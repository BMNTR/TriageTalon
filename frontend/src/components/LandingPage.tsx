import { useState, useEffect } from 'react';
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

export default function LandingPage({ onNavigate }: { onNavigate: (page: 'scanner') => void }) {
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
    <div>
      <section className="bg-[var(--canvas)] pt-24 px-8 pb-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="eyebrow-mono">Attack Surface Discovery</span>
          <h1 className="display-xl mb-5">Hunt where the armor is thinnest.</h1>
          <p className="body-lg mb-8 max-w-lg">TriageTalon is a reconnaissance CLI that grades your scope targets from A to F in under 2 seconds. Skip hardened infrastructure. Focus on what's exploitable.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => onNavigate('scanner')} className="btn button-primary">Launch Dashboard</button>
            <a href="https://github.com/BMNTR/TriageTalon" target="_blank" rel="noopener noreferrer" className="btn button-outline-on-dark">View Source</a>
          </div>
        </div>
        
        <div className="code-mockup shadow-lg">
          <div className="code-mockup-bar">
            <div className="dot d1"></div>
            <div className="dot d2"></div>
            <div className="dot d3"></div>
          </div>
          <div className="code-text overflow-x-auto whitespace-pre">
            {terminalLines.map((line, idx) => (
              <div key={idx} className={line.class || ""}>
                {line.text === "" ? <br /> : line.text}
              </div>
            ))}
            <span className="cursor">_</span>
          </div>
        </div>
      </section>

      <div className="dashed-divider"></div>

      <section className="py-20 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="eyebrow-mono">Everything You Need</span>
          <h2 className="display-lg">Comprehensive reconnaissance engine.</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-feature">
            <h3 className="display-sm mb-3">Security Grading</h3>
            <p className="body-md">Automated A-F scoring based on HTTP response headers.</p>
          </div>
          <div className="card-feature">
            <h3 className="display-sm mb-3">Subdomain Discovery</h3>
            <p className="body-md">Live, resolved subdomains returned directly from the API.</p>
          </div>
          <div className="card-feature">
            <h3 className="display-sm mb-3">Sensitive File Detection</h3>
            <p className="body-md">Probes for exposed .git directories and .env files.</p>
          </div>
        </div>
      </section>

      <div className="dashed-divider"></div>

      <Pricing />

      <div className="green-divider-band"></div>

      <footer className="footer bg-[var(--canvas)] py-10 px-8 border-t border-[var(--hairline)]">
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
    </div>
  );
}
