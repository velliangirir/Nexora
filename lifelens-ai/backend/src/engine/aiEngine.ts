import { OptionEvaluationResult } from './scoringEngine';

export interface SkillGapItem {
  skill: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedResource?: string;
}

export interface RoadmapPhase {
  period: string;
  title: string;
  actionItems: string[];
}

export interface CareerTimelineStage {
  timeframe: string;
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

export function generateExplainableRecommendation(
  decisionTitle: string,
  category: string,
  evaluations: OptionEvaluationResult[],
  userSkills: string[] = [],
  userProjects: any[] = [],
  targetTimeline: string = '1 year'
): ExplainableAIReport {
  if (evaluations.length === 0) {
    return {
      recommended_option_id: '',
      recommended_option_name: 'No Options',
      recommendation_score: 0,
      summary: 'No options provided for evaluation.',
      why_recommended: [],
      key_risks: [],
      alternative_paths: [],
      skill_gap_analysis: { existing_skills: [], skills_to_develop: [] },
      development_roadmap: [],
      career_timeline: [],
      trade_off_analysis: [],
      suggested_missed_factors: [],
      reflection_questions: [],
    };
  }

  // Sort options by final_score descending
  const sorted = [...evaluations].sort((a, b) => b.final_score - a.final_score);
  const winner = sorted[0];

  // 1. Identify top positive drivers for winner
  const topFactors = [...winner.breakdown].sort((a, b) => b.weighted_contribution - a.weighted_contribution);
  const positiveDrivers: string[] = [];

  if (userSkills.length > 0) {
    positiveDrivers.push(`Your existing skills (${userSkills.slice(0, 4).join(', ')}) provide a solid technical foundation for ${winner.option_name}.`);
  } else {
    positiveDrivers.push(`Strong performance in ${topFactors[0]?.factor_name || 'Core Readiness'} (Score: ${topFactors[0]?.score || 85}/100).`);
  }

  if (userProjects.length > 0) {
    positiveDrivers.push(`Your portfolio of ${userProjects.length} project(s) demonstrates practical execution relevant to this career track.`);
  } else {
    positiveDrivers.push(`High future growth alignment with your declared long-term career direction.`);
  }

  if (winner.penalties === 0) {
    positiveDrivers.push('Satisfies all readiness and timeline requirements with zero constraint penalties.');
  }

  // 2. Key Risks / Challenges
  const keyRisks: string[] = [];
  if (winner.violations && winner.violations.length > 0) {
    winner.violations.forEach((v) => keyRisks.push(`Constraint Alert: ${v}`));
  } else {
    keyRisks.push('Requires consistent weekly practice hours and hands-on project milestones to maintain readiness.');
  }

  // 3. Alternative Career Paths (🥇 🥈 🥉)
  const alternativePaths = sorted.map((opt, idx) => {
    let notes = '';
    if (idx === 0) {
      notes = `${opt.option_name} is currently the strongest match based on your existing skills and goal alignment.`;
    } else if (idx === 1) {
      notes = `${opt.option_name} is a strong secondary alternative, requiring minor additional domain specialization.`;
    } else {
      notes = `${opt.option_name} remains a viable future option as your technical toolkit expands.`;
    }

    return {
      rank: idx + 1,
      option_name: opt.option_name,
      fit_score: opt.final_score,
      comparison_notes: notes,
    };
  });

  // 4. Dynamic Skill Gap Analysis based on winner path name
  const existingSkills = userSkills.length > 0 ? userSkills : ['Problem Solving', 'Baseline Technical Aptitude'];
  const pathNameLower = winner.option_name.toLowerCase();

  const skillsToDevelop: SkillGapItem[] = [];
  if (pathNameLower.includes('software') || pathNameLower.includes('developer')) {
    skillsToDevelop.push({ skill: 'Data Structures & Algorithms', category: 'CS Fundamentals', priority: 'HIGH' });
    skillsToDevelop.push({ skill: 'System Design & Architecture', category: 'Software Design', priority: 'HIGH' });
    skillsToDevelop.push({ skill: 'REST API & Microservices', category: 'Backend Development', priority: 'MEDIUM' });
    skillsToDevelop.push({ skill: 'CI/CD & Cloud Deployment', category: 'DevOps', priority: 'MEDIUM' });
  } else if (pathNameLower.includes('ai') || pathNameLower.includes('machine learning') || pathNameLower.includes('ml')) {
    skillsToDevelop.push({ skill: 'Machine Learning Algorithms & PyTorch/TensorFlow', category: 'AI/ML', priority: 'HIGH' });
    skillsToDevelop.push({ skill: 'Linear Algebra & Feature Engineering', category: 'Mathematics', priority: 'HIGH' });
    skillsToDevelop.push({ skill: 'Model Deployment & MLOps', category: 'Infrastructure', priority: 'MEDIUM' });
    skillsToDevelop.push({ skill: 'LLM Fine-Tuning & Prompt Engineering', category: 'GenAI', priority: 'MEDIUM' });
  } else if (pathNameLower.includes('data')) {
    skillsToDevelop.push({ skill: 'Advanced SQL & Data Warehousing', category: 'Data Engineering', priority: 'HIGH' });
    skillsToDevelop.push({ skill: 'Pandas & Statistical Modeling', category: 'Data Science', priority: 'HIGH' });
    skillsToDevelop.push({ skill: 'ETL Pipelines & Spark', category: 'Data Infrastructure', priority: 'MEDIUM' });
  } else {
    skillsToDevelop.push({ skill: 'Advanced Core Competencies', category: 'Specialization', priority: 'HIGH' });
    skillsToDevelop.push({ skill: 'System Architecture & Design', category: 'Engineering', priority: 'HIGH' });
    skillsToDevelop.push({ skill: 'Technical Portfolio & Interview Prep', category: 'Career Readiness', priority: 'MEDIUM' });
  }

  // 5. Personal Career Development Roadmap (Phased Months)
  const developmentRoadmap: RoadmapPhase[] = [
    {
      period: 'MONTH 1–2',
      title: 'Foundation & Core Skill Strengthening',
      actionItems: [
        `Focus on mastering ${skillsToDevelop[0]?.skill || 'Core Fundamentals'}.`,
        'Practice daily coding problem solving (LeetCode / HackerRank).',
        'Review existing projects and refine Git repositories.'
      ]
    },
    {
      period: 'MONTH 3–4',
      title: 'Portfolio Project & Practical Application',
      actionItems: [
        `Build 1 high-impact project applying ${skillsToDevelop[1]?.skill || 'System Architecture'}.`,
        'Document technical trade-offs in GitHub README.',
        'Optimize resume and LinkedIn profile for target career track.'
      ]
    },
    {
      period: 'MONTH 5–6',
      title: 'Interview Readiness & Applications',
      actionItems: [
        'Conduct mock technical interviews and system design practice.',
        'Apply for internships / entry-level positions on target platforms.',
        'Record actual progress on NEXORA AI Reality Check.'
      ]
    }
  ];

  // 6. Future Career Timeline (6 MONTHS, 1 YEAR, 3 YEARS)
  const careerTimeline: CareerTimelineStage[] = [
    {
      timeframe: '6 MONTHS',
      title: 'Skill Consolidation & Initial Applications',
      potentialFocus: [
        'Potential completion of core technical portfolio',
        'Increased readiness for technical interviews',
        'Active submission of targeted job/internship applications'
      ]
    },
    {
      timeframe: '1 YEAR',
      title: 'Early Career Execution & Role Onboarding',
      potentialFocus: [
        'Potential onboarding in Junior / Associate level role',
        'Real-world production codebase experience',
        'Expanded professional network and mentorship'
      ]
    },
    {
      timeframe: '3 YEARS',
      title: 'Specialization & Growth Advancement',
      potentialFocus: [
        'Potential advancement to Mid-Level / Specialist position',
        'Ownership of key technical modules or system architecture',
        'Mentorship of junior team members and continuous learning'
      ]
    }
  ];

  // 7. Trade-Off Analysis
  const tradeOffs = sorted.map((opt) => {
    const highest = [...opt.breakdown].sort((a, b) => b.score - a.score)[0];
    const lowest = [...opt.breakdown].sort((a, b) => a.score - b.score)[0];

    return {
      option_name: opt.option_name,
      advantage: highest ? `Excels at ${highest.factor_name} (${highest.score}/100)` : 'Balanced career fit',
      drawback: opt.penalties > 0
        ? `Triggers ${Math.round(opt.penalties)} pts constraint penalties`
        : lowest ? `Lower score in ${lowest.factor_name} (${lowest.score}/100)` : 'Requires steady preparation',
    };
  });

  const summary = `Based on your career profile, skills, and target timeline, **${winner.option_name}** achieved the highest overall Career Fit Score of **${winner.final_score}/100**.`;

  return {
    recommended_option_id: winner.option_id,
    recommended_option_name: winner.option_name,
    recommendation_score: winner.final_score,
    summary,
    why_recommended: positiveDrivers,
    key_risks: keyRisks,
    alternative_paths: alternativePaths,
    skill_gap_analysis: {
      existing_skills: existingSkills,
      skills_to_develop: skillsToDevelop,
    },
    development_roadmap: developmentRoadmap,
    career_timeline: careerTimeline,
    trade_off_analysis: tradeOffs,
    suggested_missed_factors: ['Hiring Demand', 'Mentorship Availability', 'Remote Flexibility'],
    reflection_questions: [
      `How excited are you to work daily as a ${winner.option_name}?`,
      'Are you willing to dedicate 10-15 hours per week to closing your high-priority skill gaps?'
    ],
  };
}
