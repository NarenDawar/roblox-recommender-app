// components/AuthModal.jsx
'use client';

import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // GoogleAuthProvider, // No longer needed
  // signInWithPopup, // No longer needed
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebaseClient'; // Adjust path as needed

const AuthModal = ({ onClose, onAuthSuccess, initialMode }) => {
  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login'); // true for login, false for signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // For signup
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthError = (err) => {
    let errorMessage = 'An unknown error occurred.';
    switch (err.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already in use.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage = 'Invalid email or password.';
        break;
      // case 'auth/popup-closed-by-user': // No longer needed
      //   errorMessage = 'Google sign-in popup closed.';
      //   break;
      default:
        errorMessage = err.message || errorMessage;
    }
    setError(errorMessage);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLoginMode) {
      // Login
      try {
        await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(); // Call success callback
        onClose(); // Close modal on success
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    } else {
      // Sign Up
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create a user document in Firestore for their profile
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: new Date(),
          // You can add more default profile info here
        });
        onAuthSuccess(); // Call success callback
        onClose(); // Close modal on success
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Removed handleGoogleSignIn function as it's no longer used

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-800 to-indigo-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none"
          aria-label="Close authentication modal"
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">
          {isLoginMode ? 'Welcome Back!' : 'Join RBXDiscover!'}
        </h2>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="your@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {!isLoginMode && (
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs italic text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLoginMode ? 'Logging In...' : 'Signing Up...'}
              </span>
            ) : (
              isLoginMode ? 'Login' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-purple-600 hover:text-purple-800 font-bold focus:outline-none"
            >
              {isLoginMode ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>

        {/* Removed the "OR" separator and Google Sign-in button */}
      </div>
    </div>
  );
};

export default AuthModal;
