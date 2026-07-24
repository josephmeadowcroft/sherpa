import React from 'react';
import { CvCategoryScores, CvAnalysis } from '../../types';
import { Sparkles, TrendingUp, Award } from 'lucide-react';

interface ScoreDialProps {
  score: number;
  categoryScores: CvCategoryScores;
  history: CvAnalysis[];
  summary?: string;
}

export const ScoreDial: React.FC<ScoreDialProps> = ({ score, categoryScores, history, summary }) => {
  // SVG gauge constants
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const scoreColor = 
    score >= 80 ? 'text-emerald-500 stroke-emerald-500' :
    score >= 60 ? 'text-blue-600 stroke-blue-600' :
    'text-amber-500 stroke-amber-500';

  const categories = [
    { label: 'Impact & Metrics', key: 'impact' as const, val: categoryScores.impact },
    { label: 'Clarity & Structure', key: 'clarity' as const, val: categoryScores.clarity },
    { label: 'Formatting', key: 'formatting' as const, val: categoryScores.formatting },
    { label: 'Role Relevance', key: 'relevance' as const, val: categoryScores.relevance },
    { label: 'ATS Keywords', key: 'keywords' as const, val: categoryScores.keywords },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
      {/* Col 1: Circular Score Gauge */}
      <div className="flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200 pb-6 lg:pb-0 lg:pr-6">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-gray-100"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className={`transition-all duration-1000 ease-out ${scoreColor}`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Inner Score Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums">{score}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              / 100 Score
            </span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
            score >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            score >= 60 ? 'bg-blue-50 border-blue-200 text-blue-700' :
            'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <Award className="w-3.5 h-3.5" />
            {score >= 80 ? 'Strong Competitive Resume' : score >= 60 ? 'Good Baseline — Needs Polish' : 'Needs Bullet Point Optimization'}
          </span>
        </div>
      </div>

      {/* Col 2: Category Breakdown Bars */}
      <div className="space-y-3 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-200 pb-6 lg:pb-0 lg:pr-6">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Category Score Breakdown
        </h4>
        {categories.map((cat) => (
          <div key={cat.key} className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-700">{cat.label}</span>
              <span className="text-gray-900 font-mono tabular-nums">{cat.val}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/60">
              <div
                className={`h-full transition-all duration-700 rounded-full ${
                  cat.val >= 75 ? 'bg-emerald-500' :
                  cat.val >= 55 ? 'bg-blue-600' :
                  'bg-amber-500'
                }`}
                style={{ width: `${cat.val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Col 3: Executive Summary & Past Trend */}
      <div className="flex flex-col justify-between space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Executive Assessment
          </h4>
          <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
            {summary || "Your resume demonstrates a clear technical foundation. Focus on adding quantifiable metric results (STAR method) to your experience bullet points."}
          </p>
        </div>

        {/* History sparkline / past runs */}
        {history.length > 0 && (
          <div>
            <h5 className="text-[11px] font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-600" /> Score Progression History
            </h5>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {history.slice(0, 5).map((h, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 flex flex-col items-center shrink-0"
                >
                  <span className="text-[10px] text-gray-500">
                    {new Date(h.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xs font-bold text-blue-600 tabular-nums">{h.overallScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
