import { useState, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { undo, redo, history } from '@codemirror/commands';

export default function Editor({ problemId, goBack }) {
  const [code, setCode] = useState("");
  const [activeLayer, setActiveLayer] = useState('alphabets');
  const [editorView, setEditorView] = useState(null);
  const [isCaps, setIsCaps] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const delInt = useRef(null);
  const delTo = useRef(null);

  const vibrate = () => { if (navigator.vibrate) navigator.vibrate(40); };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      textArea.remove();
    }
  };

  const handleUndo = () => { vibrate(); if (editorView) undo(editorView); };
  const handleRedo = () => { vibrate(); if (editorView) redo(editorView); };
  
  const handleCopy = () => { 
    vibrate(); 
    copyToClipboard(code);
    alert("Code copied to clipboard!");
  };
  
  const handleDownload = () => {
    vibrate();
    try {
      const element = document.createElement("a");
      const file = new Blob([code], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${problemId || 'solution'}.py`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      alert("Download failed. Your browser might block local downloads.");
    }
  };

  const handleSubmitPopUp = () => {
    vibrate();
    copyToClipboard(code);
    setShowSubmit(true);
  };

  const insertText = (t) => {
    vibrate();
    if (!editorView) return;
    const { state, dispatch } = editorView;
    const sel = state.selection.main;

    // Active Dedenting
    if (t === ':') {
      const line = state.doc.lineAt(sel.from);
      const trimmed = line.text.trim();
      if (['else', 'elif', 'except', 'finally'].includes(trimmed)) {
        const currentIndent = line.text.match(/^\s*/)[0].length;
        if (currentIndent >= 4) {
          dispatch({
            changes: [
              { from: line.from, to: line.from + 4, insert: '' },
              { from: sel.from, to: sel.to, insert: ':' }
            ],
            selection: { anchor: sel.from - 4 + 1 }
          });
          if (!editorView.hasFocus) editorView.focus();
          return;
        }
      }
    }

    // Auto-closing brackets and quotes
    if (['(', '[', '{', '"', "'"].includes(t)) {
      const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
      dispatch({
        changes: { from: sel.from, to: sel.to, insert: t + pairs[t] },
        selection: { anchor: sel.from + 1 } // Places cursor exactly inside the brackets
      });
      if (!editorView.hasFocus) editorView.focus();
      return;
    }

    dispatch({ changes: { from: sel.from, to: sel.to, insert: t }, selection: { anchor: sel.from + t.length } });
    if (!editorView.hasFocus) editorView.focus();
  };

  const insertBuiltin = (w) => {
    vibrate();
    if (!editorView) return;
    const { state, dispatch } = editorView;
    const sel = state.selection.main;
    dispatch({ changes: { from: sel.from, to: sel.to, insert: `${w}()` }, selection: { anchor: sel.from + w.length + 1 } });
    setActiveLayer('alphabets');
    if (!editorView.hasFocus) editorView.focus();
  };

  const insertImportAndWord = (w, m, nB) => {
    vibrate();
    if (!editorView) return;
    const { state, dispatch } = editorView;
    const docText = state.doc.toString();
    const sel = state.selection.main;
    let pre = m ? `${m}.` : '';
    let bC = state.doc.sliceString(Math.max(0, sel.from - pre.length), sel.from);
    let nP = m && bC !== pre;
    let iT = nB ? w : (nP ? `${pre}${w}()` : `${w}()`);
    let ch = [{ from: sel.from, to: sel.to, insert: iT }];
    let sh = 0; 
    if (m) {
      const re = new RegExp(`^from\\s+${m}\\s+import\\s+(.*)$`, 'm');
      const mt = docText.match(re);
      if (mt) {
        const cI = mt[1].split(',').map(s => s.trim());
        if (!cI.includes(w)) {
          const lE = mt.index + mt[0].length;
          const iT2 = `, ${w}`;
          ch.push({ from: lE, to: lE, insert: iT2 });
          if (lE <= sel.from) sh += iT2.length; 
        }
      } else {
        const iT3 = `from ${m} import ${w}\n`;
        ch.push({ from: 0, to: 0, insert: iT3 });
        if (0 <= sel.from) sh += iT3.length;
      }
    }
    const nA = sel.from + sh + iT.length - (nB ? 0 : 1);
    dispatch({ changes: ch, selection: { anchor: nA } });
    setActiveLayer('alphabets');
    if (!editorView.hasFocus) editorView.focus();
  };

  const insertSnippet = (t) => {
    vibrate();
    if (!editorView) return;
    const { state, dispatch } = editorView;
    const sel = state.selection.main;
    let idx = t.indexOf('\\');
    let str = t.replace('\\', '');
    let nA = sel.from + (idx !== -1 ? idx : str.length);
    dispatch({ changes: { from: sel.from, to: sel.to, insert: str }, selection: { anchor: nA } });
    setActiveLayer('alphabets');
    if (!editorView.hasFocus) editorView.focus();
  };

  const handleAction = (a) => {
    if (!editorView) return;
    const { state, dispatch } = editorView;
    const sel = state.selection.main;
    if (a === 'delete') {
      if (sel.empty && sel.from > 0) dispatch({ changes: { from: sel.from - 1, to: sel.to, insert: '' } });
      else if (!sel.empty) dispatch({ changes: { from: sel.from, to: sel.to, insert: '' } });
    } else if (a === 'enter') {
      vibrate();
      const line = state.doc.lineAt(sel.from);
      const text = line.text;
      const stripped = text.split('#')[0].trimEnd();
      const currentIndent = text.match(/^\s*/)[0].length;
      let newIndent = currentIndent;
      if (stripped.endsWith(':') || stripped.endsWith('\\')) {
        newIndent += 4;
      } else {
        const openB = (stripped.match(/[\(\[\{]/g) || []).length;
        const closeB = (stripped.match(/[\)\]\}]/g) || []).length;
        if (openB > closeB) newIndent += 4;
        else if (/^(return|break|continue|pass|raise)(\s|$)/.test(text.trim())) newIndent = Math.max(0, currentIndent - 4);
      }
      insertText('\n' + ' '.repeat(newIndent));
    } else if (a === 'space') insertText(' ');
    else if (a === 'tab') insertText('    ');
    else if (a === 'shifttab') {
      vibrate();
      const line = state.doc.lineAt(sel.from);
      if (line.text.startsWith('    ') && sel.from >= line.from + 4) dispatch({ changes: { from: line.from, to: line.from + 4, insert: '' } });
    }
    if (!editorView.hasFocus) editorView.focus();
  };

  const startDel = () => {
    handleAction('delete');
    vibrate();
    delTo.current = setTimeout(() => {
      delInt.current = setInterval(() => { handleAction('delete'); vibrate(); }, 75); 
    }, 350); 
  };
  const stopDel = () => { clearTimeout(delTo.current); clearInterval(delInt.current); };

  const moveCursor = (dir) => {
    vibrate();
    if (!editorView) return;
    const { state, dispatch } = editorView;
    const sel = state.selection.main;
    const newPos = dir === 'left' ? Math.max(0, sel.from - 1) : Math.min(state.doc.length, sel.from + 1);
    dispatch({ selection: { anchor: newPos } });
    if (!editorView.hasFocus) editorView.focus();
  };

  const LAYERS = [
    { id: 'alphabets', label: 'q' }, { id: 'symbols', label: '&' }, { id: 'keywords', label: 'K' },
    { id: 'builtins', label: '()' }, { id: 'imports', label: '√' }, { id: 'snippets', label: '=' }
  ];

  const KEYWORDS = [
    ['if', 'else', 'elif', 'while'], ['for', 'in', 'and', 'or', 'not'], ['def', 'return', 'import', 'from'],
    ['as', 'is', 'None', 'True', 'False'], ['break', 'continue', 'pass']
  ];

  const BUILTINS = [
    ['print', 'input', 'range', 'enumerate'], ['len', 'list', 'set', 'dict', 'map'], ['sum', 'min', 'max', 'abs', 'sorted'],
    ['int', 'str', 'float', 'ord', 'chr'], ['zip', 'reversed', 'filter', 'any', 'all']
  ];

  const IMPORTS_ROWS = [
    [ { w: 'gcd', m: 'math', c: 'bg-purple-700' }, { w: 'lcm', m: 'math', c: 'bg-purple-700' }, { w: 'isqrt', m: 'math', c: 'bg-purple-700' }, { w: 'sqrt', m: 'math', c: 'bg-purple-700' }, { w: 'ceil', m: 'math', c: 'bg-purple-700' }, { w: 'floor', m: 'math', c: 'bg-purple-700' }, { w: 'comb', m: 'math', c: 'bg-purple-700' }, { w: 'perm', m: 'math', c: 'bg-purple-700' }, { w: 'factorial', m: 'math', c: 'bg-purple-700' }, { w: 'dict', c: 'bg-blue-700' }, { w: 'get', c: 'bg-blue-700' }, { w: 'keys', c: 'bg-blue-700' }, { w: 'values', c: 'bg-blue-700' }, { w: 'items', c: 'bg-blue-700' }, { w: 'update', c: 'bg-blue-700' } ],
    [ { w: 'list', c: 'bg-green-700' }, { w: 'sort', c: 'bg-green-700' }, { w: 'append', c: 'bg-green-700' }, { w: 'insert', c: 'bg-green-700' }, { w: 'pop', c: 'bg-green-700' }, { w: 'remove', c: 'bg-green-700' }, { w: 'reverse', c: 'bg-green-700' }, { w: 'count', c: 'bg-green-700' }, { w: 'index', c: 'bg-green-700' }, { w: 'heappush', m: 'heapq', c: 'bg-orange-700' }, { w: 'heappop', m: 'heapq', c: 'bg-orange-700' }, { w: 'heapify', m: 'heapq', c: 'bg-orange-700' } ],
    [ { w: 'set', c: 'bg-teal-700' }, { w: 'add', c: 'bg-teal-700' }, { w: 'discard', c: 'bg-teal-700' }, { w: 'clear', c: 'bg-teal-700' }, { w: 'issubset', c: 'bg-teal-700' }, { w: 'issuperset', c: 'bg-teal-700' }, { w: 'deque', m: 'collections', c: 'bg-indigo-700' }, { w: 'appendleft', c: 'bg-indigo-700' }, { w: 'popleft', c: 'bg-indigo-700' }, { w: 'rotate', c: 'bg-indigo-700' } ],
    [ { w: 'bisect_left', m: 'bisect', c: 'bg-pink-700' }, { w: 'bisect_right', m: 'bisect', c: 'bg-pink-700' }, { w: 'insort', m: 'bisect', c: 'bg-pink-700' }, { w: 'Counter', m: 'collections', c: 'bg-rose-700' }, { w: 'most_common', c: 'bg-rose-700' }, { w: 'defaultdict', m: 'collections', c: 'bg-amber-700' }, { w: 'list', c: 'bg-amber-700', noBracket: true }, { w: 'int', c: 'bg-amber-700', noBracket: true }, { w: 'set', c: 'bg-amber-700', noBracket: true } ],
    [ { w: 'permutations', m: 'itertools', c: 'bg-cyan-700' }, { w: 'combinations', m: 'itertools', c: 'bg-cyan-700' }, { w: 'combinations_with_replacement', m: 'itertools', c: 'bg-cyan-700' }, { w: 'product', m: 'itertools', c: 'bg-cyan-700' }, { w: 'accumulate', m: 'itertools', c: 'bg-cyan-700' }, { w: 'chain', m: 'itertools', c: 'bg-cyan-700' }, { w: 'groupby', m: 'itertools', c: 'bg-cyan-700' } ]
  ];

  const SNIPPETS = [
    [ { t: 't=int(input())', c: 'bg-red-700' }, { t: 'for i in range(\\):', c: 'bg-orange-700' } ],
    [ { t: 'for _ in range(t):', c: 'bg-amber-700' }, { t: 'for z in \\:', c: 'bg-green-700' } ],
    [ { t: 'for i,z in enumerate(\\):', c: 'bg-teal-700' } ],
    [ { t: 'map(int, input().split())', c: 'bg-blue-700' } ],
    [ { t: 'list(map(int, input().split()))', c: 'bg-indigo-700' } ]
  ];

  const btnClass = "flex items-center justify-center bg-gray-700 rounded-xl active:bg-gray-500 font-mono text-2xl shadow-sm text-gray-100 h-[48px]";
  const btnRowClass = "flex justify-center gap-2 w-full";

  return (
    <div className="fixed top-0 left-0 w-full h-[100dvh] flex flex-col bg-gray-900 text-white z-50">
      
      {showSubmit && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-green-400">Code Copied!</h2>
            <p className="text-gray-300 mb-2 text-sm">Code has been copied to clipboard.</p>
            <p className="text-gray-300 mb-4 text-sm">On the submit page you have to:</p>
            <ol className="list-decimal pl-5 text-gray-300 text-sm space-y-2 mb-6">
              <li>Select Problem name: <span className="font-mono text-blue-400">{problemId}</span></li>
              <li>Language: <span className="font-bold text-white">PyPy 3</span></li>
              <li>Paste the code & submit</li>
            </ol>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSubmit(false)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Back</button>
              <a 
                href={`https://codeforces.com/contest/${problemId.slice(0, -1)}/submit`} 
                target="_blank" 
                rel="noreferrer"
                onClick={() => setShowSubmit(false)} 
                className="px-4 py-2 bg-blue-600 rounded text-white font-bold hover:bg-blue-500"
              >
                Submit
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="shrink-0 flex items-center justify-between bg-gray-800 p-2 border-b border-gray-700 text-xl font-bold w-full">
        <button onClick={() => { vibrate(); goBack(); }} className="px-2 py-1 bg-gray-700 rounded text-sm">←</button>
        <button className="px-2 text-gray-400 active:text-white" onClick={handleUndo}>↶</button>
        <button className="px-2 text-gray-400 active:text-white" onClick={handleRedo}>↷</button>
        <button className="px-2 text-green-400" onClick={() => vibrate()}>▶</button>
        <button className="px-2 text-gray-400 active:text-white" onClick={handleCopy}>⧉</button>
        <button className="px-2 text-gray-400 active:text-white" onClick={handleDownload}>↓</button>
        <button className="px-2 text-blue-400 font-mono text-sm uppercase" onClick={handleSubmitPopUp}>Submit</button>
      </div>

      <div className="flex-1 w-full overflow-y-auto text-lg" onClick={() => vibrate()}>
        <CodeMirror value={code} height="100%" theme={vscodeDark} extensions={[python(), history()]} onCreateEditor={(view) => { view.contentDOM.setAttribute('inputmode', 'none'); setEditorView(view); }} onChange={(val) => setCode(val)} className="h-full" />
      </div>

      <div className="shrink-0 bg-gray-950 border-t border-gray-700 flex flex-col pb-2 select-none w-full">
        <div className="flex justify-between bg-gray-900 p-1 mb-2 w-full h-[44px]">
          {LAYERS.map((layer) => (
            <button key={layer.id} onClick={() => { vibrate(); setActiveLayer(layer.id); }} className={`flex-1 mx-0.5 text-center rounded font-mono text-base font-bold transition-colors flex items-center justify-center ${activeLayer === layer.id ? 'bg-gray-600 text-white shadow-inner' : 'bg-gray-800 border border-gray-700 text-gray-400'}`}>
              {layer.label}
            </button>
          ))}
        </div>

        <div className="px-2 flex flex-col gap-3 pb-1 w-full">
          {activeLayer === 'alphabets' && (
            <>
              <div className={btnRowClass}>
                {['0','1','2','3','4','5','6','7','8','9'].map(char => ( <button key={char} onClick={() => insertText(char)} style={{ flex: 1 }} className={btnClass}>{char}</button> ))}
              </div>
              <div className={btnRowClass}>
                {['q','w','e','r','t','y','u','i','o','p'].map(char => {
                  const c = isCaps ? char.toUpperCase() : char;
                  return <button key={char} onClick={() => insertText(c)} style={{ flex: 1 }} className={btnClass}>{c}</button>;
                })}
              </div>
              <div className={btnRowClass}>
                <div style={{ flex: 0.5 }}></div>
                {['a','s','d','f','g','h','j','k','l'].map(char => {
                  const c = isCaps ? char.toUpperCase() : char;
                  return <button key={char} onClick={() => insertText(c)} style={{ flex: 1 }} className={btnClass}>{c}</button>;
                })}
                <div style={{ flex: 0.5 }}></div>
              </div>
              <div className={btnRowClass}>
                <button style={{ flex: 1.5 }} className={`text-xl ${isCaps ? 'bg-blue-600' : 'bg-gray-600'} ${btnClass}`} onClick={() => { vibrate(); setIsCaps(!isCaps); }}>⇧</button>
                {['z','x','c','v','b','n','m'].map(char => {
                  const c = isCaps ? char.toUpperCase() : char;
                  return <button key={char} onClick={() => insertText(c)} style={{ flex: 1 }} className={btnClass}>{c}</button>;
                })}
                <button onPointerDown={startDel} onPointerUp={stopDel} onPointerLeave={stopDel} style={{ flex: 1.5 }} className={`text-xl bg-gray-600 ${btnClass}`}>⌫</button>
              </div>
              <div className={btnRowClass}>
                <button onClick={() => moveCursor('left')} style={{ flex: 1.25 }} className={`bg-gray-600 ${btnClass}`}>←</button>
                <button onClick={() => moveCursor('right')} style={{ flex: 1.25 }} className={`bg-gray-600 ${btnClass}`}>→</button>
                <button onClick={() => insertText(':')} style={{ flex: 1 }} className={btnClass}>:</button>
                <button onClick={() => handleAction('space')} style={{ flex: 3 }} className={btnClass}></button>
                <button onClick={() => insertText(',')} style={{ flex: 1 }} className={btnClass}>,</button>
                <button onClick={() => insertText('.')} style={{ flex: 1 }} className={btnClass}>.</button>
                <button onClick={() => handleAction('enter')} style={{ flex: 1.5 }} className={`bg-blue-600 active:bg-blue-500 ${btnClass}`}>↵</button>
              </div>
            </>
          )}

          {activeLayer === 'symbols' && (
            <>
              <div className={btnRowClass}>
                {['0','1','2','3','4','5','6','7','8','9'].map(char => ( <button key={char} onClick={() => insertText(char)} style={{ flex: 1 }} className={btnClass}>{char}</button> ))}
              </div>
              <div className={btnRowClass}>
                {['&','|','^','~','<','>',"'",'"','\\','#'].map(char => ( <button key={char} onClick={() => insertText(char)} style={{ flex: 1 }} className={btnClass}>{char}</button> ))}
              </div>
              <div className={btnRowClass}>
                {['=','==','!=','+','-','*','/','//','%','**'].map(char => ( <button key={char} onClick={() => insertText(char)} style={{ flex: 1 }} className={btnClass}>{char}</button> ))}
              </div>
              <div className={btnRowClass}>
                <button onClick={() => handleAction('shifttab')} style={{ flex: 1.25 }} className={`text-sm bg-gray-600 ${btnClass}`}>⇤</button>
                <button onClick={() => handleAction('tab')} style={{ flex: 1.25 }} className={`text-sm bg-gray-600 ${btnClass}`}>⇥</button>
                {['(',')','[',']','{','}'].map(char => ( <button key={char} onClick={() => insertText(char)} style={{ flex: 1 }} className={btnClass}>{char}</button> ))}
                <button onPointerDown={startDel} onPointerUp={stopDel} onPointerLeave={stopDel} style={{ flex: 1.5 }} className={`text-xl bg-gray-600 ${btnClass}`}>⌫</button>
              </div>
              <div className={btnRowClass}>
                <button onClick={() => moveCursor('left')} style={{ flex: 1.25 }} className={`bg-gray-600 ${btnClass}`}>←</button>
                <button onClick={() => moveCursor('right')} style={{ flex: 1.25 }} className={`bg-gray-600 ${btnClass}`}>→</button>
                <button onClick={() => insertText('_')} style={{ flex: 1 }} className={btnClass}>_</button>
                <button onClick={() => handleAction('space')} style={{ flex: 3 }} className={btnClass}></button>
                <button onClick={() => insertText('@')} style={{ flex: 1 }} className={btnClass}>@</button>
                <button onClick={() => insertText('?')} style={{ flex: 1 }} className={btnClass}>?</button>
                <button onClick={() => handleAction('enter')} style={{ flex: 1.5 }} className={`bg-blue-600 active:bg-blue-500 ${btnClass}`}>↵</button>
              </div>
            </>
          )}

          {activeLayer === 'keywords' && KEYWORDS.map((row, i) => (
            <div key={i} className={btnRowClass}>
              {row.map(w => ( <button key={w} onClick={() => insertText(w + ' ')} style={{ flex: 1 }} className={`text-xl font-medium ${btnClass}`}>{w}</button> ))}
            </div>
          ))}

          {activeLayer === 'builtins' && BUILTINS.map((row, i) => (
            <div key={i} className={btnRowClass}>
              {row.map(w => ( <button key={w} onClick={() => insertBuiltin(w)} style={{ flex: 1 }} className={`text-lg font-medium ${btnClass}`}>{w}</button> ))}
            </div>
          ))}

          {activeLayer === 'imports' && (
            <div className="flex flex-col gap-3 overflow-x-auto touch-pan-x w-full max-w-[100vw] pb-1">
              {IMPORTS_ROWS.map((row, i) => (
                <div key={i} className="flex gap-2 w-max">
                  {row.map(btn => ( <button key={btn.w} onClick={() => insertImportAndWord(btn.w, btn.m, btn.noBracket)} className={`h-[48px] flex items-center justify-center px-5 rounded-xl active:opacity-80 shadow-sm font-mono text-lg font-medium text-gray-100 shrink-0 ${btn.c}`}>{btn.w}</button> ))}
                </div>
              ))}
            </div>
          )}

          {activeLayer === 'snippets' && SNIPPETS.map((row, i) => (
            <div key={i} className="flex gap-2 w-full">
              {row.map(s => ( <button key={s.t} onClick={() => insertSnippet(s.t)} style={{ flex: 1 }} className={`h-[48px] flex items-center justify-center rounded-xl active:opacity-80 shadow-sm font-mono text-sm font-medium text-gray-100 ${s.c}`}>{s.t}</button> ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}