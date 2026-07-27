import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, X, FileText, Lock, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Footer() {
  const [modalContent, setModalContent] = useState<{ title: string; icon: any; body: string } | null>(null);

  const legalDocs = {
    aup: {
      title: "Acceptable Use Policy",
      icon: Scale,
      body: `TriageTalon is designed strictly for authorized security research, bug bounty hunting within permissible program scopes, and defensive attack surface auditing.

By using TriageTalon (CLI, Web Scanner, or API), you agree to:
1. Only target domains, IP ranges, and infrastructure that you own or have explicit authorization to scan.
2. Comply with the terms and scope rules of bug bounty platforms (e.g., HackerOne, Bugcrowd, Intigriti).
3. Refrain from attempting Denial of Service (DoS), intrusive exploitation, or data exfiltration.
4. Not use TriageTalon for unlawful reconnaissance or malicious activities.

Violations of this policy may result in immediate revocation of API access keys.`
    },
    mit: {
      title: "MIT License",
      icon: FileText,
      body: `MIT License

Copyright (c) 2026 BMNTR

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`
    },
    privacy: {
      title: "Privacy Notice",
      icon: Lock,
      body: `TriageTalon values user privacy and security data integrity.

Our Data Handling Principles:
1. Zero Scan Storage: The public web scanner and API process domain targets statelessly in memory. Scan results are returned directly to the requester and are not logged or stored in any central database.
2. Local Storage Only: Recent scan history in the Scanner Dashboard is saved purely in your browser's local storage (localStorage) and never leaves your device.
3. No Third-Party Tracking: We do not sell, rent, or share telemetry data with advertisers or analytics brokers.
4. API Key Confidentiality: Your RapidAPI key is passed directly via encrypted HTTPS headers directly to the API endpoint and is never saved on frontend servers.`
    }
  };

  return (
    <>
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
                <a href="https://github.com/BMNTR/TriageTalon#api-integration" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink-strong)] transition-colors flex items-center gap-1.5">
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
              <li>
                <button 
                  onClick={() => setModalContent(legalDocs.aup)}
                  className="hover:text-[var(--ink-strong)] text-left transition-colors cursor-pointer"
                >
                  Acceptable Use
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setModalContent(legalDocs.mit)}
                  className="hover:text-[var(--ink-strong)] text-left transition-colors cursor-pointer"
                >
                  MIT License
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setModalContent(legalDocs.privacy)}
                  className="hover:text-[var(--ink-strong)] text-left transition-colors cursor-pointer"
                >
                  Privacy Notice
                </button>
              </li>
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

      {/* Interactive Legal Modal */}
      <AnimatePresence>
        {modalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-lg max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4 mb-4">
                <div className="flex items-center gap-2.5 font-bold text-lg text-[var(--ink-strong)]">
                  <modalContent.icon className="w-5 h-5 text-[var(--primary)]" />
                  {modalContent.title}
                </div>
                <button 
                  onClick={() => setModalContent(null)}
                  className="p-1 rounded-md text-[var(--mute)] hover:text-white hover:bg-[var(--canvas)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="body-sm text-[var(--canvas-text-soft)] whitespace-pre-line overflow-y-auto max-h-[60vh] pr-2 font-mono leading-relaxed">
                {modalContent.body}
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--hairline)] flex justify-end">
                <button 
                  onClick={() => setModalContent(null)}
                  className="btn button-primary px-6 py-2 text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
