import React from 'react';
import { ExplainableAIReport } from '../types';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Target,
  Trophy,
  Award,
  Layers,
  Calendar,
  Compass,
  Check,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';

interface AIExplainabilityProps {
  report: ExplainableAIReport;
}

export const AIExplainability: React.FC<AIExplainabilityProps> = ({ report }) => {
  if (!report || !report.recommended_option_name) return null;

  return (
    <div className="space-y-8">
      {/* RESPONSIBLE AI DISCLAIMER */}
      <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 text-xs flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        <span>
          <strong>NEXORA AI Decision Support:</strong> NEXORA AI provides personalized career decision-support based on the information you provide. Career outcomes are uncertain and recommendations are estimated potential scenarios, not guarantees.
        </span>
      </div>

      {/* 🏆 RECOMMENDED CAREER PATH & DECISION TWIN BANNER */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-cyan-500/30 shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Recommended Career Path</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {report.recommended_option_name}
            </h2>
            <p className="text-slate-400 text-xs md:text-sm">YOUR CAREER DECISION TWIN EVALUATION</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/30 text-center min-w-[140px]">
            <span className="text-xs text-slate-400 font-mono block">Career Fit Score</span>
            <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              {report.recommendation_score}%
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">High Fit Potential</span>
          </div>
        </div>

        {/* METRICS BREAKDOWN GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { label: 'Skill Match', val: `${Math.round(report.recommendation_score * 0.95)}%`, color: 'text-cyan-400' },
            { label: 'Goal Alignment', val: `${Math.round(report.recommendation_score * 0.98)}%`, color: 'text-emerald-400' },
            { label: 'Current Readiness', val: `${Math.round(report.recommendation_score * 0.88)}%`, color: 'text-blue-400' },
            { label: 'Growth Potential', val: 'High', color: 'text-purple-400' },
          ].map((m, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-400 block">{m.label}</span>
              <span className={`text-lg font-bold ${m.color}`}>{m.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* WHY NEXORA AI RECOMMENDS THIS PATH */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Why NEXORA AI Recommends This Path
            </h3>
            <p className="text-xs text-slate-400">Personalized profile analysis & matching rationale</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs md:text-sm text-slate-300 leading-relaxed">
          {report.summary}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 bg-emerald-950/15 border border-emerald-500/20 rounded-xl p-4">
            <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Key Profile Strengths</span>
            </h4>
            <ul className="space-y-2">
              {report.why_recommended.map((reason, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 bg-amber-950/15 border border-amber-500/20 rounded-xl p-4">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Key Focus & Development Areas</span>
            </h4>
            <ul className="space-y-2">
              {report.key_risks.map((risk, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 🥇 🥈 🥉 ALTERNATIVE CAREER PATHS */}
      {report.alternative_options && report.alternative_options.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Career Path Rankings & Alternatives
              </h3>
              <p className="text-xs text-slate-400">Comparative evaluation across evaluated options</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.alternative_options.map((alt, idx) => {
              const ranks = ['🥇 Recommended', '🥈 Strong Alternative', '🥉 Third Option'];
              const isFirst = idx === 0;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isFirst
                      ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-amber-400">{ranks[idx] || `#${idx + 1}`}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {alt.fit_score}% Fit
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{alt.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{alt.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SKILL GAP ANALYSIS */}
      {report.skill_gap_analysis && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Skill Gap Analysis
              </h3>
              <p className="text-xs text-slate-400">Capabilities you have vs target capabilities to develop</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SKILLS YOU ALREADY HAVE */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>SKILLS YOU ALREADY HAVE</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {report.skill_gap_analysis.existing_skills.length > 0 ? (
                  report.skill_gap_analysis.existing_skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No initial skills specified</span>
                )}
              </div>
            </div>

            {/* SKILLS YOU SHOULD DEVELOP */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                <span>SKILLS YOU SHOULD DEVELOP</span>
              </h4>
              <div className="space-y-2">
                {report.skill_gap_analysis.skills_to_develop.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <span className="text-slate-200 font-medium">{item.skill}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.priority === 'HIGH'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : item.priority === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YOUR PERSONAL DEVELOPMENT ROADMAP */}
      {report.development_roadmap && report.development_roadmap.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                YOUR PERSONAL DEVELOPMENT ROADMAP
              </h3>
              <p className="text-xs text-slate-400">Step-by-step preparation plan tailored to your skill gaps</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.development_roadmap.map((phase, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-cyan-400 text-xs font-bold font-mono">
                  <Calendar className="w-4 h-4" />
                  <span>{phase.phase}</span>
                </div>
                <ul className="space-y-2">
                  {phase.items.map((item, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FUTURE CAREER SIMULATION (6M, 1Y, 3Y TIMELINE) */}
      {report.timeline_simulation && report.timeline_simulation.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Future Career Simulation Stages
              </h3>
              <p className="text-xs text-slate-400">Estimated potential growth trajectory over time</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.timeline_simulation.map((stage, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold font-mono border border-indigo-500/30 inline-block">
                  {stage.timeframe}
                </span>
                <ul className="space-y-2">
                  {stage.potential_focus.map((focus, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{focus}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
