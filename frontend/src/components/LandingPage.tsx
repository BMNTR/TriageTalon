import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Pricing from './Pricing';
import { Target, Zap, Award, ChevronDown, CheckCircle2, Copy } from 'lucide-react';
import { useToast } from '../context/ToastContext';

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

const faqs = [
  {
    q: "What exactly does the engine check?",
    a: "TriageTalon checks for modern HTTP security headers, DNS misconfigurations (SPF/DMARC records), and performs lightweight path brute-forcing for exposed sensitive files like .env or .git/config."
  },
  {
    q: "Is this an active vulnerability scanner?",
    a: "No. TriageTalon is a passive and lightweight reconnaissance tool. It does not send intrusive payloads, perform SQL injection, or attempt exploitation, making it perfectly safe for broad scope discovery."
  },
  {
    q: "Do I need an API key for the CLI?",
    a: "The basic CLI works completely locally without an API key. However, utilizing our cloud-based engine for large-scale automation requires an active RapidAPI subscription key."
  }
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

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Code snippet copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-mockup relative group shadow-2xl border-[var(--hairline)] hover:border-[var(--body)] transition-colors duration-500">
      <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-transparent opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-1000 -z-10"></div>
      <div className="code-mockup-bar">
        <div className="dot d1"></div>
        <div className="dot d2"></div>
        <div className="dot d3"></div>
      </div>
      <button 
        onClick={handleCopy}
        className="absolute top-3 right-3 text-[var(--mute)] hover:text-[var(--primary)] transition-colors opacity-0 group-hover:opacity-100 p-1 bg-[var(--canvas)] rounded-md border border-transparent hover:border-[var(--hairline)] z-20"
        title="Copy to clipboard"
      >
        {copied ? <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> : <Copy className="w-4 h-4" />}
      </button>
      <div className="code-text overflow-x-auto pr-8 text-[var(--canvas-text-soft)]">
        {code}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [terminalLines, setTerminalLines] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

      {/* Hero Section */}
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

      {/* Features Section */}
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

      {/* How it Works Section */}
      <section className="relative z-10 py-20 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="eyebrow-mono text-[var(--primary)]">Workflow</span>
          <h2 className="display-lg">How it works in practice.</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] flex items-center justify-center mb-6 text-[var(--primary)]">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="display-sm mb-3">1. Input Targets</h3>
            <p className="body-md">Provide a single domain or feed thousands of scopes via a text file.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] flex items-center justify-center mb-6 text-[var(--primary)]">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="display-sm mb-3">2. Lightning Recon</h3>
            <p className="body-md">Our engine concurrently resolves DNS records and probes HTTP infrastructure.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] flex items-center justify-center mb-6 text-[var(--primary)]">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="display-sm mb-3">3. Actionable Grading</h3>
            <p className="body-md">Receive deterministic A-F grades instantly to prioritize your bug hunting.</p>
          </div>
        </div>
      </section>

      <div className="dashed-divider relative z-10"></div>

      {/* Developer API Section */}
      <section className="relative z-10 py-24 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1">
          <CodeBlock 
            code={`import requests

url = "https://ultimate-attack-surface-recon-api.p.rapidapi.com/scan"
querystring = {"domain":"hackerone.com"}

headers = {
  "x-rapidapi-key": "YOUR_API_KEY",
  "x-rapidapi-host": "ultimate-attack-surface-recon-api.p.rapidapi.com"
}

response = requests.get(url, headers=headers, params=querystring)
print(response.json())`} 
          />
        </div>
        <div className="order-1 lg:order-2">
          <span className="eyebrow-mono text-[var(--primary)]">Developer First</span>
          <h2 className="display-lg mb-5">Integrate anywhere.</h2>
          <p className="body-lg mb-8">
            TriageTalon isn't just a CLI. It's powered by a blazing fast API that you can embed directly into your CI/CD pipelines, Discord bots, or custom automation scripts.
          </p>
          <ul className="space-y-4 body-md mb-8 text-[var(--mute)]">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" /> Built for extreme concurrency.
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" /> Returns standardized JSON schema.
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" /> Backed by RapidAPI infrastructure.
            </li>
          </ul>
          <Link to="/docs" className="text-[var(--primary)] hover:text-white transition-colors flex items-center gap-2 font-mono text-sm uppercase tracking-widest font-semibold">
            Read the Documentation &rarr;
          </Link>
        </div>
      </section>

      <div className="dashed-divider relative z-10"></div>

      <div className="relative z-10">
        <Pricing />
      </div>

      <div className="dashed-divider relative z-10"></div>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 px-8 max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <span className="eyebrow-mono">FAQ</span>
          <h2 className="display-lg">Frequently Asked Questions</h2>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-[var(--hairline)] bg-[var(--canvas-soft)] rounded-md overflow-hidden">
              <button 
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="body-md-strong">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-[var(--mute)] transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-5 pt-1 text-[var(--mute)] body-sm border-t border-[var(--hairline)] mt-2">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <div className="green-divider-band relative z-10"></div>
    </motion.div>
  );
}
