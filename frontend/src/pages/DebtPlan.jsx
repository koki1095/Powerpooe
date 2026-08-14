import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useCurrencyFormatter } from '../utils/currency';
import { Plus, Trash2, Edit, CalendarClock, Percent, CircleDollarSign } from 'lucide-react';

const defaultForm = {
  name: '',
  balance: '',
  minimum_payment: '',
  interest_rate_apr: '',
  due_day: '',
  target_payoff_date: '',
  debt_type: 'other',
  debt_category: 'other',
  term_type: 'medium_term',
};

const DebtPlan = () => {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [strategy, setStrategy] = useState('snowball');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [strategyResult, setStrategyResult] = useState(null);

  const { format, symbol } = useCurrencyFormatter();

  const totalBalance = useMemo(
    () => debts.reduce((sum, d) => sum + (Number(d.balance) || 0), 0),
    [debts]
  );

  const totalMinimum = useMemo(
    () => debts.reduce((sum, d) => sum + (Number(d.minimum_payment) || 0), 0),
    [debts]
  );

  useEffect(() => {
    fetchDebts();
  }, []);

  useEffect(() => {
    fetchStrategy();
  }, [strategy, monthlyBudget, debts.length]);

  const fetchDebts = async () => {
    try {
      const res = await api.get('/debts');
      setDebts(res.data);
    } catch (error) {
      console.error('Error fetching debts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStrategy = async () => {
    try {
      const params = new URLSearchParams();
      params.set('method', strategy);
      if (monthlyBudget !== '') params.set('monthly_budget', monthlyBudget);
      const res = await api.get(`/debts/strategy?${params.toString()}`);
      setStrategyResult(res.data);
    } catch (error) {
      console.error('Error fetching strategy:', error);
      setStrategyResult(null);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingDebt(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      balance: Number(formData.balance),
      minimum_payment: Number(formData.minimum_payment),
      interest_rate_apr: Number(formData.interest_rate_apr),
      due_day: Number(formData.due_day),
      target_payoff_date: formData.target_payoff_date || null,
    };

    try {
      if (editingDebt) {
        await api.put(`/debts/${editingDebt.id}`, payload);
      } else {
        await api.post('/debts', payload);
      }
      setShowModal(false);
      resetForm();
      await fetchDebts();
      await fetchStrategy();
    } catch (error) {
      console.error('Error saving debt:', error);
      console.error('Server response data:', error?.response?.data);
    }
  };

  const handleEdit = (debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name || '',
      balance: debt.balance ?? '',
      minimum_payment: debt.minimum_payment ?? '',
      interest_rate_apr: debt.interest_rate_apr ?? '',
      due_day: debt.due_day ?? '',
      target_payoff_date: debt.target_payoff_date?.split('T')[0] || '',
      debt_type: debt.debt_type || 'other',
      debt_category: debt.debt_category || 'other',
      term_type: debt.term_type || 'medium_term',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this debt?')) return;
    try {
      await api.delete(`/debts/${id}`);
      await fetchDebts();
      await fetchStrategy();
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Debt Plan (Baby Step 2)</h1>
            <p className="text-gray-400 mt-1">Track debt expiries and follow the best payoff order.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Debt
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border border-surface-light p-5">
            <p className="text-gray-400 text-sm">Total Debt</p>
            <p className="text-2xl text-white font-bold mt-1">{format(totalBalance)}</p>
          </div>
          <div className="bg-surface rounded-xl border border-surface-light p-5">
            <p className="text-gray-400 text-sm">Total Minimum Payments</p>
            <p className="text-2xl text-white font-bold mt-1">{format(totalMinimum)}/mo</p>
          </div>
          <div className="bg-surface rounded-xl border border-surface-light p-5">
            <p className="text-gray-400 text-sm">Debts Count</p>
            <p className="text-2xl text-white font-bold mt-1">{debts.length}</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-surface-light p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-surface-light rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="snowball">Snowball (smallest balance first)</option>
                <option value="avalanche">Avalanche (highest APR first)</option>
                <option value="urgency">Urgency (due date + payoff target pressure)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Monthly Debt Budget</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder={`${symbol}0.00`}
                className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              onClick={fetchStrategy}
              className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Recalculate Plan
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-surface-light p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Debts</h3>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : debts.length === 0 ? (
            <p className="text-gray-400">No debts yet. Add one to generate your payoff strategy.</p>
          ) : (
            <div className="space-y-3">
              {debts.map((debt) => (
                <div key={debt.id} className="bg-surface-light rounded-lg p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-white font-semibold">{debt.name}</p>
                    <div className="text-xs text-gray-300 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1"><CircleDollarSign className="w-3 h-3" /> Balance: {format(debt.balance)}</span>
                      <span className="inline-flex items-center gap-1"><Percent className="w-3 h-3" /> APR: {Number(debt.interest_rate_apr).toFixed(2)}%</span>
                      <span className="inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Due day: {debt.due_day}</span>
                      <span>Min: {format(debt.minimum_payment)}/mo</span>
                      <span>Type: {debt.debt_type}</span>
                      <span>Category: {debt.debt_category || 'other'}</span>
                      <span>Term: {(debt.term_type || 'medium_term').replace('_', ' ')}</span>
                      {debt.projected_completion_date && <span>Projected completion: {new Date(debt.projected_completion_date).toLocaleDateString()}</span>}
                      {debt.target_payoff_date && <span>Target payoff: {new Date(debt.target_payoff_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(debt)} className="p-2 text-gray-300 hover:text-white">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(debt.id)} className="p-2 text-gray-300 hover:text-error">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-surface-light p-5">
          <h3 className="text-lg font-semibold text-white mb-3">Recommended Payoff Order</h3>
          {!strategyResult || !strategyResult.payoff_order?.length ? (
            <p className="text-gray-400">No strategy output yet. Add debts and set a budget.</p>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-300">
                Method: <span className="text-white font-medium">{strategyResult.method}</span> ·
                Total estimated interest: <span className="text-white font-medium"> {format(strategyResult.total_estimated_interest)}</span>
              </div>
              {strategyResult.payoff_order.map((item) => (
                <div key={item.id} className="bg-surface-light rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <p className="text-white font-semibold">
                      #{item.priority_rank} {item.name}
                    </p>
                    <p className="text-primary font-medium">
                      Recommended: {format(item.recommended_payment)}/mo
                    </p>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    Balance: {format(item.balance)} · Min: {format(item.minimum_payment)}/mo · APR: {Number(item.interest_rate_apr).toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-300">
                    Projected payoff: {item.projected_payoff_months === null ? 'Insufficient payment' : `${item.projected_payoff_months} months`}
                    {item.estimated_interest !== null ? ` · Est. interest: ${format(item.estimated_interest)}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl border border-surface-light w-full max-w-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">{editingDebt ? 'Edit Debt' : 'Add Debt'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Balance</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white"
                    placeholder={`${symbol}0.00`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Minimum Payment</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.minimum_payment}
                    onChange={(e) => setFormData({ ...formData, minimum_payment: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white"
                    placeholder={`${symbol}0.00`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Interest APR (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.001"
                    value={formData.interest_rate_apr}
                    onChange={(e) => setFormData({ ...formData, interest_rate_apr: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white"
                    placeholder="e.g. 19.9"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Due Day (1-31)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    value={formData.due_day}
                    onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white"
                    placeholder="e.g. 25"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Target Payoff Date</label>
                  <input
                    type="date"
                    value={formData.target_payoff_date}
                    onChange={(e) => setFormData({ ...formData, target_payoff_date: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Debt Type</label>
                  <select
                    value={formData.debt_type}
                    onChange={(e) => setFormData({ ...formData, debt_type: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="personal_loan">Personal Loan</option>
                    <option value="car_loan">Car Loan</option>
                    <option value="student_loan">Student Loan</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Debt Category</label>
                  <select
                    value={formData.debt_category}
                    onChange={(e) => setFormData({ ...formData, debt_category: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="vehicle_finance">Vehicle Finance</option>
                    <option value="personal_loan">Personal Loan</option>
                    <option value="student_loan">Student Loan</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="medical">Medical</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Term Type</label>
                  <select
                    value={formData.term_type}
                    onChange={(e) => setFormData({ ...formData, term_type: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white"
                  >
                    <option value="short_term">Short Term</option>
                    <option value="medium_term">Medium Term</option>
                    <option value="long_term">Long Term</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-surface-light hover:bg-surface text-white font-medium py-3 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg">
                    {editingDebt ? 'Update Debt' : 'Create Debt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DebtPlan;
