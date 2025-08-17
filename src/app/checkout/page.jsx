"use client";

import React, { useState } from 'react';
import { ArrowLeft, Lock, Loader2 } from 'lucide-react';

const CheckoutPage = ({ setCurrentPage, user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        setError(error);
        setIsLoading(false);
        return;
      }

      if (url) {
        // Redirect the user to the Stripe checkout page
        window.location.href = url;
      }
    } catch (err) {
      setError('Failed to connect to the payment service. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md my-8 mx-auto p-6 bg-gray-800 rounded-3xl shadow-xl border border-gray-700 animate-fadeIn">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentPage('landing')}
          className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors duration-300"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex-grow text-center">
          Upgrade to Pro
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="bg-gray-700 p-6 rounded-2xl border border-gray-600 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-lg text-white font-bold">Pro Plan</p>
          <p className="text-lg text-white font-bold">$15.00 / month</p>
        </div>
        <p className="text-gray-400 text-sm">
          You'll get unlimited access to all pro features, including the Idea Generator, advanced analysis, and unlimited project saves.
        </p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-800 text-white rounded-xl border border-red-700 text-sm">
          <p>{error}</p>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full px-6 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 flex items-center justify-center space-x-2 disabled:bg-gray-600"
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Lock className="h-5 w-5" />
              <span>Proceed to Secure Payment</span>
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Payments are securely processed by Stripe.
        </p>
      </div>
    </div>
  );
};

export default CheckoutPage;
