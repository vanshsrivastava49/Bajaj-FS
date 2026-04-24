import { useState, useRef } from 'react';

const ENDPOINT_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const INITIAL_PAYLOAD = `["A->B", "A->C", "B->D", "C->E", "E->F", "X->Y", "Y->Z", "Z->X", "P->Q", "Q->R", "G->H", "G->H", "G->I", "hello", "1->2", "A->"]`;

// Renamed and restyled recursive component
function BranchRenderer({ identifier, branches, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isParent = branches && Object.keys(branches).length > 0;
  const spacing = level * 24;

  return (
    <div style={{ marginLeft: `${spacing}px`, marginTop: '4px' }}>
      <div
        onClick={() => isParent && setIsExpanded(!isExpanded)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '4px 8px', borderRadius: '8px',
          cursor: isParent ? 'pointer' : 'default', userSelect: 'none',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { if (isParent) e.currentTarget.style.background = 'rgba(13, 148, 136, 0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
          {isParent && (
            <span style={{ color: '#0d9488', fontSize: '10px', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              ▶
            </span>
          )}
        </div>
        
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '10px',
          background: level === 0 ? 'linear-gradient(135deg, #0d9488, #0f766e)' : level === 1 ? '#ccfbf1' : '#f1f5f9',
          color: level === 0 ? '#fff' : level === 1 ? '#0f766e' : '#334155',
          fontWeight: 'bold', fontSize: '14px',
          boxShadow: level === 0 ? '0 2px 4px rgba(13,148,136,0.3)' : 'none'
        }}>
          {identifier}
        </span>
        {level === 0 && <span style={{ fontSize: '11px', color: '#0f766e', background: '#ccfbf1', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Root Node</span>}
      </div>
      
      {isExpanded && isParent && (
        <div style={{ borderLeft: '2px dashed #99f6e4', marginLeft: '24px', paddingLeft: '8px', marginTop: '4px' }}>
          {Object.entries(branches).map(([key, val]) => (
            <BranchRenderer key={key} identifier={key} branches={val} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// Renamed and restyled card component
function TreeResultPanel({ itemData, seqNumber }) {
  const isLoop = itemData.has_cycle === true;
  const nodes = itemData.tree && !isLoop ? Object.entries(itemData.tree) : [];

  return (
    <div style={{
      background: '#fff', border: isLoop ? '1px solid #fecaca' : '1px solid #ccfbf1',
      borderRadius: '16px', padding: '20px', marginBottom: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: isLoop ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #0d9488, #14b8a6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '18px', fontWeight: 'bold'
        }}>
          {itemData.root}
        </div>
        <div>
          <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 600 }}>
            Structure #{seqNumber + 1}
          </div>
          <div style={{ marginTop: '4px' }}>
            {isLoop ? (
              <span style={{ fontSize: '12px', background: '#fef2f2', color: '#b91c1c', padding: '3px 10px', borderRadius: '6px', fontWeight: 500 }}>⚠️ Cyclic Dependency Found</span>
            ) : (
              <span style={{ fontSize: '12px', background: '#f0fdfa', color: '#0f766e', padding: '3px 10px', borderRadius: '6px', fontWeight: 500 }}>✓ Max Depth: {itemData.depth}</span>
            )}
          </div>
        </div>
      </div>
      
      {!isLoop && nodes.length > 0 ? (
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
          {nodes.map(([k, v]) => <BranchRenderer key={k} identifier={k} branches={v} level={0} />)}
        </div>
      ) : isLoop ? (
        <div style={{ textAlign: 'center', padding: '16px', color: '#ef4444', background: '#fff1f2', borderRadius: '12px', fontSize: '14px' }}>
          Cyclic groups cannot be rendered as a tree.
        </div>
      ) : null}
    </div>
  );
}

function BadgeGroup({ elements, theme, title }) {
  if (!elements || elements.length === 0) return null;
  const styles = {
    danger: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
    warning: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  };
  const currentTheme = styles[theme] || styles.danger;
  
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '10px' }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {elements.map((el, idx) => (
          <span key={idx} style={{ 
            fontSize: '13px', background: currentTheme.bg, color: currentTheme.text, 
            border: `1px solid ${currentTheme.border}`, padding: '4px 12px', borderRadius: '8px', fontFamily: 'monospace' 
          }}>
            {String(el)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [jsonStr, setJsonStr] = useState(INITIAL_PAYLOAD);
  const [apiResult, setApiResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [viewMode, setViewMode] = useState('structures');
  const scrollAnchor = useRef(null);

  const triggerAnalysis = async () => {
    setErrorMessage('');
    setApiResult(null);
    setIsFetching(true);
    
    try {
      let parsedJson;
      try { parsedJson = JSON.parse(jsonStr); } 
      catch { throw new Error('Invalid JSON format. Please check your syntax.'); }
      
      const requestBody = Array.isArray(parsedJson) ? { data: parsedJson } : parsedJson;
      if (!Array.isArray(requestBody.data)) throw new Error('A "data" array is required.');

      const response = await fetch(`${ENDPOINT_URL}/bfhl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      
      const finalData = await response.json();
      setApiResult(finalData);
      setViewMode('structures');
      setTimeout(() => scrollAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } catch (error) {
      setErrorMessage(error.message || 'Network request failed.');
    } finally {
      setIsFetching(false);
    }
  };

  const currentSummary = apiResult?.summary;
  const currentHierarchies = apiResult?.hierarchies || [];
  const badEntries = apiResult?.invalid_entries || [];
  const duplicatePaths = apiResult?.duplicate_edges || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdfa', fontFamily: "'Inter', system-ui, sans-serif", color: '#0f172a' }}>
      
      <header style={{ background: '#fff', borderBottom: '1px solid #ccfbf1', padding: '30px 20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, color: '#0d9488', fontSize: '28px', fontWeight: 800 }}>Graph Inspector</h1>
        <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px' }}>SRM Engineering Challenge • /bfhl POST API</p>
      </header>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px' }}>
        
        <section style={{ background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 25px rgba(13,148,136,0.05)', marginBottom: '30px', border: '1px solid #e0f2fe' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f766e', marginBottom: '12px' }}>
            Payload Data (JSON)
          </label>
          <textarea
            value={jsonStr}
            onChange={e => setJsonStr(e.target.value)}
            rows={6}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '16px',
              border: '2px solid #ccfbf1', borderRadius: '12px',
              fontFamily: 'monospace', fontSize: '14px', background: '#f8fafc',
              resize: 'vertical', outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#0d9488'}
            onBlur={e => e.target.style.borderColor = '#ccfbf1'}
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              onClick={triggerAnalysis}
              disabled={isFetching}
              style={{
                padding: '12px 32px', background: isFetching ? '#99f6e4' : '#0d9488',
                color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600,
                fontSize: '15px', cursor: isFetching ? 'wait' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {isFetching ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
          
          {errorMessage && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '4px', color: '#991b1b', fontSize: '14px' }}>
              {errorMessage}
            </div>
          )}
        </section>

        {apiResult && (
          <div ref={scrollAnchor}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Student ID', val: apiResult.user_id },
                { label: 'Email Address', val: apiResult.email_id },
                { label: 'Roll Code', val: apiResult.college_roll_number },
              ].map(info => (
                <div key={info.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{info.label}</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', marginTop: '4px' }}>{info.val}</div>
                </div>
              ))}
            </div>

            {currentSummary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '30px' }}>
                <div style={{ background: '#f0fdfa', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid #ccfbf1' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0d9488' }}>{currentSummary.total_trees}</div>
                  <div style={{ fontSize: '13px', color: '#0f766e', fontWeight: 500 }}>Valid Trees</div>
                </div>
                <div style={{ background: '#fef2f2', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444' }}>{currentSummary.total_cycles}</div>
                  <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 500 }}>Cyclic Groups</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#334155' }}>{currentSummary.largest_tree_root || '-'}</div>
                  <div style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>Max Root</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
              {['structures', 'anomalies', 'json'].map(mode => (
                <button 
                  key={mode} onClick={() => setViewMode(mode)}
                  style={{
                    padding: '8px 16px', background: viewMode === mode ? '#0d9488' : 'transparent',
                    color: viewMode === mode ? '#fff' : '#64748b', border: 'none', borderRadius: '8px',
                    fontWeight: 600, fontSize: '14px', cursor: 'pointer', textTransform: 'capitalize'
                  }}
                >
                  {mode === 'structures' ? 'Hierarchies' : mode === 'anomalies' ? 'Issues' : 'Raw Data'}
                </button>
              ))}
            </div>

            {viewMode === 'structures' && (
              <div>
                {currentHierarchies.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No valid hierarchies parsed.</div>
                ) : currentHierarchies.map((item, idx) => <TreeResultPanel key={idx} itemData={item} seqNumber={idx} />)}
              </div>
            )}

            {viewMode === 'anomalies' && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                {badEntries.length === 0 && duplicatePaths.length === 0 ? (
                  <div style={{ color: '#10b981', fontWeight: 600 }}>All node entries are clean. No anomalies detected.</div>
                ) : (
                  <>
                    <BadgeGroup elements={badEntries} theme="danger" title={`Format Violations (${badEntries.length})`} />
                    <BadgeGroup elements={duplicatePaths} theme="warning" title={`Duplicate Edges Filtered (${duplicatePaths.length})`} />
                  </>
                )}
              </div>
            )}

            {viewMode === 'json' && (
              <div style={{ background: '#0f172a', borderRadius: '16px', padding: '20px', overflow: 'auto' }}>
                <pre style={{ margin: 0, color: '#38bdf8', fontSize: '13px' }}>
                  {JSON.stringify(apiResult, null, 2)}
                </pre>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}