// src/App.jsx
import { useState } from 'react';
import { STATUS_COLORS, PROBLEM_LISTS } from './constants';
import Editor from './Editor';

function App() {
  const [activeList, setActiveList] = useState('CF 1600');
  const [view, setView] = useState('dashboard');
  const [activeProblem, setActiveProblem] = useState(null);
  
  // FIXED: Moved state and fetch logic inside the component
  const [expandedProblem, setExpandedProblem] = useState(null);
  const [problemHtml, setProblemHtml] = useState("");

  const toggleProblem = async (id) => {
    if (expandedProblem === id) {
      setExpandedProblem(null);
      return;
    }
    
    setExpandedProblem(id);
    
    // Injecting a mock DOM to bypass Cloudflare for prototype testing
    setProblemHtml(`
      <div class="problem-statement">
        <div class="header">
          <div class="title">E. Team Work</div>
          <div class="time-limit"><div class="property-title">time limit per test:</div>2 seconds</div>
          <div class="memory-limit"><div class="property-title">memory limit per test:</div>256 megabytes</div>
        </div>
        <div>
          <p>You have a team of <span class="tex-span">N</span> people. For a particular task, you can pick any non-empty subset of people. The cost of having <span class="tex-span">X</span> people for the task is <span class="tex-span">X^k</span>.</p>
          <p>Output the sum of costs over all non-empty subsets of people modulo <span class="tex-span">10^9 + 7</span>.</p>
        </div>
        <div class="section-title">Input</div>
        <p>Only line of input contains two integers <span class="tex-span">N (1 &le; N &le; 10^9)</span> representing total number of people and <span class="tex-span">k (1 &le; k &le; 5000)</span>.</p>
        
        <div class="sample-test">
          <div class="input">
            <div class="title">Input</div>
            <pre>1 1</pre>
          </div>
          <div class="output">
            <div class="title">Output</div>
            <pre>1</pre>
          </div>
        </div>
      </div>
    `);
  };

  const openEditor = (problem) => {
    setActiveProblem(problem);
    setView('editor');
  };

  if (view === 'editor') {
    return <Editor problemId={activeProblem} goBack={() => setView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500">
      <div className="sticky top-0 bg-gray-800 p-3 shadow-md z-10 flex justify-center">
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

      <div className="pb-20">
        {PROBLEM_LISTS[activeList].map((p, i) => {
          const status = 'Unread'; 
          
          return (
            <div key={p.id} className="border-b border-gray-700 p-2 flex flex-col">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openEditor(p.id)}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded font-mono border border-gray-600"
                >
                  E
                </button>
                
                <a 
                  href={`https://codeforces.com/contest/${p.id.slice(0, -1)}/problem/${p.id.slice(-1)}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-gray-700 px-2 py-1 rounded text-sm text-gray-300"
                >
                  {i}
                </a>

                <button 
                  onClick={() => toggleProblem(p.id)}
                  className="flex-1 text-left truncate px-2 font-medium hover:text-blue-400 transition-colors"
                >
                  {p.name}
                </button>

                <button className={`px-2 py-1 rounded text-xs border border-gray-600 ${STATUS_COLORS[status]}`}>
                  {status}
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between px-1">
                <input 
                  type="text" 
                  placeholder="Type your observations here..."
                  className="bg-transparent outline-none text-gray-400 text-sm italic w-full"
                />
                <button className="text-gray-400 px-2">↓</button>
              </div>
              
              {expandedProblem === p.id && (
                <div 
                  className="mt-3 p-3 bg-gray-800 rounded-md border border-gray-700 cf-problem text-sm overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: problemHtml }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;