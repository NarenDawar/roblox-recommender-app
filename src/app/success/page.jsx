"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

// New component that contains the logic using the hooks
const SuccessContent = () => {
  const [plan, setPlan] = useState('Pro');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const sessionPlan = searchParams.get('plan');
    if (sessionPlan) {
      setPlan(sessionPlan.charAt(0).toUpperCase() + sessionPlan.slice(1));
    }
  }, [searchParams]);

  return (
    <>
      <CheckCircle className="h-24 w-24 text-green-400 mb-6" />
      <h1 className="text-4xl font-extrabold text-white mb-4">Upgrade Successful!</h1>
      <p className="text-lg text-gray-300 mb-8">
        Welcome to {plan}! You now have access to all premium features.
      </p>
      <button
        onClick={() => router.push('/')}
        className="px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700"
      >
        Go to Dashboard
      </button>
    </>
  );
};

// The main page component now wraps the client-side part in Suspense
const SuccessPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gray-900">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
};

export default SuccessPage;