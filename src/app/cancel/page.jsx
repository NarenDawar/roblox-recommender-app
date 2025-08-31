"use client";

import React, { Suspense } from 'react';
import { XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// New component for the content that uses the hook
const CancelContent = () => {
  const router = useRouter();

  return (
    <>
      <XCircle className="h-24 w-24 text-red-400 mb-6" />
      <h1 className="text-4xl font-extrabold text-white mb-4">Payment Canceled</h1>
      <p className="text-lg text-gray-300 mb-8">
        Your transaction was not completed. You can try again from the dashboard.
      </p>
      <button
        onClick={() => router.push('/')}
        className="px-8 py-4 bg-gray-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-gray-700"
      >
        Back to Dashboard
      </button>
    </>
  );
};

// Main page component wraps the content in Suspense
const CancelPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gray-900">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <CancelContent />
      </Suspense>
    </div>
  );
};

export default CancelPage;