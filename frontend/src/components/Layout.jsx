import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Target, 
  TrendingUp, 
  Wallet, 
  FileText,
  User,
  DollarSign,
  ListChecks,
  Landmark
} from 'lucide-react';
import logo from '/logo.jpeg';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { path: '/goals', label: 'Savings Goals', icon: Target },
  { path: '/investments', label: 'Investments', icon: TrendingUp },
  { path: '/income-streams', label: 'Income Streams', icon: Wallet },
  { path: '/estate', label: 'Estate Planning', icon: FileText },
  { path: '/baby-steps', label: '7 Baby Steps', icon: ListChecks },
  { path: '/debt-plan', label: 'Debt Plan', icon: Landmark },
  { path: '/profile', label: 'Profile', icon: User },
];

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface rounded-lg text-white hover:bg-surface-light transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

{/* Sidebar - Fixed position */}
      <aside className={`
        fixed top-0 inset-y-0 z-50
        w-64 bg-surface border-r border-surface-light
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b border-surface-light">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
            {settings.showLogo ? (
              <img src={logo} alt="Pooe Power Logo" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-white">Pooe Power</h1>
              <p className="text-xs text-gray-400">Financial Advisor</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:bg-surface-light hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-surface-light">
          <p className="text-xs text-gray-500 text-center">
            Empowering Your Financial Future
          </p>
        </div>

        {/* Close button */}
        <button 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
