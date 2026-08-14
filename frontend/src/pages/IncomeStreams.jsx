import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useCurrencyFormatter } from '../utils/currency';
import { Plus, Trash2, Edit, Wallet, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0D9488', '#F59E0B', '#22C55E', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];

const IncomeStreams = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStream, setEditingStream] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    monthly_amount: '',
    category: '',
    is_active: true,
  });
  const { format, symbol } = useCurrencyFormatter();

  const categories = [
    'Employment',
    'Freelance',
    'Business',
    'Rental',
    'Dividends',
    'Interest',
    'Side Hustle',
    'Other',
  ];

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await api.get('/income-streams');
      setStreams(response.data);
    } catch (error) {
      console.error('Error fetching income streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStream) {
        await api.put(`/income-streams/${editingStream.id}`, formData);
      } else {
        await api.post('/income-streams', formData);
      }
      setShowModal(false);
      setEditingStream(null);
      setFormData({
        name: '',
        monthly_amount: '',
        category: '',
        is_active: true,
      });
      fetchStreams();
    } catch (error) {
      console.error('Error saving income stream:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this income stream?')) return;
    try {
      await api.delete(`/income-streams/${id}`);
      fetchStreams();
    } catch (error) {
      console.error('Error deleting income stream:', error);
    }
  };

  const handleEdit = (stream) => {
    setEditingStream(stream);
    setFormData({
      name: stream.name,
      monthly_amount: stream.monthly_amount,
      category: stream.category,
      is_active: stream.is_active,
    });
    setShowModal(true);
  };

  const handleToggleActive = async (stream) => {
    try {
      await api.put(`/income-streams/${stream.id}`, { is_active: !stream.is_active });
      fetchStreams();
    } catch (error) {
      console.error('Error toggling income stream:', error);
    }
  };

  // Calculate totals
  const activeStreams = streams.filter((s) => s.is_active);
  const totalMonthlyIncome = activeStreams.reduce((sum, s) => sum + parseFloat(s.monthly_amount), 0);

  // Prepare pie chart data
  const pieData = activeStreams.reduce((acc, stream) => {
    const existing = acc.find((item) => item.category === stream.category);
    if (existing) {
      existing.amount += parseFloat(stream.monthly_amount);
    } else {
      acc.push({ name: stream.category, amount: parseFloat(stream.monthly_amount) });
    }
    return acc;
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Income Streams</h1>
            <p className="text-gray-400 mt-1">Build multiple income sources</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Income Stream
          </button>
        </div>

        {/* Total Monthly Income */}
        <div className="bg-gradient-to-r from-success to-green-600 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Total Monthly Income</p>
<p className="text-2xl font-bold text-white">
                {format(totalMonthlyIncome)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-white/80 text-sm">{activeStreams.length} Active Streams</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          {pieData.length > 0 && (
            <div className="bg-surface rounded-xl border border-surface-light p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Income Diversification
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
<Tooltip
                      formatter={(value) => format(value)}
                      contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#F8FAFC' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Income Streams List */}
          <div className="bg-surface rounded-xl border border-surface-light p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Income Sources</h3>
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : streams.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No income streams yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {streams.map((stream) => (
                  <div
                    key={stream.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      stream.is_active
                        ? 'bg-surface-light border-surface-light'
                        : 'bg-transparent border-surface-light opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleActive(stream)}
                        className={`w-4 h-4 rounded-full border-2 transition-colors ${
                          stream.is_active
                            ? 'bg-success border-success'
                            : 'border-gray-500'
                        }`}
                      />
                      <div>
                        <p className="text-white font-medium">{stream.name}</p>
                        <p className="text-gray-400 text-xs">{stream.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
<span className="text-white font-medium">
                        {format(stream.monthly_amount)}/mo
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(stream)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(stream.id)}
                          className="p-2 text-gray-400 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl border border-surface-light w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {editingStream ? 'Edit Income Stream' : 'Add Income Stream'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Source Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g., Main Job, Freelance Work"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Monthly Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthly_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, monthly_amount: e.target.value })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
placeholder={`${symbol}0.00`}
                    required
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 rounded bg-surface-light border-surface-light"
                  />
                  <label htmlFor="is_active" className="text-gray-300">
                    Active
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingStream(null);
                    }}
                    className="flex-1 bg-surface-light hover:bg-surface text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {editingStream ? 'Update' : 'Add'}
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

export default IncomeStreams;
