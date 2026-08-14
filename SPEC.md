# Pooe Power Financial Advisor - Specification

## Project Overview
- **Project Name:** Pooe Power Financial Advisor
- **Type:** Full-stack web application (Financial Planning SaaS)
- **Tagline:** "Empowering Your Financial Future"
- **Tech Stack:** React (Vite), Tailwind CSS, Node.js/Express, PostgreSQL, JWT Auth

---

## Architecture

### Project Structure
```
pooe-power/
├── backend/           # Express API server
│   ├── config/       # Database config
│   ├── middleware/  # Auth, validation middleware
│   ├── routes/      # API route handlers
│   ├── models/      # Database models/queries
│   ├── utils/       # Helper functions
│   └── server.js    # Entry point
├── frontend/         # React Vite app
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React Context
│   │   ├── hooks/      # Custom hooks
│   │   ├── services/   # API service
│   │   └── utils/     # Utilities
│   └── index.html
└── package.json
```

---

## Database Schema (PostgreSQL)

### Table: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')),
  category VARCHAR(50),
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: goals
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: investments
```sql
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  shares DECIMAL(10,4) NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: income_streams
```sql
CREATE TABLE income_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: estate_plans
```sql
CREATE TABLE estate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  has_will BOOLEAN DEFAULT FALSE,
  has_trust BOOLEAN DEFAULT FALSE,
  insurance_provider VARCHAR(100),
  coverage_amount DECIMAL(10,2),
  documents JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Auth Endpoints (Public)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Transactions (Protected)
- `GET /api/transactions` - List transactions (filter by type)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Goals (Protected)
- `GET /api/goals` - List savings goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal (current_amount)
- `DELETE /api/goals/:id` - Delete goal

### Investments (Protected)
- `GET /api/investments` - List investments
- `POST /api/investments` - Create investment
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment

### Income Streams (Protected)
- `GET /api/income-streams` - List income streams
- `POST /api/income-streams` - Create income stream
- `PUT /api/income-streams/:id` - Update income stream
- `DELETE /api/income-streams/:id` - Delete income stream

### Estate Plans (Protected)
- `GET /api/estate` - Get estate plan
- `PUT /api/estate` - Update estate plan

---

## Frontend Pages

### 1. /login
- Email/password form
- Link to register

### 2. /register
- Email, password, name form
- Link to login

### 3. /dashboard
- Total balance card
- Monthly income/expenses cards
- Savings rate percentage
- Pooe Score display with message
- Recent transactions list
- Goal progress bars (top 3)

### 4. /transactions
- Transaction list with filters (income/expense)
- Add transaction form
- Edit/delete functionality

### 5. /goals
- Goals list with progress bars
- Add goal form
- Manual transfer button

### 6. /investments
- Portfolio list
- Add investment form
- Total portfolio value

### 7. /income-streams
- Income streams list
- Add stream form
- Pie chart visualization

### 8. /estate
- Checklist (will, trust)
- Document upload placeholder
- Life insurance tracking

### 9. /profile
- User settings
- Logout button

---

## Pooe Score Algorithm
```
Pooe Score = (savings_rate * 20) + (goals_completed * 15) + (income_streams * 10) + (investment_accounts * 5) + 100 (base)
```

---

## UI/UX Specification

### Color Palette
- **Primary:** #0D9488 (Teal-600)
- **Primary Dark:** #0F766E (Teal-700)
- **Primary Light:** #14B8A6 (Teal-500)
- **Secondary:** #F59E0B (Amber-500)
- **Background:** #0F172A (Slate-900)
- **Surface:** #1E293B (Slate-800)
- **Surface Light:** #334155 (Slate-700)
- **Text Primary:** #F8FAFC (Slate-50)
- **Text Secondary:** #94A3B8 (Slate-400)
- **Success:** #22C55E (Green-500)
- **Error:** #EF4444 (Red-500)

### Typography
- **Font Family:** 'Inter', system-ui, sans-serif
- **Headings:** Bold, tracking-tight
- **Body:** Regular, 16px base

### Components
- Card-based layouts
- Gradient accents on primary elements
- Smooth hover transitions (200ms)
- Progress bars with gradient fills
- Charts with consistent color scheme

---

## Acceptance Criteria

1. User can register and login
2. Dashboard displays all financial metrics
3. User can add/edit/delete transactions
4. User can create and track savings goals
5. User can manually track investments
6. User can manage multiple income streams
7. User can set estate planning checklist
8. Pooe Score calculates and displays correctly
9. JWT authentication works
10. All API endpoints are protected
