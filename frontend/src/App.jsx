import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Politician from './pages/Politician';
import Compare from './pages/Compare';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`nav-link text-sm tracking-wide transition-colors ${
        isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </Link>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <header className="border-b border-border/40 bg-primary/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 no-underline group">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-primary text-sm font-bold">P</span>
              </div>
              <span className="font-serif text-text-primary text-lg font-semibold">
                Politi<span className="text-accent">Scope</span>
              </span>
            </Link>
            <nav className="flex items-center gap-8">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/compare">Compare</NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/politician/:name" element={<Politician />} />
          <Route path="/compare" element={<Compare />} />
        </Routes>
      </main>

      <footer className="border-t border-border/30 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-accent/20 rounded flex items-center justify-center">
                <span className="text-accent text-[10px] font-bold">P</span>
              </div>
              <span className="text-text-secondary/60 text-sm">PolitiScope</span>
            </div>
            <p className="text-text-secondary/40 text-xs">
              &copy; {new Date().getFullYear()} Lakshay Malik &mdash; MBA Business Analytics
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
