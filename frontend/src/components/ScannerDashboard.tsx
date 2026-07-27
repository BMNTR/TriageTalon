import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Search, ShieldAlert, Globe, Server, Code, FileCode, History, Trash2, Copy, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScanHistory } from '../hooks/useScanHistory';

import { useToast } from '../context/ToastContext';

export default function ScannerDashboard() {
  useEffect(() => {
    document.title = "Scanner Dashboard | TriageTalon";
  }, []);
  const [domain, setDomain] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { history, addScan, clearHistory } = useScanHistory();
  const { showToast } = useToast();

  const runScan = async (e: FormEvent) => {
    e.preventDefault();
    if (!domain || !apiKey) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.get(`https://ultimate-attack-surface-recon-api.p.rapidapi.com/scan?domain=${encodeURIComponent(domain)}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'ultimate-attack-surface-recon-api.p.rapidapi.com'
        }
      });
      const data = response.data.data || response.data;
      setResult(data);
      addScan(domain, data.security_analysis?.security_score?.grade || 'N/A', data);
      showToast(`Scan completed for ${domain}!`, 'success');
    } catch (err: any) {
      const msg = err.response?.status === 429 ? 'Error 429: Rate limit exceeded.' : `Error: ${err.message}`;
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    showToast('JSON output copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recon_${domain.replace(/[^a-zA-Z0-9-]/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('JSON report downloaded!', 'info');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] p-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="display-md">Scanner Dashboard</h1>
          <p className="body-sm text-[var(--mute)] mt-2">Execute live API scans against your target scope.</p>
        </div>

        <div className="card-feature mb-8">
          <form onSubmit={runScan} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block body-sm font-medium text-[var(--mute)] mb-2">Target Domain</label>
              <input 
                type="text" 
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="text-input" 
                placeholder="example.com" 
                required 
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block body-sm font-medium text-[var(--mute)] mb-2">RapidAPI Key</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="text-input" 
                placeholder="Your X-RapidAPI-Key" 
                required 
              />
            </div>
            <button type="submit" className="btn button-primary w-full md:w-auto px-8 flex items-center justify-center min-w-[140px]" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</> : <><Search className="w-4 h-4 mr-2" /> Scan</>}
            </button>
          </form>

          {history.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--hairline)] flex flex-wrap gap-2 items-center">
              <span className="text-sm text-[var(--mute)] flex items-center gap-1 font-medium mr-2">
                <History className="w-4 h-4" /> Recent Scans:
              </span>
              {history.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => { setDomain(item.domain); setResult(item.result); setError(null); }}
                  className="px-3 py-1 bg-[var(--canvas)] border border-[var(--hairline)] rounded-full text-xs flex items-center gap-2 hover:border-[var(--primary)] transition-colors"
                >
                  {item.domain} 
                  <span className="font-bold" style={{ color: ['A','B'].includes(item.grade) ? 'var(--primary)' : '#ff3e00' }}>
                    {item.grade}
                  </span>
                </button>
              ))}
              <button 
                onClick={clearHistory} 
                className="text-xs text-[var(--mute)] hover:text-red-500 ml-auto flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear History
              </button>
            </div>
          )}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 mb-8 border border-red-500/30 bg-red-500/10 text-red-500 rounded-md body-sm flex items-start gap-3"
          >
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>{error}</div>
          </motion.div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Grade Card */}
              <div className="card-feature text-center py-10">
                <div className="body-sm text-[var(--mute)] uppercase tracking-wider mb-2">Security Grade</div>
                <div className="text-7xl font-mono font-bold" style={{ color: ['A','B'].includes(result.security_analysis?.security_score?.grade) ? 'var(--primary)' : '#ff3e00' }}>
                  {result.security_analysis?.security_score?.grade || 'N/A'}
                </div>
                <div className="body-sm mt-4 text-[var(--ink)]">
                  Score: {result.security_analysis?.security_score?.score || 0}/100
                </div>
              </div>

              {/* Stats Card */}
              <div className="card-feature space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                  <div className="flex items-center gap-2 text-[var(--mute)]"><Globe className="w-4 h-4" /> Subdomains</div>
                  <div className="font-mono">{result.subdomains?.count || 0}</div>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                  <div className="flex items-center gap-2 text-[var(--mute)]"><Server className="w-4 h-4" /> DNS A Records</div>
                  <div className="font-mono text-right">{result.dns?.a?.length || 0}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--mute)]"><FileCode className="w-4 h-4" /> Tech Stack</div>
                  <div className="font-mono text-right">{result.technologies?.length || 0}</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <div className="card-feature h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-[var(--hairline)] pb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <Code className="w-5 h-5 text-[var(--primary)]" />
                    Raw JSON Output
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={copyToClipboard} className="text-[var(--mute)] hover:text-white transition-colors flex items-center gap-1 text-sm" title="Copy JSON">
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button onClick={downloadJson} className="text-[var(--mute)] hover:text-[var(--primary)] transition-colors flex items-center gap-1 text-sm" title="Download Report">
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-[var(--canvas-soft)] rounded-md border border-[var(--hairline)] p-4 overflow-auto max-h-[600px] relative">
                  <pre className="font-mono text-[13px] text-[var(--canvas-text-soft)] whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
