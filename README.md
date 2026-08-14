# Pooe Power Financial Advisor

Full-stack Financial Planning Web Application with the tagline "Empowering Your Financial Future."

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Authentication:** JWT

## Features

### Step 1: Plan Your Finances
- Income/expense tracker with categories
- Dashboard showing: total balance, monthly income, monthly expenses, savings rate

### Step 2: Save with Purpose
- Create/Edit/Delete savings goals
- Progress bars for each goal
- Manual transfer to goals

### Step 3: Invest Wisely
- Simple portfolio tracker (manual entry)

### Step 4: Build Multiple Income Streams
- List income sources with pie chart

### Step 5: Grow Generational Wealth
- Estate planning checklist
- Document upload placeholder
- Life insurance tracking

### 7 Baby Steps Guide
- Dedicated in-app page with the proven 7 Baby Steps journey
- Step-by-step progression in order (no shortcuts)
- Quick access from Dashboard and Sidebar

### Gamification: Pooe Score
- Algorithm: (savings_rate * 20) + (goals_completed * 15) + (income_streams * 10) + (investment_accounts * 5)

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14

### Database Setup

1. Create the database:
```sql
CREATE DATABASE pooe_power;
```

2. Run the schema:
```bash
psql -d pooe_power -f backend/schema.sql
```

3. Copy `.env.example` to `.env` and update with your database credentials:
```bash
cp backend/.env.example backend/.env
```

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Server runs on http://localhost:3001

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs on http://localhost:5173

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Transactions
- GET /api/transactions
- POST /api/transactions
- PUT /api/transactions/:id
- DELETE /api/transactions/:id
- GET /api/transactions/summary

### Goals
- GET /api/goals
- POST /api/goals
- PUT /api/goals/:id
- DELETE /api/goals/:id
- POST /api/goals/:id/transfer

### Investments
- GET /api/investments
- POST /api/investments
- PUT /api/investments/:id
- DELETE /api/investments/:id

### Income Streams
- GET /api/income-streams
- POST /api/income-streams
- PUT /api/income-streams/:id
- DELETE /api/income-streams/:id

### Estate
- GET /api/estate
- PUT /api/estate

### Debts (Baby Step 2)
- GET /api/debts
- POST /api/debts
- PUT /api/debts/:id
- DELETE /api/debts/:id
- GET /api/debts/strategy?method=snowball|avalanche|urgency&monthly_budget=VALUE

## Project Structure

```
pooe-power/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── goals.js
│   │   ├── investments.js
│   │   ├── incomeStreams.js
│   │   └── estate.js
│   ├── package.json
│   ├── server.js
│   └── schema.sql
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── package.json
```

## License

MIT
