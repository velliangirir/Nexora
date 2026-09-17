import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Decision, EvaluationResult, ExplainableAIReport, RealityCheck } from '../types';
import { AIExplainability } from '../components/AIExplainability';
import { PdfReportGenerator } from '../components/PdfReportGenerator';
import { Sparkles, Sliders, ShieldAlert, GitBranch, Clock, Flame, CheckCircle2, Target, Brain } from 'lucide-react';

export const SimulatorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [decision, setDecision] = useState<Decision | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [aiReport, setAiReport] = useState<ExplainableAIReport | null>(null);
  const [realityCheck, setRealityCheck] = useState<RealityCheck | null>(null);
  const [loading, setLoading] = useState(true);

  // Slider State Controls
  const [growthMult, setGrowthMult] = useState<number>(1.0);
  const [timeMult, setTimeMult] = useState<number>(1.0);
  const [riskTolerance, setRiskTolerance] = useState<number>(50);
  const [effortHours, setEffortHours] = useState<number>(30);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // 1. Initial Load Decision Data
  useEffect(() => {
    const fetchDecision = async () => {
      try {
        const res = await fetch(`/api/decisions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDecision(data.decision);
          setEvaluations(data.evaluations || []);
          setAiReport(data.aiReport || null);
          setRealityCheck(data.realityCheck || null);
        }
      } catch (err) {
        console.error('Error loading decision:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchDecision();
    }
  }, [id, token]);

  // 2. Real-Time Re-evaluation on Slider Change (0ms Instant Recalculation)
  useEffect(() => {
    const recalculate = async () => {
      if (!id || !token) return;
      try {
        const res = await fetch('/api/simulations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            decision_id: id,
            modifiers: {
              growth_priority: growthMult,
              time_multiplier: timeMult,
              risk_tolerance: riskTolerance,
              effort_available: effortHours
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          setEvaluations(data.evaluations || []);
          setAiReport(data.aiReport || null);
        }
      } catch (err) {
        console.error('Error re-calculating simulation:', err);
      }
    };

    const timer = setTimeout(recalculate, 50); // slight debounce for smooth dragging
    return () => clearTimeout(timer);
  }, [growthMult, timeMult, riskTolerance, effortHours, id, token]);

  if (loading || !decision) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Loading What-If Simulation Engine...</p>
      </div>
    );
  }

  // Prepare Radar Chart Data (Option factor comparison)
  const topFactors = evaluations[0]?.breakdown || [];
  const radarData = topFactors.map((f) => {
    const row: Record<string, any> = { factor: f.factor_name };
    evaluations.forEach((ev) => {
      const match = ev.breakdown.find((b) => b.factor_id === f.factor_id);
      row[ev.option_name] = match ? match.score : 50;
    });
    return row;
  });

  const topOption = [...evaluations].sort((a, b) => b.final_score - a.final_score)[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* SIMULATOR TOP BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {decision.category}
            </span>
            <span className="text-xs text-slate-400">• Real-Time Simulation Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{decision.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PdfReportGenerator decision={decision} evaluations={evaluations} aiReport={aiReport || undefined} realityCheck={realityCheck || undefined} />
          
          <Link
            to={`/reality/${decision.id}`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Reality Check
          </Link>
        </div>
      </div>

      {/* DECISION TWIN USER PROFILE CARD (STEP 3 DATA) */}
      {decision.profile && (
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 bg-slate-900/60">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">Candidate / User Profile & Skills</span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Step 3 Background Data</span>
          </div>

          {typeof decision.profile === 'string' && decision.profile === 'NA' ? (
            <p className="text-xs text-slate-400 italic">Profile Data: NA (Default baseline evaluation applied)</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {typeof decision.profile === 'object' && decision.profile.skills && decision.profile.skills.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Learned Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {decision.profile.skills.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono text-[11px] border border-sky-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {typeof decision.profile === 'object' && decision.profile.projects && decision.profile.projects.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Projects Built:</span>
                  <span className="text-slate-200 font-medium">
                    {decision.profile.projects.map((p: any) => p.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DECISION TWIN PERSONAL & EDUCATIONAL DETAILS CARD (STEP 4 DATA) */}
      {decision.personal_details && typeof decision.personal_details === 'object' && (
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 bg-slate-900/60 text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-mono font-bold text-sky-400 uppercase tracking-wider">Candidate Personal & Educational Background</span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Step 4 Context</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
            {decision.personal_details.fullName && (
              <div>
                <span className="text-slate-400 block font-medium">Candidate:</span>
                <span className="text-white font-semibold">{decision.personal_details.fullName}</span> {decision.personal_details.age && `(${decision.personal_details.age} yrs)`}
              </div>
            )}

            {(decision.personal_details.city || decision.personal_details.state || decision.personal_details.country) && (
              <div>
                <span className="text-slate-400 block font-medium">Location:</span>
                <span className="text-slate-200 font-medium">
                  {[decision.personal_details.city, decision.personal_details.state, decision.personal_details.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {decision.personal_details.educationLevel && (
              <div>
                <span className="text-slate-400 block font-medium">Education Level:</span>
                <span className="text-sky-300 font-semibold">{decision.personal_details.educationLevel}</span> {decision.personal_details.courseDegree && `(${decision.personal_details.courseDegree})`}
              </div>
            )}

            {decision.personal_details.institution && (
              <div>
                <span className="text-slate-400 block font-medium">Institution:</span>
                <span className="text-slate-200">{decision.personal_details.institution}</span>
              </div>
            )}

            {decision.personal_details.cgpaValue && (
              <div>
                <span className="text-slate-400 block font-medium">Score / Grade:</span>
                <span className="text-emerald-400 font-mono font-bold">{decision.personal_details.cgpaValue} ({decision.personal_details.cgpaType || 'CGPA'})</span>
              </div>
            )}

            {decision.personal_details.targetRole && (
              <div>
                <span className="text-slate-400 block font-medium">Target Role:</span>
                <span className="text-indigo-300 font-bold">{decision.personal_details.targetRole}</span>
              </div>
            )}
          </div>

          {decision.personal_details.eduSkills && decision.personal_details.eduSkills.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-slate-400 font-medium block mb-1">Current Technical & Core Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {decision.personal_details.eduSkills.map((sk: string) => (
                  <span key={sk} className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono text-[11px] border border-sky-500/20">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CORE WHAT-IF CONTROLS BAR (INTERACTIVE SLIDERS) */}
      <div className="glass-card rounded-3xl p-6 border border-sky-500/30 shadow-2xl space-y-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Career What-If Simulator Sliders</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 animate-pulse">
            ⚡ Real-Time Recalculation Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
          
          {/* Slider 1: Learning & Prep Time per Week */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-400" /> Learning Time / Week
              </span>
              <span className="font-mono text-rose-400 font-bold">{effortHours} hrs/wk</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={effortHours}
              onChange={(e) => setEffortHours(parseInt(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>10 hrs/wk</span>
              <span>60 hrs/wk</span>
            </div>
          </div>

          {/* Slider 2: Skill & Project Level */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-cyan-400" /> Skill Mastery Level
              </span>
              <span className="font-mono text-cyan-400 font-bold">{growthMult.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={growthMult}
              onChange={(e) => setGrowthMult(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.5x (Beginner)</span>
              <span>2.0x (Advanced)</span>
            </div>
          </div>

          {/* Slider 3: Timeline Preparation */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" /> Timeline Speed
              </span>
              <span className="font-mono text-purple-400 font-bold">{timeMult.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={timeMult}
              onChange={(e) => setTimeMult(parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.5x (Fast-track)</span>
              <span>2.0x (Extended)</span>
            </div>
          </div>

          {/* Slider 4: Risk & Career Ambition */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Career Risk Level
              </span>
              <span className="font-mono text-amber-400 font-bold">{riskTolerance} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Conservative</span>
              <span>Ambitious</span>
            </div>
          </div>

        </div>
      </div>

      {/* TOP WINNING OPTION BANNER */}
      {topOption && (
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-emerald-950/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">Highest Scoring Simulation Winner</span>
            <h2 className="text-2xl font-bold text-white mt-0.5">{topOption.option_name}</h2>
            <p className="text-xs text-slate-400 mt-1">Base Score: {topOption.base_score} • Constraint Penalties: -{topOption.penalties} pts</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-3xl font-extrabold text-emerald-400">{topOption.final_score}</span>
              <span className="text-xs text-slate-400 block">/ 100 Final Score</span>
            </div>
          </div>
        </div>
      )}

      {/* OPTIMISTIC, REALISTIC, CONSERVATIVE SCENARIOS CARDS */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-400" />
          Generated Scenario Variations (Optimistic, Realistic, Conservative)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {evaluations.slice(0, 3).map((ev) => {
            const realistic = ev.scenarios.find((s) => s.type === 'realistic');
            const optimistic = ev.scenarios.find((s) => s.type === 'optimistic');
            const conservative = ev.scenarios.find((s) => s.type === 'conservative');

            return (
              <div key={ev.option_id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 glass-card-hover">
                
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-white text-base">{ev.option_name}</h4>
                  <span className="text-xl font-extrabold text-sky-400">{ev.final_score} <span className="text-xs text-slate-400">/100</span></span>
                </div>

                {/* Scenario Badges */}
                <div className="space-y-2 text-xs">
                  
                  {/* Optimistic */}
                  <div className="bg-emerald-950/30 border border-emerald-500/20 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-emerald-400">
                      <span>Optimistic Scenario</span>
                      <span>Score: {optimistic?.score}</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Duration: {optimistic?.estimated_months} mos
                    </div>
                  </div>

                  {/* Realistic */}
                  <div className="bg-sky-950/30 border border-sky-500/20 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-sky-400">
                      <span>Realistic Scenario</span>
                      <span>Score: {realistic?.score}</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Duration: {realistic?.estimated_months} mos • Risk: {realistic?.risk_level}
                    </div>
                  </div>

                  {/* Conservative */}
                  <div className="bg-amber-950/30 border border-amber-500/20 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-amber-400">
                      <span>Conservative Scenario</span>
                      <span>Score: {conservative?.score}</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Duration: {conservative?.estimated_months} mos
                    </div>
                  </div>

                </div>

                {ev.violations.length > 0 && (
                  <div className="text-[11px] text-rose-400 bg-rose-950/20 p-2.5 rounded-xl border border-rose-500/20">
                    ⚠️ {ev.violations[0]}
                  </div>
                )}

              </div>
            );
          })}

        </div>
      </div>

      {/* EXPLAINABLE AI SECTION */}
      {aiReport && <AIExplainability report={aiReport} />}



      {/* VISUAL DECISION TREE GRAPH */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Interactive Visual Decision Tree</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Click any node to view details</span>
        </div>

        <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-8 min-w-[700px]">
            
            {/* Root Node */}
            <div className="bg-sky-500/20 border border-sky-500/40 p-4 rounded-2xl text-center space-y-1 shrink-0 shadow-lg">
              <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">Decision Root</span>
              <h4 className="font-bold text-white text-xs max-w-[150px] truncate">{decision.title}</h4>
            </div>

            <div className="w-8 h-0.5 bg-slate-700 shrink-0" />

            {/* Options Branches */}
            <div className="flex flex-col gap-4 flex-1">
              {evaluations.map((ev) => (
                <div
                  key={ev.option_id}
                  onClick={() => setSelectedNode(ev.option_name)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedNode === ev.option_name
                      ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span className="text-xs font-bold">{ev.option_name}</span>
                  </div>
                  <div className="flex gap-2 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Opt: {ev.scenarios[0]?.score}</span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400">Real: {ev.scenarios[1]?.score}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">Cons: {ev.scenarios[2]?.score}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {selectedNode && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            Selected Tree Node: <strong className="text-white">{selectedNode}</strong> — Demonstrating branch details for optimistic, realistic, and conservative scenarios.
          </div>
        )}
      </div>

      {/* 🧠 AI STRATEGIC SUGGESTION (AFTER VISUAL DECISION TREE) */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/25 via-slate-900/90 to-slate-950 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-500/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono uppercase tracking-wider font-bold">
              <Brain className="w-4 h-4 text-purple-400" /> Neural Decision Intelligence
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              🧠 AI Decision Suggestion & Guidance
            </h3>
            <p className="text-xs text-slate-300">
              Personalized strategy synthesized directly from your decision tree branches and What-If variable sliders.
            </p>
          </div>

          {topOption && (
            <div className="px-4 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-2 shrink-0">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono font-bold text-purple-300">
                Suggested: <strong className="text-white">{topOption.option_name}</strong> ({topOption.final_score}/100)
              </span>
            </div>
          )}
        </div>

        {/* AI Suggestion Body Content */}
        {topOption ? (
          <div className="space-y-6">
            
            {/* Top Recommendation Box */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 font-mono">
                  Primary Path Recommendation
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Optimal Tree Fit
                </span>
              </div>

              <h4 className="text-lg font-bold text-white">
                Pursue <span className="text-sky-400">{topOption.option_name}</span> as your primary strategic choice.
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                {aiReport?.summary ||
                  `Based on your visual decision tree evaluation, "${topOption.option_name}" achieves the highest overall alignment score (${topOption.final_score}/100) with minimal constraint penalties (-${topOption.penalties} pts).`}
              </p>
            </div>

            {/* Strategic Action Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Card 1: Core Strength */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Decision Tree Advantage
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {aiReport?.positive_factors?.[0] ||
                    `"${topOption.option_name}" provides the strongest performance across optimistic and realistic tree branches.`}
                </p>
              </div>

              {/* Card 2: Risk Mitigation */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldAlert className="w-4 h-4" /> Risk & Effort Calibration
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {riskTolerance < 40
                    ? `With a risk-averse setting (${riskTolerance}/100), maintain structured milestone reviews every 30 days.`
                    : effortHours > 40
                    ? `High weekly commitment (${effortHours} hrs/wk) is required. Pace your workload to prevent burnout.`
                    : `Your current slider settings (Growth ${growthMult}x, Effort ${effortHours}h/wk) match the execution requirements cleanly.`}
                </p>
              </div>

              {/* Card 3: Alternative Contingency */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <GitBranch className="w-4 h-4" /> Contingency Pivot Branch
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {evaluations.length > 1
                    ? `If external constraints shift, your secondary tree contingency branch is "${[...evaluations].sort((a, b) => b.final_score - a.final_score)[1]?.option_name}" (${[...evaluations].sort((a, b) => b.final_score - a.final_score)[1]?.final_score}/100).`
                    : `No secondary alternative needed. Focus 100% on executing ${topOption.option_name}.`}
                </p>
              </div>

            </div>

            {/* AI Reflection Question */}
            {aiReport?.reflection_questions && aiReport.reflection_questions.length > 0 && (
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs space-y-1.5">
                <span className="font-extrabold text-purple-300 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-400" /> Key Question for Strategic Reflection:
                </span>
                <p className="text-purple-200/90 italic leading-relaxed">
                  "{aiReport.reflection_questions[0]}"
                </p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-500/20">
              <span className="text-[11px] text-slate-400 font-mono">
                AI Suggestion Engine updated dynamically with slider adjustments
              </span>
              <Link
                to={`/reality/${decision.id}`}
                className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs shadow-lg shadow-purple-950/50 flex items-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Lock Choice & Log Reality Check
              </Link>
            </div>

          </div>
        ) : (
          <p className="text-xs text-slate-400">No decision options evaluated yet.</p>
        )}

      </div>

    </div>
  );
};
