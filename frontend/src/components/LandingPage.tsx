import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Pricing from './Pricing';

const heroLines = [
  { text: "$ talon -l scope.txt", class: "text-[var(--primary)]", delay: 800 },
  { text: "[*] TriageTalon initialized. Scanning 3 targets...", class: "text-[var(--mute)]", delay: 400 },
  { text: "", delay: 200 },
  { text: "[*] Scanning: shop.example.com", class: "text-[var(--mute)]", delay: 500 },
  { text: "    -> Grade: A | Subdomains: 3", class: "text-[#525252]", delay: 300 },
  { text: "", delay: 200 },
  { text: "[*] Scanning: api.example.com", class: "text-[var(--mute)]", delay: 500 },
  { text: "    -> Grade: B | Subdomains: 1", class: "text-[#525252]", delay: 300 },
  { text: "", delay: 200 },
  { text: "[*] Scanning: legacy.example.com", class: "text-[var(--mute)]", delay: 500 },
  { text: "    -> Grade: F | Subdomains: 47", class: "text-[#facc15]", delay: 400 },
  { text: "    -> [!] Weak security headers", class: "text-[#ef4444]", delay: 200 },
  { text: "    -> SPF: MISSING", class: "text-[#525252]", delay: 200 },
  { text: "    -> [!!!] Exposed .env found", class: "text-[#ef4444]", delay: 200 }
];

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div 
      className="card-feature relative overflow-hidden group border-[var(--hairline)] hover:border-[var(--body)] transition-colors duration-300"
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight Hover Effect */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 62, 0, 0.08), transparent 40%)`
        }}
      />
      <div className="relative z-10">
        <h3 className="display-sm mb-3 group-hover:text-[var(--ink-strong)] transition-colors">{title}</h3>
        <p className="body-md group-hover:text-[var(--ink)] transition-colors">{desc}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [terminalLines, setTerminalLines] = useState<any[]>([]);

  useEffect(() => {
    let currentLine = 0;
    const renderNext = async () => {
      if (currentLine >= heroLines.length) return;
      const line = heroLines[currentLine];
      setTerminalLines(prev => [...prev, line]);
      currentLine++;
      setTimeout(renderNext, heroLines[currentLine]?.delay || 0);
    };
    renderNext();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* Faded Cyber Grid Background */}
      <div className="bg-grid-pattern h-[800px]"></div>

      <section className="relative z-10 pt-24 px-8 pb-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[600px]">
        <div>
          <motion.span 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="eyebrow-mono"
          >
            Attack Surface Discovery
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="display-xl mb-5 text-[var(--ink-strong)]"
          >
            Hunt where the armor is thinnest.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="body-lg mb-8 max-w-lg"
          >
            TriageTalon is a reconnaissance CLI that grades your scope targets from A to F in under 2 seconds. Skip hardened infrastructure. Focus on what's exploitable.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/scanner" className="btn button-primary flex items-center justify-center">Launch Scanner</Link>
            <a href="https://github.com/BMNTR/TriageTalon" target="_blank" rel="noopener noreferrer" className="btn button-outline-on-dark flex items-center justify-center">View Source</a>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="code-mockup shadow-2xl relative group border-[var(--hairline)] hover:border-[var(--body)] transition-colors duration-500"
        >
          {/* Subtle glow behind terminal */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-transparent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-1000 -z-10"></div>
          
          <div className="code-mockup-bar">
            <div className="dot d1"></div>
            <div className="dot d2"></div>
            <div className="dot d3"></div>
          </div>
          <div className="code-text overflow-x-auto whitespace-pre">
            {terminalLines.map((line, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={line.class || ""}
              >
                {line.text === "" ? <br /> : line.text}
              </motion.div>
            ))}
            <span className="cursor">_</span>
          </div>
        </motion.div>
      </section>

      <div className="dashed-divider relative z-10"></div>

      <section className="relative z-10 py-20 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="eyebrow-mono">Everything You Need</span>
          <h2 className="display-lg">Comprehensive reconnaissance engine.</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            title="Security Grading" 
            desc="Automated A-F scoring based on HTTP response headers." 
          />
          <FeatureCard 
            title="Subdomain Discovery" 
            desc="Live, resolved subdomains returned directly from the API." 
          />
          <FeatureCard 
            title="Sensitive File Detection" 
            desc="Probes for exposed .git directories and .env files." 
          />
        </div>
      </section>

      <div className="dashed-divider relative z-10"></div>

      <div className="relative z-10">
        <Pricing />
      </div>

      <div className="green-divider-band relative z-10"></div>

      <footer className="footer relative z-10 bg-[var(--canvas)] py-10 px-8 border-t border-[var(--hairline)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="16" height="16">
              <circle cx="50" cy="50" r="25" fill="none" stroke="var(--primary)" strokeWidth="12" />
              <circle cx="50" cy="50" r="10" fill="var(--primary)" />
              <line x1="50" y1="0" x2="50" y2="15" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
              <line x1="50" y1="100" x2="50" y2="85" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
              <line x1="0" y1="50" x2="15" y2="50" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
              <line x1="100" y1="50" x2="85" y2="50" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
            </svg>
            TriageTalon
          </div>
          <div className="text-[var(--body)] text-sm">
            Built by <a href="https://github.com/BMNTR" className="hover:text-white transition-colors">BMNTR</a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
