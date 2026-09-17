import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Decision, Option, RealityCheck } from '../types';
import { CheckCircle2, ArrowLeft, Clock, Star, Sparkles, ThumbsUp, ThumbsDown, BookOpen, Target } from 'lucide-react';

export const RealityCheckPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [decision, setDecision] = useState<Decision | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [existingRc, setExistingRc] = useState<RealityCheck | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [actualTime, setActualTime] = useState<number>(0);
  const [satisfaction, setSatisfaction] = useState<number>(9);
  const [actualOutcome, setActualOutcome] = useState('');
  const [whatWorked, setWhatWorked] = useState('');
  const [whatDidNotWork, setWhatDidNotWork] = useState('');
  const [keyLessons, setKeyLessons] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [varianceResult, setVarianceResult] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/decisions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDecision(data.decision);
          setOptions(data.options || []);
          if (data.options && data.options.length > 0) {
            setSelectedOptionId(data.options[0].id);
            setActualTime(data.options[0].estimated_months || 0);
          }
          if (data.realityCheck) {
            setExistingRc(data.realityCheck);
            setSelectedOptionId(data.realityCheck.selected_option_id);
            setActualTime(data.realityCheck.actual_time_months || 0);
            setSatisfaction(data.realityCheck.satisfaction_score || 9);
            setActualOutcome(data.realityCheck.actual_outcome || '');
            setWhatWorked(data.realityCheck.what_worked || '');
            setWhatDidNotWork(data.realityCheck.what_did_not_work || '');
            setKeyLessons(data.realityCheck.key_lessons || '');
            setNotes(data.realityCheck.problems_notes || '');
          }
        }
      } catch (err) {
        console.error('Error fetching decision for reality check:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchData();
    }
  }, [id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/reality-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision_id: id,
          selected_option_id: selectedOptionId,
          actual_time_months: actualTime,
          satisfaction_score: satisfaction,
          actual_outcome: actualOutcome,
          what_worked: whatWorked,
          what_did_not_work: whatDidNotWork,
          key_lessons: keyLessons,
          problems_notes: notes,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save Reality Check');

      setSuccessMsg('Reality Check recorded! Adaptive learning models updated based on time estimation & outcome metrics.');
      setVarianceResult(data.variance);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !decision) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-400">
        Loading Reality Check Studio...
      </div>
    );
  }

  const selectedOpt = options.find((o) => o.id === selectedOptionId);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Signature Reality Check Feature
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">Record Actual Outcomes for "{decision.title}"</h1>
        </div>

        <button
          onClick={() => navigate(`/simulator/${decision.id}`)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Simulator
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {successMsg}
          </div>
          {varianceResult && (
            <div className="pt-2 font-mono text-[11px] border-t border-emerald-500/20">
              • Time Variance (Predicted vs Actual): {varianceResult.time_variance_pct > 0 ? `+${varianceResult.time_variance_pct}% longer than predicted` : `${varianceResult.time_variance_pct}% faster`}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 border border-slate-800 space-y-6">
        
        {/* Select Chosen Option */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Which option was actually chosen?</label>
          <select
            value={selectedOptionId}
            onChange={(e) => {
              setSelectedOptionId(e.target.value);
              const opt = options.find((o) => o.id === e.target.value);
              if (opt) {
                setActualTime(opt.estimated_months || 0);
              }
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-500"
          >
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name} (Predicted Duration: {opt.estimated_months} mos)
              </option>
            ))}
          </select>
        </div>

        {/* Time Comparison & Satisfaction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Actual Time Taken */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Actual Time Taken (Months)
            </label>
            <input
              type="number"
              step="0.5"
              value={actualTime}
              onChange={(e) => setActualTime(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
            />
            {selectedOpt && (
              <p className="text-[11px] text-slate-400">Predicted estimate was {selectedOpt.estimated_months} months</p>
            )}
          </div>

          {/* Satisfaction Rating */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" /> Overall Outcome Satisfaction Score ({satisfaction} / 10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={satisfaction}
              onChange={(e) => setSatisfaction(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 (Very Unsatisfied)</span>
              <span>10 (Extremely Satisfied)</span>
            </div>
          </div>

        </div>

        {/* Actual Outcome */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-sky-400" /> Actual Outcome Achieved
          </label>
          <textarea
            value={actualOutcome}
            onChange={(e) => setActualOutcome(e.target.value)}
            placeholder="Describe the final result or goal achieved after executing this choice..."
            rows={2}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-sky-500"
          />
        </div>

        {/* What Worked & What Did Not Work Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <ThumbsUp className="w-4 h-4 text-emerald-400" /> What Worked Well?
            </label>
            <textarea
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
              placeholder="Highlight strategies, tools, or factors that succeeded..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <ThumbsDown className="w-4 h-4 text-rose-400" /> What Did Not Work?
            </label>
            <textarea
              value={whatDidNotWork}
              onChange={(e) => setWhatDidNotWork(e.target.value)}
              placeholder="Highlight bottlenecks, unexpected delays, or difficulties..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-rose-500"
            />
          </div>

        </div>

        {/* Key Lessons Learned & Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-400" /> Key Lessons Learned & Problems Encountered
          </label>
          <textarea
            value={keyLessons || notes}
            onChange={(e) => {
              setKeyLessons(e.target.value);
              setNotes(e.target.value);
            }}
            placeholder="e.g. Dedicated preparation schedule was effective, but project timeline needed 2 extra weeks..."
            rows={3}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 transition-all text-sm flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {saving ? 'Saving Outcome...' : 'Save Reality Check & Update Adaptive Engine'}
        </button>

      </form>

    </div>
  );
};
