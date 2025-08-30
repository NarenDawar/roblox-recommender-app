"use client";

import React from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import CheckoutButton from '../components/CheckoutButton/page.jsx';

const CheckoutPage = ({ setCurrentPage, plan = 'pro' }) => {
  const planDetails = {
    pro: {
      name: 'Pro Plan',
      price: '$10.00 / month',
      priceId: "price_1S0lhXAaSrBLZiYG8m86YgLQ",
      description: "You'll get unlimited access to all pro features, including the Idea Generator, advanced analysis, and unlimited project saves."
    },
    enterprise: {
      name: 'Enterprise Plan',
      price: '$30.00 / month',
      priceId: 'price_1S0lhjAaSrBLZiYGEI4YrUg0',
      description: "You'll get unlimited analyses, shared workspaces, and priority support."
    }
  };

  const selectedPlan = planDetails[plan];

  return (
    <div className="w-full max-w-md my-8 mx-auto p-6 bg-gray-800 rounded-3xl shadow-xl border border-gray-700 animate-fadeIn">
      {/* ... header and plan details ... */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentPage('landing')}
          className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors duration-300"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex-grow text-center">
          Upgrade to {selectedPlan.name}
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="bg-gray-700 p-6 rounded-2xl border border-gray-600 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-lg text-white font-bold">{selectedPlan.name}</p>
          <p className="text-lg text-white font-bold">{selectedPlan.price}</p>
        </div>
        <p className="text-gray-400 text-sm">
          {selectedPlan.description}
        </p>
      </div>

      <div className="mt-6">
        <div className="w-full px-6 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 flex items-center justify-center space-x-2">
            <Lock className="h-5 w-5" />
            {/* --- FIX IS HERE --- */}
            {/* Pass both the priceId and the plan name ('pro' or 'enterprise') */}
            <CheckoutButton priceId={selectedPlan.priceId} plan={plan} />
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Payments are securely processed by Stripe.
        </p>
      </div>
    </div>
  );
};

export default CheckoutPage;