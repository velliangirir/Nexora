import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, ArrowLeft, Sparkles, CheckCircle2, Clock, Star, Compass, RefreshCw } from 'lucide-react';

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

export const AdaptiveInsightsPage: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<AdaptiveData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdaptiveInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/adaptive', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching adaptive insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAdaptiveInsights();
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold mb-1">
            <Brain className="w-4 h-4 text-purple-400" /> Personalized Machine Intelligence
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            🧠 Adaptive Insights Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            NEXORA AI learns from your real-world decisions and uses your experience to improve future recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdaptiveInsights}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            Refresh Engine
          </button>

          <Link
            to="/dashboard"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 space-y-3">
          <Brain className="w-10 h-10 text-purple-400 animate-pulse mx-auto" />
          <p className="text-sm font-semibold">Analyzing real-world decision history & training adaptive engine...</p>
        </div>
      ) : !data || !data.hasData ? (
        /* EMPTY STATE WHEN NO REALITY CHECKS RECORDED */
        <div className="glass-card p-10 rounded-3xl border border-purple-500/20 text-center space-y-6 max-w-2xl mx-auto my-12 bg-gradient-to-b from-purple-950/20 via-slate-900/60 to-slate-950">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-3xl">
            🧠
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">
              {data?.emptyState?.title || '🧠 Your Adaptive Engine is waiting for its first real-world outcome.'}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {data?.emptyState?.subtitle || 'Complete a Reality Check after executing a decision to start personalized learning.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left text-xs text-slate-300 space-y-2">
            <div className="font-bold text-sky-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> How Adaptive Learning Works:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>Create and evaluate a decision using the What-If simulator</li>
              <li>Execute your chosen option in real life</li>
              <li>Log your actual time and satisfaction on the decision's Reality Check page</li>
              <li>NEXORA AI automatically updates your personal predictive model</li>
            </ul>
          </div>

          <div className="pt-2">
            <Link
              to="/history"
              className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs shadow-lg shadow-purple-500/25 hover:brightness-110 transition-all inline-flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Log a Reality Check in Decision History
            </Link>
          </div>
        </div>
      ) : (
        /* HAS DATA — FULL ADAPTIVE INSIGHTS VIEW */
        <div className="space-y-8">
          
          {/* LEARNING SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Reality Checks</span>
              <div className="text-2xl font-extrabold text-amber-400">{data.summary.realityChecks}</div>
              <span className="text-[10px] text-slate-500">Outcomes logged</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Decisions Learned</span>
              <div className="text-2xl font-extrabold text-sky-400">{data.summary.decisionsLearned}</div>
              <span className="text-[10px] text-slate-500">Unique models</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Avg Satisfaction</span>
              <div className="text-2xl font-extrabold text-emerald-400">{data.summary.averageSatisfaction} / 10</div>
              <span className="text-[10px] text-slate-500">Post-execution score</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Prediction Accuracy</span>
              <div className="text-2xl font-extrabold text-purple-400">{data.summary.timeAccuracy}</div>
              <span className="text-[10px] text-slate-500">Time estimate fit</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Time Variance</span>
              <div className={`text-2xl font-extrabold ${data.timeEstimation.variancePercent > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {data.summary.timeEstimationPattern}
              </div>
              <span className="text-[10px] text-slate-500">Pace delta</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20 space-y-1">
              <span className="text-[11px] font-semibold text-purple-300">Engine Status</span>
              <div className="text-base font-extrabold text-purple-400 flex items-center gap-1">
                {data.summary.adaptiveLearningStatus}
              </div>
              <span className="text-[10px] text-purple-400/70">Personalized</span>
            </div>

          </div>

          {/* TIME ESTIMATION & SATISFACTION LEARNING SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* TIME ESTIMATION LEARNING */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bold text-white text-base">Time Estimation Learning</h3>
                </div>
                <span className="text-xs font-mono text-sky-400 font-semibold">{data.summary.timeEstimationPattern}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[11px] text-slate-400">Avg Predicted Time</span>
                  <div className="text-xl font-extrabold text-slate-200">{data.timeEstimation.averagePredictedMonths} months</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Avg Actual Time</span>
                  <div className="text-xl font-extrabold text-sky-400">{data.timeEstimation.averageActualMonths} months</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/20 text-xs text-sky-300 leading-relaxed font-semibold">
                {data.timeEstimation.insightText}
              </div>
            </div>

            {/* SATISFACTION LEARNING */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                  <h3 className="font-bold text-white text-base">Satisfaction Learning</h3>
                </div>
                <span className="text-xs font-mono text-amber-400 font-semibold">{data.satisfaction.average} / 10 Avg</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400">Historical Decision Rating</span>
                  <div className="text-lg font-bold text-white">Consistent High Alignment</div>
                </div>
                <div className="text-3xl font-black text-amber-400">{data.satisfaction.average}</div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300 leading-relaxed font-semibold">
                {data.satisfaction.insightText}
              </div>
            </div>

          </div>

          {/* PERSONAL LEARNING PATTERNS */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-purple-400" /> Personal Learning Patterns
              </h3>
              <p className="text-xs text-slate-400">Patterns detected from your actual Reality Check data across all decisions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.patterns.map((pt, idx) => (
                <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="text-2xl">{pt.icon}</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">{pt.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{pt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FUTURE DECISION IMPACT */}
          <div className="glass-card p-6 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-slate-900/80 to-slate-950 space-y-4">
            <div className="flex items-center gap-2 border-b border-purple-500/20 pb-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="font-extrabold text-white text-base">{data.futureImpact.title}</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {data.futureImpact.description}
            </p>

            <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30 text-xs text-purple-200 font-semibold leading-relaxed">
              👉 {data.futureImpact.adjustmentText}
            </div>
          </div>

          {/* RECENT LEARNING EVENTS */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Recent Learning Events
              </h3>
              <span className="text-xs text-slate-400 font-mono">Latest {data.recentEvents.length} Recorded Outcome(s)</span>
            </div>

            {data.recentEvents.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No recent learning events recorded.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.recentEvents.map((evt) => (
                  <div key={evt.id} className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-sky-400 text-xs font-mono font-semibold">
                      <Brain className="w-3.5 h-3.5 text-purple-400" /> Learning Updated
                    </div>
                    <h4 className="font-bold text-white text-sm">{evt.decisionTitle}</h4>
                    <p className="text-xs text-slate-400 font-mono">Selected: {evt.optionName}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs font-semibold">
                      <span className="text-slate-300">{evt.actualTimeMonths} months actual</span>
                      <span className="text-amber-400">{evt.satisfactionScore}/10 satisfaction</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
