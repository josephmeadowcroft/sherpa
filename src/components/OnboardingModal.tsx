import React, { useState } from 'react';
import { Upload, CheckCircle2, Loader2, Sparkles, UserCheck, GraduationCap, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SherpaMascot } from './SherpaMascot';

interface OnboardingModalProps {
  onComplete: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onShowToast }) => {
  const { userProfile, updateUserProfile, checkUsernameAvailable, currentUser } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [username, setUsername] = useState<string>(userProfile?.username || '');
  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string>('');

  const [course, setCourse] = useState<string>(userProfile?.course || 'Computer Science');
  const [university, setUniversity] = useState<string>(userProfile?.university || 'University of London');
  const [gradYear, setGradYear] = useState<string>(userProfile?.gradYear || '2026');
  const [targetRoles, setTargetRoles] = useState<string>(userProfile?.targetRoles?.join(', ') || 'Software Engineering, Product Management');
  const [savingStep2, setSavingStep2] = useState<boolean>(false);

  const [uploadingCv, setUploadingCv] = useState<boolean>(false);
  const [skippingCv, setSkippingCv] = useState<boolean>(false);

  const handleUsernameChange = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    setUsernameError('');
    if (clean.length < 3) {
      setUsernameValid(false);
      if (clean.length > 0) setUsernameError('Username must be at least 3 characters.');
      return;
    }
    setCheckingUsername(true);
    try {
      const isAvailable = await checkUsernameAvailable(clean);
      setUsernameValid(isAvailable);
      if (!isAvailable) {
        setUsernameError('Username is already taken.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameValid || !username) return;
    try {
      await updateUserProfile({ username });
      setStep(2);
    } catch (err: any) {
      setUsernameError(err.message || 'Failed to save username');
    }
  };

  const handleNextStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !university) return;
    const rolesArray = targetRoles
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    setSavingStep2(true);
    try {
      await updateUserProfile({
        course,
        university,
        gradYear,
        targetRoles: rolesArray.length > 0 ? rolesArray : ['Software Engineering']
      });
      setStep(3);
    } catch (err: any) {
      console.error(err);
      onShowToast('error', err.message || 'Failed to save your profile. Please try again.');
    } finally {
      setSavingStep2(false);
    }
  };

  const handleCvUploadAndAnalyze = async (file: File) => {
    if (!currentUser) return;
    setUploadingCv(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read the selected file.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: file.type || 'application/pdf',
          userId: currentUser.uid
        })
      });

      if (!res.ok) {
        throw new Error('Failed to analyze CV.');
      }

      const analysis = await res.json();

      const analysisId = `cv_${Date.now()}`;
      await setDoc(doc(db, 'cvAnalyses', analysisId), {
        ...analysis,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      });

      await updateUserProfile({
        cvText: analysis.extractedText || '',
        cvFileName: file.name,
        cvUpdatedAt: new Date().toISOString(),
        onboardingCompleted: true
      });

      const actId = `act_${Date.now()}`;
      await setDoc(doc(db, 'activities', actId), {
        userId: currentUser.uid,
        username: username || userProfile?.username || 'student',
        userDisplayName: userProfile?.displayName || username,
        type: 'cv_improved',
        text: `improved their CV score to ${analysis.overallScore}/100`,
        createdAt: new Date().toISOString()
      });

      onShowToast('success', `CV Analyzed! Initial score: ${analysis.overallScore}/100`);
      onComplete();
    } catch (err: any) {
      console.error(err);
      onShowToast('error', err.message || 'CV Analysis failed. Please try again.');
    } finally {
      setUploadingCv(false);
    }
  };

  const handleSkipCv = async () => {
    setSkippingCv(true);
    try {
      await updateUserProfile({ onboardingCompleted: true });
      onComplete();
    } catch (err: any) {
      console.error(err);
      onShowToast('error', err.message || 'Failed to save. Please try again.');
    } finally {
      setSkippingCv(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs font-sans">
      <div className="w-full max-w-lg bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xl relative">
        {/* Wizard Progress Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SherpaMascot size="sm" />
            <span className="text-sm font-semibold text-gray-900">
              {step === 1 && 'Choose Username'}
              {step === 2 && 'Academic Profile'}
              {step === 3 && 'Upload Resume'}
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-blue-600' : s < step ? 'w-4 bg-blue-200' : 'w-4 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Username Selection */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" /> Choose your unique username
              </h2>
              <p className="text-xs text-gray-500">
                This is how peers and network connections will view your activity feed on Sherpa.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-gray-400 font-mono text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="alex_dev"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 rounded-xl pl-8 pr-10 py-2.5 text-sm outline-none transition-all"
                  required
                />
                <div className="absolute right-3 top-3">
                  {checkingUsername && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                  {!checkingUsername && usernameValid === true && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>
              {usernameError && <p className="text-xs text-rose-600 mt-1.5">{usernameError}</p>}
            </div>

            <button
              type="submit"
              disabled={!usernameValid || checkingUsername}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Profile Details */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" /> Academic & Career Focus
              </h2>
              <p className="text-xs text-gray-500">
                Sherpa uses this to personalize internship recommendations and AI guidance.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Degree / Course
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="BSc Computer Science"
                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 rounded-xl px-3.5 py-2.5 text-sm outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  University
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="UCL / Imperial / Harvard"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 rounded-xl px-3.5 py-2.5 text-sm outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Graduation Year
                </label>
                <select
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 rounded-xl px-3.5 py-2.5 text-sm outline-none"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Target Roles / Industries
              </label>
              <input
                type="text"
                value={targetRoles}
                onChange={(e) => setTargetRoles(e.target.value)}
                placeholder="Software Engineering, Product Manager, Investment Banking"
                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 rounded-xl px-3.5 py-2.5 text-sm outline-none"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">Separate multiple target roles with commas.</p>
            </div>

            <button
              type="submit"
              disabled={savingStep2}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              {savingStep2 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Continue to Resume Analysis <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: CV Upload */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Upload your CV / Resume
              </h2>
              <p className="text-xs text-gray-500">
                Upload your PDF resume to instantly receive your CV Score and tailored AI Next Steps.
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-8 text-center transition-colors bg-gray-50">
              {uploadingCv ? (
                <div className="flex flex-col items-center justify-center gap-3 py-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Analyzing CV with Gemini AI...</p>
                    <p className="text-xs text-gray-500 mt-1">Extracting impact metrics, bullet points, and keyword scores</p>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="application/pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleCvUploadAndAnalyze(file);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    Click to browse or drop your PDF resume here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supports PDF format (Max 10MB)</p>
                </label>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSkipCv}
                disabled={uploadingCv || skippingCv}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                {skippingCv ? 'Saving...' : "I'll do this later"}
              </button>
              <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Powered by Gemini AI
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
