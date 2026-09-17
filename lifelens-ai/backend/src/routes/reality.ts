import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from './auth';

const router = Router();

// POST /api/reality-checks — Record actual outcome vs predicted metrics
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const {
      decision_id,
      selected_option_id,
      actual_time_months,
      satisfaction_score,
      problems_notes,
      key_lessons,
      what_worked,
      what_did_not_work,
      actual_outcome,
    } = req.body;

    if (!decision_id || !selected_option_id) {
      return res.status(400).json({ error: 'decision_id and selected_option_id are required' });
    }

    let decision = db.prepare('SELECT * FROM decisions WHERE id = ? AND user_id = ?').get(decision_id, req.userId);
    if (!decision) {
      decision = db.prepare('SELECT * FROM decisions WHERE id = ?').get(decision_id);
    }
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    const option = db.prepare('SELECT * FROM options WHERE id = ? AND decision_id = ?').get(selected_option_id, decision_id) as any;
    if (!option) {
      return res.status(404).json({ error: 'Selected option not found in decision' });
    }

    const rcId = 'rc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Delete any existing reality check for this decision to overwrite
    db.prepare('DELETE FROM reality_checks WHERE decision_id = ?').run(decision_id);

    db.prepare(`
      INSERT INTO reality_checks (id, decision_id, selected_option_id, actual_cost, actual_time_months, actual_score, problems_notes, satisfaction_score, key_lessons, what_worked, what_did_not_work, actual_outcome)
      VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      rcId,
      decision_id,
      selected_option_id,
      actual_time_months !== undefined ? Number(actual_time_months) : null,
      satisfaction_score !== undefined ? Number(satisfaction_score) : null,
      problems_notes || '',
      satisfaction_score !== undefined ? Number(satisfaction_score) : null,
      key_lessons || '',
      what_worked || '',
      what_did_not_work || '',
      actual_outcome || ''
    );

    // Update decision status to completed
    db.prepare("UPDATE decisions SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(decision_id);

    // Calculate prediction variance metrics (Time only)
    const timeVariancePct = option.estimated_months > 0 && actual_time_months ? ((actual_time_months - option.estimated_months) / option.estimated_months) * 100 : 0;

    res.status(201).json({
      message: 'Reality Check recorded successfully',
      reality_check_id: rcId,
      variance: {
        predicted_time: option.estimated_months,
        actual_time_months,
        time_variance_pct: Math.round(timeVariancePct * 10) / 10,
        satisfaction_score,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reality-checks/:decisionId — Get reality check for a decision
router.get('/:decisionId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const rc = db.prepare(`
      SELECT rc.*, o.name as option_name, o.estimated_months as pred_time
      FROM reality_checks rc
      JOIN options o ON rc.selected_option_id = o.id
      WHERE rc.decision_id = ?
    `).get(req.params.decisionId) as any;

    if (!rc) {
      return res.status(404).json({ error: 'No Reality Check recorded for this decision yet' });
    }

    res.json({ realityCheck: rc });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
