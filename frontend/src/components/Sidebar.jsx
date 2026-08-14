import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Target, 
  TrendingUp, 
  Wallet, 
  FileText,
  User,
  X,
  ListChecks,
  Landmark
} from 'lucide-react';

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

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-surface border-r border-surface-light
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Mobile close button */}
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-surface-light">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center animate-pulse-glow">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Pooe Power</h1>
              <p className="text-xs text-gray-400">Financial Advisor</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:bg-surface-light hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
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
      </aside>
    </>
  );
};

export default Sidebar;
