import React from 'react';
import { Share2, Link2, GitBranch } from 'lucide-react';
import mainLogo from '../assets/logo.png';
import VERSION_CONFIG from '../config/versionConfig';
import './Footer.css';

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-main">
      {/* Brand */}
      <div className="footer-col brand-col">
        <div className="footer-logo">
          <img src={mainLogo} alt={VERSION_CONFIG.shortName} className="footer-logo-img" />
        </div>
        <p className="footer-tagline">Predictive Healthcare,<br />Zero Gravity Workflow.</p>
        <div className="social-links">
          <a href="#" aria-label="Twitter"><Share2 size={18} /></a>
          <a href="#" aria-label="LinkedIn"><Link2 size={18} /></a>
          <a href="#" aria-label="GitHub"><GitBranch size={18} /></a>
        </div>
      </div>

      {/* Product */}
      <div className="footer-col">
        <h3 className="footer-col-title">Product</h3>
        <ul>
          <li><a href="#">Features</a></li>
          <li><a href="#">Pricing</a></li>
          <li><a href="#">Case Studies</a></li>
          <li><a href="#">API Docs</a></li>
          <li><a href="#">Changelog</a></li>
        </ul>
      </div>

      {/* Company */}
      <div className="footer-col">
        <h3 className="footer-col-title">Company</h3>
        <ul>
          <li><a href="#">About Us</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">Press</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>

      {/* Access Portals */}
      <div className="footer-col">
        <h3 className="footer-col-title">Portals</h3>
        <ul>
          <li><a href="/patient/login">Patient Login</a></li>
          <li><a href="/doctor/login">Doctor Portal</a></li>
          <li><a href="/admin/login">Admin Console</a></li>
          <li><a href="/register">Patient Registration</a></li>
        </ul>
      </div>

      {/* Legal */}
      <div className="footer-col">
        <h3 className="footer-col-title">Legal & Support</h3>
        <ul>
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms of Service</a></li>
          <li><a href="#">HIPAA Compliance</a></li>
          <li><a href="#">Security</a></li>
          <li><a href="#">Help Center</a></li>
        </ul>
      </div>
    </div>

    <div className="footer-bottom flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-xs">
      <span>© {new Date().getFullYear()} {VERSION_CONFIG.shortName}. All rights reserved.</span>
      <span className="font-semibold text-teal-600/80">v{VERSION_CONFIG.version} ({VERSION_CONFIG.environment})</span>
    </div>
  </footer>
);

export default Footer;

