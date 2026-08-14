import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useCurrencyFormatter } from '../utils/currency';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

const babySteps = [
  {
    id: 1,
    title: 'Save $1,000 for your starter emergency fund',
    description:
      'You can’t build wealth if you’re constantly borrowing money every time life throws you a curveball. Get this quick win under your belt ASAP.',
  },
  {
    id: 2,
    title: 'Pay off all debt (except the house) using the debt snowball',
    description:
      'List your debts smallest to largest, attack the smallest one with a vengeance, and roll those payments into the next debt. Keep the momentum going until you’re debt-free!',
  },
  {
    id: 3,
    title: 'Save 3–6 months of expenses in a fully funded emergency fund',
    description:
      'This is your cushion for when (not if) life happens. With this fund, a job loss, medical emergency, or car repair won’t send you back into debt.',
  },
  {
    id: 4,
    title: 'Invest 15% of your household income in retirement',
    description:
      'You’re out of debt and have a safety net—now it’s time to build wealth. Max out your 401(k) match and invest consistently in good, growth stock mutual funds.',
  },
  {
    id: 5,
    title: 'Save for your kids’ college fund',
    description:
      'You don’t have to take out student loans or saddle your kids with debt. Save early and let compound interest work for you.',
  },
  {
    id: 6,
    title: 'Pay off your house early',
    description:
      'Imagine life without a mortgage payment. Every extra dollar you throw at your mortgage gets you closer to complete ownership.',
  },
  {
    id: 7,
    title: 'Build wealth and give generously',
    description:
      'This is where the real fun begins. No payments, no debt, and less financial stress—now you can live and give like no one else.',
  },
];

const BabySteps = () => {
  const [completed, setCompleted] = useState([]);
  const [debtCount, setDebtCount] = useState(0);
  const [debtStrategy, setDebtStrategy] = useState(null);

  const { format } = useCurrencyFormatter();

  useEffect(() => {
    fetchDebtStatus();
  }, []);

  const fetchDebtStatus = async () => {
    try {
      const [debtsRes, strategyRes] = await Promise.all([
        api.get('/debts'),
        api.get('/debts/strategy?method=urgency'),
      ]);

      const debts = debtsRes.data || [];
      setDebtCount(debts.length);
      setDebtStrategy(strategyRes.data || null);

      setCompleted((prev) => {
        const next = [...prev];
        const hasDebt = debts.length > 0;
        const step2Done = !hasDebt;
        const set = new Set(next);

        if (step2Done) {
          set.add(2);
        } else {
          set.delete(2);
          for (const n of [3, 4, 5, 6, 7]) set.delete(n);
        }

        return Array.from(set).sort((a, b) => a - b);
      });
    } catch (error) {
      console.error('Error fetching debt status for Baby Steps:', error);
    }
  };

  const isUnlocked = (stepId) => stepId === 1 || completed.includes(stepId - 1);
  const isCompleted = (stepId) => completed.includes(stepId);

  const handleToggle = (stepId) => {
    if (stepId === 2) return;
    if (!isUnlocked(stepId)) return;

    setCompleted((prev) => {
      if (prev.includes(stepId)) {
        const filtered = prev.filter((id) => id <= stepId - 1 || id === 2);
        return filtered;
      }
      return [...prev, stepId].sort((a, b) => a - b);
    });
  };

  const progress = useMemo(() => Math.round((completed.length / babySteps.length) * 100), [completed.length]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-surface border border-surface-light rounded-2xl p-6">
          <h1 className="text-3xl font-bold text-white">The 7 Baby Steps</h1>
          <p className="text-gray-300 mt-2">
            Money stress is real, but there is a proven path forward. Follow these steps <span className="font-semibold text-white">in order</span>—no shortcuts.
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Progress</span>
              <span>{completed.length} / {babySteps.length} complete ({progress}%)</span>
            </div>
            <div className="h-2 bg-surface-light rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary-light" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-surface-light rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-xl font-semibold text-white">Baby Step 2 Status</h2>
            <a href="/debt-plan" className="text-primary text-sm hover:text-primary-light">Open Debt Plan</a>
          </div>
          <p className="text-gray-300 text-sm">
            {debtCount === 0
              ? 'You are debt-free (excluding house). Baby Step 2 is complete.'
              : `You currently have ${debtCount} debt account(s). Use Debt Plan to clear them with urgency-aware prioritization.`}
          </p>
          {debtStrategy?.payoff_order?.length > 0 && (
            <div className="mt-4 bg-surface-light rounded-lg p-4">
              <p className="text-white font-medium">
                Top priority now: #{debtStrategy.payoff_order[0].priority_rank} {debtStrategy.payoff_order[0].name}
              </p>
              <p className="text-gray-300 text-sm mt-1">
                Recommended monthly payment: {format(debtStrategy.payoff_order[0].recommended_payment)}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Strategy: {debtStrategy.method} · Estimated total interest: {format(debtStrategy.total_estimated_interest)}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {babySteps.map((step) => {
            const unlocked = isUnlocked(step.id);
            const done = isCompleted(step.id);

            return (
              <div
                key={step.id}
                className={`rounded-xl border p-5 transition-all ${
                  unlocked
                    ? 'bg-surface border-surface-light'
                    : 'bg-surface/50 border-surface-light/50 opacity-70'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggle(step.id)}
                    disabled={!unlocked}
                    className="mt-0.5 disabled:cursor-not-allowed"
                    aria-label={`Toggle Baby Step ${step.id}`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    ) : unlocked ? (
                      <Circle className="w-6 h-6 text-gray-400" />
                    ) : (
                      <Lock className="w-6 h-6 text-gray-500" />
                    )}
                  </button>
                  <div>
                    <h3 className="text-white font-semibold">
                      Baby Step {step.id}: {step.title}
                    </h3>
                    <p className="text-gray-300 mt-1">{step.description}</p>
                    {!unlocked && (
                      <p className="text-xs text-amber-300 mt-2">
                        Complete Baby Step {step.id - 1} to unlock this step.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default BabySteps;
