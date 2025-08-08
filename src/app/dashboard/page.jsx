import React, { useState, useEffect } from 'react';
import { Sparkles, PlusCircle } from 'lucide-react';
import { collection, onSnapshot } from '../../../firebase.js';

const Dashboard = ({ setCurrentPage, db, user }) => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (db && user) {
      const q = collection(db, `artifacts/roblox-recommender/users/${user.uid}/projects`);
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
    <div className="flex flex-col items-center min-h-screen p-4 text-gray-200 text-center bg-gray-900 animate-fadeIn">
      <div className="w-full p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 space-y-8">
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
              <div key={project.id} className="bg-gray-800 p-4 rounded-xl border border-gray-600 hover:bg-gray-600 transition-colors duration-200 cursor-pointer">
                <h3 className="font-semibold text-white">{project.idea.substring(0, 50)}...</h3>
                <p className="text-gray-400 text-sm mt-1">{project.analysis.substring(0, 100)}...</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">You currently have no projects. Click the button below to get started!</p>
          )}
        </div>

        <button
          onClick={() => setCurrentPage('analyzer')}
          className="px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 flex items-center space-x-2 mx-auto"
        >
          <PlusCircle className="h-6 w-6" />
          <span>Start a New Idea</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;