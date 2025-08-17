'use client'
import React, { useState } from 'react';
import { AtSign, Lock } from 'lucide-react';
import { auth, db } from '../../../firebase.js'; // Import db
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore functions

const SignupPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    if (password !== confirmPassword) {
      setSignupError("Passwords do not match!");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // --- CREATE USER DOCUMENT IN FIRESTORE ---
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        tier: 'free',
        analysisCount: 0,
        usageResetDate: null,
      });
      // --- END ---

      console.log('Sign Up and user document creation successful!');
      setCurrentPage('login'); // Redirect to login after successful signup
    } catch (error) {
      console.error('Sign Up failed:', error.message);
      if (error.code === 'auth/email-already-in-use') {
        setSignupError('That email address is already in use. Please log in or use a different email.');
      } else {
        setSignupError('Sign Up failed: ' + error.message);
      }
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
          <div className="relative">
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
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-purple-600 text-white font-bold rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 cursor-pointer"
          >
            Sign Up
          </button>
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
