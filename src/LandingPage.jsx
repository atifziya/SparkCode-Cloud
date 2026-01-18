// src/LandingPage.jsx
import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, googleProvider, db } from './firebase';
import { FaGoogle, FaMicrochip, FaBolt, FaLinkedin, FaGithub, FaArrowRight, FaUser, FaLock, FaEnvelope, FaPhone, FaCopyright } from 'react-icons/fa';

const LandingPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={styles.container}>
      {/* Background Ambience */}
      <div style={styles.orb1}></div>
      <div style={styles.orb2}></div>
      <div style={styles.gridOverlay}></div>

      {/* --- LEFT: BRANDING & INFO --- */}
      <div style={styles.heroSection}>
        
        <div style={styles.contentBox}>
          {/* 1. BADGE (Top) */}
          <div style={styles.brandBadge}>
            <FaBolt color="#fbbf24" /> <span>v5.0 Stable Release</span>
          </div>
          
          {/* 2. BRAND NAME (Biggest Text) */}
          <div style={styles.logoHeader}>
            <div style={styles.logoIconBox}>
              <FaMicrochip size={35} color="#fff" />
            </div>
            <h1 style={styles.mainTitle}>SparkCode <span style={{color: '#3b82f6'}}>Cloud</span></h1>
          </div>

          {/* 3. HEADLINE (Smaller than Brand) */}
          <h2 style={styles.subHeadline}>
            Build Hardware <span style={styles.gradientText}>At Warp Speed.</span>
          </h2>
          
          <p style={styles.subtext}>
            The Ultimate Agentless Arduino IDE. Write code, manage libraries, 
            compile in the cloud, and flash directly from your browser. 
            No drivers. No hassle.
          </p>

          {/* 4. STATS ROW (Restored) */}
          <div style={styles.statsRow}>
            <div style={styles.statItem}>
              <h3>100%</h3> <p>Web Based</p>
            </div>
            <div style={styles.divider}></div>
            <div style={styles.statItem}>
              <h3>0s</h3> <p>Setup Time</p>
            </div>
            <div style={styles.divider}></div>
            <div style={styles.statItem}>
              <h3>AWS</h3> <p>Powered</p>
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
                <a href="https://linkedin.com/in/atifziya" target="_blank" style={styles.socialBtn}><FaLinkedin /></a>
                <a href="https://github.com" target="_blank" style={styles.socialBtn}><FaGithub /></a>
            </div>
            <div style={styles.copyright}>
                <FaCopyright /> 2024 Atif Ziya. All Rights Reserved.
            </div>
          </div>

        </div>
      </div>

      {/* --- RIGHT: AUTH FORM --- */}
      <div style={styles.formSection}>
        <div style={styles.glassCard}>
          <div style={styles.cardHeader}>
            <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
            <p>{isRegistering ? 'Join the community today.' : 'Enter details to access workspace.'}</p>
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
              {loading ? 'Processing...' : (isRegistering ? 'Sign Up Now' : 'Access Workspace')} <FaArrowRight />
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
              {isRegistering ? 'Login Here' : 'Create Account'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    display: 'flex', height: '100vh', width: '100vw', 
    backgroundColor: '#030712', color: '#fff', fontFamily: "'Inter', sans-serif", 
    position: 'relative', overflow: 'hidden'
  },
  
  // Background
  gridOverlay: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 },
  orb1: { position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 },
  orb2: { position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 },

  // Left Side
  heroSection: { flex: 1.3, zIndex: 2, display: 'flex', flexDirection: 'column', padding: '0 80px', justifyContent:'center' },
  contentBox: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  
  // Badge
  brandBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '6px 14px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '600', width: 'fit-content', marginBottom: '20px', border: '1px solid rgba(251, 191, 36, 0.2)' },
  
  // Main Brand Name (Biggest)
  logoHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' },
  logoIconBox: { width: '55px', height: '55px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)' },
  mainTitle: { fontSize: '4rem', fontWeight: '800', margin: 0, letterSpacing: '-1.5px', color: '#fff', lineHeight: '1' },

  // Sub Headline
  subHeadline: { fontSize: '2.5rem', fontWeight: '700', margin: '15px 0', letterSpacing: '-0.5px', color: '#e2e8f0' },
  gradientText: { background: 'linear-gradient(to right, #3b82f6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  
  subtext: { fontSize: '1.1rem', color: '#94a3b8', lineHeight: '1.6', maxWidth: '550px', marginBottom: '40px' },

  // Stats Row
  statsRow: { display: 'flex', gap: '25px', alignItems: 'center', marginBottom: '50px', borderTop: '1px solid #1e293b', paddingTop: '30px', width: 'fit-content' },
  statItem: { h3: { fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#fff' }, p: { margin: 0, fontSize: '0.85rem', color: '#64748b' } },
  divider: { width: '1px', height: '35px', background: '#334155' },

  // Dev Section
  devSection: { display: 'flex', flexDirection: 'column', gap: '15px' },
  devProfile: { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' },
  avatar: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize:'1rem' },
  socialBtn: { color: '#94a3b8', fontSize: '1.2rem', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.1)', color: '#fff' } },
  copyright: { color: '#475569', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' },

  // Right Side
  formSection: { flex: 1, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  glassCard: { width: '400px', padding: '40px', borderRadius: '24px', background: 'rgba(17, 24, 39, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
  cardHeader: { marginBottom: '30px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  row: { display: 'flex', gap: '10px' },
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

export default LandingPage;