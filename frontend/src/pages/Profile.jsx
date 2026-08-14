import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Layout from '../components/Layout';
import { User, Mail, LogOut, Save, Image, DollarSign, Palette } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // In a real app, this would call an API to update the user
    setTimeout(() => {
      setSaving(false);
      alert('Profile updated successfully!');
    }, 1000);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="text-gray-400 mt-1">Manage your account settings</p>
        </div>

        {/* Profile Form */}
        <div className="bg-surface rounded-xl border border-surface-light p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-11 pr-4 py-3 bg-surface-light/50 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Contact support to change your email
              </p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

{/* Account Info */}
        <div className="bg-surface rounded-xl border border-surface-light p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-surface-light">
              <span className="text-gray-400">Member Since</span>
              <span className="text-white">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-light">
              <span className="text-gray-400">Account Status</span>
              <span className="text-success">Active</span>
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-surface rounded-xl border border-surface-light p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            App Settings
          </h3>
          
          <div className="space-y-4">
            {/* Show Logo Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-surface-light">
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Show Logo</p>
                  <p className="text-gray-400 text-sm">Display logo in navigation</p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ showLogo: !settings.showLogo })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.showLogo ? 'bg-primary' : 'bg-surface-light'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.showLogo ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center justify-between py-3 border-b border-surface-light">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Currency</p>
                  <p className="text-gray-400 text-sm">Default currency display</p>
                </div>
              </div>
              <select
                value={settings.currency}
                onChange={(e) => updateSettings({ currency: e.target.value })}
                className="bg-surface-light text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="ZAR">ZAR (R)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-surface rounded-xl border border-surface-light p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sign Out</h3>
          <p className="text-gray-400 mb-4">
            Ready to leave? Click the button below to sign out of your account.
          </p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-error hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* Tagline */}
        <p className="text-center text-gray-500 text-sm">
          Empowering Your Financial Future
        </p>
      </div>
    </Layout>
  );
};

export default Profile;
