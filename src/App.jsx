import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { uploadHexFileToArduino } from './uploader';
import BlocklyEditor from './BlocklyEditor';
import LandingPage from './LandingPage';

// Firebase Imports
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Icons
import { FaSave, FaFolderOpen, FaDownload, FaSignOutAlt, FaUserCircle, FaBars, FaTimes, FaTrash, FaBook, FaSearch, FaCloudDownloadAlt, FaSpinner, FaCheck, FaTerminal, FaBolt, FaCopy } from 'react-icons/fa';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- EDITOR STATE ---
  const [mode, setMode] = useState('text');
  const [textCode, setTextCode] = useState(`void setup() {\n  Serial.begin(9600);\n  pinMode(LED_BUILTIN, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  Serial.println("SparkCode Active");\n  delay(1000);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(1000);\n}`);
  const [blockGeneratedCode, setBlockGeneratedCode] = useState('');
  
  // --- HARDWARE STATE ---
  const [board, setBoard] = useState('arduino:avr:uno');
  const [logs, setLogs] = useState([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSerialOpen, setIsSerialOpen] = useState(false);
  const [baudRate, setBaudRate] = useState(9600);

  // --- UI STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLibManagerOpen, setIsLibManagerOpen] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [savedSketches, setSavedSketches] = useState([]);
  
  // --- LIBRARY MANAGER STATE ---
  const [libSearchQuery, setLibSearchQuery] = useState('');
  const [libSearchResults, setLibSearchResults] = useState([]);
  const [isSearchingLib, setIsSearchingLib] = useState(false);
  const [installingLibId, setInstallingLibId] = useState(null);

  // Refs for Serial
  const serialPortRef = useRef(null);
  const readerRef = useRef(null);
  const readableStreamClosedRef = useRef(null); 
  const keepReadingRef = useRef(false);
  
  const consoleEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- API CONFIGURATION ---
  const BACKEND_BASE = 'https://stemrobo.duckdns.org'; 
  const BACKEND_URL = `${BACKEND_BASE}/compile`;
  const LIB_SEARCH_URL = `${BACKEND_BASE}/library/search`;
  const LIB_INSTALL_URL = `${BACKEND_BASE}/library/install`;

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        fetchSavedSketches(currentUser.uid);
        setTimeout(() => {
            addLog(`🚀 Welcome back, ${currentUser.displayName || 'Developer'}!`, 'success');
            addLog('System Ready. Select a board to begin.', 'info');
        }, 500);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { consoleEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  // --- HELPER FOR WOKWI BOARD SELECTION ---
  const getWokwiBoardSlug = () => {
    switch(board) {
        case 'arduino:avr:nano': return 'arduino-nano';
        case 'arduino:avr:mega': return 'arduino-mega';
        case 'arduino:avr:uno': default: return 'arduino-uno';
    }
  };

  // --- FUNCTIONS ---
  const handleDownload = () => {
    const codeToSave = mode === 'text' ? textCode : blockGeneratedCode;
    const blob = new Blob([codeToSave], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'sketch.ino';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    addLog('⬇️ Code downloaded to computer.', 'success');
  };

  const handleLibSearch = async () => {
      if(!libSearchQuery.trim()) return;
      setIsSearchingLib(true);
      setLibSearchResults([]); 
      try {
          const res = await fetch(LIB_SEARCH_URL, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ query: libSearchQuery })
          });
          if (!res.ok) throw new Error("Server Search Failed");
          const data = await res.json();
          setLibSearchResults(data.libraries || []);
      } catch (e) {
          console.error(e);
          addLog(`❌ Lib Search Error: ${e.message}`, 'error');
      } finally {
          setIsSearchingLib(false);
      }
  };

  const handleLibInstall = async (libName, libVersion) => {
      setInstallingLibId(libName);
      addLog(`⬇️ Installing: ${libName}...`, 'info');
      try {
          const res = await fetch(LIB_INSTALL_URL, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ name: libName }) 
          });
          const data = await res.json();
          if(!res.ok || data.error) throw new Error(data.error || "Installation failed");
          
          addLog(`✅ Installed: ${libName}`, 'success');
          if(mode === 'text') {
             const headerName = libName.replace(/\s+/g, '') + '.h'; 
             if(!textCode.includes(headerName)) {
                 setTextCode(`#include <${headerName}>\n` + textCode);
             }
          }
      } catch (e) {
          addLog(`❌ Install Error: ${e.message}`, 'error');
      } finally {
          setInstallingLibId(null);
      }
  };

  const fetchSavedSketches = async (userId) => {
    try {
      const q = query(collection(db, "sketches"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const sketches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedSketches(sketches);
    } catch (e) { console.error(e); }
  };

  const handleSaveCode = async () => {
    const name = prompt("Enter sketch name:", "My Sketch");
    if (!name) return;
    try {
      await addDoc(collection(db, "sketches"), {
        userId: user.uid, name, code: mode === 'text' ? textCode : blockGeneratedCode,
        mode, date: new Date().toISOString()
      });
      addLog(`💾 Saved: "${name}"`, 'success');
      fetchSavedSketches(user.uid);
    } catch (e) { addLog(`❌ Save Failed`, 'error'); }
  };

  const loadSketch = (sketch) => {
    if(mode !== sketch.mode && !confirm(`Switch to ${sketch.mode} mode?`)) return;
    setMode(sketch.mode);
    if(sketch.mode === 'text') setTextCode(sketch.code);
    addLog(`📂 Loaded: ${sketch.name}`, 'info');
  };

  const deleteSketch = async (id, e) => {
      e.stopPropagation();
      if(!confirm("Delete this sketch?")) return;
      await deleteDoc(doc(db, "sketches", id));
      fetchSavedSketches(user.uid);
  }

  const addLog = (msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { text: `[${timestamp}] ${msg}`, type }]);
  };

  const getCurrentCode = () => mode === 'text' ? textCode : blockGeneratedCode;

  const handleCopyForSim = () => {
    const code = getCurrentCode();
    navigator.clipboard.writeText(code);
    addLog("📋 Code copied! Paste it into the Simulator.", "success");
  };

  const handleCompile = async () => {
    const codeToCompile = getCurrentCode();
    if(!codeToCompile || codeToCompile.trim() === "") {
        addLog("❌ Error: Code is empty!", "error");
        return;
    }
    setIsCompiling(true);
    addLog(`🚀 Compiling...`, 'info');
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToCompile, board })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Server Error: ${response.status}`);
      addLog('✅ Compile Success!', 'success');
      return data.hex;
    } catch (err) {
      addLog(`❌ Error: ${err.message}`, 'error');
      return null;
    } finally {
      setIsCompiling(false);
    }
  };

  const handleUpload = async () => {
    if (isCompiling || isUploading) return;
    if (isSerialOpen) {
        addLog('⚠️ Closing Serial for upload...', 'warning');
        await disconnectSerial(); 
        await new Promise(r => setTimeout(r, 800));
    }
    const hexData = await handleCompile();
    if (!hexData) return;
    setIsUploading(true);
    addLog('🔌 Uploading...', 'info');
    try {
      await uploadHexFileToArduino(hexData, board, (msg) => addLog(`>> ${msg}`, 'upload'));
      addLog('🎉 Upload Complete!', 'success');
    } catch (err) {
      addLog(`❌ Upload Failed: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const connectSerial = async () => {
      if (!navigator.serial) return alert("Web Serial not supported.");
      try {
          const port = await navigator.serial.requestPort();
          await port.open({ baudRate: parseInt(baudRate) });
          
          serialPortRef.current = port;
          const textDecoder = new TextDecoderStream();
          readableStreamClosedRef.current = port.readable.pipeTo(textDecoder.writable);
          const reader = textDecoder.readable.getReader();
          readerRef.current = reader;
          keepReadingRef.current = true;
          
          setIsSerialOpen(true);
          addLog(`🔌 Serial Connected (${baudRate} baud)`, 'success');
          
          readSerialLoop(reader);
      } catch (err) { addLog(`❌ Serial Error: ${err.message}`, 'error'); }
  };

  const disconnectSerial = async () => {
    addLog('🔌 Closing Serial Port...', 'warning');
    keepReadingRef.current = false; 
    
    if (readerRef.current) {
        try { await readerRef.current.cancel(); } catch (e) { console.warn(e); }
        readerRef.current = null;
    }
    if (readableStreamClosedRef.current) {
        try { await readableStreamClosedRef.current.catch(() => {}); } catch (e) {}
    }
    if (serialPortRef.current) {
        try { await serialPortRef.current.close(); } catch (e) { console.warn(e); }
        serialPortRef.current = null;
    }

    setIsSerialOpen(false);
    addLog('✅ Serial Disconnected & Port Released.', 'success');
  };

  const readSerialLoop = async (reader) => {
      let buffer = '';
      try {
          while (keepReadingRef.current) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) {
                  buffer += value;
                  if (buffer.includes('\n')) {
                      const lines = buffer.split('\n');
                      buffer = lines.pop(); 
                      lines.forEach(line => {
                          const clean = line.replace(/\r/g, '');
                          if (clean) addLog(clean, 'serial');
                      });
                  }
              }
          }
      } catch (e) {
          if (keepReadingRef.current) console.error(e);
      } finally { 
          if (reader) reader.releaseLock(); 
      }
  };

  if (loading) return <div style={styles.loader}>Loading SparkCode...</div>;
  if (!user) return <LandingPage />;

  return (
    <div style={styles.container}>
      {/* SIDEBAR - STRICT INSTANT TOGGLE */}
      <div style={{
          ...styles.sidebar, 
          width: isSidebarOpen ? '260px' : '0px', 
          minWidth: isSidebarOpen ? '260px' : '0px', // Forces Instant Block Size
          padding: isSidebarOpen ? '20px' : '0' 
      }}>
        <div style={styles.profileSection}>
            <FaUserCircle size={35} color="#3b82f6" />
            <div style={styles.profileInfo}>
                <div style={styles.userName}>{user.displayName || 'Developer'}</div>
                <div style={styles.userEmail}>SparkCode Pro</div>
            </div>
        </div>

        <div style={styles.sidebarMenu}>
            <div style={styles.menuLabel}>PROJECT</div>
            <button style={styles.menuBtn} onClick={handleSaveCode}><FaSave /> Save Cloud</button>
            <button style={styles.menuBtn} onClick={handleDownload}><FaDownload /> Download File</button>
            <button style={styles.menuBtn} onClick={() => fileInputRef.current.click()}><FaFolderOpen /> Open File</button>
            <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={(e) => {
                const file = e.target.files[0];
                if(file) { const r = new FileReader(); r.onload = (ev) => {setTextCode(ev.target.result); setMode('text');}; r.readAsText(file); }
            }} />
            
            <div style={styles.menuLabel}>TOOLS</div>
            <button 
                style={{...styles.menuBtn, ...(isLibManagerOpen ? {background: '#334155', color: '#fff'} : {})}} 
                onClick={() => setIsLibManagerOpen(!isLibManagerOpen)}
            >
                <FaBook /> Library Manager
            </button>

            <div style={styles.menuLabel}>SAVED SKETCHES</div>
            <div style={styles.sketchList}>
                {savedSketches.map(s => (
                    <div key={s.id} style={styles.sketchItem} onClick={() => loadSketch(s)}>
                        {s.name} <FaTrash style={{color:'#ef4444'}} onClick={(e)=>deleteSketch(s.id, e)}/>
                    </div>
                ))}
            </div>
        </div>

        <button style={styles.logoutBtn} onClick={() => signOut(auth)}><FaSignOutAlt /> Logout</button>
      </div>

      {/* LIBRARY DRAWER */}
      <div style={{...styles.libDrawer, width: isLibManagerOpen ? '380px' : '0px', display: isLibManagerOpen ? 'flex' : 'none'}}>
          <div style={styles.libHeader}>
              <h3>Library Manager</h3>
              <button onClick={() => setIsLibManagerOpen(false)} style={styles.closeBtn}><FaTimes /></button>
          </div>
          
          <div style={styles.libSearchBox}>
              <input 
                type="text" 
                placeholder="Search Arduino libraries..." 
                value={libSearchQuery}
                onChange={(e) => setLibSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLibSearch()}
                style={styles.libInput}
              />
              <button onClick={handleLibSearch} style={styles.searchBtn}><FaSearch /></button>
          </div>

          <div style={styles.libListContainer}>
              {isSearchingLib ? (
                  <div style={{textAlign: 'center', padding: '30px', color: '#94a3b8'}}>
                      <FaSpinner className="fa-spin" size={20} /> <br/> Searching AWS Cloud...
                  </div>
              ) : (
                  libSearchResults.length > 0 ? (
                      libSearchResults.map((lib, idx) => (
                          <div key={idx} style={styles.libCard}>
                              <div style={styles.libCardHeader}>
                                  <span style={styles.libName}>{lib.name}</span>
                                  <span style={styles.libVersion}>{lib.version}</span>
                              </div>
                              <div style={styles.libAuthor}>by {lib.author}</div>
                              <div style={styles.libDesc}>{lib.sentence || lib.paragraph}</div>
                              <button 
                                style={styles.installBtn} 
                                onClick={() => handleLibInstall(lib.name, lib.version)}
                                disabled={installingLibId === lib.name}
                              >
                                  {installingLibId === lib.name ? <><FaSpinner className="fa-spin"/> Installing...</> : <><FaCloudDownloadAlt /> Install</>}
                              </button>
                          </div>
                      ))
                  ) : (
                      <div style={{textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.9rem'}}>
                          {libSearchQuery ? 'No libraries found.' : 'Type name and press Enter to search.'}
                      </div>
                  )
              )}
          </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.mainContent}>
        <header style={styles.header}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={styles.iconBtn}>
               {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div style={styles.logo}>SparkCode <span style={{color:'#3b82f6'}}>Cloud</span></div>
          </div>
          
          <div style={styles.toolbar}>
             <div style={styles.toggleGroup}>
                <button style={{...styles.toggleBtn, ...(mode==='text'?styles.activeToggle:{})}} onClick={()=>setMode('text')}>Text</button>
                <button style={{...styles.toggleBtn, ...(mode==='block'?styles.activeToggle:{})}} onClick={()=>setMode('block')}>Block</button>
             </div>
            
            {/* SIMULATOR BUTTON */}
            <button 
                onClick={() => setShowSimulator(!showSimulator)} 
                style={{...styles.btn, background: showSimulator ? '#9333ea' : '#334155', display: 'flex', alignItems: 'center', gap: '5px'}}
            >
               <FaBolt /> {showSimulator ? 'Close Sim' : 'Simulator'}
            </button>

            <select value={board} onChange={e => setBoard(e.target.value)} style={styles.select}>
              <option value="arduino:avr:uno">Arduino Uno</option>
              <option value="arduino:avr:nano">Arduino Nano</option>
              <option value="arduino:avr:mega">Arduino Mega</option>
            </select>

            <select value={baudRate} onChange={e => setBaudRate(e.target.value)} style={styles.selectSmall}>
              <option value="9600">9600 Baud</option>
              <option value="115200">115200 Baud</option>
              <option value="57600">57600 Baud</option>
              <option value="38400">38400 Baud</option>
            </select>

            <button onClick={isSerialOpen ? disconnectSerial : connectSerial} style={{...styles.btn, background: isSerialOpen ? '#dc2626' : '#334155'}}>
               {isSerialOpen ? 'Stop Serial' : 'Serial Monitor'}
            </button>
            <button onClick={handleCompile} disabled={isCompiling} style={{...styles.btn, background: '#ca8a04'}}>
              {isCompiling ? '⚙️' : '✓ Verify'}
            </button>
            <button onClick={handleUpload} disabled={isUploading} style={{...styles.btn, background: '#2563eb'}}>
              {isUploading ? '📤...' : '➜ Upload'}
            </button>
          </div>
        </header>

        {/* WORKSPACE AREA WITH SPLIT VIEW */}
        <div style={styles.workspace}>
          {/* LEFT SIDE: EDITOR */}
          <div style={{flex: 1, height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column'}}>
              {mode === 'text' ? (
                <Editor height="100%" defaultLanguage="cpp" theme="vs-dark" value={textCode} onChange={setTextCode} options={{ minimap: { enabled: false }, fontSize: 15 }} />
              ) : (
                <div style={{display:'flex', height:'100%'}}>
                    <div style={{flex: 3, minWidth:0}}><BlocklyEditor onCodeChange={setBlockGeneratedCode} /></div>
                    <div style={{flex: 1, background:'#1e1e1e', minWidth:0}}><Editor height="100%" defaultLanguage="cpp" theme="vs-dark" value={blockGeneratedCode} options={{ readOnly: true, minimap: { enabled: false }}} /></div>
                </div>
              )}
          </div>

          {/* RIGHT SIDE: SIMULATOR IFRAME */}
          {showSimulator && (
              <div style={styles.simulatorPane}>
                  <div style={styles.simHeader}>
                      <span>Online Circuit Simulator</span>
                      <button style={styles.copyBtn} onClick={handleCopyForSim}>
                          <FaCopy /> Copy Code
                      </button>
                  </div>
                  {/* WRAPPER DIV WITH ADJUSTED CROP (-40px) */}
                  <div style={styles.simContent}>
                      <iframe 
                        // DYNAMIC WOKWI URL based on selected board
                        src={`https://wokwi.com/projects/new/${getWokwiBoardSlug()}?dark=1`} 
                        title="Wokwi Simulator"
                        style={styles.simFrame}
                      />
                  </div>
              </div>
          )}
        </div>

        <div style={styles.terminal}>
          <div style={styles.terminalHeader}>
            <span>Output Terminal</span>
            {isSerialOpen && <span style={{color: '#4ade80', fontSize: '0.8rem'}}> ● Serial Active</span>}
          </div>
          <div style={styles.logsContainer}>
            {logs.map((l, i) => (
                <div key={i} style={{
                    marginBottom:'2px', 
                    color: l.type==='error'?'#f87171':l.type==='success'?'#4ade80':l.type==='serial'?'#60a5fa':'#9ca3af'
                }}>{l.text}</div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', background: '#0f172a', color: '#fff', fontFamily: "'Segoe UI', sans-serif" },
  loader: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', color: '#3b82f6', background: '#0f172a' },
  
  // SIDEBAR - ULTRA FAST FIX
  sidebar: { 
    background: '#1e293b', 
    borderRight: '1px solid #334155', 
    display: 'flex', 
    flexDirection: 'column', 
    overflow: 'hidden', 
    zIndex: 20,
    flexShrink: 0, // IMPORTANT: Prevents layout recalculation lag
    whiteSpace: 'nowrap', // Prevents text reflow lag
    transition: '0s', // Forced Zero Delay
    transitionDuration: '0s', 
    transitionProperty: 'none'
  },
  
  profileSection: { display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid #334155', marginBottom: '20px' },
  userName: { fontWeight: '600', fontSize: '0.95rem' },
  userEmail: { fontSize: '0.8rem', color: '#94a3b8' },
  menuLabel: { fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginTop: '20px', marginBottom: '8px', letterSpacing: '0.5px' },
  menuBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', borderRadius: '6px', fontSize: '0.9rem', width: '100%', textAlign: 'left', ':hover': {background: '#334155'} },
  sketchList: { maxHeight: '200px', overflowY: 'auto' },
  sketchItem: { padding: '8px', background: '#0f172a', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#94a3b8' },
  logoutBtn: { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#dc2626', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' },
  
  // LIBRARY DRAWER
  libDrawer: { background: '#1e293b', borderRight: '1px solid #334155', flexDirection: 'column', overflow: 'hidden', height: '100%', position: 'relative', zIndex: 10 },
  libHeader: { padding: '15px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a' },
  closeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' },
  libSearchBox: { padding: '15px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '5px', background: '#1e293b' },
  libInput: { background: '#0f172a', border: '1px solid #334155', padding:'8px', borderRadius:'4px', color: '#fff', width: '100%', outline: 'none', fontSize: '0.9rem' },
  searchBtn: { background: '#3b82f6', color:'white', border:'none', padding:'8px 12px', borderRadius:'4px', cursor:'pointer' },
  libListContainer: { flex: 1, overflowY: 'auto', padding: '10px', background: '#0f172a' },
  libCard: { background: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #334155' },
  libCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' },
  libName: { fontWeight: '700', fontSize: '0.95rem', color: '#fff' },
  libVersion: { fontSize: '0.75rem', background: '#334155', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' },
  libAuthor: { fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', fontStyle: 'italic' },
  libDesc: { fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '10px', lineHeight: '1.4' },
  installBtn: { width: '100%', padding: '8px', background: '#2563eb', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '600', ':hover': {background: '#1d4ed8'}, ':disabled': {background: '#475569', cursor: 'not-allowed'} },

  mainContent: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { height: '55px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' },
  iconBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' },
  logo: { fontSize: '1.2rem', fontWeight: 'bold' },
  toolbar: { display: 'flex', gap: '10px', alignItems: 'center' },
  toggleGroup: { background: '#0f172a', borderRadius: '6px', padding: '3px', display: 'flex', gap: '2px' },
  toggleBtn: { padding: '5px 12px', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' },
  activeToggle: { background: '#3b82f6', color: '#fff' },
  select: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #475569', background: '#334155', color: '#fff', fontSize: '0.85rem' },
  selectSmall: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: '0.85rem' },
  btn: { padding: '6px 14px', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  
  // WORKSPACE
  workspace: { flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'row' },
  
  // SIMULATOR STYLES
  simulatorPane: { flex: 1, borderLeft: '2px solid #334155', display: 'flex', flexDirection: 'column', background: '#0f172a' },
  simHeader: { height: '40px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1', zIndex: 5 },
  simContent: { flex: 1, overflow: 'hidden', position: 'relative' },
  
  // CROP FIX (-40px) and Dynamic Board Logic
  simFrame: { width: '100%', height: 'calc(100% + 40px)', border: 'none', marginTop: '-40px' },
  copyBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#3b82f6', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' },

  terminal: { height: '180px', background: '#0f172a', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column' },
  terminalHeader: { padding: '5px 15px', background: '#1e293b', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' },
  logsContainer: { flex: 1, padding: '10px', overflowY: 'auto', fontFamily: 'Consolas, monospace', fontSize: '0.85rem' },
};

export default App;