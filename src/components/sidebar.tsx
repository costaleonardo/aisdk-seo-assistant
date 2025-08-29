'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MessageCircle, 
  Globe, 
  BarChart3, 
  Menu, 
  X,
  Plus
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  
  const navigation = [
    {
      name: 'Chat',
      href: '/',
      icon: MessageCircle,
      current: pathname === '/'
    },
    {
      name: 'Web Scraper',
      href: '/scraper',
      icon: Globe,
      current: pathname === '/scraper'
    },
    {
      name: 'SEO Analysis',
      href: '/seo-analysis',
      icon: BarChart3,
      current: pathname === '/seo-analysis'
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-[#003D5B] text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <img src="//www.concentrix.com/wp-content/uploads/2024/02/concentrix_logo.webp" alt="" />
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-slate-800 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button - Hidden for now */}
        {/* <div className="p-4">
          <Link href="/">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-body font-medium">New Chat</span>
            </button>
          </Link>
        </div> */}

        {/* Navigation */}
        <nav className="px-4 pb-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors
                    ${item.current 
                      ? 'bg-slate-800 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                  onClick={() => {
                    // Close mobile menu on navigation
                    if (window.innerWidth < 768) {
                      onToggle();
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-body font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="text-caption font-regular text-slate-400 text-center">
            <p>Concentrix SEO Assistant</p>
            <p className="mt-1 text-caption font-regular">For internal team use only</p>
          </div>
        </div>
      </div>
    </>
  );
}