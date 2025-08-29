'use client';

import { useState } from 'react';
import Sidebar from './sidebar';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Menu Button */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-heading-5 font-semibold text-gray-900">SEO Assistant</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
        
        {/* Content Area */}
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}