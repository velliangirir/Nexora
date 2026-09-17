import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnalyticsSummary, Decision } from '../types';
import { Sparkles, PlusCircle, Target, ShieldCheck, ArrowUpRight, CheckCircle2, Sliders, Brain, ArrowRight, Clock, Star } from 'lucide-react';

interface AdaptiveData {
  success: boolean;
  hasData: boolean;
  summary: {
    realityChecks: number;
    decisionsLearned: number;
    averageSatisfaction: number;
    timeAccuracy: string;
    timeEstimationPattern: string;
    adaptiveLearningStatus: string;
    lastUpdated: string | null;
  };
  emptyState?: {
    title: string;
    subtitle: string;
  };
  patterns: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  timeEstimation: {
    averagePredictedMonths: number;
    averageActualMonths: number;
    variancePercent: number;
    insightText: string;
  };
  satisfaction: {
    average: number;
    insightText: string;
  };
  adaptiveEngineStatus: {
    status: string;
    explanation: string;
  };
  futureImpact: {
    title: string;
    description: string;
    adjustmentText: string;
  };
  recentEvents: Array<{
    id: string;
    decisionTitle: string;
    optionName: string;
    actualTimeMonths: number;
    predictedTimeMonths: number;
    satisfactionScore: number;
    createdAt: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [adaptive, setAdaptive] = useState<AdaptiveData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [anRes, decRes, adapRes] = await Promise.all([
          fetch('/api/analytics', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/decisions', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/analytics/adaptive', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (anRes.ok) {
          const anData = await anRes.json();
          setAnalytics(anData);
        }
        if (decRes.ok) {
          const decData = await decRes.json();
          setDecisions(decData.decisions || []);
        }
        if (adapRes.ok) {
          const adapData = await adapRes.json();
          setAdaptive(adapData);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              NEXORA AI
            </span>
            <span className="text-xs text-slate-400">• Personal Career Decision & Growth Simulator</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Career Decision Center</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            "Choose Your Path. Simulate Your Future. Build Your Career."
          </p>
        </div>

        <Link
          to="/create"
          className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all flex items-center gap-2 text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          New Career Decision
        </Link>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Total Decisions</span>
            <Target className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{analytics?.kpis.totalDecisions ?? 3}</div>
          <div className="text-[11px] text-slate-400">{analytics?.kpis.activeDecisions ?? 2} Active, {analytics?.kpis.completedDecisions ?? 1} Completed</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Prediction Accuracy</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{analytics?.kpis.predictionAccuracyPct ?? 91.5}%</div>
          <div className="text-[11px] text-slate-400">Based on reality check variances</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Average Confidence</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400">{analytics?.kpis.averageConfidence ?? 86.4}%</div>
          <div className="text-[11px] text-slate-400">Weighted scoring certainty</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Reality Checks</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{analytics?.kpis.realityCount ?? 1}</div>
          <div className="text-[11px] text-slate-400">Recorded actual outcomes</div>
        </div>

      </div>

      {/* 🧠 ADAPTIVE INSIGHTS DASHBOARD CARD SECTION */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900/90 to-slate-950 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-500/20 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono uppercase tracking-wider font-bold">
              <Brain className="w-4 h-4 text-purple-400" /> Personalized Machine Intelligence
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              🧠 Adaptive Insights
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              NEXORA AI learns from your real-world decisions and uses your experience to improve future recommendations.
            </p>
          </div>

          <Link
            to="/adaptive-insights"
            className="px-5 py-2.5 rounded-xl font-bold bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-950/50"
          >
            View Adaptive Insights <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {!adaptive || !adaptive.hasData ? (
          /* EMPTY STATE WHEN NO REALITY CHECKS YET */
          <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-center space-y-3">
            <div className="text-2xl">🧠</div>
            <h3 className="text-base font-bold text-white">
              {adaptive?.emptyState?.title || '🧠 Your Adaptive Engine is waiting for its first real-world outcome.'}
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              {adaptive?.emptyState?.subtitle || 'Complete a Reality Check after executing a decision to start personalized learning.'}
            </p>
            <div className="pt-2">
              <Link
                to="/history"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 inline-flex items-center gap-1.5 hover:bg-sky-500/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Log Reality Check in History
              </Link>
            </div>
          </div>
        ) : (
          /* POPULATED ADAPTIVE ENGINE SUMMARY */
          <div className="space-y-6">
            
            {/* LEARNING SUMMARY METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Reality Checks</span>
                <div className="text-xl font-extrabold text-amber-400">{adaptive.summary.realityChecks}</div>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Decisions Learned</span>
                <div className="text-xl font-extrabold text-sky-400">{adaptive.summary.decisionsLearned}</div>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Avg Satisfaction</span>
                <div className="text-xl font-extrabold text-emerald-400">{adaptive.summary.averageSatisfaction} / 10</div>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Time Accuracy</span>
                <div className="text-xl font-extrabold text-purple-400">{adaptive.summary.timeAccuracy}</div>
              </div>

              <div className="bg-purple-950/40 p-3.5 rounded-xl border border-purple-500/30 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-purple-300 uppercase font-mono">Learning Status</span>
                <div className="text-sm font-extrabold text-purple-400 flex items-center gap-1">
                  {adaptive.summary.adaptiveLearningStatus}
                </div>
              </div>
            </div>

            {/* LEARNING PATTERNS & INSIGHTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <Clock className="w-4 h-4 text-sky-400" /> Time Estimation Pattern
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  {adaptive.timeEstimation.insightText}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" /> Satisfaction Learning
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  {adaptive.satisfaction.insightText}
                </p>
              </div>

            </div>

            {/* FUTURE SIMULATION IMPACT */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1.5">
              <div className="text-xs font-extrabold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" /> {adaptive.futureImpact.title}
              </div>
              <p className="text-xs text-purple-200/90 leading-relaxed">
                {adaptive.futureImpact.adjustmentText}
              </p>
            </div>

          </div>
        )}

      </div>



      {/* RECENT DECISIONS LIST */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Your Decisions & Simulations</h3>
            <p className="text-xs text-slate-400">Select any decision to launch the interactive What-If Simulator</p>
          </div>
          <Link to="/history" className="text-xs text-sky-400 hover:underline font-semibold flex items-center gap-1">
            View All History <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {decisions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 space-y-3">
            <p className="text-sm">No decisions created yet.</p>
            <Link to="/create" className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 bg-sky-500/10 px-4 py-2 rounded-xl border border-sky-500/20">
              <PlusCircle className="w-4 h-4" /> Create Your First Decision
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decisions.map((dec) => (
              <div key={dec.id} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition-all space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {dec.category}
                    </span>
                    <h4 className="font-bold text-white text-base mt-2">{dec.title}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    dec.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {dec.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{dec.description || 'No detailed description.'}</p>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">{dec.option_count || 4} Options Defined</span>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/simulator/${dec.id}`}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Simulator
                    </Link>
                    {dec.status === 'completed' && (
                      <Link
                        to={`/reality/${dec.id}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        Reality Check
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
