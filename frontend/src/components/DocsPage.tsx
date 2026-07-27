import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield, Cpu, Copy, CheckCircle2 } from 'lucide-react';

function CodeBlock({ code, showDots = false }: { code: string, showDots?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-mockup mb-6 relative group">
      {showDots && (
        <div className="code-mockup-bar">
          <div className="dot d1"></div>
          <div className="dot d2"></div>
          <div className="dot d3"></div>
        </div>
      )}
      <button 
        onClick={handleCopy}
        className="absolute top-3 right-3 text-[var(--mute)] hover:text-[var(--primary)] transition-colors opacity-0 group-hover:opacity-100 p-1 bg-[var(--canvas)] rounded-md border border-transparent hover:border-[var(--hairline)]"
        title="Copy to clipboard"
      >
        {copied ? <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> : <Copy className="w-4 h-4" />}
      </button>
      <div className="code-text text-[var(--canvas-text-soft)] overflow-x-auto pr-8">
        {code}
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] pb-20"
    >
      <div className="max-w-4xl mx-auto pt-16 px-8">
        <span className="eyebrow-mono mb-4 text-[var(--primary)]">Documentation</span>
        <h1 className="display-lg mb-4">How TriageTalon Works</h1>
        <p className="body-lg mb-12 border-b border-[var(--hairline)] pb-12">
          TriageTalon is a specialized reconnaissance tool designed to quickly evaluate the attack surface of target domains.
          It is available as both a local Python CLI and a cloud-based API.
        </p>

        {/* Section 1: CLI */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Terminal className="w-6 h-6 text-[var(--primary)]" />
            <h2 className="display-md">CLI Installation & Usage</h2>
          </div>
          <p className="body-md mb-6">
            The TriageTalon CLI allows bug bounty hunters to rapidly score targets directly from their terminal. 
            It requires Python 3.8+ to be installed on your system.
          </p>
          
          <div className="card-feature mb-8">
            <h3 className="body-md-strong mb-4">1. Installation</h3>
            <p className="body-sm mb-4">Install the package directly from PyPI:</p>
            <CodeBlock code="$ pip install triagetalon" />

            <h3 className="body-md-strong mb-4">2. Basic Usage</h3>
            <p className="body-sm mb-4">Scan a single target using the <code className="text-[var(--primary)] bg-[var(--canvas-soft)] px-1 rounded">-t</code> flag:</p>
            <CodeBlock code="$ talon -t hackerone.com" />

            <h3 className="body-md-strong mb-4">3. Bulk Scanning</h3>
            <p className="body-sm mb-4">Provide a text file containing a list of subdomains (one per line) using the <code className="text-[var(--primary)] bg-[var(--canvas-soft)] px-1 rounded">-l</code> flag:</p>
            <CodeBlock code="$ talon -l scope.txt --output results.json" />
          </div>
        </section>

        {/* Section 2: Grading System */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-[var(--primary)]" />
            <h2 className="display-md">The Grading System (A-F)</h2>
          </div>
          <p className="body-md mb-6">
            TriageTalon uses a deterministic scoring algorithm (0-100) based on critical misconfigurations. 
            The goal is not to find every vulnerability, but to highlight infrastructure that lacks basic hygiene.
          </p>
          
          <div className="card-feature space-y-6">
            <div>
              <h3 className="body-md-strong flex items-center gap-2"><span className="text-[var(--primary)] font-mono">1.</span> Security Headers</h3>
              <p className="body-sm text-[var(--mute)] mt-1">
                The engine checks for modern HTTP security headers. Missing <code>Strict-Transport-Security</code>, <code>Content-Security-Policy</code>, or <code>X-Frame-Options</code> will heavily penalize the score.
              </p>
            </div>
            <div className="hairline-divider"></div>
            <div>
              <h3 className="body-md-strong flex items-center gap-2"><span className="text-[var(--primary)] font-mono">2.</span> DNS & Email Spoofing</h3>
              <p className="body-sm text-[var(--mute)] mt-1">
                We query the TXT records of the target. If SPF (Sender Policy Framework) or DMARC records are missing or misconfigured, it indicates potential vulnerability to email spoofing.
              </p>
            </div>
            <div className="hairline-divider"></div>
            <div>
              <h3 className="body-md-strong flex items-center gap-2"><span className="text-[var(--primary)] font-mono">3.</span> Exposed Assets</h3>
              <p className="body-sm text-[var(--mute)] mt-1">
                The scanner performs lightweight path brute-forcing to check if common sensitive files (<code>.env</code>, <code>.git/config</code>) are publicly accessible. A hit results in an automatic F grade.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: API Integration */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="w-6 h-6 text-[var(--primary)]" />
            <h2 className="display-md">API Integration</h2>
          </div>
          <p className="body-md mb-6">
            You can integrate TriageTalon's engine directly into your own automation pipelines using our RapidAPI endpoint.
          </p>
          
          <div className="card-feature">
            <h3 className="body-md-strong mb-4">Authentication</h3>
            <p className="body-sm mb-4">
              All requests require the <code>X-RapidAPI-Key</code> header. You can obtain your key by subscribing on the RapidAPI hub.
            </p>
            
            <CodeBlock 
              showDots={true}
              code={`curl --request GET \\
  --url 'https://ultimate-attack-surface-recon-api.p.rapidapi.com/scan?domain=example.com' \\
  --header 'x-rapidapi-host: ultimate-attack-surface-recon-api.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_API_KEY'`} 
            />
          </div>
        </section>
      </div>
    </motion.div>
  );
}
