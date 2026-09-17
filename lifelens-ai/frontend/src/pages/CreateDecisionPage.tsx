import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Clock,
  User,
  GraduationCap,
  Briefcase,
  Globe,
  Award,
  X,
  Code2,
  FolderGit2,
  Brain,
  Target,
  Rocket,
  CheckCircle2,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technology: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface CertificationItem {
  id: string;
  name: string;
  provider: string;
  link: string;
}

interface OptionItem {
  id: string;
  name: string;
  description: string;
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced' | '';
  interest_level: 'Low' | 'Medium' | 'High' | '';
}

const CAREER_INTEREST_OPTIONS = [
  'Software Development',
  'AI / Machine Learning',
  'Data Science',
  'Cybersecurity',
  'Cloud / DevOps',
  'Embedded Systems',
  'Electronics / VLSI',
  'Product Management',
  'UI/UX',
  'Data Analytics',
  'Research',
  'Entrepreneurship',
  'Other',
];

const TARGET_TIMELINES = ['6 months', '1 year', '2 years', '3 years', '5 years'];

const PRESET_SKILLS = [
  'Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'React', 'Node.js',
  'SQL', 'Git', 'Docker', 'Machine Learning', 'AWS', 'Data Structures & Algorithms',
  'HTML/CSS', 'PostgreSQL', 'MongoDB', 'System Design', 'Cybersecurity', 'Kubernetes'
];

