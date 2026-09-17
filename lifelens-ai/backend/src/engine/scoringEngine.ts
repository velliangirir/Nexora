export interface OptionInput {
  id: string;
  name: string;
  description?: string;
  cost?: number;
  estimated_months: number;
  difficulty_score: number;
  long_term_growth: number;
  scores: Record<string, number>; // factorId -> score (0-100)
}

export interface FactorInput {
  id: string;
  name: string;
  weight: number;
  category?: string;
}

export interface ConstraintInput {
  id: string;
  name: string;
  constraint_type: 'max_time' | 'min_growth' | 'max_difficulty';
  limit_value: number;
  is_hard?: boolean;
}

export interface SimulationModifiers {
  time_multiplier?: number;   // 0.5 to 2.0
  risk_tolerance?: number;    // 0 to 100
  effort_available?: number;  // 0 to 100
  factor_weight_overrides?: Record<string, number>;
}

export interface ScenarioOutcome {
  type: 'optimistic' | 'realistic' | 'conservative';
  score: number;
  estimated_months: number;
  risk_level: 'Low' | 'Medium' | 'High';
  key_assumptions: string[];
  constraint_violations: string[];
}

export interface OptionEvaluationResult {
  option_id: string;
  option_name: string;
  final_score: number;
  base_score: number;
  penalties: number;
  scenarios: ScenarioOutcome[];
  breakdown: Array<{
    factor_id: string;
    factor_name: string;
    weight: number;
    score: number;
    weighted_contribution: number;
  }>;
  violations: string[];
}

export function evaluateDecisionOptions(
  options: OptionInput[],
  factors: FactorInput[],
  constraints: ConstraintInput[],
  modifiers: SimulationModifiers = {},
  historicalTimeErrorPct: number = 0
): OptionEvaluationResult[] {
  if (options.length === 0 || factors.length === 0) {
    return [];
  }

  // 1. Calculate effective weights with overrides
  const effectiveWeights: Record<string, number> = {};
  let totalWeight = 0;
  
  factors.forEach((f) => {
    const override = modifiers.factor_weight_overrides?.[f.id];
    const w = override !== undefined ? override : f.weight;
    effectiveWeights[f.id] = Math.max(0.1, w);
    totalWeight += effectiveWeights[f.id];
  });

  const timeMult = modifiers.time_multiplier ?? 1.0;
  const riskTol = modifiers.risk_tolerance ?? 50;

  return options.map((opt) => {
    // 2. Base Factor Score calculation
    let weightedSum = 0;
    const breakdown: OptionEvaluationResult['breakdown'] = [];

    factors.forEach((f) => {
      const normWeight = effectiveWeights[f.id] / totalWeight;
      const rawScore = opt.scores[f.id] ?? 50;
      const contrib = rawScore * normWeight;
      weightedSum += contrib;

      breakdown.push({
        factor_id: f.id,
        factor_name: f.name,
        weight: Math.round(normWeight * 100) / 100,
        score: rawScore,
        weighted_contribution: Math.round(contrib * 100) / 100,
      });
    });

    // Effective time adjusted by multipliers & historical user bias
    const effectiveTime = (opt.estimated_months || 6) * timeMult * (1 + historicalTimeErrorPct / 100);

    // 3. Evaluate Constraints & Penalties
    let penalties = 0;
    const violations: string[] = [];

    constraints.forEach((c) => {
      if (c.constraint_type === 'max_time') {
        if (effectiveTime > c.limit_value) {
          const excessRatio = (effectiveTime - c.limit_value) / c.limit_value;
          const p = Math.min(35, excessRatio * 40);
          penalties += p;
          violations.push(`Exceeds time limit by ${(effectiveTime - c.limit_value).toFixed(1)} months (Penalty: -${Math.round(p)} pts)`);
        }
      } else if (c.constraint_type === 'min_growth') {
        if (opt.long_term_growth < c.limit_value) {
          const gap = c.limit_value - opt.long_term_growth;
          const p = gap * 5;
          penalties += p;
          violations.push(`Growth score (${opt.long_term_growth}) below required limit of ${c.limit_value}`);
        }
      } else if (c.constraint_type === 'max_difficulty') {
        if (opt.difficulty_score > c.limit_value) {
          const gap = opt.difficulty_score - c.limit_value;
          const p = gap * 4;
          penalties += p;
          violations.push(`Difficulty (${opt.difficulty_score}) exceeds comfortable limit of ${c.limit_value}`);
        }
      }
    });

    // Penalty for risk misalignment with user tolerance
    const riskFactor = (100 - opt.long_term_growth * 5) + opt.difficulty_score * 5;
    if (riskFactor > riskTol) {
      const riskPen = Math.min(20, (riskFactor - riskTol) * 0.3);
      penalties += riskPen;
    }

    const finalScore = Math.max(0, Math.min(100, Math.round((weightedSum - penalties) * 10) / 10));

    // 4. Generate Optimistic, Realistic, Conservative Scenarios
    const scenarios: ScenarioOutcome[] = [
      {
        type: 'optimistic',
        score: Math.min(100, Math.round(finalScore * 1.15)),
        estimated_months: Math.max(0.5, Math.round(effectiveTime * 0.85 * 10) / 10),
        risk_level: 'Low',
        key_assumptions: [
          'Resource & learning tool availability is smooth without bottlenecks.',
          'Learning curve progresses 20% faster than average.',
          'No unexpected scheduling conflicts occur.'
        ],
        constraint_violations: violations.length > 0 ? ['Minor schedule buffer required'] : ['None']
      },
      {
        type: 'realistic',
        score: finalScore,
        estimated_months: Math.round(effectiveTime * 10) / 10,
        risk_level: opt.difficulty_score > 7 ? 'High' : opt.difficulty_score > 4 ? 'Medium' : 'Low',
        key_assumptions: [
          'Project timeline adheres to standard planned schedule.',
          'Moderate effort and time allocation maintained.',
          'Minor friction during implementation handled within buffer.'
        ],
        constraint_violations: violations
      },
      {
        type: 'conservative',
        score: Math.max(0, Math.round(finalScore * 0.78)),
        estimated_months: Math.round(effectiveTime * 1.3 * 10) / 10,
        risk_level: 'High',
        key_assumptions: [
          'Unforeseen delays or prerequisite skill hurdles encountered.',
          'Intermittent availability requires extra contingency time.',
          'Complex technical milestones demand extra practice hours.'
        ],
        constraint_violations: [...violations, 'Conservative scenario triggers risk buffer warning']
      }
    ];

    return {
      option_id: opt.id,
      option_name: opt.name,
      final_score: finalScore,
      base_score: Math.round(weightedSum * 10) / 10,
      penalties: Math.round(penalties * 10) / 10,
      scenarios,
      breakdown,
      violations
    };
  });
}
