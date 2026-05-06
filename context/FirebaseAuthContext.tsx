'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import axios from 'axios';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  authProvider: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Error setting persistence:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const provider =
            firebaseUser.providerData[0]?.providerId || 'password';

          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            authProvider: provider,
          };

          setUser(authUser);
          setIsAuthenticated(true);
          setLoading(false);

          axios
            .post('/api/auth', {
              uid: authUser.uid,
              email: authUser.email,
              name:
                authUser.displayName || authUser.email?.split('@')[0] || 'User',
              image: authUser.photoURL,
              authProvider: authUser.authProvider,
            })
            .catch((error) => {
              console.error('Error syncing user to MongoDB:', error);
            });
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in auth state changed:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false);
      throw error;
    }
  };

  const getIdToken = async (): Promise<string> => {
    const currentUser = auth.currentUser;
    console.log('[FirebaseAuth] Current user:', currentUser?.uid || 'No user');

    if (!currentUser) {
      console.error('[FirebaseAuth] No current user found');
      return '';
    }

    try {
      const token = await currentUser.getIdToken();
      console.log('[FirebaseAuth] Token obtained successfully');
      return token;
    } catch (error) {
      console.error('[FirebaseAuth] Error getting ID token:', error);
      return '';
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signOut, isAuthenticated, getIdToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useFirebaseAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within AuthProvider');
  }
  return context;
};
