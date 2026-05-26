import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlowButton from '../components/GlowButton';
import Footer from '../components/Footer';
import {
  Brain, Cpu, FileText, Shield, LayoutDashboard, Globe,
  Activity, Heart, Zap, Lock,
  ArrowRight, Star, Upload, CheckCircle, BarChart3
} from 'lucide-react';
import healthHero from '../assets/health_hero.png';
import dnaStrand from '../assets/dna_strand.png';
import heartHands from '../assets/heart_hands.png';
import heartEcg from '../assets/heart_ecg.png';
import medicalCross from '../assets/medical_cross.png';
import mainLogo from '../assets/logo.png';
import { mlService } from '../services/mlService';
import './Landing.css';

// --- ANIMATED COUNTER HOOK ---
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

// --- COUNTER COMPONENT ---
const Counter = ({ value, suffix, label, inView }) => {
  const num = useCounter(value, 2000, inView);
  return (
    <div className="impact-item">
      <h2 className="impact-number">{num.toLocaleString()}{suffix}</h2>
      <p className="impact-label">{label}</p>
    </div>
  );
};

// --- SECTION WRAPPER (fade-up on scroll) ---
const Section = ({ children, className = '', delay = 0, id }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
};

// ===========================
// LANDING PAGE COMPONENT
// ===========================
const Landing = () => {
  const navigate = useNavigate();
  const impactRef = useRef(null);
  const impactInView = useInView(impactRef, { once: true });

  const handleDemoPredict = () => {
    navigate('/ml-studio');
  };

  return (
    <div className="landing-page">
      <div className="bg-particles"></div>

      {/* ── NAV ── */}
      <nav className="landing-nav glass-panel">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={mainLogo} alt="Health Analyzer" className="main-logo-img" />
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <span onClick={() => navigate('/ml-studio')} style={{cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 500}}>Machine Learning</span>
          <a href="#testimonials">Testimonials</a>
        </div>
        <div className="nav-actions">
          <GlowButton variant="outline" onClick={() => navigate('/login')}>Sign In</GlowButton>
          <GlowButton onClick={() => navigate('/register')}>Get Started</GlowButton>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="badge-glow text-[#0F9D8A] bg-teal-50 border-teal-100">🧬 Next-Gen Medical AI</div>
          <h1 className="text-slate-900">
            Predictive Healthcare,<br />
            <span className="text-[#0F9D8A]">Zero Gravity Workflow.</span>
          </h1>
          <p>
            Upload patient scans, analyze neurological data, and uncover hidden risk
            factors using our advanced neural engine in under 60 seconds.
          </p>
          <div className="hero-actions">
            <GlowButton onClick={() => navigate('/register')} className="hero-btn">Get Started <ArrowRight size={18} /></GlowButton>
            <GlowButton variant="outline" className="hero-btn" onClick={() => navigate('/login')}>Sign In</GlowButton>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="floating-sphere sphere-1"></div>
          <div className="floating-sphere sphere-2"></div>

          {/* Hero photo */}
          <motion.div
            className="hero-photo-wrap"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src={healthHero} alt="Be Healthy" className="hero-photo" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS BAR ── */}
      <motion.div
        className="stats-bar glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {[
          { val: '10,000+', label: 'Scans Analyzed' },
          { val: '98.7%', label: 'Accuracy Rate' },
          { val: '500+', label: 'Hospitals' },
          { val: '24/7', label: 'AI Support' },
        ].map((s, i) => (
          <div key={i} className="stat-bar-item">
            <span className="stat-bar-val">{s.val}</span>
            <span className="stat-bar-label">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* ── HOW IT WORKS ── */}
      <Section className="section how-it-works" id="how-it-works">
        <div className="section-header">
          <p className="section-badge">Simple Process</p>
          <h2>How Health Analyzer Works</h2>
          <p className="section-sub">Three steps from upload to clinical insight</p>
        </div>
        <div className="steps-flow">
          {[
            { icon: <Upload size={32} color="#2DD4BF" />, step: '01', title: 'Upload Patient Scan', desc: 'Drag-and-drop MRI, CT, X-ray, or DICOM files. Supports PDF lab reports too.' },
            { icon: <Cpu size={32} color="#0EA5E9" />, step: '02', title: 'AI Neural Analysis', desc: 'Our deep learning engine processes your data across 150+ disease patterns in real-time.' },
            { icon: <FileText size={32} color="#10B981" />, step: '03', title: 'Get Risk Report', desc: 'Receive a detailed clinical report with risk scores, recommendations, and specialist referrals.' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              <motion.div
                className="step-card glass-panel"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                whileHover={{ y: -6 }}
              >
                <div className="step-number">{s.step}</div>
                <div className="step-icon-wrap">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.div>
              {i < 2 && <div className="step-connector"><ArrowRight size={24} color="#2DD4BF" /></div>}
            </React.Fragment>
          ))}
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section className="section features-section" id="features">
        <div className="section-header">
          <p className="section-badge">Core Capabilities</p>
          <h2>Built for Clinical Excellence</h2>
          <p className="section-sub">Everything you need for next-generation diagnostics</p>
        </div>

        {/* DNA visual accent */}
        <motion.div
          className="features-dna-banner"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img src={dnaStrand} alt="DNA Strand" className="dna-img" />
        </motion.div>

        <div className="features-grid">
          {[
            { icon: <Brain size={28} />, title: 'Neural Scan Analysis', desc: 'Deep learning models detect abnormalities in MRI, CT, and X-ray scans with 98.7% accuracy.' },
            { icon: <BarChart3 size={28} />, title: 'Risk Factor Detection', desc: 'Identifies hidden cardiovascular, neurological, and metabolic risk factors from patient data.' },
            { icon: <Zap size={28} />, title: 'Real-Time Diagnostics', desc: 'Results in under 60 seconds. No waiting, no delays, instant clinical insights for your team.' },
            { icon: <Lock size={28} />, title: 'HIPAA Compliant', desc: 'End-to-end encrypted. Patient data never leaves your secure environment. Fully auditable.' },
            { icon: <LayoutDashboard size={28} />, title: 'Doctor Dashboard', desc: 'Intuitive interface built for clinicians. Track patients, manage reports, and collaborate.' },
            { icon: <Globe size={28} />, title: 'Multi-Language Support', desc: 'Available in 40+ languages, making Health Analyzer accessible to global healthcare teams everywhere.' },
          ].map((f, i) => (
            <motion.div
              key={i}
              className="feature-card glass-panel"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(45,212,191,0.15)' }}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── IMPACT STATS ── */}
      <Section className="section impact-section" ref={impactRef}>
        <div ref={impactRef} className="impact-inner">
          <p className="section-badge light">Proven Results</p>
          <h2>Transforming Healthcare at Scale</h2>
          <div className="impact-grid">
            <Counter value={2400000} suffix="+" label="Patient Records Processed" inView={impactInView} />
            <Counter value={150} suffix="+" label="Disease Patterns Detected" inView={impactInView} />
            <Counter value={60} suffix="s" label="Average Analysis Time" inView={impactInView} />
            <Counter value={99} suffix=".9%" label="Uptime Guaranteed" inView={impactInView} />
          </div>
          {/* ECG visual */}
          <motion.div
            className="impact-ecg-wrap"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <img src={heartEcg} alt="Heart ECG" className="impact-ecg-img" />
          </motion.div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <Section className="section testimonials-section" id="testimonials">
        <div className="section-header">
          <p className="section-badge">Testimonials</p>
          <h2>Trusted by Leading Clinicians</h2>
          <p className="section-sub">Hear from doctors saving lives with Health Analyzer</p>
        </div>
        {/* Heart in hands visual */}
        <motion.div
          className="testimonial-photo-row"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <img src={heartHands} alt="Heart in Hands" className="testimonial-heart-img" />
        </motion.div>
        <div className="testimonials-grid">
          {[
            { quote: 'Health Analyzer caught a tumor marker our team missed in 3 rounds of review. It\'s now integral to our workflow.', name: 'Dr. Priya Sharma', role: 'Neurologist, Apollo Hospitals' },
            { quote: 'We reduced diagnostic turnaround by 70% in our radiology department. The ROI was immediate and undeniable.', name: 'Dr. James Osei', role: 'Radiologist, NHS UK' },
            { quote: 'The risk prediction model has transformed how we manage high-risk patients. An incredible tool for cardiologists.', name: 'Dr. Mei Lin', role: 'Cardiologist, Singapore General' },
          ].map((t, i) => (
            <motion.div
              key={i}
              className="testimonial-card glass-panel"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ y: -4 }}
            >
              <div className="stars">{[...Array(5)].map((_, j) => <Star key={j} size={16} fill="#F59E0B" color="#F59E0B" />)}</div>
              <p className="testimonial-quote">"{t.quote}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.name[0]}{t.name.split(' ')[2]?.[0]}</div>
                <div>
                  <h4>{t.name}</h4>
                  <span>{t.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── TRUSTED BY ── */}
      <Section className="section trusted-section">
        <p className="trusted-label">Trusted by world-class institutions</p>
        <div className="logo-row">
          {['Apollo', 'NHS', 'Mayo Clinic', 'AIIMS', 'Johns Hopkins'].map((l, i) => (
            <motion.div
              key={i}
              className="hospital-logo"
              whileHover={{ scale: 1.05, opacity: 1 }}
            >
              <span>{l}</span>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section className="section demo-section" id="demo">
        <div className="section-header">
          <p className="section-badge">Neural Intelligence</p>
          <h2>Advanced Machine Learning Studio</h2>
          <p className="section-sub">Experience the power of custom clinical models with our high-fidelity training environment.</p>
        </div>
        
        <div className="demo-container glass-panel">
          <div className="demo-promo-grid">
            <div className="promo-text">
              <h3>Supervised Learning Demo</h3>
              <p>Upload clinical datasets in CSV format to train, test, and evaluate custom diagnostic models. Visualize accuracy, precision, and recall metrics in real-time.</p>
              <div className="promo-features">
                <div className="p-feat"><CheckCircle size={16} /> Random Forest Architecture</div>
                <div className="p-feat"><CheckCircle size={16} /> Automated Preprocessing</div>
                <div className="p-feat"><CheckCircle size={16} /> Real-time Performance Metrics</div>
              </div>
              <GlowButton onClick={() => navigate('/ml-studio')} className="promo-btn">
                Launch ML Studio <ArrowRight size={18} />
              </GlowButton>
            </div>
            <div className="promo-visual">
              <div className="neural-abstract">
                <div className="n-circle c1"></div>
                <div className="n-circle c2"></div>
                <div className="n-circle c3"></div>
                <Cpu size={80} className="n-icon" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="section cta-section">
        <div className="cta-inner glass-panel">
          <motion.div
            className="cta-photo-wrap"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img src={medicalCross} alt="Medical AI" className="cta-photo" />
          </motion.div>
          <h2>Ready to Transform Your Practice?</h2>
          <p>Join 500+ hospitals using Health Analyzer to save lives every day</p>
          <div className="cta-actions">
            <GlowButton onClick={() => navigate('/register')} className="cta-btn">Start Free Trial</GlowButton>
            <GlowButton variant="outline" className="cta-btn">Book a Demo</GlowButton>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
};

export default Landing;
