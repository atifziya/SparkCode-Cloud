// src/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, googleProvider, db } from './firebase';
// IMPORT YOUR LOGO HERE
import logo from './assets/logo.png'; 
import { FaGoogle, FaBolt, FaLinkedin, FaGithub, FaArrowRight, FaUser, FaLock, FaEnvelope, FaPhone, FaCopyright, FaMagic, FaBuilding } from 'react-icons/fa';

const LandingPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- RESPONSIVE STATE ---
  const [width, setWidth] = useState(window.innerWidth);
  const isMobile = width < 900; // 900px se kam hone par Mobile Layout activate hoga

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: fullName });
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: fullName,
          email, phone,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  // --- DYNAMIC STYLES ---
  const styles = {
    container: { 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row', // Mobile pe Column, Desktop pe Row
      minHeight: '100vh', 
      width: '100vw', 
      backgroundColor: '#030712', 
      color: '#fff', 
      fontFamily: "'Inter', sans-serif", 
      position: 'relative', 
      overflowX: 'hidden', 
      overflowY: 'auto'
    },
    
    // Background
    gridOverlay: { position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 },
    orb1: { position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 },
    orb2: { position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 },

    // Left Side
    heroSection: { 
        flex: 1.3, 
        zIndex: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: isMobile ? '60px 20px 40px' : '40px 80px', // Mobile Padding Fix
        justifyContent: 'center',
        alignItems: isMobile ? 'center' : 'flex-start', // Mobile pe Center Align
        textAlign: isMobile ? 'center' : 'left'
    },
    contentBox: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: isMobile ? 'center' : 'flex-start' },
    
    // Badge
    brandBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '6px 14px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '600', width: 'fit-content', marginBottom: '20px', border: '1px solid rgba(251, 191, 36, 0.2)' },
    
    // HEADER
    logoHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', flexDirection: isMobile ? 'column' : 'row' },
    logoImage: { height: isMobile ? '50px' : '60px', width: 'auto', objectFit: 'contain' }, 
    
    // *** NAME CHANGED HERE: SparkCode -> ZylixCode ***
    mainTitle: { fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: '800', margin: 0, letterSpacing: '-1.5px', color: '#fff', lineHeight: '1' }, // Font Size Fix

    // Sub Headline
    subHeadline: { fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: '700', margin: '15px 0', letterSpacing: '-0.5px', color: '#e2e8f0' },
    gradientText: { background: 'linear-gradient(to right, #3b82f6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    
    subtext: { fontSize: isMobile ? '1rem' : '1.1rem', color: '#94a3b8', lineHeight: '1.6', maxWidth: '580px', marginBottom: '40px' },

    // Stats Row
    statsRow: { display: 'flex', gap: '25px', alignItems: 'center', marginBottom: '50px', borderTop: '1px solid #1e293b', paddingTop: '30px', width: 'fit-content', justifyContent: isMobile ? 'center' : 'flex-start' },
    statItem: { h3: { fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#fff', display:'flex', alignItems:'center', gap:'8px' }, p: { margin: 0, fontSize: '0.85rem', color: '#64748b' } },
    divider: { width: '1px', height: '35px', background: '#334155' },

    // Dev Section
    devSection: { display: 'flex', flexDirection: 'column', gap: '15px', alignItems: isMobile ? 'center' : 'flex-start' },
    devProfile: { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' },
    avatar: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize:'1rem' },
    socialBtn: { color: '#94a3b8', fontSize: '1.2rem', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.1)', color: '#fff' } },
    
    // STEMROBO LINK SECTION
    stemLink: { marginTop: '5px', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5' },
    stemAnchor: { color: '#3b82f6', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s' },

    copyright: { color: '#475569', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' },

    // Right Side
    formSection: { 
        flex: 1, 
        zIndex: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: isMobile ? '20px 20px 60px' : '40px' 
    },
    glassCard: { 
        width: isMobile ? '100%' : '400px', // Fluid Width on Mobile
        maxWidth: '400px',
        padding: isMobile ? '30px 20px' : '40px', 
        borderRadius: '24px', 
        background: 'rgba(17, 24, 39, 0.7)', 
        backdropFilter: 'blur(20px)', 
        border: '1px solid rgba(255, 255, 255, 0.08)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
    },
    cardHeader: { marginBottom: '30px', textAlign: 'center' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    row: { display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }, // Stack Inputs on Mobile
    inputWrapper: { position: 'relative', flex: 1 },
    icon: { position: 'absolute', left: '16px', top: '16px', color: '#6b7280' },
    input: { width: '100%', padding: '14px 14px 14px 45px', borderRadius: '12px', border: '1px solid #374151', background: 'rgba(3, 7, 18, 0.5)', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' },
    ctaButton: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(to right, #2563eb, #4f46e5)', color: '#fff', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' },
    separator: { textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', margin: '20px 0', position: 'relative' },
    googleButton: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #374151', background: 'transparent', color: '#fff', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
    switchModeContainer: { marginTop: '25px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' },
    switchText: { color: '#9ca3af', fontSize: '0.9rem', margin: 0 },
    switchBtn: { background: 'none', border: 'none', color: '#38bdf8', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', padding: '5px' },
    errorBanner: { background: 'rgba(220, 38, 38, 0.1)', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '15px', textAlign: 'center' }
  };

  return (
    <div style={styles.container}>
      {/* Background Ambience */}
      <div style={styles.orb1}></div>
      <div style={styles.orb2}></div>
      <div style={styles.gridOverlay}></div>

      {/* --- LEFT: BRANDING & INFO --- */}
      <div style={styles.heroSection}>
        
        <div style={styles.contentBox}>
          {/* 1. BADGE */}
          <div style={styles.brandBadge}>
            <FaBolt color="#fbbf24" /> <span>New: Live Circuit Simulator</span>
          </div>
          
          {/* 2. BRAND NAME WITH LOGO */}
          <div style={styles.logoHeader}>
            <img src={logo} alt="ZylixCode Logo" style={styles.logoImage} />
            <h1 style={styles.mainTitle}>ZylixCode <span style={{color: '#3b82f6'}}>Cloud</span></h1>
          </div>

          {/* 3. HEADLINE */}
          <h2 style={styles.subHeadline}>
            Simulate & Build <span style={styles.gradientText}>At Warp Speed.</span>
          </h2>
          
          {/* 4. THE PITCH */}
          <p style={styles.subtext}>
            The Ultimate Cloud IDE. <strong>No Hardware? No Problem.</strong> Design and test complex circuits with our 
            <span style={{color: '#fff', fontWeight: '600'}}> built-in Simulator</span> instantly. 
            Write code, visualize results in real-time, and flash physical boards only when you're ready. 
            <br /><br />
            No Drivers. No Cables. Just Pure Innovation.
          </p>

          {/* 5. STATS ROW */}
          <div style={styles.statsRow}>
            <div style={styles.statItem}>
              <h3><FaMagic size={20} color="#a855f7"/> Live</h3> <p>Simulator</p>
            </div>
            <div style={styles.divider}></div>
            <div style={styles.statItem}>
              <h3>0s</h3> <p>Setup Time</p>
            </div>
            <div style={styles.divider}></div>
            <div style={styles.statItem}>
              <h3>1-Click</h3> <p>Flash Code</p>
            </div>
          </div>

          {/* Developer & Copyright Section */}
          <div style={styles.devSection}>
            <div style={styles.devProfile}>
                <div style={styles.avatar}>AZ</div>
                <div>
                <p style={{fontSize: '0.7rem', color: '#94a3b8', margin: 0, textTransform:'uppercase', letterSpacing:'1px'}}>Developed & Maintained by</p>
                <h4 style={{fontSize: '1.1rem', color: '#fff', margin: '2px 0'}}>Atif Ziya</h4>
                </div>
                <a href="https://linkedin.com/in/atifziya" target="_blank" rel="noreferrer" style={styles.socialBtn}><FaLinkedin /></a>
                <a href="https://github.com" target="_blank" rel="noreferrer" style={styles.socialBtn}><FaGithub /></a>
            </div>

            {/* *** NEW: STEMROBO MENTION *** */}
            <div style={styles.stemLink}>
                Innovated by developers from <br />
                <a href="https://www.stemrobo.com" target="_blank" rel="noreferrer" style={styles.stemAnchor}>
                   <FaBuilding style={{marginBottom: '-2px', marginRight: '4px'}}/> STEMROBO Technology Ltd. ↗
                </a>
            </div>

            <div style={styles.copyright}>
                <FaCopyright /> 2026 Atif Ziya. All Rights Reserved.
            </div>
          </div>

        </div>
      </div>

      {/* --- RIGHT: AUTH FORM --- */}
      <div style={styles.formSection}>
        <div style={styles.glassCard}>
          <div style={styles.cardHeader}>
            <h2>{isRegistering ? 'Join the Revolution' : 'Welcome Back'}</h2>
            <p>{isRegistering ? 'Start simulating in seconds.' : 'Login to access your workspace.'}</p>
          </div>

          {error && <div style={styles.errorBanner}>{error}</div>}

          <form onSubmit={handleAuth} style={styles.form}>
            {isRegistering && (
              <div style={styles.row}>
                <div style={styles.inputWrapper}>
                  <FaUser style={styles.icon} />
                  <input type="text" placeholder="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)} style={styles.input} required/>
                </div>
                <div style={styles.inputWrapper}>
                  <FaPhone style={styles.icon} />
                  <input type="tel" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} style={styles.input} required/>
                </div>
              </div>
            )}
            
            <div style={styles.inputWrapper}>
              <FaEnvelope style={styles.icon} />
              <input type="email" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} style={styles.input} required/>
            </div>
            
            <div style={styles.inputWrapper}>
              <FaLock style={styles.icon} />
              <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={styles.input} required/>
            </div>

            <button type="submit" style={styles.ctaButton} disabled={loading}>
              {loading ? 'Processing...' : (isRegistering ? 'Start Coding Now' : 'Access Workspace')} <FaArrowRight />
            </button>
          </form>

          <div style={styles.separator}><span>or continue with</span></div>

          <button onClick={() => signInWithPopup(auth, googleProvider)} style={styles.googleButton}>
            <FaGoogle /> Google
          </button>

          <div style={styles.switchModeContainer}>
            <p style={styles.switchText}>
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button onClick={() => setIsRegistering(!isRegistering)} style={styles.switchBtn}>
              {isRegistering ? 'Login Here' : 'Create Free Account'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LandingPage;
