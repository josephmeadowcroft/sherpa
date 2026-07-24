import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthScreen } from "./components/AuthScreen";
import { OnboardingModal } from "./components/OnboardingModal";
import { Header } from "./components/Header";
import { NextStepCard } from "./components/Dashboard/NextStepCard";
import { AssistantChat } from "./components/Dashboard/AssistantChat";
import { ActivityFeed } from "./components/Dashboard/ActivityFeed";
import { ScoreDial } from "./components/CvImprover/ScoreDial";
import { CvAnalysisView } from "./components/CvImprover/CvAnalysisView";
import { CvGenerateResult } from "./components/CvImprover/CvGenerateResult";
import { InternshipTracker } from "./components/Tracker/InternshipTracker";
import { ToastContainer, ToastMessage } from "./components/Toast";
import {
  FileText,
  Upload,
  RefreshCw,
  Loader2,
  Sparkles,
  Compass,
  Wand2,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "./lib/firebase";
import { ApplicationRecord, CvAnalysis, GeneratedCv } from "./types";

function MainApp() {
  const {
    currentUser,
    userProfile,
    loading,
    updateUserProfile,
    refreshProfile,
  } = useAuth();

  const [currentTab, setCurrentTab] = useState<"dashboard" | "cv" | "tracker">(
    "dashboard",
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Firestore Data
  const [applications, setApplications] = useState<
    Record<string, ApplicationRecord>
  >({});
  const [cvAnalyses, setCvAnalyses] = useState<CvAnalysis[]>([]);
  const [analyzingCv, setAnalyzingCv] = useState<boolean>(false);
  const [generatingCv, setGeneratingCv] = useState<boolean>(false);
  const [generatedCv, setGeneratedCv] = useState<GeneratedCv | null>(null);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, text }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Listen to Applications for this user
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "applications"),
      where("userId", "==", currentUser.uid),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Record<string, ApplicationRecord> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data() as ApplicationRecord;
        items[data.internshipId || d.id] = data;
      });
      setApplications(items);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 2. Listen to CV Analyses history for this user
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "cvAnalyses"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: CvAnalysis[] = [];
      snapshot.docs.forEach((d) =>
        items.push({ id: d.id, ...d.data() } as CvAnalysis),
      );
      setCvAnalyses(items);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const latestCvAnalysis = cvAnalyses[0] || null;
  const latestCvScore = latestCvAnalysis ? latestCvAnalysis.overallScore : null;

  // Handle CV Upload on CV Optimizer Page
  const handleUploadCv = async (file: File) => {
    if (!currentUser) return;
    setAnalyzingCv(true);
    setGeneratedCv(null);
    try {
      const isLatex = file.name.toLowerCase().endsWith(".tex");

      const runAnalysis = async (body: Record<string, any>) => {
        const res = await fetch("/api/analyze-cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Analysis failed.");
        const analysis = await res.json();

        // Save analysis to Firestore
        const analysisId = `cv_${Date.now()}`;
        await setDoc(doc(db, "cvAnalyses", analysisId), {
          ...analysis,
          userId: currentUser.uid,
          createdAt: new Date().toISOString(),
        });

        // Check if score improved
        const prevScore = latestCvScore || 0;
        const improved = analysis.overallScore > prevScore;

        // Update user profile
        await updateUserProfile({
          cvText: analysis.extractedText || "",
          cvFileName: file.name,
          cvUpdatedAt: new Date().toISOString(),
        });

        // If score improved, broadcast to activity feed
        if (improved) {
          const actId = `act_${Date.now()}`;
          await setDoc(doc(db, "activities", actId), {
            userId: currentUser.uid,
            username: userProfile?.username || "student",
            userDisplayName: userProfile?.displayName || "Student",
            userPhotoURL: userProfile?.photoURL || "",
            type: "cv_improved",
            text: `improved their CV score to ${analysis.overallScore}/100`,
            createdAt: new Date().toISOString(),
          });
        }

        showToast(
          "success",
          `CV Analyzed! Score: ${analysis.overallScore}/100`,
        );
        setAnalyzingCv(false);
      };

      if (isLatex) {
        const latexSource = await file.text();
        await runAnalysis({ latexSource, userId: currentUser.uid });
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64Data = reader.result as string;
          await runAnalysis({
            fileData: base64Data,
            mimeType: file.type || "application/pdf",
            userId: currentUser.uid,
          });
        };
      }
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to analyze CV");
      setAnalyzingCv(false);
    }
  };

  // Handle "Generate Updated CV" (Jake's Resume Template, LaTeX + compiled PDF)
  const handleGenerateCv = async () => {
    if (!currentUser) return;
    setGeneratingCv(true);
    try {
      const res = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText: userProfile?.cvText,
          analysis: latestCvAnalysis,
          userId: currentUser.uid,
        }),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Failed to generate updated CV.");

      setGeneratedCv(result);
      showToast(
        "success",
        "Updated CV generated! Download your PDF or LaTeX source below.",
      );
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to generate updated CV.");
    } finally {
      setGeneratingCv(false);
    }
  };

  // Handle Re-analyze on existing stored text
  const handleReanalyzeText = async () => {
    if (!currentUser || !userProfile?.cvText) return;
    setAnalyzingCv(true);
    try {
      const res = await fetch("/api/analyze-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText: userProfile.cvText,
          userId: currentUser.uid,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed.");
      const analysis = await res.json();

      const analysisId = `cv_${Date.now()}`;
      await setDoc(doc(db, "cvAnalyses", analysisId), {
        ...analysis,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      });

      showToast(
        "success",
        `Re-analyzed CV! New score: ${analysis.overallScore}/100`,
      );
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to re-analyze CV.");
    } finally {
      setAnalyzingCv(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center text-gray-900 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading Sherpa...</p>
        </div>
      </div>
    );
  }

  // Auth Protection
  if (!currentUser) {
    return <AuthScreen onShowToast={showToast} />;
  }

  // Onboarding Protection
  const needsOnboarding =
    !userProfile?.username || userProfile.onboardingCompleted === false;

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-gray-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Onboarding Wizard Modal if incomplete */}
      {needsOnboarding && (
        <OnboardingModal
          onComplete={() => {
            refreshProfile();
            showToast("success", "Onboarding complete! Welcome to Sherpa.");
          }}
          onShowToast={showToast}
        />
      )}

      {/* Top Navigation Bar */}
      <Header currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* PAGE 1: OVERVIEW */}
        {currentTab === "dashboard" && (
          <div className="space-y-6">
            {/* Home 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column (2/3 width): Sherpa AI Assistant & Recommended Next Step */}
              <div className="lg:col-span-2 space-y-6">
                {/* Sherpa AI Assistant */}
                <AssistantChat
                  applications={applications}
                  latestCvScore={latestCvScore}
                  onNavigate={setCurrentTab}
                />

                {/* Recommended Next Step */}
                <NextStepCard
                  applications={applications}
                  latestCvScore={latestCvScore}
                  onNavigate={setCurrentTab}
                />
              </div>

              {/* Right Column (1/3 width): Peer Network */}
              <div className="lg:col-span-1">
                <ActivityFeed onShowToast={showToast} />
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: CV OPTIMIZER */}
        {currentTab === "cv" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" /> Resume & CV
                  Optimizer
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Instant ATS scoring, STAR bullet point rewrites, and tailored
                  feedback.
                </p>
              </div>

              {userProfile?.cvText && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReanalyzeText}
                    disabled={analyzingCv}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-2 border border-gray-200 shadow-2xs"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${analyzingCv ? "animate-spin text-blue-600" : ""}`}
                    />
                    <span>Re-analyze</span>
                  </button>

                  {latestCvAnalysis && (
                    <button
                      onClick={handleGenerateCv}
                      disabled={generatingCv}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-2 border border-gray-200 shadow-2xs"
                    >
                      <Wand2 className={`w-3.5 h-3.5 ${generatingCv ? "animate-spin text-blue-600" : ""}`} />
                      <span>{generatingCv ? "Generating..." : "Generate Updated CV"}</span>
                    </button>
                  )}

                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all shadow-2xs flex items-center gap-2">
                    <input
                      type="file"
                      accept="application/pdf,.doc,.docx,.tex"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadCv(file);
                      }}
                    />
                    <Upload className="w-3.5 h-3.5" />
                    <span>Replace CV</span>
                  </label>
                </div>
              )}
            </div>

            {/* Analysis Loading State */}
            {analyzingCv && (
              <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center space-y-3 shadow-sm">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <h3 className="text-sm font-bold text-gray-900">
                  Analyzing Resume with Gemini AI...
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Extracting impact metrics, evaluating clarity, and crafting
                  concrete STAR bullet point rewrites.
                </p>
              </div>
            )}

            {/* Upload Box if no CV exists */}
            {!latestCvAnalysis && !analyzingCv && (
              <div className="bg-white border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-12 text-center transition-colors shadow-2xs">
                <label className="cursor-pointer block space-y-4">
                  <input
                    type="file"
                    accept="application/pdf,.doc,.docx,.tex"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadCv(file);
                    }}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">
                      Upload your PDF Resume
                    </p>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Drag & drop or click to upload your PDF CV. Gemini will
                      score your resume and generate concrete rewritten
                      examples.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* CV Score Gauge & Analysis View */}
            {latestCvAnalysis && !analyzingCv && (
              <div className="space-y-6">
                <ScoreDial
                  score={latestCvAnalysis.overallScore}
                  categoryScores={latestCvAnalysis.categoryScores}
                  history={cvAnalyses}
                  summary={latestCvAnalysis.summary}
                />

                <CvAnalysisView
                  tips={latestCvAnalysis.tips || []}
                  improvedSections={latestCvAnalysis.improvedSections || []}
                  onShowToast={showToast}
                />

                {generatedCv && (
                  <CvGenerateResult
                    generatedCv={generatedCv}
                    fileNameBase={`${userProfile?.username || "sherpa"}-updated-cv`}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* PAGE 3: APPLICATION TRACKER */}
        {currentTab === "tracker" && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Compass className="w-6 h-6 text-blue-600" /> Internship &
                Graduate Application Tracker
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Track and manage your internship & graduate scheme applications
                across Saved, Applied, Interview, and Offer pipeline stages.
              </p>
            </div>

            <InternshipTracker onShowToast={showToast} />
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
