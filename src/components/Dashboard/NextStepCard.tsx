import React, { useEffect, useState } from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApplicationRecord } from '../../types';
import sherpaGuide from '../../../assets/sherpa_photo/Gemini_Generated_Image_slijoslijoslijos-removebg-preview.png';

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
        reason:
          'Recruiters spend under 10 seconds per resume. Ensure your STAR metrics highlight measurable project results.',
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
    <div className="flex items-end justify-center gap-3 sm:gap-5">
      <div className="relative shrink-0 select-none pointer-events-none">
        <img
          src={sherpaGuide}
          alt="Sherpa"
          className="object-contain drop-shadow-lg h-[min(34vh,280px)] w-auto max-w-[min(30vw,220px)]"
          draggable={false}
        />
      </div>

      <div className="relative flex-1 min-w-0 max-w-lg pb-6 sm:pb-10">
        <div
          className="absolute left-0 bottom-16 sm:bottom-20 -translate-x-[10px] w-5 h-5 bg-white border-l border-b border-gray-200/80 rotate-45 z-0 shadow-sm"
          aria-hidden
        />

        <div className="relative z-10 bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-2xl rounded-bl-md shadow-sm p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Next step
            </p>
            <button
              type="button"
              onClick={fetchNextStep}
              disabled={loading}
              title="Refresh AI Next Step"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all shrink-0"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`}
              />
            </button>
          </div>

          {loading && !data ? (
            <div className="space-y-2.5 py-1">
              <div className="h-5 bg-gray-100 rounded-lg w-4/5 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse" />
              <div className="h-4 bg-gray-100 rounded-lg w-2/3 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                  {data?.nextStep}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {data?.reason}
                </p>
              </div>

              {data?.ctaLabel && (
                <button
                  type="button"
                  onClick={() => {
                    if (data.ctaLink === '/cv') onNavigate('cv');
                    else if (data.ctaLink === '/tracker') onNavigate('tracker');
                    else onNavigate('cv');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-2xs"
                >
                  <span>{data.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
