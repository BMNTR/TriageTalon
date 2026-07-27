

export default function Navbar({ onNavigate }: { onNavigate: (page: 'landing' | 'scanner') => void }) {
  return (
    <nav className="flex justify-between items-center bg-[var(--canvas)] px-8 py-3 border-b border-[var(--hairline)] sticky top-0 z-[100]">
      <div 
        className="font-sans text-xl font-bold text-[var(--ink-strong)] flex items-center gap-2 cursor-pointer"
        onClick={() => onNavigate('landing')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="18" height="18">
          <circle cx="50" cy="50" r="25" fill="none" stroke="var(--primary)" stroke-width="12" />
          <circle cx="50" cy="50" r="10" fill="var(--primary)" />
          <line x1="50" y1="0" x2="50" y2="15" stroke="var(--primary)" stroke-width="12" stroke-linecap="round" />
          <line x1="50" y1="100" x2="50" y2="85" stroke="var(--primary)" stroke-width="12" stroke-linecap="round" />
          <line x1="0" y1="50" x2="15" y2="50" stroke="var(--primary)" stroke-width="12" stroke-linecap="round" />
          <line x1="100" y1="50" x2="85" y2="50" stroke="var(--primary)" stroke-width="12" stroke-linecap="round" />
        </svg>
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
