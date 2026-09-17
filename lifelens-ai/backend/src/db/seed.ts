import bcrypt from 'bcryptjs';
import { db, initDatabase } from './database';

export async function seedDemoData() {
  await initDatabase();

  const demoUserId = 'usr_demo_001';
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(demoUserId);

  if (existingUser) {
    console.log('🌱 Demo user accounts already initialized.');
    return;
  }

  console.log('🌱 Initializing user accounts...');

  const passwordHash = bcrypt.hashSync('password123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const evaluatorPasswordHash = bcrypt.hashSync('evaluator123', 10);
  const studentPasswordHash = bcrypt.hashSync('student123', 10);

  // 1. Create Specified User 1: Demo User (Alex Chen)
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, age_range, occupation, goals, interests, budget_range)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    demoUserId,
    'Alex Chen',
    'demo@futlens.ai',
    passwordHash,
    '21-25',
    'ECE Senior Student / Career Planner',
    'Land a high-impact engineering role in embedded systems or software',
    'Software Development, AI / Machine Learning, Cloud / DevOps',
    'N/A'
  );

  // Specified User 2: Admin User
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, age_range, occupation, goals, interests, budget_range)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'usr_admin_002',
    'System Admin',
    'admin@futlens.ai',
    adminPasswordHash,
    '26-35',
    'Project Team Lead',
    'Manage organizational decisions and evaluate risk models',
    'System Architecture, Risk Analysis',
    'N/A'
  );

  // Specified User 3: Evaluator
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, age_range, occupation, goals, interests, budget_range)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'usr_eval_003',
    'Senior Evaluator',
    'evaluator@futlens.ai',
    evaluatorPasswordHash,
    '36-50',
    'Decision Support Specialist',
    'Evaluate decision accuracy and reality checks',
    'Data Science, Predictive Modeling',
    'N/A'
  );

  // Specified User 4: Student User
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, age_range, occupation, goals, interests, budget_range)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'usr_student_004',
    'Jordan Lee',
    'student@futlens.ai',
    studentPasswordHash,
    '18-20',
    'College Student',
    'Plan higher education and internship options',
    'Robotics, AI, Software',
    'N/A'
  );

  console.log('✅ Demo user accounts initialized cleanly without pre-populated decisions.');
}

if (require.main === module) {
  seedDemoData();
}
