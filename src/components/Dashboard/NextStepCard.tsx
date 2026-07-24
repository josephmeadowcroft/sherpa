import React, { useEffect, useState } from 'react';
import { Target, RefreshCw, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApplicationRecord } from '../../types';

interface NextStepData {
  nextStep: string;
  reason: string;
  ctaLabel: string;
  ctaLink: '/cv' | '/tracker' | null;
}

interface NextStepCardProps {
  applications: Record<string, ApplicationRecord>;
  latestCvScore: number | null;
  onNavigate: (tab: 'dashboard' | 'cv' | 'tracker') => void;
}

export const NextStepCard: React.FC<NextStepCardProps> = ({
  applications,
  latestCvScore,
  onNavigate,
}) => {
  const { userProfile } = useAuth();
  const [data, setData] = useState<NextStepData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNextStep = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/next-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          applications: Object.values(applications),
          latestCvScore,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch next step');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      // Fallback
      setData({
        nextStep: 'Optimize your CV impact bullets',
        reason: 'Recruiters spend under 10 seconds per resume. Ensure your STAR metrics highlight measurable project results.',
        ctaLabel: 'Go to CV Optimizer',
        ctaLink: '/cv',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextStep();
  }, []);

  return (
    <div className="w-full bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow transition-all relative overflow-hidden">
      {/* Decorative mountain ridge background SVG */}
      <div className="absolute right-0 bottom-0 opacity-[0.04] pointer-events-none">
        <svg width="240" height="120" viewBox="0 0 240 120" fill="none">
          <path d="M0 120 L60 30 L120 90 L180 10 L240 120 Z" fill="#111827" />
        </svg>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Recommended Next Step
            </h3>
            <p className="text-xs text-gray-500">AI Priority Strategy</p>
          </div>
        </div>

        <button
          onClick={fetchNextStep}
          disabled={loading}
          title="Refresh AI Next Step"
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3 relative z-10">
        {loading ? (
          <div className="space-y-2 py-2">
            <div className="h-4 bg-gray-100 rounded-lg w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded-lg w-full animate-pulse" />
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-gray-900 leading-snug">
                {data?.nextStep}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {data?.reason}
              </p>
            </div>

            {data?.ctaLabel && (
              <div className="pt-1">
                <button
                  onClick={() => {
                    if (data.ctaLink === '/cv') onNavigate('cv');
                    else if (data.ctaLink === '/tracker') onNavigate('tracker');
                    else onNavigate('cv');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-all shadow-2xs"
                >
                  <span>{data.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
