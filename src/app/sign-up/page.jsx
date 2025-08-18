'use client'
import React, { useState } from 'react';
import { AtSign, Lock } from 'lucide-react';
import { auth, db } from '../../../firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const SignupPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isReactivating, setIsReactivating] = useState(false);

  const handleReactivation = async () => {
    try {
        const response = await fetch('/api/reactivate-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Reactivation failed.");
        
        // Show success message and guide user to log in
        setSignupError("Account reactivated! Please log in.");
        setIsReactivating(false); // Hide the reactivate button
    } catch (error) {
        setSignupError(error.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    setIsReactivating(false);

    if (password !== confirmPassword) {
      setSignupError("Passwords do not match!");
      return;
    }

    try {
      // Step 1: Call the new API to check the email status
      const checkEmailResponse = await fetch('/api/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
      });

      const { status, error: checkError } = await checkEmailResponse.json();

      if (!checkEmailResponse.ok) {
          throw new Error(checkError || "Error checking email availability.");
      }

      // Step 2: Handle the response from the API
      if (status === 'inactive') {
          setIsReactivating(true);
          setSignupError('This account is inactive. Enter your new password to reactivate it.');
          return;
      }
      
      if (status === 'active') {
          setSignupError('This email is already in use. Please log in.');
          return;
      }

      // Step 3: If email is 'available', proceed with creating a new account
      if (status === 'available') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          email: user.email,
          tier: 'free',
          analysisCount: 0,
          usageResetDate: null,
          status: 'active',
        });

        setCurrentPage('login');
      }

    } catch (error) {
      console.error('Sign Up failed:', error.message);
      setSignupError('Sign Up failed: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-gray-200 text-center bg-gray-900 animate-fadeIn">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700">
        <h2 className="text-4xl font-extrabold text-white mb-6">Sign Up</h2>
        <form onSubmit={handleSignup} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <AtSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 placeholder-gray-400"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 placeholder-gray-400"
            />
          </div>
           {/* The 'Confirm Password' field is now hidden during reactivation */}
           {!isReactivating && <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 placeholder-gray-400"
            />
          </div>}
          
          {/* Show the appropriate button based on the context */}
          {!isReactivating ? (
            <button
                type="submit"
                className="w-full px-6 py-3 bg-purple-600 text-white font-bold rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 cursor-pointer"
            >
                Sign Up
            </button>
           ) : (
            <button type="button" onClick={handleReactivation} className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-full shadow-lg hover:bg-green-700">
                Reactivate Account
            </button>
           )}

          {signupError && (
            <p className="text-red-400 text-sm mt-2">{signupError}</p>
          )}
        </form>
        <p className="mt-6 text-gray-400">
          Already have an account?{' '}
          <button onClick={() => setCurrentPage('login')} className="text-purple-400 hover:underline font-semibold cursor-pointer">
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;