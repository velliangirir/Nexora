import React from 'react';
import { AppLogo } from './AppLogo';
import { Shield, Cpu, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AppLogo className="w-6 h-6" />
              <span className="font-bold text-white tracking-tight text-base">NEXORA AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore the possibilities. Make better decisions. NEXORA AI turns complex real-world choices into explainable What-If scenarios.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Core Features</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-sky-400 transition-colors">What-If Slider Simulator</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Deterministic Scoring Engine</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Explainable AI Recommendations</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Reality Check Variance Tracker</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Decision Categories</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-300">Engineering & Tech Paths</span></li>
              <li><span className="text-slate-300">Education & Course Planning</span></li>
              <li><span className="text-slate-300">Project & Team Selection</span></li>
              <li><span className="text-slate-300">Workstation & Tool Purchases</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">System Transparency</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Disclaimer: NEXORA AI generates estimated scenarios based on mathematical algorithms and user-provided assumptions. It does not predict future certainty.
            </p>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p>© 2026 NEXORA AI. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Adaptive Decision Support Engine v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
