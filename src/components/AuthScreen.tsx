import React, { useState } from 'react';
import { Sparkles, ArrowRight, Lock, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SherpaMascot } from './SherpaMascot';

interface AuthScreenProps {
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

const FRIENDLY_AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password. Please try again.',
  'auth/wrong-password': 'Incorrect email or password. Please try again.',
  'auth/user-not-found': 'No account found with that email. Try signing up instead.',
  'auth/invalid-email': 'That email address looks invalid. Please check and try again.',
  'auth/email-already-in-use': 'An account with that email already exists. Try signing in instead.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
};

const friendlyAuthError = (err: any, fallback: string): string => {
  const code = err?.code as string | undefined;
  if (code && FRIENDLY_AUTH_ERRORS[code]) return FRIENDLY_AUTH_ERRORS[code];
  return fallback;
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onShowToast }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        onShowToast('success', "Account created! Let's complete your profile.");
      } else {
        await signInWithEmail(email, password);
        onShowToast('success', 'Welcome back!');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast('error', friendlyAuthError(err, 'Authentication failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onShowToast('success', 'Successfully signed in with Google!');
    } catch (err: any) {
      console.error(err);
      onShowToast('error', friendlyAuthError(err, 'Google sign-in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-gray-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-2xl p-8 shadow-sm relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <SherpaMascot size="lg" className="mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Sherpa AI
          </h1>
          <p className="text-xs text-gray-500">
            Your AI career co-pilot for university internships & graduate schemes.
          </p>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-3 shadow-2xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-[11px] text-gray-400 font-medium">OR EMAIL</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.ac.uk"
                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 rounded-xl pl-10 pr-3.5 py-2.5 text-xs outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 rounded-xl pl-10 pr-3.5 py-2.5 text-xs outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-xs transition-all shadow-2xs flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};
