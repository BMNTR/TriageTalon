import React, { useState } from 'react';
import axios from 'axios';
import { Search, ShieldAlert, Globe, Server, Code, FileCode } from 'lucide-react';

export default function ScannerDashboard() {
  const [domain, setDomain] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !apiKey) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.get(`https://ultimate-attack-surface-recon-api.p.rapidapi.com/scan?domain=${domain}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'ultimate-attack-surface-recon-api.p.rapidapi.com'
        }
      });
      setResult(response.data.data || response.data);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Error 429: Rate limit exceeded or free quota reached.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] p-8">
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
              {loading ? <div className="spinner"></div> : <><Search className="w-4 h-4 mr-2" /> Scan</>}
            </button>
          </form>
        </div>

        {error && (
          <div className="p-4 mb-8 border border-red-500/30 bg-red-500/10 text-red-500 rounded-md body-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
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
            </div>

            <div className="lg:col-span-2">
              <div className="card-feature h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-[var(--hairline)] pb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <Code className="w-5 h-5 text-[var(--primary)]" />
                    Raw JSON Output
                  </div>
                </div>
                <div className="flex-1 bg-[var(--canvas-soft)] rounded-md border border-[var(--hairline)] p-4 overflow-auto max-h-[600px]">
                  <pre className="font-mono text-[13px] text-[var(--canvas-text-soft)] whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
