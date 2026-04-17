import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { timeAgo } from '../utils';
import TopicCard from '../components/TopicCard';
import NewsCard from '../components/NewsCard';
import { API_BASE } from '../config';
import TopicChart, {
  TopicDonutChart,
  SourceBarChart,
  CoverageAreaChart,
  DayDistributionChart,
  TopicWordCloud,
  TopicTimelineChart
} from '../components/TopicChart';

/* ─── Skeleton Components ─── */
function SkeletonAvatar() {
  return (
    <div className="w-full aspect-square bg-card border border-border animate-pulse">
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-16 h-16 skeleton rounded-none" />
      </div>
    </div>
  );
}

function SkeletonTopicBreakdown() {
  return (
    <div className="space-y-3 mt-6">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-3 w-8" />
          </div>
          <div className="w-full h-2 bg-border">
            <div className="skeleton h-full" style={{ width: `${70 - i * 15}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonTopicCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border border-border bg-card p-6 animate-pulse">
          <div className="skeleton h-5 w-36 mb-4" />
          <div className="flex gap-2 mb-4">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="skeleton h-5 w-14" />
            ))}
          </div>
          <div className="skeleton h-3 w-20 mb-3" />
          <div className="skeleton h-1.5 w-full" />
        </div>
      ))}
    </div>
  );
}

function SkeletonNewsCards() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border border-border bg-card animate-pulse">
          <div className="skeleton aspect-video w-full" />
          <div className="p-5">
            <div className="skeleton h-4 w-3/4 mb-3" />
            <div className="skeleton h-3 w-full mb-2" />
            <div className="skeleton h-3 w-2/3 mb-4" />
            <div className="flex justify-between">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCount({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (value === 0) return;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOut curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  return <>{display}</>;
}

/* ─── Main Politician Page ─── */
export default function Politician() {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('topics');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(true);

  // Fetch politician data
  useEffect(() => {
    setLoading(true);
    setError('');
    setData(null);
    setSelectedTopic(null);

    fetch(`${API_BASE}/api/politician/${encodeURIComponent(decodedName)}`)
      .then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e));
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
        try {
          const recent = JSON.parse(localStorage.getItem('politiscope_recent') || '[]');
          const updated = recent.filter(r => r.name !== decodedName);
          updated.unshift({ name: decodedName, timestamp: Date.now() });
          localStorage.setItem('politiscope_recent', JSON.stringify(updated.slice(0, 5)));
        } catch (e) {}
      })
      .catch((err) => {
        setError(err.detail || `No significant coverage found for ${decodedName}`);
        setLoading(false);
      });
  }, [decodedName]);

  // Fetch avatar from Wikipedia
  useEffect(() => {
    setAvatarLoading(true);
    setAvatarUrl(null);

    fetch(`${API_BASE}/api/politician-image/${encodeURIComponent(decodedName)}`)
      .then((res) => res.json())
      .then((json) => {
        setAvatarUrl(json.image_url);
        setAvatarLoading(false);
      })
      .catch(() => {
        setAvatarLoading(false);
      });
  }, [decodedName]);

  // Generate initials
  const initials = decodedName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Current date formatted
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();

  const TABS = [
    { id: 'topics', label: 'Topics' },
    { id: 'news', label: 'Latest News' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'wordcloud', label: 'Word Cloud' },
    { id: 'analytics', label: 'Analytics' },
  ];

  // Error state
  if (!loading && error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 border border-border flex items-center justify-center mx-auto mb-6">
            <span className="text-text-secondary text-2xl">✕</span>
          </div>
          <p className="text-text-secondary text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ─── Newspaper Timestamp ─── */}
      <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-8">
        <div className="flex justify-end">
          <div className="text-right">
            <p className="text-accent/70 text-[11px] tracking-[0.15em] font-medium font-mono uppercase">
              UPDATED {timeAgo(now.toISOString())}
            </p>
            <p className="text-text-secondary/50 text-[10px] tracking-[0.3em] uppercase mt-0.5">
              Intelligence Briefing
            </p>
          </div>
        </div>
      </div>

      <div className="section-divider max-w-6xl mx-auto" />

      {/* ─── Two-Column Layout ─── */}
      <div className="max-w-6xl mx-auto px-5 lg:px-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* ═══ LEFT COLUMN (35%) ═══ */}
          <div className="lg:w-[35%] space-y-6">
            {/* Avatar */}
            {avatarLoading ? (
              <SkeletonAvatar />
            ) : avatarUrl ? (
              <div className="w-full aspect-square bg-card rounded-2xl border border-border/40 overflow-hidden relative group">
                <img
                  src={avatarUrl}
                  alt={decodedName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  onError={() => setAvatarUrl(null)}
                />
              </div>
            ) : (
              <div className="w-full aspect-square bg-card rounded-2xl border border-accent/20 flex items-center justify-center">
                <span className="font-serif text-accent text-6xl tracking-wider">{initials}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <h1 className="font-serif text-2xl lg:text-3xl text-text-primary font-bold leading-tight">
                {decodedName}
              </h1>
            </div>

            {/* Stats */}
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="skeleton h-5 w-32" />
                <div className="skeleton h-4 w-48" />
                <div className="skeleton h-4 w-40" />
                <SkeletonTopicBreakdown />
              </div>
            ) : data ? (
              <>
                {/* Live indicator */}
                <div className="flex items-center gap-2.5 py-2">
                  <span className="live-dot w-2 h-2 bg-success inline-block" style={{ borderRadius: '50%' }} />
                  <span className="text-success text-[11px] font-semibold tracking-wide">LIVE</span>
                  <span className="text-text-secondary/50 text-[11px]">
                    <AnimatedCount value={data.articles_count} /> articles · Updated just now
                  </span>
                </div>

                {/* Coverage period */}
                <div className="stat-card border border-border/40 bg-card rounded-xl p-4">
                  <p className="text-text-secondary/50 text-[10px] uppercase tracking-[0.2em] mb-2">
                    Coverage Period
                  </p>
                  <p className="text-text-primary text-sm font-medium">
                    {data.date_range.from
                      ? `${new Date(data.date_range.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date(data.date_range.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : 'N/A'}
                  </p>
                </div>

                {/* Topic Breakdown */}
                <div>
                  <p className="text-text-secondary/50 text-[10px] uppercase tracking-[0.2em] mb-4">
                    Topic Breakdown
                  </p>
                  <div className="space-y-3">
                    {data.topics.map((topic, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-text-primary text-sm">{topic.label}</span>
                          <span className="text-accent text-xs font-semibold font-mono">
                            <AnimatedCount value={parseFloat(topic.percentage)} />%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-border/60 rounded-full">
                          <div
                            className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${topic.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* ═══ RIGHT COLUMN (65%) ═══ */}
          <div className="lg:w-[65%]">
            {/* Tab Bar */}
            <div className="flex border-b border-border/60 mb-8 gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedTopic(null);
                  }}
                  className={`tab-btn px-5 py-3.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-accent active'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {loading ? (
              activeTab === 'topics' ? (
                <SkeletonTopicCards />
              ) : activeTab === 'news' ? (
                <SkeletonNewsCards />
              ) : (
                <div className="animate-pulse">
                  <div className="skeleton h-80 w-full" />
                </div>
              )
            ) : data ? (
              <>
                {/* TOPICS TAB */}
                {activeTab === 'topics' && !selectedTopic && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.topics.map((topic, i) => (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        index={i}
                        onViewArticles={(t) => {
                          setSelectedTopic(t);
                          setActiveTab('news');
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* NEWS TAB */}
                {activeTab === 'news' && (
                  <div>
                    {selectedTopic && (
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-serif text-xl text-accent">
                          Articles — {selectedTopic.label}
                        </h3>
                        <button
                          onClick={() => setSelectedTopic(null)}
                          className="text-text-secondary text-xs hover:text-accent transition-colors cursor-pointer"
                        >
                          ← All Topics
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedTopic ? selectedTopic.articles : data.topics.flatMap((t) => t.articles))
                        .slice(0, 20)
                        .map((article, i) => {
                          const topicForArticle = selectedTopic || data.topics.find((t) =>
                            t.articles.some((a) => a.url === article.url)
                          );
                          return (
                            <NewsCard
                              key={i}
                              article={article}
                              topicLabel={topicForArticle?.label}
                              topicIndex={topicForArticle ? data.topics.indexOf(topicForArticle) : 0}
                            />
                          );
                        })}
                    </div>

                    {(!selectedTopic ? data.topics.flatMap((t) => t.articles) : selectedTopic.articles).length === 0 && (
                      <p className="text-text-secondary text-center py-12">No articles found</p>
                    )}
                  </div>
                )}

                {/* TIMELINE TAB */}
                {activeTab === 'timeline' && (
                  <div className="rounded-xl border border-border/40 bg-card p-6">
                    <h3 className="font-serif text-xl text-text-primary mb-6">
                      Topic Frequency Over Time
                    </h3>
                    <TopicTimelineChart timeline={data.analytics?.topic_timeline} />
                  </div>
                )}

                {/* WORD CLOUD TAB */}
                {activeTab === 'wordcloud' && (
                  <div className="rounded-xl border border-border/40 bg-card p-6">
                    <h3 className="font-serif text-xl text-text-primary mb-6">
                      Keyword Prominence
                    </h3>
                    <TopicWordCloud topics={data.topics} />
                  </div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === 'analytics' && data.analytics && (
                  <div className="space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="stat-card border border-border bg-card p-5">
                        <p className="text-text-secondary/50 text-[10px] uppercase tracking-[0.2em] mb-2">Total Articles</p>
                        <p className="font-serif text-3xl text-accent leading-none"><AnimatedCount value={data.articles_count} /></p>
                      </div>
                      <div className="stat-card border border-border bg-card p-5">
                        <p className="text-text-secondary/50 text-[10px] uppercase tracking-[0.2em] mb-2">Unique Sources</p>
                        <p className="font-serif text-3xl text-accent leading-none"><AnimatedCount value={data.analytics.unique_sources} /></p>
                      </div>
                      <div className="stat-card border border-border bg-card p-5">
                        <p className="text-text-secondary/50 text-[10px] uppercase tracking-[0.2em] mb-2">Topics Identified</p>
                        <p className="font-serif text-3xl text-accent leading-none"><AnimatedCount value={data.topics.length} /></p>
                      </div>
                      <div className="stat-card border border-border bg-card p-5">
                        <p className="text-text-secondary/50 text-[10px] uppercase tracking-[0.2em] mb-2">Last 7 Days</p>
                        <p className="font-serif text-3xl text-accent leading-none"><AnimatedCount value={data.analytics.recency_percentage} /><span className="text-xl">%</span></p>
                      </div>
                    </div>

                    {/* Row 1: Donut + Coverage Volume */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="rounded-xl border border-border/40 bg-card p-6">
                        <h4 className="font-serif text-lg text-text-primary mb-4">Topic Distribution</h4>
                        <TopicDonutChart data={data.analytics.topic_distribution} />
                      </div>
                      <div className="rounded-xl border border-border/40 bg-card p-6">
                        <h4 className="font-serif text-lg text-text-primary mb-4">Coverage Volume</h4>
                        <CoverageAreaChart data={data.analytics.coverage_timeline} />
                      </div>
                    </div>

                    {/* Row 2: Source Distribution + Day Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="rounded-xl border border-border/40 bg-card p-6">
                        <h4 className="font-serif text-lg text-text-primary mb-4">Top Sources</h4>
                        <SourceBarChart data={data.analytics.source_distribution} />
                      </div>
                      <div className="rounded-xl border border-border/40 bg-card p-6">
                        <h4 className="font-serif text-lg text-text-primary mb-4">Publication Day</h4>
                        <DayDistributionChart data={data.analytics.day_distribution} />
                      </div>
                    </div>

                    {/* Keyword Cloud */}
                    {data.analytics.keyword_cloud && data.analytics.keyword_cloud.length > 0 && (
                      <div className="rounded-xl border border-border/40 bg-card p-6">
                        <h4 className="font-serif text-lg text-text-primary mb-4">Key Terms</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.analytics.keyword_cloud.map((kw, i) => (
                            <span
                              key={i}
                              className="text-sm px-3 py-1.5 rounded-lg bg-accent-muted text-accent-light hover:bg-accent/15 transition-colors cursor-default"
                              title={`Topic: ${kw.topic}`}
                            >
                              {kw.word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
