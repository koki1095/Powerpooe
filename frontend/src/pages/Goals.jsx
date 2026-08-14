import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Plus, Trash2, Edit, Target, CheckCircle } from 'lucide-react';
import { useCurrencyFormatter } from '../utils/currency';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
  });
  const [investments, setInvestments] = useState([]);

  const { format } = useCurrencyFormatter();

  useEffect(() => {
    fetchGoalsAndInvestments();
  }, []);

  const fetchGoalsAndInvestments = async () => {
    try {
      const [goalsRes, investmentsRes] = await Promise.all([
        api.get('/goals'),
        api.get('/investments'),
      ]);
      setGoals(goalsRes.data);
      setInvestments(investmentsRes.data);
    } catch (error) {
      console.error('Error fetching goals/investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = fetchGoalsAndInvestments;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await api.put(`/goals/${editingGoal.id}`, formData);
      } else {
        await api.post('/goals', formData);
      }
      setShowModal(false);
      setEditingGoal(null);
      setFormData({
        name: '',
        target_amount: '',
        current_amount: '',
        deadline: '',
      });
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline?.split('T')[0] || '',
    });
    setShowModal(true);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/goals/${selectedGoal.id}/transfer`, {
        amount: parseFloat(transferAmount),
      });
      setShowTransferModal(false);
      setTransferAmount('');
      setSelectedGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Error transferring:', error);
    }
  };

  const openTransferModal = (goal) => {
    setSelectedGoal(goal);
    setShowTransferModal(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Savings Goals</h1>
            <p className="text-gray-400 mt-1">Save with purpose</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Goal
          </button>
        </div>

        {/* Goals Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : goals.length === 0 ? (
          <div className="bg-surface rounded-xl border border-surface-light p-8 text-center">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              No savings goals yet. Create one to start saving!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const targetAmount = Number(goal.target_amount) || 0;
              const currentGoalAmount = Number(goal.current_amount) || 0;
              const totalInvestmentsValue = investments.reduce(
                (sum, inv) => sum + ((Number(inv.shares) || 0) * (Number(inv.purchase_price) || 0)),
                0
              );

              const effectiveSaved = currentGoalAmount + totalInvestmentsValue;
              const rawProgress = targetAmount > 0 ? (effectiveSaved / targetAmount) * 100 : 0;
              const progress = Math.min(rawProgress, 100);
              const isComplete = progress >= 100;
              const remainingAmount = Math.max(targetAmount - effectiveSaved, 0);
              const progressDisplay = `${progress.toFixed(2)}%`;
              const progressBarWidth =
                progress > 0 && progress < 2 ? 2 : Math.min(progress, 100);

              return (
                <div
                  key={goal.id}
                  className={`bg-surface rounded-xl border border-surface-light p-6 ${
                    isComplete ? 'border-success/50' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isComplete ? 'bg-success/20' : 'bg-primary/20'
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <Target className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{goal.name}</h3>
                        {goal.deadline && (
                          <p className="text-gray-400 text-xs">
                            Due: {new Date(goal.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-2 text-gray-400 hover:text-error transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-medium">
                        {progressDisplay}
                      </span>
                    </div>
                    <div className="h-3 bg-surface-light rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isComplete
                            ? 'bg-success'
                            : 'bg-gradient-to-r from-primary to-primary-light'
                        }`}
                        style={{ width: `${progressBarWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-gray-400 text-xs">Current</p>
                      <p className="text-white font-bold text-lg">
                        {format(effectiveSaved)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Target</p>
                      <p className="text-gray-300">
                        {format(targetAmount)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Remaining: {format(remainingAmount)} (includes investments contribution)
                  </p>

                  {/* Transfer Button */}
                  {!isComplete && (
                    <button
                      onClick={() => openTransferModal(goal)}
                      className="w-full bg-primary/20 hover:bg-primary/30 text-primary font-medium py-2 rounded-lg transition-colors"
                    >
                      Transfer Funds
                    </button>
                  )}

                  {isComplete && (
                    <div className="w-full bg-success/20 text-success font-medium py-2 rounded-lg text-center">
                      Goal Achieved! 🎉
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl border border-surface-light w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {editingGoal ? 'Edit Goal' : 'Create Savings Goal'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g., Emergency Fund, Vacation"
                    required
                  />
                </div>

                {/* Target Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.target_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_amount: e.target.value,
                      })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Current Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Amount (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.current_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_amount: e.target.value,
                      })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0.00"
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingGoal(null);
                    }}
                    className="flex-1 bg-surface-light hover:bg-surface text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {editingGoal ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && selectedGoal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl border border-surface-light w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-white mb-2">
                Transfer to {selectedGoal.name}
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Current: {format(selectedGoal.current_amount)} / {format(selectedGoal.target_amount)}
              </p>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount to Transfer
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferAmount('');
                      setSelectedGoal(null);
                    }}
                    className="flex-1 bg-surface-light hover:bg-surface text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Transfer
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

export default Goals;
