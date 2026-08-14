-- Pooe Power Financial Advisor Database Schema
-- Run this script to create the database and tables

-- Create database (run as superuser/postgres)
-- CREATE DATABASE pooe_power;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Debts (Baby Step 2 planning)
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  balance DECIMAL(12,2) NOT NULL CHECK (balance >= 0),
  minimum_payment DECIMAL(12,2) NOT NULL CHECK (minimum_payment >= 0),
  interest_rate_apr DECIMAL(6,3) NOT NULL DEFAULT 0 CHECK (interest_rate_apr >= 0),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  target_payoff_date DATE,
  debt_type VARCHAR(30) NOT NULL DEFAULT 'other',
  debt_category VARCHAR(40) NOT NULL DEFAULT 'other',
  term_type VARCHAR(20) NOT NULL DEFAULT 'medium_term',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions (income + expense unified)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')),
  entry_kind VARCHAR(20) NOT NULL DEFAULT 'expense' CHECK (entry_kind IN ('expense', 'debt_payment')),
  debt_id UUID REFERENCES debts(id) ON DELETE SET NULL,
  category VARCHAR(50),
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Savings goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Investment holdings
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  shares DECIMAL(10,4) NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Income streams
CREATE TABLE IF NOT EXISTS income_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Estate planning
CREATE TABLE IF NOT EXISTS estate_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  has_will BOOLEAN DEFAULT FALSE,
  has_trust BOOLEAN DEFAULT FALSE,
  insurance_provider VARCHAR(100),
  coverage_amount DECIMAL(10,2),
  documents JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_entry_kind ON transactions(user_id, entry_kind);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_debt_id ON transactions(user_id, debt_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_income_streams_user_id ON income_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_estate_plans_user_id ON estate_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_id_due_day ON debts(user_id, due_day);
