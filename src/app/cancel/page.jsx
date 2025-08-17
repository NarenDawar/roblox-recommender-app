"use client";

import React from 'react';
import { XCircle } from 'lucide-react';

const CancelPage = ({ setCurrentPage }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <XCircle className="h-24 w-24 text-red-400 mb-6" />
      <h1 className="text-4xl font-extrabold text-white mb-4">Payment Canceled</h1>
      <p className="text-lg text-gray-300 mb-8">
        Your transaction was not completed. You can try again from the dashboard.
      </p>
      <button
        onClick={() => setCurrentPage('dashboard')}
        className="px-8 py-4 bg-gray-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-gray-700"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default CancelPage;
