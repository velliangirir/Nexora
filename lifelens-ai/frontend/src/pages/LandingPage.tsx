import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from '../components/AppLogo';
import {
  Sparkles,
  Sliders,
  ShieldCheck,
  ArrowRight,
  GitBranch,
  Target,
  Zap,
  Brain,
  ChevronRight,
  Activity,
  TrendingUp,
  Code2,
  Compass,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Interactive Live What-If Slider state for Landing Page Preview
  const [effortMultiplier, setEffortMultiplier] = useState(1.0);
  const [riskTolerance, setRiskTolerance] = useState(50);

  // Dynamic live score calculation for preview card
  const baseScoreSoftware = 91;
  const baseScoreAiMl = 82;
  const baseScoreDataEng = 86;

  const liveSoftwareScore = Math.min(99, Math.max(40, Math.round(baseScoreSoftware * (0.8 + effortMultiplier * 0.2) + (riskTolerance - 50) * 0.1)));
  const liveAiMlScore = Math.min(99, Math.max(30, Math.round(baseScoreAiMl * (0.6 + effortMultiplier * 0.4) - (100 - riskTolerance) * 0.15)));
  const liveDataEngScore = Math.min(99, Math.max(40, Math.round(baseScoreDataEng * (0.9 + effortMultiplier * 0.1) + (50 - riskTolerance) * 0.05)));

  return (
    <div className="space-y-28 pb-24 text-slate-100 overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative pt-16 sm:pt-20 pb-16">
        {/* Aesthetic Background Lighting & Glow Spheres */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/15 blur-[140px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-48 right-10 w-72 h-72 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-60 left-10 w-72 h-72 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 text-center space-y-8 relative z-10">
          {/* Tagline Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-widest shadow-lg shadow-cyan-500/10 backdrop-blur-md animate-fade-in">
            <AppLogo className="w-5 h-5" />
            <span>NEXORA AI • Personalized Career Decision & Growth Simulator</span>
          </div>

          {/* Aesthetic Hero Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
            Choose Your Path. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
              Simulate Your Future. Build Your Career.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Understand your profile, compare potential career paths, discover skill gaps, and receive a personalized development roadmap for your career goals.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 text-sm"
            >
              <Zap className="w-4 h-4 fill-current text-slate-950" />
              <span>Start Free Career Simulation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {!isAuthenticated && (
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold bg-slate-900/90 text-slate-200 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/90 transition-all flex items-center justify-center gap-2 text-sm backdrop-blur-md"
              >
                Sign In to Account
              </Link>
            )}
          </div>

          {/* Feature Pillars */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl mx-auto text-xs text-slate-300">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-center gap-2.5 backdrop-blur-md hover:border-cyan-500/30 transition-colors">
              <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-medium">Skills & Project Matching</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-center gap-2.5 backdrop-blur-md hover:border-blue-500/30 transition-colors">
              <Compass className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-medium">Personal Roadmap</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-center gap-2.5 backdrop-blur-md hover:border-purple-500/30 transition-colors">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-medium">Career Fit AI</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-center gap-2.5 backdrop-blur-md hover:border-emerald-500/30 transition-colors">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">Reality Check & Adaptive Engine</span>
            </div>
          </div>

          {/* HERO IMAGE SHOWCASE CARD */}
          <div className="pt-10 max-w-4xl mx-auto px-4">
            <div className="relative rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 group">
              <img
                src="https://i.pinimg.com/736x/12/6d/e6/126de68d8ed57720d85c0bd2d56d40ba.jpg"
                alt="NEXORA AI Aesthetic Tech Visual"
                className="w-full h-[320px] sm:h-[420px] object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-90 contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 p-4 sm:p-6 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3">
                  <AppLogo className="w-10 h-10 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">Next-Gen Career Decision Twin</h3>
                    <p className="text-xs text-slate-400">Personalized Career Fit, Skill Gap Analysis & Development Roadmaps</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 text-xs font-mono font-semibold border border-cyan-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    NEXORA AI Simulator
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE LIVE WHAT-IF PLAYGROUND PREVIEW CARD */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-cyan-500/30 shadow-2xl bg-slate-900/90 relative overflow-hidden space-y-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[100px] pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2 border border-amber-500/20">
                <Activity className="w-3.5 h-3.5" />
                Live Career What-If Playground
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">"Which Career Path Best Fits My Profile?"</h3>
              <p className="text-xs text-slate-400 mt-1">Adjust learning commitment and risk sliders to preview live career fit scores!</p>
            </div>

            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="px-5 py-2.5 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs shadow-lg shadow-cyan-500/20 transition-all text-center shrink-0 flex items-center justify-center gap-2"
            >
              <span>Launch Full Simulator</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Interactive Playground Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Learning Commitment Multiplier
                </label>
                <span className="font-mono text-cyan-400 font-bold">{effortMultiplier.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={effortMultiplier}
                onChange={(e) => setEffortMultiplier(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <p className="text-[10px] text-slate-400">Simulates impact of dedicating more weekly practice and project building.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  Career Risk Level
                </label>
                <span className="font-mono text-indigo-400 font-bold">{riskTolerance}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
                className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <p className="text-[10px] text-slate-400">Higher risk tolerance evaluates ambitious specialized roles like AI Research.</p>
            </div>
          </div>

          {/* Live Recalculated Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-slate-950/80 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white text-sm">Software Developer</h4>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {liveSoftwareScore}% Fit
                </span>
              </div>
              <p className="text-xs text-slate-400">React, Node.js, DSA, System Design, REST APIs</p>
              <div className="text-[11px] space-y-1 text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex justify-between font-mono">
                  <span>Target Readiness:</span>
                  <strong className="text-emerald-400">High</strong>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Target Timeline:</span>
                  <strong className="text-slate-200">1 Year</strong>
                </div>
                <div className="text-[10px] text-emerald-400 pt-1 font-semibold">🥇 Recommended Path</div>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-slate-950/80 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white text-sm">AI/ML Engineer</h4>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {liveAiMlScore}% Fit
                </span>
              </div>
              <p className="text-xs text-slate-400">Python, PyTorch, Model Training, Mathematics, Neural Nets</p>
              <div className="text-[11px] space-y-1 text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex justify-between font-mono">
                  <span>Target Readiness:</span>
                  <strong className="text-amber-400">Moderate</strong>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Target Timeline:</span>
                  <strong className="text-slate-200">2 Years</strong>
                </div>
                <div className="text-[10px] text-amber-400 pt-1 font-semibold">🥈 Strong Alternative</div>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-cyan-500/30 bg-slate-950/80 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white text-sm">Data Engineer</h4>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {liveDataEngScore}% Fit
                </span>
              </div>
              <p className="text-xs text-slate-400">SQL, Spark, Airflow, Data Pipelines, Cloud Storage</p>
              <div className="text-[11px] space-y-1 text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex justify-between font-mono">
                  <span>Target Readiness:</span>
                  <strong className="text-cyan-400">High</strong>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Target Timeline:</span>
                  <strong className="text-slate-200">1 Year</strong>
                </div>
                <div className="text-[10px] text-cyan-400 pt-1 font-semibold">🥉 Third Option</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRIC COUNTERS SECTION */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 font-mono">100%</div>
            <div className="text-xs font-semibold text-white">Personalized Profile</div>
            <div className="text-[10px] text-slate-400">Based on your skills & goals</div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-300 font-mono">Roadmap</div>
            <div className="text-xs font-semibold text-white">Actionable Steps</div>
            <div className="text-[10px] text-slate-400">Months 1-2, 3-4, 5-6</div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 font-mono">Skill Gap</div>
            <div className="text-xs font-semibold text-white">Clear Analysis</div>
            <div className="text-[10px] text-slate-400">Have vs Develop Next</div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono">Adaptive</div>
            <div className="text-xs font-semibold text-white">Reality Check</div>
            <div className="text-[10px] text-slate-400">Learns from actual outcomes</div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-xs">Everything you need to know about NEXORA AI decision support.</p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="font-bold text-white text-sm">Does NEXORA AI guarantee my career future?</h3>
            <p className="text-slate-400 leading-relaxed">
              No. NEXORA AI provides decision-support based on your inputs. Career outcomes are uncertain and recommendations are estimated scenarios, not guarantees.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="font-bold text-white text-sm">How does NEXORA AI evaluate career fit?</h3>
            <p className="text-slate-400 leading-relaxed">
              NEXORA AI evaluates skill match, goal alignment, current readiness, project experience, and learning curve to calculate a personalized Career Fit Score.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="font-bold text-white text-sm">What is the Reality Check feature?</h3>
            <p className="text-slate-400 leading-relaxed">
              After following a career path, you record your actual outcome and satisfaction. The Adaptive Engine learns from your real experience to refine future career recommendations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
