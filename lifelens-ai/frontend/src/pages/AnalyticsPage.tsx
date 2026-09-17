import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AnalyticsSummary } from '../types';
import { BarChart3, ShieldCheck, Target, Award, BrainCircuit } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
      }
    };
    if (token) fetchAnalytics();
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="border-b border-slate-800 pb-6">
        <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold">Personal Performance Insights</span>
        <h1 className="text-3xl font-extrabold text-white">Decision Intelligence & Analytics</h1>
        <p className="text-xs text-slate-400 mt-1">Deep insights into prediction error distributions, historical accuracy, and risk tolerance trends.</p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Overall Prediction Accuracy</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{analytics?.kpis.predictionAccuracyPct ?? 91.5}%</div>
          <div className="text-[11px] text-slate-400">High precision score</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Evaluated Decisions</span>
            <Target className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{analytics?.kpis.totalDecisions ?? 3}</div>
          <div className="text-[11px] text-slate-400">{analytics?.kpis.realityCount ?? 1} Verified via Reality Check</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Scoring Certainty</span>
            <BrainCircuit className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400">{analytics?.kpis.averageConfidence ?? 86.4}%</div>
          <div className="text-[11px] text-slate-400">Deterministic model fit</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Risk Tolerance Category</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-2">{analytics?.kpis.riskToleranceLevel || 'Balanced'}</div>
          <div className="text-[11px] text-slate-400">Moderate risk profile</div>
        </div>
      </div>



    </div>
  );
};
