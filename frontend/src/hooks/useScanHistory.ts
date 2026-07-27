import { useState, useEffect } from 'react';

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  domain: string;
  grade: string;
  result: any;
}

export function useScanHistory() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  // Load history from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('triage_talon_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('triage_talon_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  const addScan = (domain: string, grade: string, result: any) => {
    const newItem: ScanHistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      domain,
      grade,
      result
    };

    setHistory(prev => {
      // Add new item to front, keep only last 10 items to prevent storage bloat
      return [newItem, ...prev].slice(0, 10);
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('triage_talon_history');
  };

  return { history, addScan, clearHistory };
}
