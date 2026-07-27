import { Link } from 'react-router-dom';
import { Shield, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 bg-[var(--canvas)] text-[var(--ink)] border-t border-[var(--hairline)] pt-16 pb-12 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
        
        {/* Brand & Status Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="font-bold flex items-center gap-2 text-lg text-[var(--ink-strong)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="20" height="20">
              <circle cx="50" cy="50" r="25" fill="none" stroke="var(--primary)" strokeWidth="12" />
              <circle cx="50" cy="50" r="10" fill="var(--primary)" />
              <line x1="50" y1="0" x2="50" y2="15" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
              <line x1="50" y1="100" x2="50" y2="85" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
              <line x1="0" y1="50" x2="15" y2="50" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
              <line x1="100" y1="50" x2="85" y2="50" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
            </svg>
            TriageTalon
          </div>
          <p className="body-sm text-[var(--mute)] max-w-sm">
            High-speed reconnaissance CLI and API engine designed to grade bug bounty targets and prioritize exploitable assets.
          </p>
          
          {/* Operational Status Indicator */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] text-xs font-mono text-[var(--mute)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            All Systems Operational
          </div>
        </div>

        {/* Product Column */}
        <div className="space-y-3">
          <div className="eyebrow-mono text-xs text-[var(--primary)] mb-2">Product</div>
          <ul className="space-y-2 body-sm text-[var(--mute)]">
            <li><Link to="/scanner" className="hover:text-[var(--ink-strong)] transition-colors">Scanner Dashboard</Link></li>
            <li><Link to="/docs" className="hover:text-[var(--ink-strong)] transition-colors">CLI & Documentation</Link></li>
            <li><a href="/#features" className="hover:text-[var(--ink-strong)] transition-colors">Key Features</a></li>
            <li><a href="/#pricing" className="hover:text-[var(--ink-strong)] transition-colors">Pricing Tiers</a></li>
          </ul>
        </div>

        {/* Developer & Security Column */}
        <div className="space-y-3">
          <div className="eyebrow-mono text-xs text-[var(--primary)] mb-2">Resources</div>
          <ul className="space-y-2 body-sm text-[var(--mute)]">
            <li>
              <a href="https://github.com/BMNTR/TriageTalon" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink-strong)] transition-colors flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> GitHub Source
              </a>
            </li>
            <li>
              <a href="https://rapidapi.com/bmntrs-projects-bmntrs-projects/api/ultimate-attack-surface-recon-api" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink-strong)] transition-colors flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> RapidAPI Hub
              </a>
            </li>
            <li>
              <a href="https://github.com/BMNTR/TriageTalon/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink-strong)] transition-colors flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Security Policy
              </a>
            </li>
            <li>
              <a href="https://github.com/BMNTR/TriageTalon/issues" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink-strong)] transition-colors">
                Report an Issue
              </a>
            </li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className="space-y-3">
          <div className="eyebrow-mono text-xs text-[var(--primary)] mb-2">Legal</div>
          <ul className="space-y-2 body-sm text-[var(--mute)]">
            <li><span className="hover:text-[var(--ink-strong)] cursor-pointer transition-colors" title="For passive reconnaissance use only">Acceptable Use</span></li>
            <li><span className="hover:text-[var(--ink-strong)] cursor-pointer transition-colors" title="Standard MIT License">MIT License</span></li>
            <li><span className="hover:text-[var(--ink-strong)] cursor-pointer transition-colors">Privacy Notice</span></li>
          </ul>
        </div>

      </div>

      <div className="dashed-divider mb-8"></div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 body-sm text-[var(--mute)]">
        <div>
          © {new Date().getFullYear()} TriageTalon. All rights reserved.
        </div>
        <div>
          Engineered for researchers by <a href="https://github.com/BMNTR" target="_blank" rel="noopener noreferrer" className="text-[var(--ink)] hover:text-[var(--primary)] transition-colors font-medium">BMNTR</a>
        </div>
      </div>
    </footer>
  );
}
