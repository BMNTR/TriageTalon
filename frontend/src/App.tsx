import { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ScannerDashboard from './components/ScannerDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'scanner'>('landing');

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <Navbar onNavigate={setCurrentPage} />
      {currentPage === 'landing' ? (
        <LandingPage onNavigate={setCurrentPage} />
      ) : (
        <ScannerDashboard />
      )}
    </div>
  );
}

export default App;
