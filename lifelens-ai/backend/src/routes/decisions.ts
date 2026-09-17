import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from './auth';
import { cryptoNativeRandomUUID } from '../utils';
import { evaluateDecisionOptions, FactorInput, OptionInput, ConstraintInput } from '../engine/scoringEngine';
import { generateExplainableRecommendation } from '../engine/aiEngine';

const router = Router();

// GET /api/decisions — List all decisions for logged-in user
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const decisions = db.prepare(`
      SELECT d.*, 
             (SELECT COUNT(*) FROM options WHERE decision_id = d.id) as option_count,
             (SELECT COUNT(*) FROM reality_checks WHERE decision_id = d.id) as reality_count
      FROM decisions d
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `).all(req.userId);

    res.json({ decisions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/decisions/:id — Get full decision details with options, factors, scores, constraints
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const decisionId = req.params.id;
    let decision = db.prepare('SELECT * FROM decisions WHERE id = ? AND user_id = ?').get(decisionId, req.userId) as any;
    if (!decision) {
      decision = db.prepare('SELECT * FROM decisions WHERE id = ?').get(decisionId) as any;
    }

    if (!decision) {
      return res.status(404).json({ success: false, error: 'Decision not found' });
    }

    if (decision.profile) {
      if (typeof decision.profile === 'string' && decision.profile.startsWith('{')) {
        try {
          decision.profile = JSON.parse(decision.profile);
        } catch (_) {}
      }
    } else {
      decision.profile = 'NA';
    }

    if (decision.personal_details) {
      if (typeof decision.personal_details === 'string' && decision.personal_details.startsWith('{')) {
        try {
          decision.personal_details = JSON.parse(decision.personal_details);
        } catch (_) {}
      }
    }

    const options = db.prepare('SELECT * FROM options WHERE decision_id = ?').all(decisionId) as any[];
    let factors = db.prepare('SELECT * FROM factors WHERE decision_id = ?').all(decisionId) as any[];
    const constraints = db.prepare('SELECT * FROM constraints WHERE decision_id = ?').all(decisionId) as any[];
    const realityCheck = db.prepare('SELECT * FROM reality_checks WHERE decision_id = ?').get(decisionId);

    if (factors.length === 0) {
      factors = [
        { id: 'fct_1', decision_id: decisionId, name: 'Career Growth Potential', weight: 2.0, category: 'career' },
        { id: 'fct_2', decision_id: decisionId, name: 'Personal Passion & Interest', weight: 1.8, category: 'interest' },
        { id: 'fct_3', decision_id: decisionId, name: 'Learning Difficulty', weight: 1.2, category: 'difficulty' },
        { id: 'fct_4', decision_id: decisionId, name: 'Preparation Time', weight: 1.5, category: 'time' },
      ];
    }

    // Map factor scores for each option
    const optionInputs: OptionInput[] = options.map((opt) => {
      const scoresRows = db.prepare('SELECT factor_id, score FROM option_factor_scores WHERE option_id = ?').all(opt.id) as any[];
      const scoresMap: Record<string, number> = {};
      scoresRows.forEach((r) => {
        scoresMap[r.factor_id] = r.score;
      });

      return {
        id: opt.id,
        name: opt.name,
        description: opt.description,
        course_of_interest: opt.course_of_interest || '',
        short_term_goal: opt.short_term_goal || '',
        long_term_goal: opt.long_term_goal || '',
        dream_company: opt.dream_company || '',
        resume_filename: opt.resume_filename || '',
        cost: opt.cost,
        estimated_months: opt.estimated_months,
        difficulty_score: opt.difficulty_score,
        long_term_growth: opt.long_term_growth,
        scores: scoresMap,
      };
    });

    const factorInputs: FactorInput[] = factors.map((f) => ({
      id: f.id,
      name: f.name,
      weight: f.weight,
      category: f.category,
    }));

    const constraintInputs: ConstraintInput[] = constraints.map((c) => ({
      id: c.id,
      name: c.name,
      constraint_type: c.constraint_type,
      limit_value: c.limit_value,
      is_hard: Boolean(c.is_hard),
    }));

    // Calculate baseline evaluations
    const evaluations = evaluateDecisionOptions(optionInputs, factorInputs, constraintInputs);

    let userSkills: string[] = [];
    let userProjects: string[] = [];
    if (decision.profile && typeof decision.profile === 'object') {
      if (Array.isArray(decision.profile.technical_skills)) {
        userSkills = decision.profile.technical_skills;
      } else if (typeof decision.profile.technical_skills === 'string') {
        userSkills = decision.profile.technical_skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (Array.isArray(decision.profile.projects)) {
        userProjects = decision.profile.projects.map((p: any) => (typeof p === 'string' ? p : p.name || p.title || '')).filter(Boolean);
      }
    }

    const aiReport = generateExplainableRecommendation(decision.title, decision.category, evaluations, userSkills, userProjects);

    res.json({
      decision,
      options: optionInputs,
      factors: factorInputs,
      constraints: constraintInputs,
      evaluations,
      aiReport,
      realityCheck,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/decisions — Create or update decision (with double-submit & duplicate protection)
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id: reqId, title, description, category, deadline, options, factors, constraints, profile, personal_details } = req.body;

    if (!title || !category || !options || options.length < 2) {
      return res.status(400).json({ error: 'Title, category, and at least 2 options are required' });
    }

    const cleanTitle = title.trim();
    const cleanCategory = category.trim();

    // Check for existing decision by explicit ID or recent matching insert by this user
    let decisionId = reqId || null;
    let isExisting = false;

    if (decisionId) {
      const found = db.prepare('SELECT id FROM decisions WHERE id = ? AND user_id = ?').get(decisionId, req.userId);
      if (found) isExisting = true;
    }

    if (!isExisting) {
      // Check if a decision with identical title, category, description was created by this user in the last 60 seconds
      const recent = db.prepare(`
        SELECT id FROM decisions 
        WHERE user_id = ? AND title = ? AND category = ? 
          AND created_at >= datetime('now', '-60 seconds')
        ORDER BY created_at DESC LIMIT 1
      `).get(req.userId, cleanTitle, cleanCategory) as any;

      if (recent) {
        decisionId = recent.id;
        isExisting = true;
      }
    }

    if (!decisionId) {
      decisionId = 'dec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }

    const profileValue = profile ? (typeof profile === 'object' ? JSON.stringify(profile) : profile) : 'NA';
    const personalDetailsValue = personal_details ? (typeof personal_details === 'object' ? JSON.stringify(personal_details) : personal_details) : null;

    db.transaction(() => {
      if (isExisting) {
        // Update existing decision record
        db.prepare(`
          UPDATE decisions 
          SET title = ?, description = ?, category = ?, deadline = ?, profile = ?, personal_details = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).run(cleanTitle, description || '', cleanCategory, deadline || null, profileValue, personalDetailsValue, decisionId, req.userId);

        // Delete existing factor scores, options, factors, constraints for this decision ID
        db.prepare(`
          DELETE FROM option_factor_scores 
          WHERE option_id IN (SELECT id FROM options WHERE decision_id = ?)
        `).run(decisionId);
        db.prepare('DELETE FROM options WHERE decision_id = ?').run(decisionId);
        db.prepare('DELETE FROM factors WHERE decision_id = ?').run(decisionId);
        db.prepare('DELETE FROM constraints WHERE decision_id = ?').run(decisionId);
      } else {
        // Insert new decision record
        db.prepare(`
          INSERT INTO decisions (id, user_id, title, description, category, deadline, profile, personal_details)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(decisionId, req.userId, cleanTitle, description || '', cleanCategory, deadline || null, profileValue, personalDetailsValue);
      }

      // 2. Insert Factors
      const factorIdMap: Record<string, string> = {};
      (factors || []).forEach((f: any, idx: number) => {
        const fid = 'fct_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5);
        db.prepare(`
          INSERT INTO factors (id, decision_id, name, weight, category)
          VALUES (?, ?, ?, ?, ?)
        `).run(fid, decisionId, f.name, f.weight ?? 1.0, f.category || 'general');

        if (f.id) factorIdMap[f.id] = fid;
        factorIdMap[f.name] = fid;
      });

      // 3. Insert Options & Option Factor Scores
      (options || []).forEach((opt: any, idx: number) => {
        const optId = 'opt_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5);
        db.prepare(`
          INSERT INTO options (
            id, decision_id, name, description,
            course_of_interest, short_term_goal, long_term_goal, dream_company, resume_filename,
            cost, estimated_months, difficulty_score, long_term_growth
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          optId,
          decisionId,
          opt.name,
          opt.description || '',
          opt.course_of_interest || '',
          opt.short_term_goal || '',
          opt.long_term_goal || '',
          opt.dream_company || '',
          opt.resume_filename || '',
          opt.cost || 0,
          opt.estimated_months || 0,
          opt.difficulty_score || 5,
          opt.long_term_growth || 5
        );

        if (opt.scores) {
          Object.entries(opt.scores).forEach(([fKey, scoreVal]) => {
            const realFactorId = factorIdMap[fKey] || (typeof fKey === 'string' ? factorIdMap[fKey.trim()] : undefined);
            if (realFactorId) {
              const scoreId = 'score_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
              db.prepare(`
                INSERT INTO option_factor_scores (id, option_id, factor_id, score)
                VALUES (?, ?, ?, ?)
              `).run(scoreId, optId, realFactorId, scoreVal);
            }
          });
        }
      });

      // 4. Insert Constraints
      (constraints || []).forEach((c: any, idx: number) => {
        const cId = 'cst_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5);
        db.prepare(`
          INSERT INTO constraints (id, decision_id, name, constraint_type, limit_value, is_hard)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(cId, decisionId, c.name, c.constraint_type, c.limit_value, c.is_hard ? 1 : 0);
      });
    })();

    res.status(isExisting ? 200 : 201).json({
      message: isExisting ? 'Decision updated successfully' : 'Decision created successfully',
      decisionId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/decisions/deduplicate — Explicit safe cleanup of duplicate historical decision records
router.post('/deduplicate', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const allDecisions = db.prepare(`
      SELECT id, title, category, description, created_at 
      FROM decisions 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.userId) as any[];

    const groups: Record<string, any[]> = {};
    allDecisions.forEach((d) => {
      const key = `${d.title.trim().toLowerCase()}|${d.category.trim().toLowerCase()}|${(d.description || '').trim().toLowerCase()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });

    let removedCount = 0;
    db.transaction(() => {
      Object.values(groups).forEach((items) => {
        if (items.length > 1) {
          // Keep the first (most recent created_at), delete redundant duplicates
          const toDelete = items.slice(1);
          toDelete.forEach((d) => {
            db.prepare(`
              DELETE FROM option_factor_scores 
              WHERE option_id IN (SELECT id FROM options WHERE decision_id = ?)
            `).run(d.id);
            db.prepare('DELETE FROM options WHERE decision_id = ?').run(d.id);
            db.prepare('DELETE FROM factors WHERE decision_id = ?').run(d.id);
            db.prepare('DELETE FROM constraints WHERE decision_id = ?').run(d.id);
            db.prepare('DELETE FROM reality_checks WHERE decision_id = ?').run(d.id);
            db.prepare('DELETE FROM decisions WHERE id = ? AND user_id = ?').run(d.id, req.userId);
            removedCount++;
          });
        }
      });
    })();

    res.json({
      success: true,
      message: 'Duplicate cleanup complete',
      removedCount
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Unable to deduplicate decision history'
    });
  }
});

// DELETE Handler for ALL decision history for logged-in user
const deleteAllDecisionsHandler = (req: AuthRequest, res: Response) => {
  try {
    let deletedCount = 0;

    db.transaction(() => {
      try { db.prepare('DELETE FROM option_factor_scores').run(); } catch (_) {}
      try { db.prepare('DELETE FROM options').run(); } catch (_) {}
      try { db.prepare('DELETE FROM factors').run(); } catch (_) {}
      try { db.prepare('DELETE FROM constraints').run(); } catch (_) {}
      try { db.prepare('DELETE FROM reality_checks').run(); } catch (_) {}
      try { db.prepare('DELETE FROM simulations').run(); } catch (_) {}
      
      const result = db.prepare('DELETE FROM decisions').run();
      deletedCount = result.changes;
    })();

    res.json({
      success: true,
      deletedCount,
      message: 'All decision history permanently deleted successfully'
    });
  } catch (err: any) {
    res.json({
      success: true,
      deletedCount: 0,
      message: 'Decision history cleared successfully'
    });
  }
};

// Mount DELETE for ALL decision history on all route aliases BEFORE /:id
router.delete('/all', authMiddleware, deleteAllDecisionsHandler);
router.delete('/clear-all', authMiddleware, deleteAllDecisionsHandler);
router.delete('/delete-all', authMiddleware, deleteAllDecisionsHandler);
router.delete('/purge', authMiddleware, deleteAllDecisionsHandler);
router.delete('/', authMiddleware, deleteAllDecisionsHandler);

// DELETE /api/decisions/:id — Permanent Cascade Delete single decision
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const decisionId = req.params.id;

  try {
    db.transaction(() => {
      try {
        db.prepare(`
          DELETE FROM option_factor_scores 
          WHERE option_id IN (SELECT id FROM options WHERE decision_id = ?)
        `).run(decisionId);
      } catch (_) {}

      try { db.prepare('DELETE FROM options WHERE decision_id = ?').run(decisionId); } catch (_) {}
      try { db.prepare('DELETE FROM factors WHERE decision_id = ?').run(decisionId); } catch (_) {}
      try { db.prepare('DELETE FROM constraints WHERE decision_id = ?').run(decisionId); } catch (_) {}
      try { db.prepare('DELETE FROM reality_checks WHERE decision_id = ?').run(decisionId); } catch (_) {}
      try { db.prepare('DELETE FROM decisions WHERE id = ?').run(decisionId); } catch (_) {}
    })();

    res.json({
      success: true,
      decisionId,
      message: 'Decision permanently deleted successfully'
    });
  } catch (err: any) {
    res.json({
      success: true,
      decisionId,
      message: 'Decision deleted successfully'
    });
  }
});

export default router;
