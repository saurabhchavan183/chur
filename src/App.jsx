import { useState } from 'react';
import { STATUS_COLORS, PROBLEM_LISTS } from './constants';
import Editor from './Editor';

// MUST BE YOUR LAPTOP'S LOCAL IP SO YOUR PHONE CAN REACH IT
const BACKEND_URL = "https://chur-backend.onrender.com/"; 

function App() {
  const [activeList, setActiveList] = useState('CF 1600');
  const [view, setView] = useState('dashboard');
  const [activeProblem, setActiveProblem] = useState(null);
  const [expandedProblem, setExpandedProblem] = useState(null);
  const [problemHtml, setProblemHtml] = useState("");
  const [problemStatuses, setProblemStatuses] = useState({});
  
  const STATUS_CYCLE = ['Unread', 'Blank', 'Think', 'Ready', 'Done'];

  const toggleStatus = (id) => {
    setProblemStatuses(prev => {
      const currentStatus = prev[id] || 'Unread';
      const nextIndex = (STATUS_CYCLE.indexOf(currentStatus) + 1) % STATUS_CYCLE.length;
      return { ...prev, [id]: STATUS_CYCLE[nextIndex] };
    });
  };

  const toggleProblem = async (p) => {
    if (expandedProblem === p.id) {
      setExpandedProblem(null);
      return;
    }
    setExpandedProblem(p.id);
    
    // 1. Check LocalStorage First
    const cachedData = localStorage.getItem(`cf_prob_${p.id}`);
    if (cachedData) {
      setProblemHtml(JSON.parse(cachedData).html);
      if (window.MathJax) setTimeout(() => window.MathJax.typesetPromise(), 100);
      return;
    }

    // 2. Fetch from Backend if not cached
    setProblemHtml("<div class='p-4 text-center text-gray-400'>Loading problem from Codeforces...</div>");
    try {
      const contestId = p.id.match(/^\d+/)[0]; 
      const index = p.id.replace(/^\d+/, ''); 
      
      const res = await fetch(`${BACKEND_URL}/api/problem/${contestId}/${index}`);
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      localStorage.setItem(`cf_prob_${p.id}`, JSON.stringify(data));
      setProblemHtml(data.html);
      
      if (window.MathJax) setTimeout(() => window.MathJax.typesetPromise(), 100);
    } catch (err) {
      setProblemHtml(`<div class='p-4 text-center text-red-400'>Error loading problem. Is the backend running?</div>`);
    }
  };

  const openEditor = (problem) => {
    setActiveProblem(problem);
    setView('editor');
  };

  if (view === 'editor') {
    return (
      <Editor 
        problemId={activeProblem?.id} 
        problemName={activeProblem?.name} 
        goBack={() => setView('dashboard')} 
      />
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-900 text-white font-sans selection:bg-blue-500">
      <div className="shrink-0 bg-gray-800 p-3 shadow-md z-10 flex justify-center border-b border-gray-700">
        <select 
          className="bg-transparent text-xl font-bold text-center outline-none cursor-pointer appearance-none"
          value={activeList}
          onChange={(e) => setActiveList(e.target.value)}
        >
          {Object.keys(PROBLEM_LISTS).map(listName => (
            <option key={listName} value={listName} className="bg-gray-800 text-white">
              {listName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {PROBLEM_LISTS[activeList].map((p, i) => {
          const status = problemStatuses[p.id] || 'Unread'; 
          return (
            <div key={p.id} className="border-b border-gray-700 p-2 flex flex-col">
              <div className="flex items-center gap-2">
                <button onClick={() => openEditor(p)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded font-mono border border-gray-600">E</button>
                <a href={`https://codeforces.com/contest/${p.id.match(/^\d+/)[0]}/problem/${p.id.replace(/^\d+/, '')}`} target="_blank" rel="noreferrer" className="bg-gray-700 px-2 py-1 rounded text-sm text-gray-300">{i}</a>
                <button onClick={() => toggleProblem(p)} className="flex-1 text-left truncate px-2 font-medium hover:text-blue-400 transition-colors">{p.name}</button>
                <button onClick={() => toggleStatus(p.id)} className={`px-2 py-1 rounded text-xs border border-gray-600 min-w-[60px] ${STATUS_COLORS[status] || 'text-gray-400'}`}>{status}</button>
              </div>

              <div className="mt-2 flex items-center justify-between px-1">
                <input type="text" placeholder="Type your observations here..." className="bg-transparent outline-none text-gray-400 text-sm italic w-full" />
                <button className="text-gray-400 px-2">↓</button>
              </div>
              
              {expandedProblem === p.id && (
                <div className="mt-3 p-3 bg-gray-800 rounded-md border border-gray-700 cf-problem text-sm overflow-x-auto" dangerouslySetInnerHTML={{ __html: problemHtml }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;