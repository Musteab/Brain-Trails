import React, { useEffect, useRef } from 'react';

const MUSIC_URLS = {
  lofi: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4c7b.mp3',
  ambient: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b1b7b7.mp3',
  rain: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b7b1b7b.mp3',
};

const MusicPlayer = ({ music }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (music && MUSIC_URLS[music]) {
      audioRef.current.src = MUSIC_URLS[music];
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.play();
    } else {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [music]);

  return <audio ref={audioRef} style={{ display: 'none' }} />;
};

export default MusicPlayer;
