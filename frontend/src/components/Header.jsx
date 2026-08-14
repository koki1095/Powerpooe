import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Header = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-surface rounded-lg text-white"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 mt-16 lg:mt-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Header;
