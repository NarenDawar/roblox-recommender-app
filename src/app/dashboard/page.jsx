import React, { useState, useEffect } from 'react';
import { Sparkles, PlusCircle, Trash2 } from 'lucide-react';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

// ConfirmationModal component for delete actions
const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 max-w-md w-full text-center">
      <div className="flex justify-center mb-4">
        <Trash2 className="h-10 w-10 text-red-400" />
      </div>
      <p className="text-white mb-6 text-lg">{message}</p>
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

const Dashboard = ({ setCurrentPage, db, user, onProjectSelect, onStartNewProject }) => {
  const [projects, setProjects] = useState([]);
  const [appId] = useState('roblox-analyzer'); // Static app ID
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const showConfirmationModal = (projectId) => {
    setProjectToDelete(projectId);
    setIsConfirmationModalOpen(true);
  };

  const handleDeleteProject = async () => {
    try {
      const projectRef = doc(db, `artifacts/${appId}/users/${user.uid}/projects`, projectToDelete);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setIsConfirmationModalOpen(false);
      setProjectToDelete(null);
    }
  };

  useEffect(() => {
    if (db && user) {
      // Corrected Firestore collection path to match security rules
      const q = collection(db, `artifacts/${appId}/users/${user.uid}/projects`);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const projectsArray = [];
        querySnapshot.forEach((doc) => {
          projectsArray.push({ id: doc.id, ...doc.data() });
        });
        setProjects(projectsArray);
      });
      return () => unsubscribe();
    }
  }, [db, user]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 text-gray-200 text-center bg-gray-900 animate-fadeIn">
      <div className="w-full max-w-4xl p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 space-y-8">
        <div className="flex items-center justify-center space-x-4">
          <Sparkles className="h-12 w-12 text-yellow-400" />
          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight">
            My Workspace
          </h1>
        </div>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Welcome back! Here you can manage your previous ideas and start a new project.
        </p>
        
        {/* Project List */}
        <div className="w-full p-6 bg-gray-700 rounded-2xl border border-gray-600 text-left space-y-4">
          {projects.length > 0 ? (
            projects.map((project) => (
              <div key={project.id} className="relative group">
                <button
                  onClick={() => onProjectSelect(project)}
                  className="w-full text-left bg-gray-800 p-4 rounded-xl border border-gray-600 hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                >
                  <h3 className="font-semibold text-white">{project.idea.substring(0, 50)}...</h3>
                  <p className="text-gray-400 text-sm mt-1">{project.analysis.substring(0, 100)}...</p>
                </button>
                <button
                  onClick={() => showConfirmationModal(project.id)}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                  aria-label="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">You currently have no projects. Click the button below to get started!</p>
          )}
        </div>

        <button
          onClick={onStartNewProject}
          className="px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 flex items-center space-x-2 mx-auto cursor-pointer"
        >
          <PlusCircle className="h-6 w-6" />
          <span>Start a New Idea</span>
        </button>
      </div>
      {isConfirmationModalOpen && (
        <ConfirmationModal
          message="Are you sure you want to delete this project? This action cannot be undone."
          onConfirm={handleDeleteProject}
          onCancel={() => setIsConfirmationModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