export const CreateDecisionPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [clientDecisionId] = useState(() => 'dec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // STEP 1: CAREER GOAL (ALL MANDATORY)
  const [title, setTitle] = useState('Which career path should I choose?');
  const [currentSituation, setCurrentSituation] = useState('Final year student looking for a software career.');
  const [careerGoal, setCareerGoal] = useState('Get a software engineering job within the next year.');
  const [careerInterest, setCareerInterest] = useState('Software Development');
  const [longTermGoal, setLongTermGoal] = useState('Become a highly skilled senior software engineer.');
  const [targetTimeline, setTargetTimeline] = useState('1 year');

  // STEP 2: SKILLS & EXPERIENCE (ALL MANDATORY)
  const [technicalSkills, setTechnicalSkills] = useState<string[]>(['Python', 'JavaScript', 'React', 'SQL', 'Git']);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [codingExperience, setCodingExperience] = useState('LeetCode: 150+ solved, HackerRank 4-Star');
  const [projects, setProjects] = useState<ProjectItem[]>([
    {
      id: 'proj_1',
      name: 'Full Stack Web App',
      description: 'Built a web application with React and Node.js backend.',
      technology: 'React, Node.js, Express, MongoDB',
      level: 'Intermediate',
    },
  ]);
  const [githubUrl, setGithubUrl] = useState('https://github.com/alexchen-dev');
  const [linkedinUrl, setLinkedinUrl] = useState('https://linkedin.com/in/alexchen-dev');
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [educationLevel, setEducationLevel] = useState('Undergraduate');
  const [courseDegree, setCourseDegree] = useState('B.Tech Computer Science');
  const [institution, setInstitution] = useState('ABC Institute of Technology');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [cgpaValue, setCgpaValue] = useState('8.8 / 10.0');
  const [internships, setInternships] = useState('Software Engineering Intern at Tech Corp');
  const [workExperience, setWorkExperience] = useState('Software Engineer Intern at Tech Corp (3 months)');
  const [achievements, setAchievements] = useState('1st Place in College Hackathon 2025');
  const [otherExperience, setOtherExperience] = useState('Technical blog writer & Coding Club Lead');
  const [portfolioUrl, setPortfolioUrl] = useState('https://alexchen.dev');

  // STEP 3: CAREER OPTIONS (ALL MANDATORY)
  const [options, setOptions] = useState<OptionItem[]>([
    {
      id: 'opt_1',
      name: 'Software Developer',
      description: 'Focus on full-stack application development, clean code, and API engineering.',
      experience_level: 'Intermediate',
      interest_level: 'High',
    },
    {
      id: 'opt_2',
      name: 'AI/ML Engineer',
      description: 'Focus on machine learning models, data pipelines, and deep learning systems.',
      experience_level: 'Beginner',
      interest_level: 'High',
    },
  ]);

  // AI Suggestions status
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);

  // Helper handlers for skills
  const toggleSkill = (skill: string) => {
    if (technicalSkills.includes(skill)) {
      setTechnicalSkills(technicalSkills.filter((s) => s !== skill));
    } else {
      setTechnicalSkills([...technicalSkills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !technicalSkills.includes(trimmed)) {
      setTechnicalSkills([...technicalSkills, trimmed]);
      setCustomSkillInput('');
    }
  };

  // Helper handlers for Projects
  const handleAddProject = () => {
    setProjects([
      ...projects,
      {
        id: `proj_${Date.now()}_${projects.length}`,
        name: '',
        description: '',
        technology: '',
        level: 'Intermediate',
      },
    ]);
  };

  const handleRemoveProject = (idx: number) => {
    if (projects.length <= 1) {
      setError('At least 1 project is mandatory.');
      return;
    }
    setProjects(projects.filter((_, i) => i !== idx));
  };

  const handleUpdateProject = (idx: number, field: keyof ProjectItem, value: any) => {
    const updated = [...projects];
    updated[idx] = { ...updated[idx], [field]: value };
    setProjects(updated);
  };

  // Helper handlers for Certifications
  const handleAddCertification = () => {
    setCertifications([
      ...certifications,
      { id: `cert_${Date.now()}_${certifications.length}`, name: '', provider: '', link: '' },
    ]);
  };

  const handleRemoveCertification = (idx: number) => {
    setCertifications(certifications.filter((_, i) => i !== idx));
  };

  // Helper handlers for Options
  const handleAddOption = (name = '', description = '') => {
    if (options.length >= 6) return;
    const charLabel = String.fromCharCode(65 + options.length);
    setOptions([
      ...options,
      {
        id: `opt_${Date.now()}_${options.length + 1}`,
        name: name || `Career Option ${charLabel}`,
        description: description || 'Exploration path based on current goals.',
        experience_level: 'Beginner',
        interest_level: 'High',
      },
    ]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) {
      setError('At least 2 career options are mandatory.');
      return;
    }
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleUpdateOption = (idx: number, field: keyof OptionItem, value: any) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], [field]: value };
    setOptions(updated);
  };

  // Generate AI Suggestions based on Step 1 & Step 2 profile
  const handleGenerateAiSuggestions = () => {
    setSuggestedLoading(true);
    setTimeout(() => {
      const suggestions: string[] = [];
      const skillsStr = technicalSkills.join(' ').toLowerCase();

      if (skillsStr.includes('python') || skillsStr.includes('machine learning') || careerInterest.includes('AI')) {
        suggestions.push('AI/ML Engineer');
        suggestions.push('Data Scientist');
      }
      if (skillsStr.includes('react') || skillsStr.includes('javascript') || skillsStr.includes('java') || careerInterest.includes('Software')) {
        suggestions.push('Software Developer');
        suggestions.push('Full Stack Engineer');
      }
      if (skillsStr.includes('aws') || skillsStr.includes('docker') || careerInterest.includes('Cloud')) {
        suggestions.push('Cloud / DevOps Engineer');
      }
      if (skillsStr.includes('sql') || skillsStr.includes('postgres') || careerInterest.includes('Data')) {
        suggestions.push('Data Engineer');
      }
      if (careerInterest.includes('Cybersecurity')) {
        suggestions.push('Cybersecurity Analyst');
      }

      // Default fallbacks if empty
      if (suggestions.length === 0) {
        suggestions.push('Software Developer', 'Data Analyst', 'Cloud Engineer');
      }

      // Deduplicate and filter out already added option names
      const existingNames = options.map((o) => o.name.toLowerCase());
      const filtered = Array.from(new Set(suggestions)).filter((s) => !existingNames.includes(s.toLowerCase()));

      setAiSuggestions(filtered.length > 0 ? filtered : ['Software Engineer', 'Systems Architect']);
      setSuggestedLoading(false);
    }, 400);
  };

  // Step 1 Validation & Next (ALL FIELDS MANDATORY)
  const handleStep1Next = () => {
    if (!title.trim()) {
      setError('Career Decision Title is mandatory.');
      return;
    }
    if (!currentSituation.trim()) {
      setError('Current Situation is mandatory.');
      return;
    }
    if (!careerGoal.trim()) {
      setError('Primary Career Goal is mandatory.');
      return;
    }
    if (!careerInterest.trim()) {
      setError('Career Interest Domain is mandatory.');
      return;
    }
    if (!targetTimeline.trim()) {
      setError('Target Timeline is mandatory.');
      return;
    }
    if (!longTermGoal.trim()) {
      setError('Long-Term Career Goal is mandatory.');
      return;
    }
    setError('');
    setStep(2);
  };

  // Step 2 Validation & Next (ALL FIELDS MANDATORY)
  const handleStep2Next = () => {
    if (technicalSkills.length === 0) {
      setError('At least 1 Technical Skill is mandatory.');
      return;
    }
    if (!codingExperience.trim()) {
      setError('Programming & Problem-Solving Experience is mandatory.');
      return;
    }
    if (projects.length === 0) {
      setError('At least 1 Project is mandatory.');
      return;
    }
    for (let i = 0; i < projects.length; i++) {
      if (!projects[i].name.trim()) {
        setError(`Project Name for Project #${i + 1} is mandatory.`);
        return;
      }
      if (!projects[i].technology.trim()) {
        setError(`Technologies Used for Project #${i + 1} is mandatory.`);
        return;
      }
      if (!projects[i].description.trim()) {
        setError(`Description for Project #${i + 1} is mandatory.`);
        return;
      }
    }
    if (!githubUrl.trim()) {
      setError('GitHub Profile URL is mandatory.');
      return;
    }
    if (!linkedinUrl.trim()) {
      setError('LinkedIn Profile URL is mandatory.');
      return;
    }
    if (!courseDegree.trim()) {
      setError('Education Degree is mandatory.');
      return;
    }
    if (!institution.trim()) {
      setError('Institution / University is mandatory.');
      return;
    }
    if (!graduationYear.trim()) {
      setError('Graduation Year is mandatory.');
      return;
    }
    if (!cgpaValue.trim()) {
      setError('CGPA / Grade is mandatory.');
      return;
    }
    if (!workExperience.trim()) {
      setError('Work Experience / Internships field is mandatory.');
      return;
    }
    if (!achievements.trim()) {
      setError('Key Achievements & Awards field is mandatory.');
      return;
    }
    if (!portfolioUrl.trim()) {
      setError('Portfolio / Personal Website URL is mandatory.');
      return;
    }
    setError('');
    setStep(3);
  };

  // Step 3 Validation & Next (ALL FIELDS MANDATORY)
  const handleStep3Next = () => {
    if (options.length < 2) {
      setError('Please provide at least 2 career paths to compare.');
      return;
    }
    for (let i = 0; i < options.length; i++) {
      if (!options[i].name.trim()) {
        setError(`Name for Career Option #${i + 1} is mandatory.`);
        return;
      }
      if (!options[i].description.trim()) {
        setError(`Description for Career Option #${i + 1} is mandatory.`);
        return;
      }
      if (!options[i].experience_level) {
        setError(`Current Experience Level for Career Option #${i + 1} is mandatory.`);
        return;
      }
      if (!options[i].interest_level) {
        setError(`Personal Interest Level for Career Option #${i + 1} is mandatory.`);
        return;
      }
    }
    setError('');
    setStep(4);
  };

  // Final Submit & Launch Simulation
  const handleSubmit = async () => {
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      // Build profile object
      const hasSkills = technicalSkills.length > 0;
      const hasProjects = projects.filter((p) => p.name.trim()).length > 0;
      const hasEdu = Boolean(courseDegree || educationLevel || institution);

      const isProfileEmpty = !hasSkills && !hasProjects && !hasEdu && !codingExperience.trim() && !workExperience.trim();

      const profilePayload = isProfileEmpty
        ? 'NA'
        : {
            current_situation: currentSituation.trim() || 'NA',
            career_goal: careerGoal.trim() || 'NA',
            career_interest: careerInterest || 'NA',
            long_term_goal: longTermGoal.trim() || 'NA',
            target_timeline: targetTimeline || '1 year',
            technical_skills: technicalSkills,
            coding_experience: codingExperience.trim() || 'NA',
            projects: projects.filter((p) => p.name.trim()),
            github_url: githubUrl.trim() || 'NA',
            linkedin_url: linkedinUrl.trim() || 'NA',
            certifications: certifications.filter((c) => c.name.trim()),
            education: {
              level: educationLevel || 'NA',
              degree: courseDegree || 'NA',
              institution: institution || 'NA',
              graduationYear: graduationYear || 'NA',
              cgpa: cgpaValue || 'NA',
            },
            internships: internships.trim() || 'NA',
            work_experience: workExperience.trim() || 'NA',
            achievements: achievements.trim() || 'NA',
            other_experience: otherExperience.trim() || 'NA',
            portfolio_url: portfolioUrl.trim() || 'NA',
          };

      // Formulate factors for scoring
      const factors = [
        { id: 'fct_1', name: 'Skill Match', weight: 2.0, category: 'skill' },
        { id: 'fct_2', name: 'Goal Alignment', weight: 1.9, category: 'goal' },
        { id: 'fct_3', name: 'Current Readiness', weight: 1.8, category: 'readiness' },
        { id: 'fct_4', name: 'Growth Potential', weight: 1.8, category: 'growth' },
        { id: 'fct_5', name: 'Interest Alignment', weight: 1.5, category: 'interest' },
        { id: 'fct_6', name: 'Learning Difficulty', weight: 1.2, category: 'difficulty' },
      ];

      // Build Option objects
      const formattedOptions = options.map((opt) => {
        // Derive initial synthetic scores based on profile & option interest/experience
        let expScore = opt.experience_level === 'Advanced' ? 90 : opt.experience_level === 'Intermediate' ? 75 : 60;
        let intScore = opt.interest_level === 'High' ? 90 : opt.interest_level === 'Medium' ? 75 : 60;

        return {
          id: opt.id,
          name: opt.name.trim(),
          description: opt.description.trim() || `${opt.name} career path evaluation`,
          course_of_interest: opt.name.trim(),
          short_term_goal: careerGoal.trim() || 'Skill development and preparation',
          long_term_goal: longTermGoal.trim() || 'Career growth',
          dream_company: '',
          resume_filename: portfolioUrl || '',
          scores: {
            fct_1: expScore,
            fct_2: intScore,
            fct_3: Math.round((expScore + intScore) / 2),
            fct_4: 85,
            fct_5: intScore,
            fct_6: 40, // lower difficulty is better
          },
        };
      });

      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: clientDecisionId,
          title: title.trim(),
          category: 'Career',
          description: `Goal: ${careerGoal} | Interest: ${careerInterest} | Timeline: ${targetTimeline}`,
          options: formattedOptions,
          factors,
          constraints: [],
          profile: profilePayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize career decision.');

      // Launch simulation immediately
      navigate(`/simulator/${data.decisionId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* HEADER IDENTITY */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>NEXORA AI • Personal Career Growth Simulator</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Simulate & Choose Your Career Path
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
          Evaluate your current skills, compare future roles, discover skill gaps, and get a personalized development roadmap.
        </p>
      </div>

      {/* STEP PROGRESS BAR */}
      <div className="grid grid-cols-4 gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 backdrop-blur-md">
        {[
          { num: 1, title: '1. Career Goal', icon: Target },
          { num: 2, title: '2. Skills & Profile', icon: Code2 },
          { num: 3, title: '3. Career Options', icon: Brain },
          { num: 4, title: '4. Run Simulation', icon: Rocket },
        ].map((s) => {
          const IconComponent = s.icon;
          const isActive = step === s.num;
          const isCompleted = step > s.num;
          return (
            <div
              key={s.num}
              onClick={() => {
                if (s.num < step) setStep(s.num as any);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                  : isCompleted
                  ? 'bg-slate-800/80 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <IconComponent className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">Step {s.num}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3 animate-shake">
          <Zap className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: UNDERSTAND YOUR CAREER GOAL */}
      {step === 1 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Step 1 — Understand Your Career Goal</h2>
                <p className="text-slate-400 text-xs md:text-sm">
                  Define what career milestone or direction you are aiming for. <span className="text-cyan-400 font-semibold">(All fields are mandatory *)</span>
                </p>
              </div>
            </div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30 font-semibold">
              * All fields are mandatory
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Career Decision Title <span className="text-cyan-400 font-bold">* (Mandatory)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Which career path should I choose?"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Current Situation <span className="text-cyan-400 font-bold">* (Mandatory)</span>
              </label>
              <input
                type="text"
                value={currentSituation}
                onChange={(e) => setCurrentSituation(e.target.value)}
                placeholder="e.g. Final year CS student looking for a software career."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Primary Career Goal <span className="text-cyan-400 font-bold">* (Mandatory)</span>
              </label>
              <input
                type="text"
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                placeholder="e.g. Get a software engineering job within the next year."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Career Interest Domain <span className="text-cyan-400 font-bold">* (Mandatory)</span>
              </label>
              <select
                value={careerInterest}
                onChange={(e) => setCareerInterest(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
              >
                {CAREER_INTEREST_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Target Timeline <span className="text-cyan-400 font-bold">* (Mandatory)</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TARGET_TIMELINES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTargetTimeline(t)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      targetTimeline === t
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Long-Term Career Goal <span className="text-cyan-400 font-bold">* (Mandatory)</span>
              </label>
              <textarea
                value={longTermGoal}
                onChange={(e) => setLongTermGoal(e.target.value)}
                rows={3}
                placeholder="e.g. Become a senior tech lead or specialized Machine Learning Architect."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={handleStep1Next}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              <span>Continue to Skills & Experience</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: YOUR SKILLS & EXPERIENCE */}
      {step === 2 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Step 2 — Your Skills & Experience</h2>
                <p className="text-slate-400 text-xs md:text-sm">
                  Add your current skills, projects, education, and credentials. <span className="text-cyan-400 font-semibold">(All fields are mandatory *)</span>
                </p>
              </div>
            </div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30 font-semibold">
              * All fields are mandatory
            </span>
          </div>

          <div className="space-y-6">
            {/* TECHNICAL SKILLS */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Technical Skills <span className="text-cyan-400 font-bold">* (Mandatory - Select at least 1)</span></span>
                <span className="text-slate-400 font-normal text-xs">{technicalSkills.length} selected</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SKILLS.map((skill) => {
                  const isSelected = technicalSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {skill}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  placeholder="Add custom skill (e.g. Rust, Go, PyTorch)..."
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-all"
                >
                  Add Skill
                </button>
              </div>
            </div>

            {/* CODING & PROBLEM SOLVING */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Programming & Problem-Solving Experience <span className="text-cyan-400 font-bold">* (Mandatory)</span>
              </label>
              <input
                type="text"
                value={codingExperience}
                onChange={(e) => setCodingExperience(e.target.value)}
                placeholder="e.g. LeetCode 200+ solved, HackerRank 5-Star Python, CodeChef 1600 rating"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* PROJECTS SECTION */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-cyan-400" />
                  <span>Projects <span className="text-cyan-400 font-bold text-xs">* (Mandatory - At least 1 required)</span></span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </button>
              </div>

              {projects.map((proj, idx) => (
                <div key={proj.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative">
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(idx)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-medium">Project Name * (Mandatory)</label>
                      <input
                        type="text"
                        value={proj.name}
                        onChange={(e) => handleUpdateProject(idx, 'name', e.target.value)}
                        placeholder="Project Name (e.g. AI Portfolio Generator)"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-medium">Project Level * (Mandatory)</label>
                      <select
                        value={proj.level}
                        onChange={(e) => handleUpdateProject(idx, 'level', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Beginner">Level: Beginner</option>
                        <option value="Intermediate">Level: Intermediate</option>
                        <option value="Advanced">Level: Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">Technologies Used * (Mandatory)</label>
                    <input
                      type="text"
                      value={proj.technology}
                      onChange={(e) => handleUpdateProject(idx, 'technology', e.target.value)}
                      placeholder="Technologies Used (e.g. React, Node.js, SQLite)"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">Project Description * (Mandatory)</label>
                    <input
                      type="text"
                      value={proj.description}
                      onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                      placeholder="Brief description of what you built and achieved..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* LINKS, EDUCATION & EXPERIENCE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">
                  GitHub Profile URL <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">
                  LinkedIn Profile URL <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">
                  Portfolio / Website URL <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://alexchen.dev"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">
                  Education Degree <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                </label>
                <input
                  type="text"
                  value={courseDegree}
                  onChange={(e) => setCourseDegree(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">
                  Institution / University <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. ABC Institute of Technology"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">
                  Graduation Year <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                </label>
                <input
                  type="text"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">
                  CGPA / Grade <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                </label>
                <input
                  type="text"
                  value={cgpaValue}
                  onChange={(e) => setCgpaValue(e.target.value)}
                  placeholder="e.g. 8.8 / 10.0"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">
                  Work Experience / Internships <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                </label>
                <input
                  type="text"
                  value={workExperience}
                  onChange={(e) => setWorkExperience(e.target.value)}
                  placeholder="e.g. Software Engineering Intern at Tech Corp (3 months)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-slate-300 font-semibold">
                  Key Achievements & Awards <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                </label>
                <input
                  type="text"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="e.g. 1st Place in College Hackathon 2025, CodeChef 1600 Rating"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleStep2Next}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              <span>Continue to Career Options</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CAREER PATH OPTIONS */}
      {step === 3 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Step 3 — Career Path Options</h2>
                <p className="text-slate-400 text-xs md:text-sm">
                  Add 2 to 6 career paths you want to compare and simulate. <span className="text-cyan-400 font-semibold">(All fields are mandatory *)</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30 font-semibold">
                * All fields are mandatory
              </span>
              <button
                type="button"
                onClick={handleGenerateAiSuggestions}
                disabled={suggestedLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-500/30 transition-all"
              >
                <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                <span>{suggestedLoading ? 'Analyzing Profile...' : 'AI Suggest Career Paths'}</span>
              </button>
            </div>
          </div>

          {/* AI SUGGESTIONS BANNER */}
          {aiSuggestions.length > 0 && (
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 space-y-2">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Based on your profile, these paths may be worth evaluating:</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {aiSuggestions.map((pathName) => (
                  <button
                    key={pathName}
                    type="button"
                    onClick={() => handleAddOption(pathName, `Exploration of ${pathName} career path.`)}
                    className="px-3 py-1.5 rounded-lg bg-purple-900/60 border border-purple-700/80 text-purple-200 text-xs font-medium hover:bg-purple-800 flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add {pathName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CAREER OPTIONS LIST */}
          <div className="space-y-4">
            {options.map((opt, idx) => (
              <div key={opt.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                    Option {String.fromCharCode(65 + idx)}
                  </span>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1 space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">
                      Career Path Name <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                    </label>
                    <input
                      type="text"
                      value={opt.name}
                      onChange={(e) => handleUpdateOption(idx, 'name', e.target.value)}
                      placeholder="e.g. Software Developer"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">
                      Current Experience Level <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                    </label>
                    <select
                      value={opt.experience_level}
                      onChange={(e) => handleUpdateOption(idx, 'experience_level', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">
                      Personal Interest Level <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                    </label>
                    <select
                      value={opt.interest_level}
                      onChange={(e) => handleUpdateOption(idx, 'interest_level', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Low">Low Interest</option>
                      <option value="Medium">Medium Interest</option>
                      <option value="High">High Interest</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">
                    Career Description / Target Focus <span className="text-cyan-400 font-bold">* (Mandatory)</span>
                  </label>
                  <input
                    type="text"
                    value={opt.description}
                    onChange={(e) => handleUpdateOption(idx, 'description', e.target.value)}
                    placeholder="Brief description of what this role entails for you..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <button
              type="button"
              onClick={() => handleAddOption()}
              className="w-full py-3 rounded-xl border border-dashed border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Career Option ({options.length}/6)</span>
            </button>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleStep3Next}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              <span>Continue to Simulation Launcher</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SIMULATE YOUR CAREER FUTURE */}
      {step === 4 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-md shadow-2xl text-center">
          <div className="max-w-xl mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/20">
              <Rocket className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">STEP 4 — SIMULATE YOUR CAREER FUTURE</h2>
            <p className="text-cyan-300 font-medium text-sm">
              Ready to see which path best matches your current profile and future goals?
            </p>
          </div>

          {/* PROFILE SUMMARY CARD */}
          <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              Career Evaluation Profile Summary
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Career Goal:</span>
                <span className="text-white font-semibold">{careerGoal || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Domain Interest:</span>
                <span className="text-white font-semibold">{careerInterest}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Target Timeline:</span>
                <span className="text-cyan-400 font-semibold">{targetTimeline}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Options to Compare:</span>
                <span className="text-emerald-400 font-semibold">{options.map((o) => o.name).join(', ')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-500 block">Top Skills Identified:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {technicalSkills.length > 0 ? (
                  technicalSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">None specified (Profile = NA)</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 max-w-md mx-auto space-y-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black text-base tracking-wide shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
            >
              <Rocket className="w-6 h-6 animate-bounce" />
              <span>{loading ? 'RUNNING CAREER SIMULATION...' : '🚀 RUN CAREER SIMULATION'}</span>
            </button>
            <p className="text-slate-500 text-xs">
              NEXORA AI provides personalized decision-support. Recommendations are estimated based on your input.
            </p>
          </div>

          <div className="flex justify-start pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
