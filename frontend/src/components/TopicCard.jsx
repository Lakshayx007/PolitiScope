import { useState, useRef, useEffect } from 'react';

export default function TopicCard({ topic, index = 0, onViewArticles }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const sourceCounts = topic.articles.reduce((acc, a) => {
    if (a.source) acc[a.source] = (acc[a.source] || 0) + 1;
    return acc;
  }, {});
  const topSources = Object.entries(sourceCounts)
    .sort((a,b) => b[1]-a[1])
    .slice(0,3)
    .map(([name]) => name)
    .join(' · ');

  return (
    <div
      className={`topic-card border border-border/40 bg-card p-6 cursor-pointer ${
        isVisible ? 'animate-fade-up' : 'opacity-0'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewArticles && onViewArticles(topic)}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <h3 className="font-serif text-lg text-text-primary mb-3 font-semibold">
        {topic.label}
      </h3>

      <div className="flex flex-wrap gap-1.5 mb-4 min-h-[2rem]">
        {topic.keywords.slice(0, 5).map((keyword, ki) => (
          <span
            key={ki}
            className={`text-xs px-2.5 py-1 rounded-md border border-border-light bg-border/60 text-gold tracking-wide ${
              isHovered ? 'keyword-enter' : ''
            }`}
            style={isHovered ? { animationDelay: `${ki * 50}ms` } : {}}
          >
            {keyword}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {topic.coherence !== undefined && (
          <span 
            title="Higher score = more focused topic"
            className="text-[10px] px-2 py-0.5 rounded border border-border-light bg-border/40 text-text-secondary uppercase tracking-wider"
          >
            Coherence: {topic.coherence}
          </span>
        )}
        <span 
          title="Stable = consistent across model runs"
          className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border border-border-light bg-border/40 text-text-secondary uppercase tracking-wider"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${topic.stable ? 'bg-[#50C878]' : 'bg-[#E8924A]'}`} />
          {topic.stable ? 'Stable' : 'Variable'}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-text-secondary text-sm">
          {topic.article_count} article{topic.article_count !== 1 ? 's' : ''}
        </span>
        <span className="text-gold font-mono text-sm font-semibold">
          {topic.percentage}%
        </span>
      </div>

      <div className="w-full h-1.5 bg-border/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(topic.percentage, 100)}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[10px] text-text-secondary/60 truncate pr-3" title={topSources}>
          {topSources}
        </span>
        <span className="text-accent/70 text-xs font-medium hover:text-accent transition-colors whitespace-nowrap">
          View Articles →
        </span>
      </div>
    </div>
  );
}
