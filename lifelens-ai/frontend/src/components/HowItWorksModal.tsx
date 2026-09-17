import React from 'react';
import { X, Sliders, GitBranch, Sparkles, ShieldCheck, PlusCircle, HelpCircle, Target, Code2, Compass } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl bg-slate-900/95 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">How NEXORA AI Works</h2>
              <p className="text-xs text-slate-400">Personalized Career Decision & Growth Simulator Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intro Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/20 space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Skill Gap Engine + Explainable Decision Twin
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            NEXORA AI evaluates your profile, matches your skills against career options, calculates readiness scores, and generates step-by-step career development roadmaps.
          </p>
        </div>

        {/* 5-Step Pipeline Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">The 5-Step Career Decision Journey</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 relative">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">Step 01</span>
                <Target className="w-4 h-4 text-slate-500" />
              </div>
              <h4 className="font-bold text-white text-sm">Define Career Goal</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Set your target career goal, interest domain, current situation, and target timeline (6m to 5y).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 relative">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-mono text-xs font-bold">Step 02</span>
                <Code2 className="w-4 h-4 text-slate-500" />
              </div>
              <h4 className="font-bold text-white text-sm">Add Skills & Projects Profile</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Input your technical skills, LeetCode / coding experience, projects, and education. Optional fields allow continuation even with empty profiles.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 relative">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-mono text-xs font-bold">Step 03</span>
                <GitBranch className="w-4 h-4 text-slate-500" />
              </div>
              <h4 className="font-bold text-white text-sm">Compare Career Options & AI Suggestions</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compare 2 to 6 career paths. Use AI-suggested career paths based on your real profile data while maintaining full edit control.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 relative">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono text-xs font-bold">Step 04</span>
                <Compass className="w-4 h-4 text-slate-500" />
              </div>
              <h4 className="font-bold text-white text-sm">Simulate Career Twin & Roadmaps</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run simulation to discover your Recommended Career Path, Skill Gap Analysis, Personal Development Roadmap, and Future Timeline stages.
              </p>
            </div>

          </div>

          {/* Step 5 (Full Width Highlight) */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
            <div className="flex justify-between items-center">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">Step 05</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h4 className="font-bold text-white text-sm">Reality Check & Adaptive Engine</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              After following a career path, log your real-world outcome, satisfaction, and actual preparation time. NEXORA AI learns from real outcomes to refine future recommendations!
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs shadow-lg transition-all"
          >
            Got It, Let's Go!
          </button>
        </div>

      </div>
    </div>
  );
};
