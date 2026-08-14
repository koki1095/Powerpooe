import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useCurrencyFormatter } from '../utils/currency';
import { Plus, Trash2, Edit, TrendingUp, DollarSign } from 'lucide-react';

const Investments = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [formData, setFormData] = useState({
    ticker: '',
    shares: '',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
  });
  const { format, symbol } = useCurrencyFormatter();

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const response = await api.get('/investments');
      setInvestments(response.data);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInvestment) {
        await api.put(`/investments/${editingInvestment.id}`, formData);
      } else {
        await api.post('/investments', formData);
      }
      setShowModal(false);
      setEditingInvestment(null);
      setFormData({
        ticker: '',
        shares: '',
        purchase_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
      });
      fetchInvestments();
    } catch (error) {
      console.error('Error saving investment:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;
    try {
      await api.delete(`/investments/${id}`);
      fetchInvestments();
    } catch (error) {
      console.error('Error deleting investment:', error);
    }
  };

  const handleEdit = (investment) => {
    setEditingInvestment(investment);
    setFormData({
      ticker: investment.ticker,
      shares: investment.shares,
      purchase_price: investment.purchase_price,
      purchase_date: investment.purchase_date?.split('T')[0] || '',
    });
    setShowModal(true);
  };

  // Calculate total portfolio value
  const totalValue = investments.reduce((sum, inv) => {
    return sum + (inv.shares * inv.purchase_price);
  }, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Investments</h1>
            <p className="text-gray-400 mt-1">Track your portfolio</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Investment
          </button>
        </div>

        {/* Total Portfolio Value */}
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Total Portfolio Value</p>
<p className="text-2xl font-bold text-white">
                {format(totalValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Investments List */}
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : investments.length === 0 ? (
          <div className="bg-surface rounded-xl border border-surface-light p-8 text-center">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              No investments yet. Track your first holding!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Add Your First Investment
            </button>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-surface-light overflow-hidden">
            <div className="divide-y divide-surface-light">
              {investments.map((investment) => {
                const value = investment.shares * investment.purchase_price;
                
                return (
                  <div
                    key={investment.id}
                    className="flex items-center justify-between p-4 hover:bg-surface-light/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-white font-bold">
                          {investment.ticker}
                        </p>
<p className="text-gray-400 text-sm">
                          {investment.shares} shares @ {format(investment.purchase_price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
<p className="text-white font-bold">
                          {format(value)}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {investment.purchase_date && new Date(investment.purchase_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(investment)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(investment.id)}
                          className="p-2 text-gray-400 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl border border-surface-light w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {editingInvestment ? 'Edit Investment' : 'Add Investment'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Ticker */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ticker Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.ticker}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ticker: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g., AAPL, GOOGL"
                    required
                  />
                </div>

                {/* Shares */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Shares
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.shares}
                    onChange={(e) =>
                      setFormData({ ...formData, shares: e.target.value })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0"
                    required
                  />
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Purchase Price per Share
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_price: e.target.value,
                      })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
placeholder={`${symbol}0.00`}
                    required
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_date: e.target.value })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingInvestment(null);
                    }}
                    className="flex-1 bg-surface-light hover:bg-surface text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {editingInvestment ? 'Update' : 'Add'}
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

export default Investments;
