import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({ placeholder = 'Search a politician...', className = '' }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/politician/${encodeURIComponent(trimmed)}`);
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative w-full max-w-xl ${className}`}>
      <div className={`flex items-center rounded-xl border transition-all duration-200 ${
        focused
          ? 'border-accent/50 bg-card shadow-lg shadow-accent/5'
          : 'border-border/60 bg-card/60'
      }`}>
        <div className="pl-4 pr-2 text-text-secondary/40">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 py-3.5 bg-transparent text-text-primary placeholder-text-secondary/40 text-sm outline-none"
          id="search-politician"
        />
        <button
          type="submit"
          className="bg-accent hover:bg-accent-light text-primary px-5 py-2.5 m-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          Analyze
        </button>
      </div>
    </form>
  );
}
