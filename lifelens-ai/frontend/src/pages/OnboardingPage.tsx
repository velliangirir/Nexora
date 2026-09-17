import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Target, Clock, ArrowRight, Code2, Brain } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ageRange, setAgeRange] = useState('21-25');
  const [goals, setGoals] = useState('Software Engineering & Full-Stack Development');
  const [targetTimeline, setTargetTimeline] = useState('1 year');
  const [timeAvailable, setTimeAvailable] = useState('10-20 hrs/week');

  const handleComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-8 shadow-2xl bg-slate-900/80 backdrop-blur-md">
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Personalize Your Career Growth Profile
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome, {user?.name || 'Developer'}!</h2>
          <p className="text-xs text-slate-400">
            Tell us about your career objectives so NEXORA AI can personalize your simulator baselines.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Age / Career Stage</label>
            <div className="grid grid-cols-4 gap-3 text-xs">
              {['Under 20', '21-25', '26-30', '31+'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAgeRange(item)}
                  className={`p-3 rounded-xl border text-center font-medium transition-all ${
                    ageRange === item
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Primary Career Focus
            </label>
            <select
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Software Engineering & Full-Stack Development">Software Engineering & Full-Stack</option>
              <option value="AI / Machine Learning & Data Science">AI / Machine Learning & Data Science</option>
              <option value="Cloud / DevOps & Systems">Cloud / DevOps & Systems Architecture</option>
              <option value="Cybersecurity & Network Engineering">Cybersecurity & Security Engineering</option>
              <option value="Embedded Systems & VLSI">Embedded Systems & Hardware Engineering</option>
              <option value="Product Management & Tech Leadership">Product Management & Tech Leadership</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Target Timeline Goal
              </label>
              <select
                value={targetTimeline}
                onChange={(e) => setTargetTimeline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="6 months">6 Months</option>
                <option value="1 year">1 Year</option>
                <option value="2 years">2 Years</option>
                <option value="3 years">3 Years</option>
                <option value="5 years">5 Years</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Weekly Learning Capacity
              </label>
              <select
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="5-10 hrs/week">5-10 hrs/week</option>
                <option value="10-20 hrs/week">10-20 hrs/week</option>
                <option value="20-40 hrs/week">20-40 hrs/week (Dedicated)</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleComplete}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all"
        >
          <span>Complete Setup & Enter Decision Center</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
