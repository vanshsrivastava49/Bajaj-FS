import React, { useState, useEffect, useRef } from 'react';
import { Network, Play, AlertCircle, CheckCircle2, ChevronRight, Share2, Activity, ShieldAlert, Code2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DEFAULT_TEST_CASE = `["A->B", "A->C", "B->D", "C->E", "E->F", "X->Y", "Y->Z", "Z->X", "P->Q", "Q->R", "G->H", "G->H", "G->I", "hello", "1->2", "A->"]`;

const HERO_PHRASES = [
  "Analyze Hierarchies.",
  "Detect Cycles.",
  "Process Data Fast.",
  "Build Trees.",
];

// Recursive Tree Node Visualizer
function NodeVisualizer({ label, subNodes, currentDepth = 0 }) {
  const [isOpen, setIsOpen] = useState(true);
  const isBranch = subNodes && Object.keys(subNodes).length > 0;
  const paddingLeft = currentDepth * 24;

  return (
    <div style={{ marginLeft: `${paddingLeft}px`, marginTop: '8px' }} className="animate-fade">
      <div
        onClick={() => isBranch && setIsOpen(!isOpen)}
        className={`node-row ${isBranch ? 'cursor-pointer' : ''}`}
      >
        <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
          {isBranch && (
            <span className="node-arrow" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          )}
        </div>
        
        <span className={`node-circle depth-${Math.min(currentDepth, 2)}`}>
          {label}
        </span>
        {currentDepth === 0 && <span className="node-root-badge">Root</span>}
      </div>
      
      {isOpen && isBranch && (
        <div className="node-children-container">
          {Object.entries(subNodes).map(([key, val]) => (
            <NodeVisualizer key={key} label={key} subNodes={val} currentDepth={currentDepth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// Card for Each Hierarchy
function DataCard({ dataObj, index }) {
  const isCycle = dataObj.has_cycle === true;
  const childrenList = dataObj.tree && !isCycle ? Object.entries(dataObj.tree) : [];

  return (
    <div className={`result-card ${isCycle ? 'cycle' : 'valid'}`}>
      <div className="result-header">
        <div className={`result-avatar ${isCycle ? 'bg-red' : 'bg-teal'}`}>
          {dataObj.root}
        </div>
        <div>
          <div className="result-title">Hierarchy Structure #{index + 1}</div>
          <div style={{ marginTop: '4px' }}>
            {isCycle ? (
              <span className="tag-cycle"><Activity size={12} /> Cyclic Group Detected</span>
            ) : (
              <span className="tag-valid"><Share2 size={12} /> Max Depth: {dataObj.depth}</span>
            )}
          </div>
        </div>
      </div>
      
      {!isCycle && childrenList.length > 0 ? (
        <div className="tree-container">
          {childrenList.map(([k, v]) => <NodeVisualizer key={k} label={k} subNodes={v} currentDepth={0} />)}
        </div>
      ) : isCycle ? (
        <div className="cycle-container">
          Cyclic groups form infinite loops and cannot be rendered as a tree.
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const [inputText, setInputText] = useState(DEFAULT_TEST_CASE);
  const [serverData, setServerData] = useState(null);
  const [clientError, setClientError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState('visual');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseState, setPhraseState] = useState("visible");
  const anchorRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseState("exit");
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % HERO_PHRASES.length);
        setPhraseState("enter");
        requestAnimationFrame(() => requestAnimationFrame(() => setPhraseState("visible")));
      }, 340);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const executeRequest = async () => {
    setClientError('');
    setServerData(null);
    setIsLoading(true);
    try {
      let parsed;
      try { parsed = JSON.parse(inputText); } 
      catch { throw new Error('Invalid JSON format. Please check your syntax.'); }
      
      const payload = Array.isArray(parsed) ? { data: parsed } : parsed;
      if (!Array.isArray(payload.data)) throw new Error('Payload must contain a "data" array.');

      const res = await fetch(`${API_BASE_URL}/bfhl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`API Connection Failed (Status: ${res.status})`);
      const responseJson = await res.json();
      if (responseJson.error) throw new Error(responseJson.error);

      setServerData(responseJson);
      setTab('visual');
      setTimeout(() => anchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } catch (err) {
      setClientError(err.message || 'Failed to connect to the backend.');
    } finally {
      setIsLoading(false);
    }
  };
  const statBlock = serverData?.summary;
  const treeList = serverData?.hierarchies || [];
  const badInputs = serverData?.invalid_entries || [];
  const duplicateInputs = serverData?.duplicate_edges || [];
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; overflow-x: hidden; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes phraseSlideOutUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-40px); } }
        @keyframes phraseSlideInUp  { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .animate-fade { animation: fadeUp 0.4s ease forwards; }
        
        /* Navbar */
        .navbar { background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #e2e8f0; padding: 16px 48px; position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 12px; }
        .nav-logo { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;}
        .nav-logo svg { color: #0d9488; }

        /* Hero Section */
        .hero-section { background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #ecfdf5 100%); padding: 100px 48px; position: relative; overflow: hidden; text-align: center; }
        .hero-section::before { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 70%); top: -200px; left: -100px; pointer-events: none; }
        .hero-section::after { content: ''; position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%); bottom: -150px; right: -50px; pointer-events: none; }
        
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: white; border: 1.5px solid #99f6e4; color: #0f766e; font-size: 13px; font-weight: 700; padding: 6px 16px; border-radius: 50px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(13,148,136,0.1); position: relative; z-index: 2; }
        .hero-title { font-size: 56px; font-weight: 900; color: #0f172a; margin-bottom: 16px; letter-spacing: -2px; line-height: 1.1; display: flex; align-items: baseline; justify-content: center; flex-wrap: wrap; position: relative; z-index: 2; }
        .hero-title-static { margin-right: 14px; }
        .hero-title-clip { display: inline-flex; overflow: hidden; height: 1.2em; align-items: flex-end; position: relative; color: #0d9488; }
        
        .hero-phrase { display: inline-block; white-space: nowrap; will-change: transform, opacity; }
        .hero-phrase.state-visible { opacity: 1; transform: translateY(0); }
        .hero-phrase.state-exit { animation: phraseSlideOutUp 0.3s cubic-bezier(0.55, 0, 0.45, 1) forwards; }
        .hero-phrase.state-enter { opacity: 0; transform: translateY(40px); animation: none; }
        .hero-phrase.state-visible-anim { animation: phraseSlideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .hero-subtitle { font-size: 18px; color: #475569; max-width: 600px; margin: 0 auto 48px; line-height: 1.6; position: relative; z-index: 2; }

        /* Main Editor / Input Area */
        .editor-container { max-width: 900px; margin: -40px auto 40px; background: white; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); position: relative; z-index: 10; border: 1px solid #e2e8f0; overflow: hidden; }
        .editor-header { background: #0f172a; padding: 12px 20px; display: flex; align-items: center; gap: 8px; }
        .mac-dot { width: 12px; height: 12px; border-radius: 50%; }
        .editor-title { margin-left: auto; color: #94a3b8; font-family: 'Fira Code', monospace; font-size: 13px; font-weight: 500; }
        
        .editor-body { padding: 32px; background: #ffffff; }
        .textarea-styled { width: 100%; box-sizing: border-box; padding: 20px; border: 2px solid #e2e8f0; border-radius: 12px; font-family: 'Fira Code', monospace; font-size: 15px; background: #f8fafc; resize: vertical; outline: none; transition: all 0.2s; color: #1e293b; line-height: 1.5; }
        .textarea-styled:focus { border-color: #0d9488; background: white; box-shadow: 0 0 0 4px rgba(13,148,136,0.1); }
        
        .submit-btn { margin-top: 24px; width: 100%; padding: 16px; background: linear-gradient(135deg, #0f172a, #1e293b); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15,23,42,0.3); background: linear-gradient(135deg, #0d9488, #0f766e); }
        .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }

        .error-banner { margin-top: 20px; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #b91c1c; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 10px; }

        /* Results Layout */
        .results-section { max-width: 1000px; margin: 0 auto; padding: 0 24px 80px; }
        
        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
        .stat-card { background: white; border-radius: 16px; padding: 24px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .stat-val { font-size: 32px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
        .stat-lbl { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Tabs */
        .tabs-row { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
        .tab-btn { padding: 10px 20px; background: transparent; color: #64748b; border: none; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .tab-btn.active { background: #0f172a; color: white; }
        .tab-btn:hover:not(.active) { background: #f1f5f9; color: #0f172a; }

        /* Cards */
        .result-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 20px; transition: all 0.3s; }
        .result-card.valid:hover { border-color: #0d9488; box-shadow: 0 8px 24px rgba(13,148,136,0.1); }
        .result-card.cycle { border-color: #fecaca; }
        
        .result-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .result-avatar { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: 800; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .bg-teal { background: linear-gradient(135deg, #0d9488, #0f766e); }
        .bg-red { background: linear-gradient(135deg, #ef4444, #dc2626); }
        
        .result-title { font-size: 16px; color: #0f172a; font-weight: 700; }
        .tag-valid { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; background: #f0fdfa; color: #0f766e; padding: 4px 12px; border-radius: 8px; font-weight: 600; border: 1px solid #ccfbf1; }
        .tag-cycle { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; background: #fef2f2; color: #b91c1c; padding: 4px 12px; border-radius: 8px; font-weight: 600; border: 1px solid #fecaca; }

        /* Trees */
        .tree-container { background: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #f1f5f9; }
        .node-row { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px; user-select: none; transition: background 0.2s; }
        .node-row:hover { background: rgba(13,148,136,0.08); }
        .node-arrow { color: #0d9488; font-size: 12px; transition: transform 0.2s; }
        .node-circle { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 12px; font-weight: 800; font-size: 15px; }
        .depth-0 { background: linear-gradient(135deg, #0d9488, #0f766e); color: white; box-shadow: 0 4px 10px rgba(13,148,136,0.2); }
        .depth-1 { background: #ccfbf1; color: #0f766e; }
        .depth-2 { background: white; border: 1.5px solid #e2e8f0; color: #334155; }
        .node-root-badge { font-size: 11px; color: #0f766e; background: #ccfbf1; padding: 2px 8px; border-radius: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .node-children-container { border-left: 2px solid #e2e8f0; margin-left: 26px; padding-left: 8px; margin-top: 4px; }
        
        .cycle-container { text-align: center; padding: 24px; color: #ef4444; background: #fff1f2; border-radius: 12px; font-size: 14px; font-weight: 500; border: 1px dashed #fecaca; }

        /* Badges */
        .badge-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
        .badge { font-size: 13px; padding: 6px 16px; border-radius: 10px; font-family: 'Fira Code', monospace; font-weight: 500; }
        .badge.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .badge.warn { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
        
        @media (max-width: 768px) {
          .hero-section { padding: 60px 20px; }
          .hero-title { font-size: 36px; }
          .editor-container { margin: -20px 20px 40px; }
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-logo">
          <Network size={24} /> GraphInspector
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">  
        <h1 className="hero-title">
          <span className="hero-title-static">Intelligent API to</span>
          <span className="hero-title-clip">
            <span className={`hero-phrase state-${phraseState === "visible" ? "visible" : phraseState === "exit" ? "exit" : phraseState === "enter" ? "enter" : "visible-anim"}`}>
              {HERO_PHRASES[phraseIndex]}
            </span>
          </span>
        </h1>
        <p className="hero-subtitle">
          Submit your directed graph data. Our God-level backend will construct trees, trace multi-parent edges, and detect deeply nested cyclic dependencies in milliseconds.
        </p>
      </section>

      {/* Input Editor */}
      <div className="editor-container animate-fade">
        <div className="editor-header">
          <div className="mac-dot" style={{ background: '#ef4444' }} />
          <div className="mac-dot" style={{ background: '#f59e0b' }} />
          <div className="mac-dot" style={{ background: '#10b981' }} />
          <div className="editor-title">POST /bfhl</div>
        </div>
        <div className="editor-body">
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            Request Payload (JSON Array)
          </label>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={6}
            className="textarea-styled"
            placeholder='{"data": ["A->B"]}'
          />
          
          <button onClick={executeRequest} disabled={isLoading} className="submit-btn">
            {isLoading ? (
              <><Activity className="animate-spin" size={20} /> Processing Graph...</>
            ) : (
              <><Play size={20} /> Run Analysis</>
            )}
          </button>
          
          {clientError && (
            <div className="error-banner">
              <AlertCircle size={20} /> {clientError}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {serverData && (
        <div className="results-section" ref={anchorRef}>
          
          {/* Stats */}
          {statBlock && (
            <div className="stats-grid animate-fade">
              <div className="stat-card">
                <div className="stat-val">{statBlock.total_trees}</div>
                <div className="stat-lbl" style={{ color: '#0d9488' }}>Valid Trees</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{statBlock.total_cycles}</div>
                <div className="stat-lbl" style={{ color: '#ef4444' }}>Cyclic Groups</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{statBlock.largest_tree_root || '-'}</div>
                <div className="stat-lbl">Deepest Root</div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="tabs-row animate-fade">
            <button className={`tab-btn ${tab === 'visual' ? 'active' : ''}`} onClick={() => setTab('visual')}>
              <Network size={16} /> Hierarchies
            </button>
            <button className={`tab-btn ${tab === 'errors' ? 'active' : ''}`} onClick={() => setTab('errors')}>
              <ShieldAlert size={16} /> Anomalies
            </button>
            <button className={`tab-btn ${tab === 'json' ? 'active' : ''}`} onClick={() => setTab('json')}>
              <Code2 size={16} /> Raw Output
            </button>
          </div>

          {/* Tab Views */}
          <div className="animate-fade">
            {tab === 'visual' && (
              <div>
                {treeList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px' }}>No valid hierarchies parsed.</div>
                ) : treeList.map((obj, i) => <DataCard key={i} dataObj={obj} index={i} />)}
              </div>
            )}

            {tab === 'errors' && (
              <div className="result-card">
                {badInputs.length === 0 && duplicateInputs.length === 0 ? (
                  <div style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={20} /> System Clean: No format violations or duplicate edges found!
                  </div>
                ) : (
                  <>
                    {badInputs.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Format Violations ({badInputs.length})</div>
                        <div className="badge-grid">
                          {badInputs.map((item, i) => <span key={i} className="badge error">{String(item)}</span>)}
                        </div>
                      </div>
                    )}
                    {duplicateInputs.length > 0 && (
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Duplicate Edges Ignored ({duplicateInputs.length})</div>
                        <div className="badge-grid">
                          {duplicateInputs.map((item, i) => <span key={i} className="badge warn">{String(item)}</span>)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === 'json' && (
              <div style={{ background: '#0f172a', borderRadius: '20px', padding: '24px', overflow: 'auto', border: '1px solid #1e293b' }}>
                <pre style={{ margin: 0, color: '#38bdf8', fontSize: '14px', fontFamily: "'Fira Code', monospace" }}>
                  {JSON.stringify(serverData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}