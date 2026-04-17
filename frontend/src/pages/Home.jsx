import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import Ticker from '../components/Ticker';

const POLITICIANS = [
  { name: 'Narendra Modi', slug: 'Narendra_Modi' },
  { name: 'Joe Biden', slug: 'Joe_Biden' },
  { name: 'Donald Trump', slug: 'Donald_Trump' },
  { name: 'Emmanuel Macron', slug: 'Emmanuel_Macron' },
  { name: 'Rishi Sunak', slug: 'Rishi_Sunak' },
  { name: 'Xi Jinping', slug: 'Xi_Jinping' },
];

function PoliticianCard({ politician, navigate }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    fetch(`/api/politician-image/${encodeURIComponent(politician.name)}`)
      .then(res => res.json())
      .then(data => { if (data.image_url) setImageUrl(data.image_url); })
      .catch(() => {});
  }, [politician.name]);

  return (
    <button
      onClick={() => navigate(`/politician/${encodeURIComponent(politician.name)}`)}
      className="group relative flex flex-col items-center gap-3 cursor-pointer bg-transparent border-0 p-0"
    >
      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border/40 group-hover:border-accent/60 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-accent/10">
        {imageUrl ? (
          <img src={imageUrl} alt={politician.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-card-elevated flex items-center justify-center">
            <span className="text-gold font-serif text-xl font-bold">
              {politician.name.split(' ').map(w => w[0]).join('')}
            </span>
          </div>
        )}
      </div>
      <span className="text-text-primary/70 text-xs font-medium group-hover:text-text-primary transition-colors text-center leading-tight">
        {politician.name}
      </span>
    </button>
  );
}

/* SVG Icons for features */
const DataIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8763A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    <path d="M21 3v5h-5" />
    <path d="M21 8l-4.5 4.5" />
  </svg>
);
const NlpIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8763A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);
const ChartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8763A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M7 16l4-8 4 4 4-6" />
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('politiscope_recent') || '[]');
      setRecent(stored);
    } catch(e) {}
  }, []);

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center hero-bg-animate"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1920&q=80')`,
            }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13,11,8,0.78), rgba(13,11,8,0.88), #0D0B08)' }} />
        </div>

        <div className="relative z-10 text-center px-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-accent text-xs font-medium">Live Political Intelligence</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-text-primary leading-[1.1] mb-5 font-bold animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Track What Politicians{' '}
            <span className="text-accent">Stand For</span>
          </h1>

          <p className="text-text-secondary text-base sm:text-lg mb-12 max-w-lg mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Real-time topic intelligence powered by NLP analysis of global news coverage
          </p>

          <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <SearchBar className="mx-auto mb-14" />
          </div>

          {/* Politician Photos Grid */}
          <div className="flex flex-wrap justify-center gap-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            {POLITICIANS.map((p) => (
              <PoliticianCard key={p.name} politician={p} navigate={navigate} />
            ))}
          </div>

          {recent.length > 0 && (
            <div className="mt-12 animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <p className="text-text-secondary/50 text-[10px] uppercase tracking-[0.2em] mb-4">
                Recently Analyzed
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {recent.map((r, i) => (
                  <button
                    key={r.name + i}
                    onClick={() => navigate(`/politician/${encodeURIComponent(r.name)}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 bg-card hover:bg-card-hover hover:border-accent/40 transition-all cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary/60">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span className="text-text-secondary text-sm font-medium hover:text-text-primary transition-colors">{r.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <Ticker />
        </div>
      </section>

      {/* Features - NO emojis, clean SVG icons */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl text-text-primary mb-3 font-bold">
              How it works
            </h2>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              From raw news to structured political intelligence in seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: <DataIcon />, num: '01', title: 'Data Collection', desc: 'Articles aggregated from 100+ global news sources via Google News in real-time.' },
              { icon: <NlpIcon />, num: '02', title: 'NLP Analysis', desc: 'TF-IDF vectorization and LDA topic modeling extract the dominant themes.' },
              { icon: <ChartIcon />, num: '03', title: 'Intelligence Report', desc: 'Interactive dashboards with topic distributions, timelines, and source analytics.' },
            ].map((f, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/40 p-7 hover:border-accent/30 transition-all duration-300 group">
                <div className="mb-5 opacity-80 group-hover:opacity-100 transition-opacity">{f.icon}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-accent/40 text-xs">{f.num}</span>
                  <h3 className="font-serif text-lg text-text-primary font-semibold">{f.title}</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
