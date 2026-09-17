import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from './auth';
import { generateExplainableRecommendation } from '../engine/aiEngine';
import { evaluateDecisionOptions } from '../engine/scoringEngine';

const router = Router();

// POST /api/ai/analyze — Generates explainable AI recommendation summary
router.post('/analyze', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { title, category, options, factors, constraints, modifiers } = req.body;

    if (!title || !options || options.length === 0 || !factors || factors.length === 0) {
      return res.status(400).json({ error: 'Title, options, and factors are required for AI analysis' });
    }

    const evaluations = evaluateDecisionOptions(options, factors, constraints || [], modifiers || {});
    const aiReport = generateExplainableRecommendation(title, category || 'General', evaluations);

    res.json({ aiReport });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
