'use client';

import { useState, useEffect } from 'react';
import Sidebar from './sidebar';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  // Start with sidebar open to avoid hydration mismatch
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Set initial state based on screen size after mount
    const isMobile = window.innerWidth < 768;
    setSidebarOpen(!isMobile);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth < 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Content Area */}
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}