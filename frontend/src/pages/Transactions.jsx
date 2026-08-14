import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Plus, ArrowUpRight, ArrowDownRight, Trash2, Edit, CreditCard } from 'lucide-react';
import { useCurrencyFormatter } from '../utils/currency';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [debts, setDebts] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    entry_kind: 'expense',
    debt_id: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const { format, symbol } = useCurrencyFormatter();

  const categories = {
    income: ['Salary', 'Freelance', 'Dividends', 'Rental', 'Side Hustle', 'Gift', 'Other'],
    expense: ['Housing', 'Food', 'Transportation', 'Utilities', 'Insurance', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Savings', 'Other'],
  };

  useEffect(() => {
    fetchTransactions();
    fetchDebts();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      const query = new URLSearchParams();
      if (filter !== 'all') query.set('type', filter);
      const response = await api.get(`/transactions${query.toString() ? `?${query.toString()}` : ''}`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDebts = async () => {
    try {
      const res = await api.get('/debts');
      setDebts(res.data || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'expense',
      entry_kind: 'expense',
      debt_id: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.type === 'expense' && formData.entry_kind === 'debt_payment' && !formData.debt_id) {
        alert('Please select a linked debt for debt payment.');
        return;
      }

      const payload = {
        ...formData,
        debt_id: formData.entry_kind === 'debt_payment' ? formData.debt_id || null : null,
      };

      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }

      setShowModal(false);
      setEditingTransaction(null);
      resetForm();
      fetchTransactions();
      fetchDebts();
    } catch (error) {
      console.error('Error saving transaction:', error);
      const message = error?.response?.data?.error || error?.response?.data?.errors?.[0]?.msg || 'Failed to save transaction';
      alert(message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
      fetchDebts();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount,
      type: transaction.type,
      entry_kind: transaction.entry_kind || 'expense',
      debt_id: transaction.debt_id || '',
      category: transaction.category,
      description: transaction.description || '',
      date: transaction.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Transactions</h1>
            <p className="text-gray-400 mt-1">Track your income, expenses, and debt payments</p>
          </div>
          <button
            onClick={() => {
              setEditingTransaction(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>

        <div className="flex gap-2">
          {['all', 'income', 'expense'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === type
                  ? 'bg-primary text-white'
                  : 'bg-surface text-gray-400 hover:text-white'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-surface rounded-xl border border-surface-light overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No transactions found. Add one to get started!</div>
          ) : (
            <div className="divide-y divide-surface-light">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 hover:bg-surface-light/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-success/20' : 'bg-error/20'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5 text-success" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-error" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{transaction.category}</p>
                      <p className="text-gray-400 text-sm">
                        {transaction.description || '-'} • {new Date(transaction.date).toLocaleDateString()} •{' '}
                        {transaction.entry_kind === 'debt_payment'
                          ? `Debt Payment${transaction.debt_name ? ` (${transaction.debt_name})` : ''}`
                          : transaction.type === 'income'
                          ? 'Income'
                          : 'Expense'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-success' : 'text-error'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {format(transaction.amount)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
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

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl border border-surface-light w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <div className="flex gap-2">
                    {['income', 'expense'].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            type,
                            category: '',
                            entry_kind: type === 'income' ? 'expense' : formData.entry_kind,
                            debt_id: type === 'income' ? '' : formData.debt_id,
                          })
                        }
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                          formData.type === type
                            ? type === 'income'
                              ? 'bg-success text-white'
                              : 'bg-error text-white'
                            : 'bg-surface-light text-gray-400'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.type === 'expense' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Expense Entry Kind</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, entry_kind: 'expense', debt_id: '' })}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                          formData.entry_kind === 'expense'
                            ? 'bg-secondary text-white'
                            : 'bg-surface-light text-gray-400'
                        }`}
                      >
                        Normal Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, entry_kind: 'debt_payment' })}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                          formData.entry_kind === 'debt_payment'
                            ? 'bg-primary text-white'
                            : 'bg-surface-light text-gray-400'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <CreditCard className="w-4 h-4" /> Debt Payment
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {formData.type === 'expense' && formData.entry_kind === 'debt_payment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Linked Debt</label>
                    <select
                      value={formData.debt_id}
                      onChange={(e) => setFormData({ ...formData, debt_id: e.target.value })}
                      className="w-full bg-surface-light rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    >
                      <option value="">Select debt</option>
                      {debts
                        .filter((debt) => Number(debt.balance) > 0)
                        .map((debt) => (
                          <option key={debt.id} value={debt.id}>
                            {debt.name} • {(debt.debt_category || 'other').replace('_', ' ')} • APR {Number(debt.interest_rate_apr || 0).toFixed(2)}% • Est {debt.projected_completion_date ? new Date(debt.projected_completion_date).toLocaleDateString() : 'N/A'} • Bal {format(debt.balance)}
                          </option>
                        ))}
                    </select>
                    {debts.filter((debt) => Number(debt.balance) > 0).length === 0 && (
                      <p className="text-amber-300 text-xs mt-2">
                        No open debts available. Add or update a debt in Debt Plan first.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={`${symbol}0.00`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    <option value="">Select category</option>
                    {categories[formData.type].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Add a note..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTransaction(null);
                      resetForm();
                    }}
                    className="flex-1 bg-surface-light hover:bg-surface text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {editingTransaction ? 'Update' : 'Add'}
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

export default Transactions;
