'use client'
import React, { useState } from 'react';
import { User, Key, Trash2, FileX, XCircle } from 'lucide-react';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateEmail, signOut } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../firebase.js';

// MessageModal component (No changes)
const MessageModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 max-w-sm w-full text-center">
      <div className="flex justify-center mb-4">
        <XCircle className="h-10 w-10 text-red-400" />
      </div>
      <p className="text-white mb-6 text-lg">{message}</p>
      <button
        onClick={onClose}
        className="w-full px-6 py-3 bg-purple-600 text-white font-bold rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 cursor-pointer"
      >
        Close
      </button>
    </div>
  </div>
);

// ConfirmationModal component (No changes)
const ConfirmationModal = ({ message, onConfirm, onCancel, showPasswordInput, password, setPassword }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <Trash2 className="h-10 w-10 text-red-400" />
        </div>
        <p className="text-white mb-6 text-lg">{message}</p>
        
        {showPasswordInput && (
          <div className="mb-4">
            <input
              type="password"
              placeholder="Enter your password to confirm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-600 text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 placeholder-gray-400"
              required
            />
          </div>
        )}
  
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-600 text-white font-bold rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
);

const SettingsPage = ({ setCurrentPage, user }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [appId] = useState('roblox-analyzer'); 
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);

  const showMessageModal = (msg) => {
    setMessage(msg);
    setIsModalOpen(true);
  };
  
  const showConfirmationModal = (msg, action, requiresPassword = false) => {
    setConfirmationMessage(msg);
    setConfirmationAction(() => action);
    setIsPasswordRequired(requiresPassword);
    setIsConfirmationModalOpen(true);
  };

  const handleReauthenticate = async (password) => {
    if (!password) {
        showMessageModal("Password is required for this action.");
        return false;
      }
    const credential = EmailAuthProvider.credential(user.email, password);
    try {
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      showMessageModal(`Re-authentication failed: ${error.message}`);
      return false;
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showMessageModal("New password must be at least 6 characters long.");
      return;
    }
    const isAuthenticated = await handleReauthenticate(currentPassword);
    if (isAuthenticated) {
      try {
        await updatePassword(user, newPassword);
        showMessageModal("Password updated successfully!");
        setCurrentPassword('');
        setNewPassword('');
      } catch (error) {
        showMessageModal(`Failed to update password: ${error.message}`);
      }
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    const isAuthenticated = await handleReauthenticate(currentPassword);
    if (isAuthenticated) {
      try {
        await updateEmail(user, newEmail);
        showMessageModal("Email updated successfully! Please log in again with your new email.");
        await signOut(auth);
        setCurrentPage('login');
      } catch (error) {
        showMessageModal(`Failed to update email: ${error.message}`);
      }
    }
  };

  const handleDeleteAccount = async (password) => {
    const isAuthenticated = await handleReauthenticate(password);
    if (isAuthenticated) {
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/delete-account', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete account.');
        }
        showMessageModal("Your account has been successfully deleted.");
        // ** THE FIX IS HERE: Forcibly sign out the user on the client-side **
        await signOut(auth);
        setCurrentPage('landing');
      } catch (error) {
        showMessageModal(`Failed to delete account: ${error.message}`);
      }
    }
  };

  const handleDeleteAllProjects = async () => {
    try {
      const projectsCollectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/projects`);
      const querySnapshot = await getDocs(projectsCollectionRef);
      const deletePromises = [];
      querySnapshot.forEach((docSnap) => {
        deletePromises.push(deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/projects`, docSnap.id)));
      });
      await Promise.all(deletePromises);
      showMessageModal("All projects have been deleted successfully!");
    } catch (error) {
      showMessageModal(`Failed to delete projects: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-8 text-gray-200 text-center bg-gray-900 animate-fadeIn">
      <div className="w-full max-w-3xl p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 space-y-12 text-left">
        <h1 className="text-4xl font-extrabold text-white text-center">Settings</h1>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-purple-400 flex items-center space-x-2">
            <User className="h-6 w-6" />
            <span>Account</span>
          </h2>
          <form onSubmit={handleChangeEmail} className="p-6 bg-gray-700 rounded-2xl border border-gray-600 space-y-4">
            <p className="text-gray-300">Logged in as: <span className="font-semibold">{user?.email}</span></p>
            <input
              type="password"
              placeholder="Enter current password to change email"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-600 text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 placeholder-gray-400"
              required
            />
            <input
              type="email"
              placeholder="Enter new email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-600 text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 placeholder-gray-400"
              required
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors duration-300 flex items-center justify-center space-x-2 cursor-pointer"
            >
              Change Email
            </button>
          </form>
          <form onSubmit={handleChangePassword} className="p-6 bg-gray-700 rounded-2xl border border-gray-600 space-y-4">
            <input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-600 text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 placeholder-gray-400"
              required
            />
            <input
              type="password"
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-600 text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 placeholder-gray-400"
              required
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors duration-300 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Key className="h-5 w-5" />
              <span>Change Password</span>
            </button>
          </form>
          
          <button
            onClick={() => showConfirmationModal("Are you sure you want to delete your account? This action is irreversible.", handleDeleteAccount, true)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors duration-300 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
          >
            <Trash2 className="h-5 w-5" />
            <span>Delete Account</span>
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-red-400 flex items-center space-x-2">
            <FileX className="h-6 w-6" />
            <span>Data Management</span>
          </h2>
          <div className="p-6 bg-gray-700 rounded-2xl border border-gray-600 space-y-4">
            <p className="text-gray-300">
              Permanently delete all of your saved Roblox game ideas and analyses.
            </p>
            <button
              onClick={() => showConfirmationModal("Are you sure you want to delete all your projects? This action is irreversible.", handleDeleteAllProjects, false)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors duration-300 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete All Projects</span>
            </button>
          </div>
        </div>
        
        {isModalOpen && <MessageModal message={message} onClose={() => setIsModalOpen(false)} />}
        
        {isConfirmationModalOpen && <ConfirmationModal
          message={confirmationMessage}
          onConfirm={() => {
            if (confirmationAction) {
                const passwordForAction = isPasswordRequired ? deleteConfirmPassword : undefined;
                confirmationAction(passwordForAction);
            }
            setIsConfirmationModalOpen(false);
            setDeleteConfirmPassword('');
          }}
          onCancel={() => {
            setIsConfirmationModalOpen(false);
            setDeleteConfirmPassword(''); 
          }}
          showPasswordInput={isPasswordRequired}
          password={deleteConfirmPassword}
          setPassword={setDeleteConfirmPassword}
        />}

        <div className="text-center">
            <button
                onClick={() => setCurrentPage('dashboard')}
                className="text-purple-400 hover:underline font-semibold cursor-pointer"
            >
                Back to Dashboard
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;