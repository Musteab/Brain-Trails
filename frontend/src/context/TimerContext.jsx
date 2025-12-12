import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'braintrails_timer_state';
const SOUND_MAP = {
  chime:
    'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgP/7kMQwAAAA8AAAACAAADSAAAAAEAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  bell:
    'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgP/7kGQwAAAA8AAAACAAADSAAAAAEAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  wave:
    'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgP/7kGQwAAAA8AAAACAAADSAAAAAEAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
};

const defaultDurations = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

const deserializeState = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Silently fail - localStorage may be corrupted or unavailable
  }
  return null;
};

const TimerContext = createContext(null);

export const TimerProvider = ({ children }) => {
  const persisted = deserializeState();
  const [mode, setModeState] = useState(persisted?.mode || 'focus');
  const [durations, setDurations] = useState(persisted?.durations || defaultDurations);
  const [timeLeft, setTimeLeft] = useState(
    persisted?.timeLeft ?? (persisted?.durations?.[persisted.mode] || defaultDurations.focus),
  );
  const [isRunning, setIsRunning] = useState(persisted?.isRunning || false);
  const [toastVisible, setToastVisible] = useState(persisted?.toastVisible ?? true);
  const [soundKey, setSoundKeyState] = useState(persisted?.soundKey || 'chime');

  const currentDuration = durations[mode] || defaultDurations.focus;
  const intervalRef = useRef(null);
  const completionRef = useRef(null);
  const alarmRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode,
          durations,
          timeLeft,
          isRunning,
          toastVisible,
          soundKey,
        }),
      );
    }
  }, [mode, durations, timeLeft, isRunning, toastVisible, soundKey]);

  useEffect(() => {
    alarmRef.current = typeof Audio !== 'undefined' ? new Audio(SOUND_MAP[soundKey] || SOUND_MAP.chime) : null;
  }, [soundKey]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (alarmRef.current) {
        alarmRef.current.currentTime = 0;
        alarmRef.current.play().catch(() => {});
      }
      if (completionRef.current) {
        completionRef.current(mode, currentDuration);
      }
    }
  }, [timeLeft, isRunning, mode, currentDuration]);

  const startTimer = useCallback(() => {
    setTimeLeft((prev) => (prev === 0 ? currentDuration : prev));
    setIsRunning(true);
  }, [currentDuration]);

  const pauseTimer = useCallback(() => setIsRunning(false), []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(currentDuration);
  }, [currentDuration]);

  const setMode = useCallback((nextMode) => {
    setIsRunning(false);
    setModeState(nextMode);
    setTimeLeft(durations[nextMode] || defaultDurations[nextMode]);
  }, [durations]);

  const updateDuration = useCallback((targetMode, minutes) => {
    const seconds = Math.max(1, Math.round(minutes)) * 60;
    setDurations((prev) => ({ ...prev, [targetMode]: seconds }));
    if (targetMode === mode) {
      setTimeLeft(seconds);
    }
  }, [mode]);

  const registerCompletionHandler = useCallback((handler) => {
    completionRef.current = handler;
    return () => {
      if (completionRef.current === handler) {
        completionRef.current = null;
      }
    };
  }, []);

  const showToast = useCallback(() => setToastVisible(true), []);
  const hideToast = useCallback(() => setToastVisible(false), []);

  const setSoundKey = useCallback((key) => {
    setSoundKeyState(key);
  }, []);

  const timePercent = useMemo(() => {
    if (!currentDuration) return 0;
    return Math.min(1, 1 - timeLeft / currentDuration);
  }, [timeLeft, currentDuration]);

  const value = useMemo(
    () => ({
      mode,
      durations,
      timeLeft,
      isRunning,
      toastVisible,
      soundKey,
      currentDuration,
      timePercent,
      startTimer,
      pauseTimer,
      resetTimer,
      setMode,
      updateDuration,
      registerCompletionHandler,
      showToast,
      hideToast,
      setSoundKey,
    }),
    [
      mode,
      durations,
      timeLeft,
      isRunning,
      toastVisible,
      soundKey,
      currentDuration,
      timePercent,
      startTimer,
      pauseTimer,
      resetTimer,
      setMode,
      updateDuration,
      registerCompletionHandler,
      showToast,
      hideToast,
      setSoundKey,
    ],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
};
