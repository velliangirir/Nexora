import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from './auth';
import { evaluateDecisionOptions, FactorInput, OptionInput, ConstraintInput, SimulationModifiers } from '../engine/scoringEngine';
import { generateExplainableRecommendation } from '../engine/aiEngine';

const router = Router();

// POST /api/simulations — Real-time What-If slider re-evaluation
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { decision_id, options, factors, constraints, modifiers } = req.body;

    let evalOptions: OptionInput[] = options || [];
    let evalFactors: FactorInput[] = factors || [];
    let evalConstraints: ConstraintInput[] = constraints || [];
    let decisionTitle = 'Custom Simulation';
    let category = 'General';

    // If decision_id is provided, load from DB if not passed in body
    if (decision_id && (!options || options.length === 0)) {
      const decision = db.prepare('SELECT * FROM decisions WHERE id = ?').get(decision_id) as any;
      if (decision) {
        decisionTitle = decision.title;
        category = decision.category;
      }

      const dbOptions = db.prepare('SELECT * FROM options WHERE decision_id = ?').all(decision_id) as any[];
      const dbFactors = db.prepare('SELECT * FROM factors WHERE decision_id = ?').all(decision_id) as any[];
      const dbConstraints = db.prepare('SELECT * FROM constraints WHERE decision_id = ?').all(decision_id) as any[];

      if (dbFactors.length === 0) {
        evalFactors = [
          { id: 'fct_1', name: 'Career Growth Potential', weight: 2.0, category: 'career' },
          { id: 'fct_2', name: 'Personal Passion & Interest', weight: 1.8, category: 'interest' },
          { id: 'fct_3', name: 'Learning Difficulty', weight: 1.2, category: 'difficulty' },
          { id: 'fct_4', name: 'Preparation Time', weight: 1.5, category: 'time' },
        ];
      } else {
        evalFactors = dbFactors.map((f) => ({
          id: f.id,
          name: f.name,
          weight: f.weight,
          category: f.category,
        }));
      }

      evalConstraints = dbConstraints.map((c) => ({
        id: c.id,
        name: c.name,
        constraint_type: c.constraint_type,
        limit_value: c.limit_value,
        is_hard: Boolean(c.is_hard),
      }));

      evalOptions = dbOptions.map((opt) => {
        const scoresRows = db.prepare('SELECT factor_id, score FROM option_factor_scores WHERE option_id = ?').all(opt.id) as any[];
        const scoresMap: Record<string, number> = {};
        scoresRows.forEach((r) => {
          scoresMap[r.factor_id] = r.score;
        });

        return {
          id: opt.id,
          name: opt.name,
          description: opt.description,
          cost: opt.cost,
          estimated_months: opt.estimated_months,
          difficulty_score: opt.difficulty_score,
          long_term_growth: opt.long_term_growth,
          scores: scoresMap,
        };
      });
    }

    // Check user's historical time error bias from past reality checks
    let historicalTimeErrorPct = 0;
    if (req.userId) {
      const pastChecks = db.prepare(`
        SELECT rc.actual_time_months, o.estimated_months as pred_time
        FROM reality_checks rc
        JOIN options o ON rc.selected_option_id = o.id
        JOIN decisions d ON rc.decision_id = d.id
        WHERE d.user_id = ? AND rc.actual_time_months IS NOT NULL AND o.estimated_months > 0
      `).all(req.userId) as any[];

      if (pastChecks.length > 0) {
        let totalError = 0;
        pastChecks.forEach((c) => {
          totalError += (c.actual_time_months - c.pred_time) / c.pred_time;
        });
        historicalTimeErrorPct = Math.round((totalError / pastChecks.length) * 100);
      }
    }

    let userSkills: string[] = [];
    let userProjects: any[] = [];
    let targetTimeline = '1 year';

    if (decision_id) {
      const decision = db.prepare('SELECT profile, personal_details FROM decisions WHERE id = ?').get(decision_id) as any;
      if (decision) {
        try {
          const prof = typeof decision.profile === 'string' && decision.profile.startsWith('{') ? JSON.parse(decision.profile) : decision.profile;
          if (prof && typeof prof === 'object') {
            userSkills = prof.skills || [];
            userProjects = prof.projects || [];
          }
          const pd = typeof decision.personal_details === 'string' && decision.personal_details.startsWith('{') ? JSON.parse(decision.personal_details) : decision.personal_details;
          if (pd && typeof pd === 'object') {
            if (pd.eduSkills) userSkills = Array.from(new Set([...userSkills, ...pd.eduSkills]));
            if (pd.targetTimeline) targetTimeline = pd.targetTimeline;
          }
        } catch (_) {}
      }
    }

    const simModifiers: SimulationModifiers = modifiers || {};
    const evaluations = evaluateDecisionOptions(evalOptions, evalFactors, evalConstraints, simModifiers, historicalTimeErrorPct);
    const aiReport = generateExplainableRecommendation(decisionTitle, category, evaluations, userSkills, userProjects, targetTimeline);

    res.json({
      timestamp: new Date().toISOString(),
      evaluations,
      aiReport,
      historical_bias_applied: {
        time_error_pct: historicalTimeErrorPct,
        explanation: historicalTimeErrorPct !== 0 
          ? `Adjusted for your historical data: past actual execution time was approx ${historicalTimeErrorPct}% higher than estimated.` 
          : 'No historical timeline bias detected.'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
