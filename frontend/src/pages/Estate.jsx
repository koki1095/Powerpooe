import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { FileText, Shield, Upload, Trash2, Check, X, File } from 'lucide-react';
import { useCurrencyFormatter } from '../utils/currency';

const Estate = () => {
  const [estatePlan, setEstatePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    has_will: false,
    has_trust: false,
    insurance_provider: '',
    coverage_amount: '',
    documents: [],
  });

  const { format } = useCurrencyFormatter();

  useEffect(() => {
    fetchEstatePlan();
  }, []);

  const fetchEstatePlan = async () => {
    try {
      const response = await api.get('/estate');
      const data = response.data;
      setEstatePlan(data);
      setFormData({
        has_will: data.has_will || false,
        has_trust: data.has_trust || false,
        insurance_provider: data.insurance_provider || '',
        coverage_amount: data.coverage_amount || '',
        documents: data.documents || [],
      });
    } catch (error) {
      console.error('Error fetching estate plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/estate', formData);
      fetchEstatePlan();
    } catch (error) {
      console.error('Error saving estate plan:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDocument = async () => {
    const filePath = prompt('Enter document path (placeholder):');
    if (!filePath) return;
    
    try {
      await api.post('/estate/documents', {
        file_path: filePath,
        file_name: filePath.split('/').pop(),
      });
      fetchEstatePlan();
    } catch (error) {
      console.error('Error adding document:', error);
    }
  };

  const handleRemoveDocument = async (docId) => {
    if (!confirm('Are you sure you want to remove this document?')) return;
    try {
      await api.delete(`/estate/documents/${docId}`);
      fetchEstatePlan();
    } catch (error) {
      console.error('Error removing document:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Estate Planning</h1>
            <p className="text-gray-400 mt-1">Grow generational wealth</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estate Planning Checklist */}
            <div className="bg-surface rounded-xl border border-surface-light p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Estate Documents
              </h3>
              
              <div className="space-y-4">
                {/* Will */}
                <div className="flex items-center justify-between p-4 bg-surface-light rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      formData.has_will ? 'bg-success/20' : 'bg-gray-600/20'
                    }`}>
                      {formData.has_will ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <X className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">Will</p>
                      <p className="text-gray-400 text-xs">Last will and testament</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, has_will: !formData.has_will })}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.has_will
                        ? 'bg-success text-white'
                        : 'bg-surface text-gray-400'
                    }`}
                  >
                    {formData.has_will ? 'Yes' : 'No'}
                  </button>
                </div>

                {/* Trust */}
                <div className="flex items-center justify-between p-4 bg-surface-light rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      formData.has_trust ? 'bg-success/20' : 'bg-gray-600/20'
                    }`}>
                      {formData.has_trust ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <X className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">Trust</p>
                      <p className="text-gray-400 text-xs">Living trust or family trust</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, has_trust: !formData.has_trust })}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.has_trust
                        ? 'bg-success text-white'
                        : 'bg-surface text-gray-400'
                    }`}
                  >
                    {formData.has_trust ? 'Yes' : 'No'}
                  </button>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Life Insurance */}
            <div className="bg-surface rounded-xl border border-surface-light p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Life Insurance
              </h3>
              
              <div className="space-y-4">
                {/* Insurance Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    value={formData.insurance_provider}
                    onChange={(e) =>
                      setFormData({ ...formData, insurance_provider: e.target.value })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g., Prudential, State Farm"
                  />
                </div>

                {/* Coverage Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Coverage Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.coverage_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, coverage_amount: e.target.value })
                    }
                    className="w-full bg-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0.00"
                  />
                </div>

                {formData.coverage_amount > 0 && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <p className="text-primary text-sm">
                      {format(formData.coverage_amount)} coverage
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-surface rounded-xl border border-surface-light p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Documents
              </h3>
              
              <div className="space-y-3">
                {formData.documents && formData.documents.length > 0 ? (
                  formData.documents.map((doc) => (
                    <div
                      key={doc.id || doc.file_path}
                      className="flex items-center justify-between p-4 bg-surface-light rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">{doc.file_name}</p>
                          <p className="text-gray-400 text-xs">{doc.file_path}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="p-2 text-gray-400 hover:text-error transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    No documents uploaded yet
                  </p>
                )}
                
                <button
                  onClick={handleAddDocument}
                  className="w-full border-2 border-dashed border-surface-light hover:border-primary text-gray-400 hover:text-primary font-medium py-4 rounded-lg transition-colors"
                >
                  + Add Document (Placeholder)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Estate;
