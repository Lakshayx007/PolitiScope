import { useState, useEffect } from 'react';
import { timeAgo } from '../utils';
import { API_BASE } from '../config';

export default function Ticker() {
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/ticker`)
      .then((res) => res.json())
      .then((data) => {
        if (data.headlines && data.headlines.length > 0) {
          setHeadlines(data.headlines);
        } else {
          setHeadlines(fallback());
        }
      })
      .catch(() => setHeadlines(fallback()));
  }, []);

  if (headlines.length === 0) return null;

  const tickerItems = [...headlines, ...headlines];

  return (
    <div className="w-full overflow-hidden border-t border-border/30 bg-primary/80 backdrop-blur-sm">
      <div className="ticker-animate flex whitespace-nowrap py-3">
        {tickerItems.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-5 text-sm">
            <span className="text-accent text-xs">●</span>
            <span className="text-text-primary/80 font-medium">{item.title}</span>
            <span className="text-text-secondary/30">·</span>
            <span className="text-text-secondary/60 text-xs">{item.source}</span>
            <span className="text-text-secondary/30">·</span>
            <span className="text-text-secondary/30 text-xs">{timeAgo(item.published_at)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function fallback() {
  return [
    { title: 'Global political landscape shifts amid new trade agreements', source: 'Reuters', published_at: new Date().toISOString() },
    { title: 'Climate summit produces historic commitments from world leaders', source: 'AP News', published_at: new Date().toISOString() },
    { title: 'Economic indicators signal steady growth across emerging markets', source: 'Bloomberg', published_at: new Date().toISOString() },
  ];
}
