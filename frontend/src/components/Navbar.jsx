import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { LogOut, User, DollarSign } from 'lucide-react';
import logo from '/logo.jpeg';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-surface border-b border-surface-light px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3">
          {settings.showLogo ? (
            <img src={logo} alt="Pooe Power Logo" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">Pooe Power</h1>
            <p className="text-xs text-gray-400">Financial Advisor</p>
          </div>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-300">
              <User className="w-4 h-4" />
              <span className="text-sm">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
