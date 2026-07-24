import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const cleanFirestoreData = (obj: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = cleanFirestoreData(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (uid: string, fallbackUser?: User) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        // Initial empty profile stub
        const initialProfile: UserProfile = {
          uid,
          email: fallbackUser?.email || '',
          username: '',
          displayName: fallbackUser?.displayName || fallbackUser?.email?.split('@')[0] || 'Student',
          photoURL: fallbackUser?.photoURL || '',
          course: '',
          university: '',
          gradYear: '2026',
          targetRoles: ['Software Engineering'],
          createdAt: new Date().toISOString(),
          onboardingCompleted: false
        };
        await setDoc(userRef, cleanFirestoreData(initialProfile));
        setUserProfile(initialProfile);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user.uid, user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser.uid, currentUser);
    }
  };

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await fetchProfile(result.user.uid, result.user);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await fetchProfile(result.user.uid, result.user);
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await fetchProfile(result.user.uid, result.user);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    const cleanName = username.trim().toLowerCase();
    if (!cleanName || cleanName.length < 3) return false;
    const nameRef = doc(db, 'usernames', cleanName);
    const snap = await getDoc(nameRef);
    if (!snap.exists()) return true;
    return snap.data().uid === currentUser?.uid;
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const userRef = doc(db, 'users', uid);

    // If username is being updated, claim in /usernames
    if (data.username && data.username !== userProfile?.username) {
      const cleanUsername = data.username.trim().toLowerCase();
      const usernameRef = doc(db, 'usernames', cleanUsername);
      await setDoc(usernameRef, { uid }, { merge: true });
    }

    const baseProfile: UserProfile = userProfile || {
      uid,
      email: currentUser.email || '',
      username: '',
      displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
      photoURL: currentUser.photoURL || '',
      course: '',
      university: '',
      gradYear: '2026',
      targetRoles: ['Software Engineering'],
      createdAt: new Date().toISOString(),
      onboardingCompleted: false
    };

    const updated: UserProfile = {
      ...baseProfile,
      ...data
    };

    const cleanedData = cleanFirestoreData(updated);
    await setDoc(userRef, cleanedData, { merge: true });
    setUserProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
        updateUserProfile,
        checkUsernameAvailable,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
