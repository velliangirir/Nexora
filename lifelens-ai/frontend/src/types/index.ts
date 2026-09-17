export interface User {
  id: string;
  name: string;
  email: string;
  age_range?: string;
  occupation?: string;
  goals?: string;
}

export interface Factor {
  id: string;
  name: string;
  weight: number;
  category?: string;
}

export interface Option {
  id: string;
  name: string;
  description?: string;
  experience_level?: string;
  interest_level?: string;
  estimated_months?: number;
  difficulty_score?: number;
  long_term_growth?: number;
  scores: Record<string, number>;
}

export interface Constraint {
  id: string;
  name: string;
  constraint_type: 'max_time' | 'min_growth' | 'max_difficulty';
  limit_value: number;
  is_hard?: boolean;
}

export interface ScenarioOutcome {
  type: 'optimistic' | 'realistic' | 'conservative';
  score: number;
  estimated_months: number;
  risk_level: 'Low' | 'Medium' | 'High';
  key_assumptions: string[];
  constraint_violations: string[];
}

export interface EvaluationResult {
  option_id: string;
  option_name: string;
  final_score: number;
  base_score: number;
  penalties: number;
  skill_match_pct?: number;
  goal_alignment_pct?: number;
  readiness_pct?: number;
  project_match_pct?: number;
  learning_curve?: string;
  skill_gap_level?: 'Low' | 'Moderate' | 'High';
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

export interface SkillGapItem {
  skill: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedResource?: string;
}

export interface RoadmapPhase {
  period: string; // e.g. "MONTH 1–2"
  title: string;
  actionItems: string[];
}

export interface CareerTimelineStage {
  timeframe: string; // e.g. "6 MONTHS", "1 YEAR", "3 YEARS"
  title: string;
  potentialFocus: string[];
}

export interface ExplainableAIReport {
  recommended_option_id: string;
  recommended_option_name: string;
  recommendation_score: number;
  summary: string;
  why_recommended: string[];
  key_risks: string[];
  alternative_paths: Array<{
    rank: number;
    option_name: string;
    fit_score: number;
    comparison_notes: string;
  }>;
  skill_gap_analysis: {
    existing_skills: string[];
    skills_to_develop: SkillGapItem[];
  };
  development_roadmap: RoadmapPhase[];
  career_timeline: CareerTimelineStage[];
  trade_off_analysis: Array<{
    option_name: string;
    advantage: string;
    drawback: string;
  }>;
  suggested_missed_factors: string[];
  reflection_questions: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  tech: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  link?: string;
}

export interface CertificationEntry {
  name: string;
  provider: string;
  link?: string;
}

export interface UserProfile {
  projects?: ProjectEntry[];
  skills?: string[];
  problemSolving?: string; // e.g., "LeetCode 150+ solved, HackerRank 5-Star"
  leetcodeProfile?: string;
  githubProfile?: string;
  linkedinProfile?: string;
  certifications?: CertificationEntry[];
  education?: string;
  internships?: string;
  workExperience?: string;
  achievements?: string;
  otherExperience?: string;
  portfolioUrl?: string;
  resumeFilename?: string;
}

export interface PersonalDetails {
  fullName?: string;
  currentSituation?: string; // Step 1: Current situation
  careerGoal?: string; // Step 1: Career goal
  careerInterest?: string; // Step 1: Selected interest category
  longTermGoal?: string; // Step 1: Long-term career goal
  targetTimeline?: string; // Step 1: Target timeline (e.g., 6m, 1y, 2y)
  age?: number;
  educationLevel?: string;
  courseDegree?: string;
  specialization?: string;
  institution?: string;
  graduationYear?: string;
  cgpaValue?: string;
  eduSkills?: string[];
}

export interface Decision {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  status: 'active' | 'completed' | 'archived';
  deadline?: string;
  profile?: UserProfile | string;
  personal_details?: PersonalDetails | string;
  created_at: string;
  updated_at: string;
  option_count?: number;
  reality_count?: number;
}

export interface RealityCheck {
  id: string;
  decision_id: string;
  selected_option_id: string;
  actual_time_months?: number;
  actual_score?: number;
  problems_notes?: string;
  satisfaction_score?: number;
  key_lessons?: string;
  what_worked?: string;
  what_did_not_work?: string;
  actual_outcome?: string;
  option_name?: string;
  pred_time?: number;
  created_at?: string;
}

export interface AnalyticsSummary {
  kpis: {
    totalDecisions: number;
    activeDecisions: number;
    completedDecisions: number;
    realityCount: number;
    averageConfidence: number;
    predictionAccuracyPct: number;
    riskToleranceLevel: string;
  };
  categoryDistribution: Array<{ category: string; count: number }>;
  accuracyTrend: Array<{ month: string; predicted: number; actual: number }>;
  riskDistribution: Array<{ name: string; count: number }>;
}
