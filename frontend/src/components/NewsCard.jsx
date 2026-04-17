import { useState } from 'react';
import { timeAgo } from '../utils';

function getFallbackImage(topicLabel) {
  if (!topicLabel) return 'https://picsum.photos/seed/politics/400/200';
  return `https://picsum.photos/seed/${topicLabel.replace(/\s+/g, '_').toLowerCase()}/400/200`;
}

const TOPIC_COLORS = [
  '#C8763A', '#C8A96E', '#E8924A', '#D4735E', '#8B6914', '#A8602E',
];

export default function NewsCard({ article, topicLabel, topicIndex = 0 }) {
  const [imgError, setImgError] = useState(false);
  const dotColor = TOPIC_COLORS[topicIndex % TOPIC_COLORS.length];

  const imageUrl = !imgError && article.image_url
    ? article.image_url
    : getFallbackImage(topicLabel);

  return (
    <article className="rounded-xl border border-border/40 bg-card hover:bg-card-hover transition-all duration-200 overflow-hidden group">
      <div className="relative overflow-hidden aspect-video">
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgError(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {topicLabel && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
            <span className="text-xs text-white/90 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md font-medium">
              {topicLabel}
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-serif text-base text-text-primary leading-snug mb-3 line-clamp-2">
          {article.title}
        </h3>
        {article.snippet && (
          <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-2">
            {article.snippet}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-text-secondary/60">
            <span className="font-medium text-text-secondary">{article.source}</span>
            <span>·</span>
            <span>{timeAgo(article.published_at)}</span>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent text-xs font-medium hover:text-accent-light transition-colors no-underline"
          >
            Read →
          </a>
        </div>
      </div>
    </article>
  );
}
