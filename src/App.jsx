import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { uploadHexFileToArduino } from './uploader';

function App() {
  const [code, setCode] = useState(`void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}`);
  
  const [board, setBoard] = useState('arduino:avr:uno'); // Default UNO
  const [status, setStatus] = useState('Ready');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Tumhara Naya Backend
  const BACKEND_URL = 'https://stemrobo.duckdns.org/compile';

  const compileAndUpload = async () => {
    if (isCompiling || isUploading) return;
    
    setIsCompiling(true);
    setStatus('🚀 Sending code to AWS for compilation...');

    try {
      // 1. Backend call (AWS)
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, board })
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Data.hex mein HEX String hai (:10E0000...)
      const hexString = data.hex; 
      
      setStatus('✅ Compile Success! Starting Upload...');
      setIsCompiling(false);
      setIsUploading(true);

      // 2. Upload Logic (Using your old uploader.js)
      // Note: Hum hexString direct pass kar rahe hain, Avrgirl (via uploader.js) isse handle karega.
      await uploadHexFileToArduino(hexString, board, setStatus);
      
    } catch (e) {
      console.error(e);
      setStatus(`❌ Error: ${e.message}`);
    } finally {
      setIsCompiling(false);
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <h1 style={{textAlign: 'center', color: '#333'}}>Arduino Cloud Uploader (Restored)</h1>
      
      {/* Board Selection */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <select 
          value={board} 
          onChange={(e) => setBoard(e.target.value)}
          style={{ padding: '10px', fontSize: '16px', borderRadius: '5px' }}
        >
          <option value="arduino:avr:uno">Arduino Uno</option>
          <option value="arduino:avr:nano">Arduino Nano</option>
          <option value="arduino:avr:mega">Arduino Mega</option>
        </select>
        
        <button
          onClick={compileAndUpload}
          disabled={isCompiling || isUploading}
          style={{
            padding: '10px 25px',
            fontSize: '16px',
            backgroundColor: isCompiling || isUploading ? '#ccc' : '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isCompiling ? 'Compiling...' : isUploading ? 'Uploading...' : 'Compile & Upload'}
        </button>
      </div>

      {/* Editor */}
      <div style={{ border: '2px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
        <Editor
          height="500px"
          defaultLanguage="cpp"
          theme="vs-dark"
          value={code}
          onChange={setCode}
          options={{ minimap: { enabled: false }, fontSize: 16 }}
        />
      </div>

      {/* Status Bar */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#333', 
        color: '#0f0', 
        borderRadius: '5px', 
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap'
      }}>
         {status}
      </div>
    </div>
  );
}

export default App;