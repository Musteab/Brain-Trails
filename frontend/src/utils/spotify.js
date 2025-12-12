const TOKEN_KEY = 'braintrails_spotify_auth';
const VERIFIER_KEY = 'braintrails_spotify_code_verifier';
const STATE_KEY = 'braintrails_spotify_state';

export const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
];

export const getSpotifyClientId = () => process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';

export const getSpotifyRedirectUri = () =>
  process.env.REACT_APP_SPOTIFY_REDIRECT_URI || `${window.location.origin}/spotify/callback`;

const generateRandomString = (length = 64) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const base64UrlEncode = (arrayBuffer) => {
  const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const createCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
};

export const readSpotifyAuth = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const storeSpotifyAuth = (payload) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(payload));
};

export const clearSpotifyAuth = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
};

export const beginSpotifyAuth = async () => {
  const clientId = getSpotifyClientId();
  if (!clientId) {
    throw new Error('Spotify client ID is not configured.');
  }
  const verifier = generateRandomString(64);
  const challenge = await createCodeChallenge(verifier);
  const state = generateRandomString(12);
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SPOTIFY_SCOPES.join(' '),
    redirect_uri: getSpotifyRedirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

const buildTokenPayload = (data) => ({
  access_token: data.access_token,
  refresh_token: data.refresh_token || null,
  scope: data.scope,
  expires_at: Date.now() + data.expires_in * 1000,
  token_type: data.token_type,
});

export const exchangeCodeForToken = async (code, state) => {
  const storedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier || !state || state !== storedState) {
    throw new Error('Invalid Spotify authorization state.');
  }
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  const params = new URLSearchParams({
    client_id: getSpotifyClientId(),
    grant_type: 'authorization_code',
    code,
    redirect_uri: getSpotifyRedirectUri(),
    code_verifier: verifier,
  });
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.ok) {
    throw new Error('Spotify authorization failed.');
  }
  const data = await response.json();
  return buildTokenPayload(data);
};

export const refreshSpotifyToken = async (refreshToken) => {
  const params = new URLSearchParams({
    client_id: getSpotifyClientId(),
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.ok) {
    throw new Error('Spotify session expired.');
  }
  const data = await response.json();
  const payload = buildTokenPayload({
    ...data,
    refresh_token: data.refresh_token || refreshToken,
  });
  return payload;
};

export const parseSpotifyUri = (value = '') => {
  if (!value) return null;
  if (value.startsWith('spotify:')) {
    const [, type, id] = value.split(':');
    if (type && id) {
      return { type, id, uri: value };
    }
  }
  const match = value.match(/open\.spotify\.com\/(?:embed\/)?(playlist|track|album)\/([a-zA-Z0-9]+)/i);
  if (match) {
    return { type: match[1], id: match[2], uri: `spotify:${match[1]}:${match[2]}` };
  }
  return null;
};
