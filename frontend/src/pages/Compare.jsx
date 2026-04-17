import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TopicTimelineChart, TopicWordCloud } from '../components/TopicChart';

export default function Compare() {
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const [data, setData] = useState(null);

  // High contrast warm sets: A (Gold/Yellows) vs B (Red/Magents/Oranges)
  const PALETTE_A = ['#FFD700', '#F4D03F', '#F5B041', '#B9770E', '#F7DC6F'];
  const PALETTE_B = ['#C0392B', '#E74C3C', '#922B21', '#641E16', '#DC7633'];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageA, setImageA] = useState(null);
  const [imageB, setImageB] = useState(null);

  const handleCompare = async (e) => {
    e.preventDefault();
    const a = nameA.trim();
    const b = nameB.trim();
    if (!a || !b) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(`/api/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed');
      const json = await res.json();
      setData(json);
      // Fetch images
      fetch(`/api/politician-image/${encodeURIComponent(a)}`).then(r => r.json()).then(d => setImageA(d.image_url || null)).catch(() => {});
      fetch(`/api/politician-image/${encodeURIComponent(b)}`).then(r => r.json()).then(d => setImageB(d.image_url || null)).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute insights
  const getInsights = () => {
    if (!data) return [];
    const a = data.politician_a;
    const b = data.politician_b;
    const insights = [];

    // Top topic for each
    const topA = a.topics[0];
    const topB = b.topics[0];
    if (topA) insights.push({ icon: '📌', text: `${a.name}'s dominant topic is "${topA.label}" at ${topA.percentage}% of coverage.` });
    if (topB) insights.push({ icon: '📌', text: `${b.name}'s dominant topic is "${topB.label}" at ${topB.percentage}% of coverage.` });

    // Coverage volume
    if (a.articles_count > b.articles_count) {
      insights.push({ icon: '📊', text: `${a.name} receives ${a.articles_count - b.articles_count} more articles in coverage than ${b.name}.` });
    } else if (b.articles_count > a.articles_count) {
      insights.push({ icon: '📊', text: `${b.name} receives ${b.articles_count - a.articles_count} more articles in coverage than ${a.name}.` });
    }

    // Shared topics
    const labelsA = new Set(a.topics.map(t => t.label));
    const shared = b.topics.filter(t => labelsA.has(t.label));
    if (shared.length > 0) {
      insights.push({ icon: '🔗', text: `Both share ${shared.length} common topic${shared.length > 1 ? 's' : ''}: ${shared.map(t => t.label).join(', ')}.` });
    } else {
      insights.push({ icon: '🔀', text: `No overlapping topics — their coverage profiles are completely different.` });
    }

    // Topic diversity
    if (a.topics.length > b.topics.length) {
      insights.push({ icon: '📐', text: `${a.name} has broader coverage diversity with ${a.topics.length} topics vs ${b.topics.length}.` });
    } else if (b.topics.length > a.topics.length) {
      insights.push({ icon: '📐', text: `${b.name} has broader coverage diversity with ${b.topics.length} topics vs ${a.topics.length}.` });
    }

    // Stability Insight
    const stableA = a.topics.filter(t => t.stable).length;
    const stableB = b.topics.filter(t => t.stable).length;
    if (stableA > stableB) {
      insights.push({ icon: '🎯', text: `${a.name}'s narrative focus is more stable (${stableA} stable topics) compared to ${b.name} (${stableB}).` });
    } else if (stableB > stableA) {
      insights.push({ icon: '🎯', text: `${b.name}'s narrative focus is more stable (${stableB} stable topics) compared to ${a.name} (${stableA}).` });
    }

    // Coherence Insight
    const avgCohA = a.topics.reduce((sum, t) => sum + (t.coherence || 0), 0) / (a.topics.length || 1);
    const avgCohB = b.topics.reduce((sum, t) => sum + (t.coherence || 0), 0) / (b.topics.length || 1);
    if (avgCohA > avgCohB + 0.1) {
      insights.push({ icon: '🧠', text: `${a.name}'s news coverage forms stronger, more coherent narratives (Avg Coherence: ${avgCohA.toFixed(2)}) than ${b.name}.` });
    } else if (avgCohB > avgCohA + 0.1) {
      insights.push({ icon: '🧠', text: `${b.name}'s news coverage forms stronger, more coherent narratives (Avg Coherence: ${avgCohB.toFixed(2)}) than ${a.name}.` });
    }

    // Overall Synthesis
    if (shared.length > 0 && avgCohA > 0.4 && avgCohB > 0.4) {
      insights.push({ icon: '💡', text: `Overall: High overlap and coherence indicate both figures are directly competing for the same narrative space.` });
    } else {
      insights.push({ icon: '💡', text: `Overall: Divergent topic focus and differing keyword clusters suggest they are targeting entirely separate demographics or addressing different political issues.` });
    }

    return insights;
  };

  // Build comparison bar data
  const getComparisonData = () => {
    if (!data) return [];
    const allLabels = new Set([
      ...data.politician_a.topics.map(t => t.label),
      ...data.politician_b.topics.map(t => t.label),
    ]);
    return [...allLabels].map(label => {
      const tA = data.politician_a.topics.find(t => t.label === label);
      const tB = data.politician_b.topics.find(t => t.label === label);
      return {
        topic: label.length > 20 ? label.slice(0, 18) + '…' : label,
        [data.politician_a.name]: tA ? parseFloat(tA.percentage) : 0,
        [data.politician_b.name]: tB ? parseFloat(tB.percentage) : 0,
      };
    });
  };

  const getOverlap = () => {
    if (!data) return [];
    const labelsA = new Set(data.politician_a.topics.map(t => t.label));
    return data.politician_b.topics.filter(t => labelsA.has(t.label));
  };

  const getUniqueA = () => {
    if (!data) return [];
    const labelsB = new Set(data.politician_b.topics.map(t => t.label));
    return data.politician_a.topics.filter(t => !labelsB.has(t.label));
  };

  const getUniqueB = () => {
    if (!data) return [];
    const labelsA = new Set(data.politician_a.topics.map(t => t.label));
    return data.politician_b.topics.filter(t => !labelsA.has(t.label));
  };

  const topKWA = data ? data.politician_a.topics.flatMap(t => t.keywords).filter((v,i,a) => a.indexOf(v) === i).slice(0, 6) : [];
  const topKWB = data ? data.politician_b.topics.flatMap(t => t.keywords).filter((v,i,a) => a.indexOf(v) === i).slice(0, 6) : [];

  const getLinguisicInference = (keywords) => {
    if (!keywords.length) return "general policy";
    const kStr = keywords.join(' ').toLowerCase();
    if (kStr.includes('election') || kStr.includes('vote') || kStr.includes('campaign')) return "electoral strategy and mobilization";
    if (kStr.includes('economy') || kStr.includes('gdp') || kStr.includes('budget')) return "fiscal policy and economic performance";
    if (kStr.includes('scam') || kStr.includes('corruption') || kStr.includes('investigat')) return "governance accountability and legal scrutiny";
    if (kStr.includes('border') || kStr.includes('foreign') || kStr.includes('treaty')) return "geopolitical relations and national security";
    return "regional administration and policy implementation";
  };

  return (
    <div className="min-h-[80vh] page-enter">
      {/* Header */}
      <section className="relative py-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-5">
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-3 font-bold">
              Side-by-Side <span className="text-accent">Comparison</span>
            </h1>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              Compare topic distributions and uncover coverage differences
            </p>
          </div>

          <form onSubmit={handleCompare} className="flex flex-col md:flex-row items-center gap-3">
            <input type="text" value={nameA} onChange={(e) => setNameA(e.target.value)}
              placeholder="First politician"
              className="flex-1 w-full py-3.5 px-5 rounded-xl bg-card border border-border/60 text-text-primary placeholder-text-secondary/40 outline-none focus:border-accent/50 transition-colors text-sm"
              id="compare-politician-a" />
            <span className="text-accent font-serif text-lg px-2">vs</span>
            <input type="text" value={nameB} onChange={(e) => setNameB(e.target.value)}
              placeholder="Second politician"
              className="flex-1 w-full py-3.5 px-5 rounded-xl bg-card border border-border/60 text-text-primary placeholder-text-secondary/40 outline-none focus:border-accent/50 transition-colors text-sm"
              id="compare-politician-b" />
            <button type="submit" disabled={loading}
              className="bg-accent hover:bg-accent-light text-primary px-7 py-3.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap">
              {loading ? 'Analyzing...' : 'Compare'}
            </button>
          </form>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
          <p className="text-text-secondary text-sm">Analyzing both politicians...</p>
        </div>
      )}

      {error && (
        <div className="max-w-3xl mx-auto px-5 py-12 text-center">
          <p className="text-text-secondary text-lg">{error}</p>
        </div>
      )}

      {/* Results */}
      {data && (
        <section className="max-w-6xl mx-auto px-5 lg:px-8 pb-16">
          {/* Profile Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Politician A */}
            <div className="rounded-xl border border-border/40 bg-card p-6">
              <div className="flex items-center gap-4 mb-6">
                {imageA ? (
                  <img src={imageA} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center">
                    <span className="font-serif text-accent text-lg font-bold">
                      {data.politician_a.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-serif text-xl text-text-primary font-bold">{data.politician_a.name}</h2>
                  <p className="text-text-secondary text-xs">{data.politician_a.articles_count} articles analyzed</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {data.politician_a.topics.map((topic, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-primary text-sm">{topic.label}</span>
                      <span className="text-gold text-xs font-semibold font-mono">{topic.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-border/40 rounded-full">
                      <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${topic.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Politician B */}
            <div className="rounded-xl border border-border/40 bg-card p-6">
              <div className="flex items-center gap-4 mb-6">
                {imageB ? (
                  <img src={imageB} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gold-muted flex items-center justify-center">
                    <span className="font-serif text-gold text-lg font-bold">
                      {data.politician_b.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-serif text-xl text-text-primary font-bold">{data.politician_b.name}</h2>
                  <p className="text-text-secondary text-xs">{data.politician_b.articles_count} articles analyzed</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {data.politician_b.topics.map((topic, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-primary text-sm">{topic.label}</span>
                      <span className="text-gold text-xs font-semibold font-mono">{topic.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-border/40 rounded-full">
                      <div className="h-full bg-gold-dark rounded-full transition-all duration-700" style={{ width: `${topic.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Word Cloud Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Politician A Word Cloud */}
            <div className="rounded-xl border border-border/40 bg-card p-6 flex flex-col relative overflow-hidden">
              {/* Subtle background glow matching theme */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-gold/5 blur-[80px] rounded-full pointer-events-none" />
              
              <h3 className="font-serif text-xl mb-8 border-b border-border/40 pb-3 flex items-center justify-between">
                <span className="text-text-primary">{data.politician_a.name}</span>
                <span className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">Gold Narrative</span>
              </h3>
              
              <h4 className="font-serif text-sm text-text-secondary/70 uppercase tracking-widest mb-4">Keyword Prominence</h4>
              {/* Force cloud A to use Gold shades only */}
              <TopicWordCloud topics={data.politician_a.topics} customPalette={PALETTE_A} />
            </div>

            {/* Politician B Word Cloud */}
            <div className="rounded-xl border border-border/40 bg-card p-6 flex flex-col relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />
              
              <h3 className="font-serif text-xl mb-8 border-b border-border/40 pb-3 flex items-center justify-between">
                <span className="text-text-primary">{data.politician_b.name}</span>
                <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">Crimson Narrative</span>
              </h3>
              
              <h4 className="font-serif text-sm text-text-secondary/70 uppercase tracking-widest mb-4">Keyword Prominence</h4>
              {/* Force cloud B to use Crimson/Red shades only */}
              <TopicWordCloud topics={data.politician_b.topics} customPalette={PALETTE_B} />
            </div>
          </div>

          {/* Dedicated Word Cloud Insight Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div className="p-6 border-l-2 border-gold/30 bg-gold/5 rounded-r-xl">
              <h5 className="text-gold text-xs font-bold uppercase tracking-widest mb-3">Narrative Insight: {data.politician_a.name}</h5>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                The primary linguistic focus is on <span className="text-text-primary font-bold">{topKWA[0]}</span>, indicating a narrative constructed around <strong>{getLinguisicInference(topKWA)}</strong>.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topKWA.map(kw => (
                  <span key={kw} className="text-[9px] px-2 py-0.5 bg-black/20 text-gold/80 rounded border border-gold/10">#{kw}</span>
                ))}
              </div>
            </div>

            <div className="p-6 border-l-2 border-accent/30 bg-accent/5 rounded-r-xl">
              <h5 className="text-accent text-xs font-bold uppercase tracking-widest mb-3">Narrative Insight: {data.politician_b.name}</h5>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                Linguistic dominance revolves around <span className="text-text-primary font-bold">{topKWB[0]}</span>, suggesting a strategic emphasis on <strong>{getLinguisicInference(topKWB)}</strong>.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topKWB.map(kw => (
                  <span key={kw} className="text-[9px] px-2 py-0.5 bg-black/20 text-accent/80 rounded border border-accent/10">#{kw}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Topic Convergence (Venn Diagram) */}
          <div className="rounded-2xl border border-border/40 bg-card p-6 md:p-10 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/10 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#1A365D]/30 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#5B2C6F]/20 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="text-center mb-10 md:mb-14 relative z-10">
              <h3 className="font-serif text-2xl md:text-3xl text-text-primary mb-3 font-bold">Topic Convergence</h3>
              <p className="text-text-secondary text-sm">Flow of narratives and shared political focus</p>
            </div>
            
            <div className="w-full relative z-10 max-w-[1300px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-6 font-sans">
              
              {/* Left Column (Unique A) */}
              <div className="flex-1 w-full lg:text-right lg:pr-8 flex flex-col lg:items-end order-2 lg:order-1 relative z-20">
                <div className="inline-block bg-accent/10 border border-accent/20 px-6 py-2.5 rounded-full mb-8 backdrop-blur-sm shadow-[0_4px_24px_rgba(200,118,58,0.1)]">
                  <span className="font-serif text-accent font-bold text-[15px] tracking-wide">{data.politician_a.name}</span>
                </div>
                {getUniqueA().length > 0 ? (
                  <ul className="flex flex-col gap-5 w-full">
                    {getUniqueA().map(t => (
                      <li key={t.label} className="flex items-center lg:justify-end gap-5 group cursor-default">
                        <span className="text-text-primary/90 text-base md:text-lg font-medium transition-colors group-hover:text-accent flex-1 lg:flex-none">{t.label}</span>
                        <div className="w-3 h-3 rounded-full bg-accent/60 group-hover:bg-accent  transition-all duration-300 shadow-[0_0_12px_rgba(200,118,58,0.4)] group-hover:shadow-[0_0_20px_rgba(200,118,58,0.8)] group-hover:scale-[1.8] flex-shrink-0" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-text-secondary/40 text-sm italic">No exclusive topics</span>
                )}
              </div>

              {/* Center Column (Venn Circles + Overlap) */}
              <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px] flex-shrink-0 flex items-center justify-center order-1 lg:order-2 group/venn">
                
                {/* Circle A (Orange) */}
                <div className="absolute left-[5%] md:left-[10%] w-[200px] h-[200px] md:w-[260px] md:h-[260px] rounded-full bg-accent/20 border border-accent/40 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] mix-blend-screen hover:bg-accent/30 hover:border-accent/60 hover:scale-[1.03] shadow-[0_0_60px_rgba(200,118,58,0.15)] group-hover/venn:shadow-[0_0_80px_rgba(200,118,58,0.25)] ring-1 ring-inset ring-accent/20" />
                
                {/* Circle B (Navy Blue) */}
                <div className="absolute right-[5%] md:right-[10%] w-[200px] h-[200px] md:w-[260px] md:h-[260px] rounded-full bg-[#1A365D]/40 border border-[#1A365D]/60 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] mix-blend-screen hover:bg-[#1A365D]/50 hover:border-[#1A365D]/80 hover:scale-[1.03] shadow-[0_0_60px_rgba(26,54,93,0.3)] group-hover/venn:shadow-[0_0_80px_rgba(26,54,93,0.5)] ring-1 ring-inset ring-[#1A365D]/30" />

                {/* Overlap Text Box (Purple undertones) */}
                <div className="absolute z-20 w-[160px] flex flex-col items-center justify-center text-center inset-0 m-auto pointer-events-none drop-shadow-[0_0_15px_rgba(91,44,111,0.6)]">
                  <span className="font-serif text-[#C39BD3] font-bold text-[11px] md:text-[13px] mb-4 uppercase tracking-[0.3em] drop-shadow-md">Shared</span>
                  <div className="flex flex-col gap-3">
                    {getOverlap().length > 0 ? getOverlap().map(t => (
                      <span key={t.label} className="text-text-primary text-[15px] md:text-[17px] font-bold tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] pointer-events-auto hover:scale-110 transition-transform cursor-crosshair">
                        {t.label}
                      </span>
                    )) : <span className="text-text-secondary/40 text-[13px] italic pointer-events-auto">None</span>}
                  </div>
                </div>
              </div>

              {/* Right Column (Unique B) */}
              <div className="flex-1 w-full lg:pl-8 flex flex-col lg:items-start order-3 lg:order-3 relative z-20 mt-2 lg:mt-0">
                <div className="inline-block bg-[#1A365D]/30 border border-[#1A365D]/50 px-6 py-2.5 rounded-full mb-8 backdrop-blur-sm shadow-[0_4px_24px_rgba(26,54,93,0.3)]">
                  <span className="font-serif text-[#60A5FA] font-bold text-[15px] tracking-wide">{data.politician_b.name}</span>
                </div>
                {getUniqueB().length > 0 ? (
                  <ul className="flex flex-col gap-5 w-full">
                    {getUniqueB().map(t => (
                      <li key={t.label} className="flex flex-row-reverse lg:flex-row items-center lg:justify-start gap-5 group cursor-default">
                        <div className="w-3 h-3 rounded-full bg-[#3B82F6]/60 group-hover:bg-[#60A5FA] transition-all duration-300 shadow-[0_0_12px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_20px_rgba(96,165,250,0.8)] group-hover:scale-[1.8] flex-shrink-0" />
                        <span className="text-text-primary/90 text-base md:text-lg font-medium transition-colors group-hover:text-[#60A5FA] flex-1 lg:flex-none text-right lg:text-left">{t.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-text-secondary/40 text-sm italic">No exclusive topics</span>
                )}
              </div>

            </div>
          </div>

          {/* Comparison Chart */}
          <div className="rounded-xl border border-border/40 bg-card p-6 mb-8">
            <h3 className="font-serif text-lg text-text-primary mb-5 font-semibold">Topic Coverage Comparison</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={getComparisonData()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2018" />
                <XAxis dataKey="topic" stroke="#9A8F7E" tick={{ fill: '#9A8F7E', fontSize: 10 }} />
                <YAxis stroke="#9A8F7E" tick={{ fill: '#9A8F7E', fontSize: 10 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#1C1815', border: '1px solid #3A3025', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                  labelStyle={{ color: '#F5F0E8', fontWeight: 500, marginBottom: 4 }}
                  itemStyle={{ color: '#C8A96E', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#9A8F7E', paddingTop: '8px' }} />
                <Bar dataKey={data.politician_a.name} fill="#C8763A" radius={[4, 4, 0, 0]} />
                <Bar dataKey={data.politician_b.name} fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insights */}
          <div className="rounded-xl border border-border/40 bg-card p-6 mb-8">
            <h3 className="font-serif text-lg text-text-primary mb-4 font-semibold">Key Insights</h3>
            <div className="space-y-3">
              {getInsights().map((insight, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8763A" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <p className="text-text-primary/80 text-sm leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Topics */}
          {getOverlap().length > 0 && (
            <div>
              <h3 className="font-serif text-lg text-text-primary mb-4 font-semibold text-center">Shared Topics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getOverlap().map((topic, i) => (
                  <div key={i} className="rounded-xl border border-border/40 bg-card p-5">
                    <h4 className="font-serif text-accent mb-2 font-semibold">{topic.label}</h4>
                    <p className="text-text-secondary text-sm mb-3">
                      {topic.article_count} articles from {data.politician_b.name}
                    </p>
                    {topic.articles.slice(0, 2).map((a, ai) => (
                      <p key={ai} className="text-text-secondary/60 text-xs mb-1 line-clamp-1">→ {a.title}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
