import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TerminalSquare } from 'lucide-react';

export default function NotFound() {
  useEffect(() => {
    document.title = "404 Target Not Found | TriageTalon";
  }, []);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-[80vh] flex flex-col items-center justify-center bg-[var(--canvas)] text-center px-8"
    >
      <div className="mb-8 p-6 bg-[var(--canvas-soft)] rounded-full border border-[var(--hairline)]">
        <TerminalSquare className="w-16 h-16 text-[var(--primary)]" />
      </div>
      
      <h1 className="display-xl mb-4 text-[var(--primary)]">404</h1>
      <h2 className="display-sm mb-6">Target Not Found</h2>
      
      <div className="code-mockup text-left max-w-lg w-full mb-10 shadow-2xl border-[var(--hairline)]">
        <div className="code-mockup-bar">
          <div className="dot d1"></div>
          <div className="dot d2"></div>
          <div className="dot d3"></div>
        </div>
        <div className="code-text text-[var(--canvas-text-soft)]">
          <div className="text-[var(--primary)]">$ talon --resolve {window.location.pathname}</div>
          <div className="text-[var(--mute)] mt-1">[*] Initializing DNS resolution...</div>
          <div className="text-[#ef4444] mt-1">[!] Error: NXDOMAIN (Non-Existent Domain)</div>
          <div className="text-[var(--mute)] mt-1">[*] Hint: Check your scope list and try again.</div>
          <div className="mt-2"><span className="cursor">_</span></div>
        </div>
      </div>
      
      <Link to="/" className="btn button-primary inline-flex items-center gap-2">
        Return to Base
      </Link>
    </motion.div>
  );
}
