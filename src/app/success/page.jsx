"use client";

import React from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessPage = ({ setCurrentPage }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <CheckCircle className="h-24 w-24 text-green-400 mb-6" />
      <h1 className="text-4xl font-extrabold text-white mb-4">Upgrade Successful!</h1>
      <p className="text-lg text-gray-300 mb-8">
        Welcome to Pro! You now have access to all premium features.
      </p>
      <button
        onClick={() => setCurrentPage('dashboard')}
        className="px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default SuccessPage;
