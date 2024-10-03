// src/useAuth.js
import { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const signup = (email, password) => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        setError(null); // Clear error on success
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        setError(null); // Clear error on success
        return true;    // Return true on success
      })
      .catch((error) => {
        setError(error.message);
        return false;   // Return false on failure
      });
  };

  const logout = () => {
    signOut(auth).then(() => {
      setUser(null);
    }).catch((error) => {
      setError(error.message);
    });
  };

  return { user, error, signup, login, logout };
};

export default useAuth;
