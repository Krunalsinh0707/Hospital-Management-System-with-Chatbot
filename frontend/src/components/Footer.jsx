import React from 'react';
import { Share2, Link2, GitBranch } from 'lucide-react';
import mainLogo from '../assets/logo.png';
import './Footer.css';

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-main">
      {/* Brand */}
      <div className="footer-col brand-col">
        <div className="footer-logo">
          <img src={mainLogo} alt="Health Analyzer" className="footer-logo-img" />
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
        <h4>Product</h4>
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
        <h4>Company</h4>
        <ul>
          <li><a href="#">About Us</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">Press</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>

      {/* Legal */}
      <div className="footer-col">
        <h4>Legal & Support</h4>
        <ul>
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms of Service</a></li>
          <li><a href="#">HIPAA Compliance</a></li>
          <li><a href="#">Security</a></li>
          <li><a href="#">Help Center</a></li>
        </ul>
      </div>
    </div>

    <div className="footer-bottom">
      <span>© 2025 Health Analyzer. All rights reserved.</span>
      <span>Built for the future of medicine.</span>
    </div>
  </footer>
);

export default Footer;
