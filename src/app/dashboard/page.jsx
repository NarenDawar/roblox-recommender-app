import React, { useState, useEffect } from 'react';
import { Sparkles, PlusCircle, Trash2, Search, Lightbulb } from 'lucide-react';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 max-w-md w-full text-center">
      <div className="flex justify-center mb-4">
        <Trash2 className="h-10 w-10 text-red-400" />
      </div>
      <p className="text-white mb-6 text-lg">{message}</p>
      <div className="flex justify-center space-x-4">
        <button onClick={onCancel} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 cursor-pointer">Cancel</button>
        <button onClick={onConfirm} className="px-6 py-3 bg-red-600 text-white font-bold rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 cursor-pointer">Confirm</button>
      </div>
    </div>
  </div>
);

const getScoreColor = (score) => {
  if (score === null || isNaN(score)) return 'text-gray-400';
  if (score >= 8) return 'text-green-400';
  if (score >= 5) return 'text-yellow-400';
  return 'text-red-400';
};

const getScoresFromAnalysis = (analysisText) => {
    const scores = { virality: null, originality: null, monetizability: null };
    if (!analysisText) return scores;
    const viralityMatch = analysisText.match(/\*{0,2}Virality Potential\*{0,2}\s*Score:\s*(\d+)\/10/i);
    if (viralityMatch) scores.virality = parseInt(viralityMatch[1], 10);
    const originalityMatch = analysisText.match(/\*{0,2}Originality\*{0,2}\s*Score:\s*(\d+)\/10/i);
    if (originalityMatch) scores.originality = parseInt(originalityMatch[1], 10);
    const monetizabilityMatch = analysisText.match(/\*{0,2}Monetizability\*{0,2}\s*Score:\s*(\d+)\/10/i);
    if (monetizabilityMatch) scores.monetizability = parseInt(monetizabilityMatch[1], 10);
    return scores;
};

const ProjectCard = ({ project, onProjectSelect, showConfirmationModal }) => {
    const scores = getScoresFromAnalysis(project.analysis);
    const date = project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date';
    const title = project.idea.substring(0, 40) + (project.idea.length > 40 ? '...' : '');

    return (
        <div className="relative group bg-gray-700 rounded-2xl border border-gray-600 flex flex-col p-6 transition-all duration-300 hover:border-purple-500 hover:shadow-lg hover:-translate-y-1">
            <button onClick={() => showConfirmationModal(project.id)} className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" aria-label="Delete project"><Trash2 className="h-4 w-4" /></button>
            <div onClick={() => onProjectSelect(project)} className="cursor-pointer flex flex-col flex-grow">
                <div className="flex-grow">
                    <p className="text-gray-400 text-sm mb-1">{date}</p>
                    <h3 className="font-bold text-white text-lg mb-4">{title}</h3>
                </div>
                <div className="flex justify-between items-end mt-4 border-t border-gray-600 pt-4">
                    <div className="text-center"><p className="text-sm text-gray-400">Virality</p><p className={`font-extrabold text-2xl ${getScoreColor(scores.virality)}`}>{scores.virality ?? 'N/A'}</p></div>
                    <div className="text-center"><p className="text-sm text-gray-400">Originality</p><p className={`font-extrabold text-2xl ${getScoreColor(scores.originality)}`}>{scores.originality ?? 'N/A'}</p></div>
                    <div className="text-center"><p className="text-sm text-gray-400">Monetizability</p><p className={`font-extrabold text-2xl ${getScoreColor(scores.monetizability)}`}>{scores.monetizability ?? 'N/A'}</p></div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ setCurrentPage, db, user, onProjectSelect, onStartNewProject, userTier, usage }) => {
  const [projects, setProjects] = useState([]);
  const [appId] = useState('roblox-analyzer');
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      const q = collection(db, `artifacts/${appId}/users/${user.uid}/projects`);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const projectsArray = [];
        querySnapshot.forEach((doc) => {
          projectsArray.push({ id: doc.id, ...doc.data() });
        });
        projectsArray.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setProjects(projectsArray);
      });
      return () => unsubscribe();
    }
  }, [db, user, appId]);

  const filteredProjects = projects.filter(project =>
    project.idea.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 text-gray-200 text-center bg-gray-900 animate-fadeIn">
      <div className="w-full max-w-6xl p-6 sm:p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 space-y-8">
        <div className="flex items-center justify-center space-x-4">
          <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">My Workspace</h1>
        </div>
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">Welcome back! Here you can manage your ideas and start a new project.</p>
        
        <div className="w-full max-w-md mx-auto bg-gray-700 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-white">Monthly Usage</span>
                <span className="text-gray-400">{usage.count} / {usage.limit}</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2.5">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${(usage.count / usage.limit) * 100}%` }}></div>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button onClick={onStartNewProject} className="w-full sm:w-auto px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 flex items-center justify-center space-x-2"><PlusCircle className="h-6 w-6" /><span>Analyze an Idea</span></button>
            <button onClick={() => setCurrentPage('generator')} className="w-full sm:w-auto px-8 py-4 bg-gray-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 flex items-center justify-center space-x-2"><Lightbulb className="h-6 w-6" /><span>Generate an Idea</span></button>
        </div>

        <div className="w-full max-w-lg mx-auto">
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4"><Search className="h-5 w-5 text-gray-400" /></span>
                <input type="text" placeholder="Search by keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-4 pl-12 text-white bg-gray-700 border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors" />
            </div>
        </div>

        <div className="w-full text-left">
          {projects.length > 0 ? (
            filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} onProjectSelect={onProjectSelect} showConfirmationModal={showConfirmationModal} />
                    ))}
                </div>
            ) : (
                <div className="text-center bg-gray-700 p-10 rounded-2xl border border-gray-600">
                    <p className="text-gray-300 font-semibold">No Projects Found</p>
                    <p className="text-gray-400">No projects matched your search for "{searchQuery}".</p>
                </div>
            )
          ) : (
            <div className="text-center bg-gray-700 p-10 rounded-2xl border border-gray-600">
                <p className="text-gray-400">You currently have no projects.</p>
                <p className="text-gray-400 mb-4">Click the button above to get started!</p>
            </div>
          )}
        </div>
      </div>
      {isConfirmationModalOpen && (
        <ConfirmationModal message="Are you sure you want to delete this project? This action cannot be undone." onConfirm={handleDeleteProject} onCancel={() => setIsConfirmationModalOpen(false)} />
      )}
    </div>
  );
};

export default Dashboard;
