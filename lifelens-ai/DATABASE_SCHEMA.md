# DATABASE_SCHEMA.md — Futlens AI

## Relational Entity Schema

### 1. `users`
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `email` (TEXT UNIQUE NOT NULL)
- `password_hash` (TEXT NOT NULL)
- `age_range` (TEXT)
- `occupation` (TEXT)
- `goals` (TEXT)
- `budget_range` (TEXT)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 2. `decisions`
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT FOREIGN KEY -> users.id)
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `category` (TEXT NOT NULL)
- `status` (TEXT DEFAULT 'active')
- `deadline` (TEXT)

### 3. `options`
- `id` (TEXT PRIMARY KEY)
- `decision_id` (TEXT FOREIGN KEY -> decisions.id)
- `name` (TEXT NOT NULL)
- `cost` (REAL)
- `estimated_months` (REAL)
- `difficulty_score` (REAL)
- `long_term_growth` (REAL)

### 4. `factors`
- `id` (TEXT PRIMARY KEY)
- `decision_id` (TEXT FOREIGN KEY -> decisions.id)
- `name` (TEXT NOT NULL)
- `weight` (REAL DEFAULT 1.0)
- `category` (TEXT)

### 5. `option_factor_scores`
- `id` (TEXT PRIMARY KEY)
- `option_id` (TEXT FOREIGN KEY -> options.id)
- `factor_id` (TEXT FOREIGN KEY -> factors.id)
- `score` (REAL NOT NULL)

### 6. `constraints`
- `id` (TEXT PRIMARY KEY)
- `decision_id` (TEXT FOREIGN KEY -> decisions.id)
- `name` (TEXT NOT NULL)
- `constraint_type` (TEXT)
- `limit_value` (REAL)

### 7. `reality_checks`
- `id` (TEXT PRIMARY KEY)
- `decision_id` (TEXT FOREIGN KEY -> decisions.id)
- `selected_option_id` (TEXT FOREIGN KEY -> options.id)
- `actual_cost` (REAL)
- `actual_time_months` (REAL)
- `actual_score` (REAL)
- `problems_notes` (TEXT)
- `satisfaction_score` (REAL)
