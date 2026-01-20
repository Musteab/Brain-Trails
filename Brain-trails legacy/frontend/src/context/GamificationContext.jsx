import { createContext, useContext } from 'react';

import useGamificationEngine from '../hooks/useGamificationEngine';

const GamificationContext = createContext(null);

export const GamificationProvider = ({ children }) => {
  const value = useGamificationEngine();
  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
};
