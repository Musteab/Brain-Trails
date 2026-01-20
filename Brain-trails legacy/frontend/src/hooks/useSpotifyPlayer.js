import { useCallback, useEffect, useRef, useState } from 'react';

import {
  beginSpotifyAuth,
  clearSpotifyAuth,
  parseSpotifyUri,
  readSpotifyAuth,
  refreshSpotifyToken,
  storeSpotifyAuth,
} from '../utils/spotify';

const SPOTIFY_PLAYER_NAME = 'BrainTrails Study Player';
let spotifyScriptPromise;

const ensureSpotifyScript = () => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Spotify) {
    return Promise.resolve();
  }
  if (!spotifyScriptPromise) {
    spotifyScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onload = () => {
        if (window.Spotify) {
          resolve();
        } else {
          reject(new Error('Spotify SDK failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Spotify SDK failed to load'));
      document.body.appendChild(script);
      window.onSpotifyWebPlaybackSDKReady = () => resolve();
    });
  }
  return spotifyScriptPromise;
};

const useSpotifyPlayer = () => {
  const [auth, setAuth] = useState(() => readSpotifyAuth());
  const [profile, setProfile] = useState(null);
  const [track, setTrack] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [paused, setPaused] = useState(true);
  const [volume, setVolume] = useState(0.6);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);

  const ensureAccessToken = useCallback(async () => {
    if (!auth?.access_token) return null;
    if (!auth.expires_at || Date.now() < auth.expires_at - 10000) {
      return auth.access_token;
    }
    if (!auth.refresh_token) {
      return auth.access_token;
    }
    try {
      const refreshed = await refreshSpotifyToken(auth.refresh_token);
      storeSpotifyAuth(refreshed);
      setAuth(refreshed);
      return refreshed.access_token;
    } catch (refreshError) {
      setError('Spotify session expired. Connect again to keep listening.');
      clearSpotifyAuth();
      setAuth(null);
      return null;
    }
  }, [auth]);

  const fetchProfile = useCallback(async () => {
    const token = await ensureAccessToken();
    if (!token) return;
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Profile fetch failed');
      }
      const data = await response.json();
      setProfile(data);
    } catch {
      // Silently fail - profile will be null which triggers appropriate UI
    }
  }, [ensureAccessToken]);

  useEffect(() => {
    if (!auth?.access_token) {
      setProfile(null);
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      setDeviceId(null);
      return;
    }
    fetchProfile();
  }, [auth?.access_token, fetchProfile]);

  useEffect(() => {
    let cancelled = false;
    const initPlayer = async () => {
      if (!auth?.access_token) return;
      setLoadingPlayer(true);
      try {
        await ensureSpotifyScript();
        if (cancelled || !window.Spotify) return;
        if (playerRef.current) {
          playerRef.current.disconnect();
        }
        const player = new window.Spotify.Player({
          name: SPOTIFY_PLAYER_NAME,
          getOAuthToken: async (cb) => {
            const token = await ensureAccessToken();
            if (token) {
              cb(token);
            }
          },
          volume,
        });
        player.addListener('ready', ({ device_id }) => {
          setDeviceId(device_id);
          setError(null);
        });
        player.addListener('not_ready', () => setDeviceId(null));
        player.addListener('player_state_changed', (state) => {
          if (!state) return;
          setPaused(state.paused);
          const current = state.track_window?.current_track;
          if (current) {
            setTrack({
              name: current.name,
              artists: current.artists?.map((artist) => artist.name).join(', '),
              artwork: current.album?.images?.[0]?.url,
            });
          }
        });
        player.addListener('initialization_error', ({ message }) => setError(message));
        player.addListener('authentication_error', ({ message }) => setError(message));
        player.addListener('account_error', ({ message }) => setError(message));
        await player.connect();
        playerRef.current = player;
      } catch {
        setError('Unable to load Spotify player. Please reload and try again.');
      } finally {
        if (!cancelled) {
          setLoadingPlayer(false);
        }
      }
    };
    initPlayer();
    return () => {
      cancelled = true;
    };
  }, [auth?.access_token, ensureAccessToken, volume]);

  const connectSpotify = useCallback(async () => {
    try {
      const url = await beginSpotifyAuth();
      window.location.assign(url);
    } catch (authError) {
      setError(authError.message || 'Unable to start Spotify connection.');
    }
  }, []);

  const disconnectSpotify = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
    }
    setDeviceId(null);
    setTrack(null);
    setProfile(null);
    clearSpotifyAuth();
    setAuth(null);
  }, []);

  const togglePlay = useCallback(() => {
    playerRef.current?.togglePlay().catch((toggleError) => setError(toggleError.message));
  }, []);

  const nextTrack = useCallback(() => {
    playerRef.current?.nextTrack();
  }, []);

  const previousTrack = useCallback(() => {
    playerRef.current?.previousTrack();
  }, []);

  const setPlayerVolume = useCallback(
    (value) => {
      setVolume(value);
      playerRef.current?.setVolume(value);
    },
    [setVolume],
  );

  const playContext = useCallback(
    async (input) => {
      const parsed = parseSpotifyUri(input);
      if (!parsed) {
        setError('Enter a valid Spotify link first.');
        return;
      }
      const token = await ensureAccessToken();
      if (!token || !deviceId) {
        setError('Spotify player is still waking up. Try again in a moment.');
        return;
      }
      const url = `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`;
      const payload =
        parsed.type === 'track'
          ? { uris: [parsed.uri] }
          : {
              context_uri: parsed.uri,
            };
      try {
        await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch (playError) {
        setError('Unable to start playback.');
      }
    },
    [deviceId, ensureAccessToken],
  );

  const isPremium = profile?.product === 'premium';

  return {
    isConnected: Boolean(auth?.access_token),
    isPremium,
    loading: loadingPlayer,
    error,
    clearError: () => setError(null),
    track,
    paused,
    profile,
    volume,
    connectSpotify,
    disconnectSpotify,
    togglePlay,
    nextTrack,
    previousTrack,
    setPlayerVolume,
    playContext,
    deviceReady: Boolean(deviceId),
  };
};

export default useSpotifyPlayer;
