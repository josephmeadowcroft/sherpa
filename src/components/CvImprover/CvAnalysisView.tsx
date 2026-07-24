import React, { useState } from 'react';
import { CvTip, CvImprovedSection } from '../../types';
import { AlertCircle, Check, Copy, ChevronDown, ChevronUp, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CvAnalysisViewProps {
  tips: CvTip[];
  improvedSections: CvImprovedSection[];
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const CvAnalysisView: React.FC<CvAnalysisViewProps> = ({ tips, improvedSections, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'tips' | 'rewrites'>('tips');
  const [expandedTipIndex, setExpandedTipIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    onShowToast('success', 'Copied rewritten bullet point to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const severityBadge = (sev: 'high' | 'medium' | 'low') => {
    switch (sev) {
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-500" /> High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500" /> Medium Fix
          </span>
        );
      case 'low':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-500" /> Quick Polish
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Sub-tabs Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('tips')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'tips'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Actionable Improvement Tips ({tips.length})
          </button>
          <button
            onClick={() => setActiveTab('rewrites')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'rewrites'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Before & After Bullet Rewrites ({improvedSections.length})
          </button>
        </div>
      </div>

      {/* TAB 1: TIPS */}
      {activeTab === 'tips' && (
        <div className="space-y-4">
          {tips.map((tip, idx) => {
            const isExpanded = expandedTipIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-gray-200/80 hover:border-gray-300 rounded-2xl p-5 transition-all shadow-sm"
              >
                <div
                  onClick={() => setExpandedTipIndex(isExpanded ? null : idx)}
                  className="flex items-start justify-between cursor-pointer gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {severityBadge(tip.severity)}
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {tip.section}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 leading-snug">{tip.issue}</h4>
                  </div>
                  <button className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg bg-gray-50 border border-gray-200">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div>
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 mb-1">
                        Recommended Fix:
                      </h5>
                      <p className="text-xs text-gray-700 leading-relaxed">{tip.fix}</p>
                    </div>

                    {tip.example && (
                      <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 relative group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-500" /> Concrete Example Bullet Rewrite
                          </span>
                          <button
                            onClick={() => handleCopy(tip.example, idx)}
                            className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs transition-colors flex items-center gap-1 font-medium"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-800 leading-relaxed pl-2.5 border-l-2 border-emerald-500 font-sans">
                          {tip.example}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: BEFORE / AFTER REWRITES */}
      {activeTab === 'rewrites' && (
        <div className="space-y-5">
          {improvedSections.map((sec, idx) => (
            <div key={idx} className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {sec.section}
                </span>
                <button
                  onClick={() => handleCopy(sec.improved, idx + 100)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-blue-200"
                >
                  {copiedIndex === idx + 100 ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied Version
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Rewritten Bullet
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-200/60 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
                    Before (Original)
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed">{sec.original}</p>
                </div>

                {/* Improved */}
                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/60 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" /> After (Gemini Enhanced STAR Bullet)
                  </span>
                  <p className="text-xs text-gray-900 font-medium leading-relaxed">{sec.improved}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
