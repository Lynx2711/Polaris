import { PolarisLogo } from "./PolarisLogo";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="ps-footer" id="contact">
      <div className="container">
        <div className="ps-footer__grid">
          {/* Brand Info */}
          <div className="ps-footer__brand">
            <PolarisLogo />
            <p className="ps-footer__copy">
              © {new Date().getFullYear()} Polaris. All rights reserved.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="ps-footer__col">
            <h5 className="ps-footer__col-title">Platform</h5>
            <a href="#about" className="ps-footer__link">About</a>
            <a href="#features" className="ps-footer__link">Features</a>
            <a href="http://localhost:5174/login" className="ps-footer__link">Dashboard</a>
            <a href="#how-it-works" className="ps-footer__link">How It Works</a>
          </div>

          {/* Links Column 2 */}
          <div className="ps-footer__col">
            <h5 className="ps-footer__col-title">Resources</h5>
            <a href="#documentation" className="ps-footer__link">Documentation</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="ps-footer__link">GitHub</a>
            <a href="#tech" className="ps-footer__link">Technology Stack</a>
          </div>

          {/* Links Column 3 */}
          <div className="ps-footer__col">
            <h5 className="ps-footer__col-title">Legal & Contact</h5>
            <a href="/contact" className="ps-footer__link">Contact Support</a>
            <a href="#privacy" className="ps-footer__link">Privacy Policy</a>
            <a href="#terms" className="ps-footer__link">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
