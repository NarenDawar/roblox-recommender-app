"use client";

import React, { useState } from 'react';
import { ArrowLeft, Rocket } from 'lucide-react';

const UpgradePage = ({ setCurrentPage }) => {
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const handleProceedToCheckout = () => {
    if (selectedPlan) {
      setCurrentPage('checkout', { plan: selectedPlan });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-gray-200 text-center bg-gray-900 animate-fadeIn">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors duration-300"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex-grow text-center">
            Choose Your Plan
          </h1>
          <div className="w-10"></div>
        </div>

        <div className="space-y-6">
          <p className="text-gray-400">
            Select a plan below to unlock more features and increase your usage limits.
          </p>
          <div className="relative">
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 appearance-none"
            >
              <option value="pro">Pro Plan - $10/month</option>
              <option value="enterprise">Enterprise Plan - $30/month</option>
            </select>
          </div>
          <button
            onClick={handleProceedToCheckout}
            className="w-full px-6 py-3 bg-purple-600 text-white font-bold rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Rocket className="h-5 w-5" />
            <span>Proceed to Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;