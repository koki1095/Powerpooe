import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import { useCurrencyFormatter } from '../utils/currency';
import { 
  Wallet, 
  Target, 
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  ListChecks,
  Landmark
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, savings_rate: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [pooeScore, setPooeScore] = useState(0);

  const { format: formatMoney } = useCurrencyFormatter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, transactionsRes, goalsRes, streamsRes, investmentsRes] = await Promise.all([
        api.get('/transactions/summary'),
        api.get('/transactions?limit=5'),
        api.get('/goals'),
        api.get('/income-streams'),
        api.get('/investments'),
      ]);

      setSummary(summaryRes.data);
      setRecentTransactions(transactionsRes.data);
      setGoals(goalsRes.data);

      const savingsRate = summaryRes.data.savings_rate || 0;
      const completedGoals = goalsRes.data.filter(g => g.completed).length;
      const incomeStreams = streamsRes.data.filter(s => s.is_active).length;
      const investments = investmentsRes.data.length;

      const score = Math.round(
        (savingsRate * 1.5) + 
        (completedGoals * 15) + 
        (incomeStreams * 10) + 
        (investments * 5) + 
        100
      );
      setPooeScore(Math.min(score, 250));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const getMotivationalMessage = (score) => {
    if (score >= 200) return "Elite Financial Warrior! 🏆";
    if (score >= 150) return "Financial Champion! 🌟";
    if (score >= 100) return "On the Right Track! 💪";
    if (score >= 50) return "Getting Started! 🚀";
    return "Let's Build Your Future! 🌱";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-400 mt-1">
            Here's your financial overview
          </p>
        </div>

        {/* Pooe Score Card */}
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">
                POOE SCORE
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold text-white">
                  {pooeScore}
                </span>
                <span className="text-white/60 text-xl">/ 250</span>
              </div>
              <p className="text-white/80 mt-2 font-medium">
                {getMotivationalMessage(pooeScore)}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Balance */}
          <div className="bg-surface rounded-xl border border-surface-light p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <span className="text-gray-400 text-sm">Total Balance</span>
            </div>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-success' : 'text-error'}`}>
              {formatMoney(summary.balance)}
            </p>
          </div>

          {/* Monthly Income */}
          <div className="bg-surface rounded-xl border border-surface-light p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-success" />
              </div>
              <span className="text-gray-400 text-sm">Monthly Income</span>
            </div>
            <p className="text-2xl font-bold text-success">
              {formatMoney(summary.income)}
            </p>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-surface rounded-xl border border-surface-light p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-error/20 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-error" />
              </div>
              <span className="text-gray-400 text-sm">Monthly Expenses</span>
            </div>
            <p className="text-2xl font-bold text-error">
              {formatMoney(summary.expense)}
            </p>
          </div>

          {/* Savings Rate */}
          <div className="bg-surface rounded-xl border border-surface-light p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-gray-400 text-sm">Savings Rate</span>
            </div>
            <p className={`text-2xl font-bold ${summary.savings_rate >= 20 ? 'text-success' : summary.savings_rate >= 10 ? 'text-secondary' : 'text-gray-400'}`}>
              {summary.savings_rate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Baby Steps Progress */}
        <div className="bg-surface rounded-xl border border-surface-light p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">7 Baby Steps</h3>
            </div>
            <a href="/baby-steps" className="text-primary text-sm hover:text-primary-light">Open guide</a>
          </div>
          <p className="text-gray-400 text-sm">
            Follow the proven 7-step path in order to reduce money stress, eliminate debt, and build long-term wealth.
          </p>
        </div>

        {/* Debt Plan CTA */}
        <div className="bg-surface rounded-xl border border-surface-light p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">Debt Plan</h3>
            </div>
            <a href="/debt-plan" className="text-primary text-sm hover:text-primary-light">Open planner</a>
          </div>
          <p className="text-gray-400 text-sm">
            Set debt due dates and payoff targets, then get your recommended payoff order using Snowball, Avalanche, or Urgency strategy.
          </p>
        </div>

        {/* Goals Progress & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goals */}
          <div className="bg-surface rounded-xl border border-surface-light p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Savings Goals</h3>
              <a href="/goals" className="text-primary text-sm hover:text-primary-light">View all</a>
            </div>
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => {
                const progress = (goal.current_amount / goal.target_amount) * 100;
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">{goal.name}</span>
                      <span className="text-gray-400">
                        {formatMoney(goal.current_amount)} / {formatMoney(goal.target_amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          progress >= 100 ? 'bg-success' : 'bg-gradient-to-r from-primary to-primary-light'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && (
                <p className="text-gray-400 text-center py-4">No goals yet. Create one to start saving!</p>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-surface rounded-xl border border-surface-light p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
              <a href="/transactions" className="text-primary text-sm hover:text-primary-light">View all</a>
            </div>
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-success/20' : 'bg-error/20'
                    }`}>
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-error" />
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm">{tx.category}</p>
                      <p className="text-gray-400 text-xs">{tx.description || '-'}</p>
                    </div>
                  </div>
                  <span className={`font-medium ${tx.type === 'income' ? 'text-success' : 'text-error'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                  </span>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-gray-400 text-center py-4">No transactions yet. Add one to get started!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
