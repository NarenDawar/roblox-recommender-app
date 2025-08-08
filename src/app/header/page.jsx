'use client'
import React from 'react';
import { Sparkles, LogIn, UserPlus, LayoutDashboard, LogOut, Settings } from 'lucide-react';

const Header = ({ setCurrentPage, userIsAuthenticated, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 bg-gray-900 bg-opacity-90 backdrop-filter backdrop-blur-lg border-b border-gray-700 p-4">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentPage('landing')}>
          <Sparkles className="h-8 w-8 text-yellow-400" />
          <span className="text-2xl font-extrabold text-white">Roblox Analyzer</span>
        </div>
        <div className="flex items-center space-x-4">
          {userIsAuthenticated ? (
            <>
              <button
                onClick={() => setCurrentPage('settings')} // New 'settings' page
                className="px-4 py-2 bg-gray-700 text-white rounded-full font-semibold hover:bg-purple-600 transition-colors duration-300 flex items-center space-x-2 cursor-pointer"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors duration-300 flex items-center space-x-2 cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentPage('login')}
                className="px-4 py-2 bg-gray-700 text-white rounded-full font-semibold hover:bg-purple-600 transition-colors duration-300 flex items-center space-x-2 cursor-pointer"
              >
                <LogIn className="h-5 w-5" />
                <span>Login</span>
              </button>
              <button
                onClick={() => setCurrentPage('signup')}
                className="px-4 py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors duration-300 flex items-center space-x-2 cursor-pointer"
              >
                <UserPlus className="h-5 w-5" />
                <span>Sign Up</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
