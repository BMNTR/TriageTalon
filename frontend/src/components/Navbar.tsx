

export default function Navbar({ onNavigate }: { onNavigate: (page: 'landing' | 'scanner') => void }) {
  return (
    <nav className="flex justify-between items-center bg-[var(--canvas)] px-8 py-3 border-b border-[var(--hairline)] sticky top-0 z-[100]">
      <div 
        className="font-sans text-xl font-bold text-[var(--ink-strong)] flex items-center gap-2 cursor-pointer"
        onClick={() => onNavigate('landing')}
      >
        <span className="text-[var(--primary)] text-base">⚡</span>
        TriageTalon
      </div>
      <div className="flex items-center gap-6">
        <a href="https://github.com/BMNTR/TriageTalon" target="_blank" rel="noopener noreferrer" className="text-[var(--body)] text-sm font-medium hover:text-[var(--ink-strong)] transition-colors">Source</a>
        <a href="https://rapidapi.com/BMNTR/api/ultimate-attack-surface-recon-api" target="_blank" rel="noopener noreferrer" className="text-[var(--body)] text-sm font-medium hover:text-[var(--ink-strong)] transition-colors">API</a>
        <button onClick={() => onNavigate('scanner')} className="btn button-primary h-[36px] text-sm px-4">Launch Scanner</button>
      </div>
    </nav>
  );
}
