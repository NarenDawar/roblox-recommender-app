"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

const SuccessPage = () => {
  const [plan, setPlan] = useState('Pro'); // Default to Pro
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const sessionPlan = searchParams.get('plan');
    if (sessionPlan) {
      // Capitalize the first letter for display
      setPlan(sessionPlan.charAt(0).toUpperCase() + sessionPlan.slice(1));
    }
    // No need to clear URL params, as it won't affect functionality
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gray-900">
      <CheckCircle className="h-24 w-24 text-green-400 mb-6" />
      <h1 className="text-4xl font-extrabold text-white mb-4">Upgrade Successful!</h1>
      <p className="text-lg text-gray-300 mb-8">
        {/* FIX: Display the dynamic plan name */}
        Welcome to {plan}! You now have access to all premium features.
      </p>
      <button
        onClick={() => router.push('/')}
        className="px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default SuccessPage;