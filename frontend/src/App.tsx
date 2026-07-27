import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ScannerDashboard from './components/ScannerDashboard';
import DocsPage from './components/DocsPage';
import NotFound from './components/NotFound';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/scanner" element={<ScannerDashboard />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
