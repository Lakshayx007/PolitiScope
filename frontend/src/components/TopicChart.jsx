import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, AreaChart, Area,
} from 'recharts';

/* High-contrast warm palette — strictly zero blue, zero green */
const PALETTE = [
  '#E74C3C', '#F4D03F', '#E67E22', '#922B21', '#F5B041',
  '#A04000', '#F1948A', '#B9770E', '#641E16', '#DC7633',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{ background: '#1C1815', border: '1px solid #3A3025', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <p style={{ color: '#9A8F7E', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
          <span style={{ color: '#F5F0E8' }}>{entry.name}:</span>
          <span style={{ color: '#C8A96E', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ─── Topic Timeline ─── */
export function TopicTimelineChart({ timeline }) {
  if (!timeline) return null;

  const weekMap = {};
  const topicLabels = Object.keys(timeline);

  topicLabels.forEach((label) => {
    Object.entries(timeline[label]).forEach(([weekStr, count]) => {
      if (!weekMap[weekStr]) {
        weekMap[weekStr] = { week: weekStr };
        topicLabels.forEach(l => weekMap[weekStr][l] = 0);
      }
      weekMap[weekStr][label] = count;
    });
  });

  const data = Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));
  if (!data.length) return <div className="flex items-center justify-center h-64 text-text-secondary text-sm">Not enough data for timeline</div>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2018" />
        <XAxis dataKey="week" stroke="#9A8F7E" tick={{ fill: '#9A8F7E', fontSize: 10 }}
          tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
        <YAxis stroke="#9A8F7E" tick={{ fill: '#9A8F7E', fontSize: 10 }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#9A8F7E', paddingTop: '8px' }} />
        {topicLabels.map((label, i) => (
          <Line key={label} type="monotone" dataKey={label}
            stroke={PALETTE[i % PALETTE.length]} strokeWidth={2}
            dot={{ fill: PALETTE[i % PALETTE.length], r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── Donut Chart — fixed label overlap ─── */
export function TopicDonutChart({ data }) {
  if (!data?.length) return null;

  const renderLabel = ({ cx, cy, midAngle, outerRadius, percentage }) => {
    if (percentage < 8) return null; // hide small slices
    const RADIAN = Math.PI / 180;
    const x = cx + (outerRadius + 22) * Math.cos(-midAngle * RADIAN);
    const y = cy + (outerRadius + 22) * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#C8A96E" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"
        style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
        {percentage}%
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} cx="50%" cy="45%" innerRadius={60} outerRadius={95}
          paddingAngle={2} dataKey="value" nameKey="name"
          label={renderLabel} labelLine={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="#0D0B08" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={({ payload }) => {
          if (!payload?.[0]) return null;
          const d = payload[0].payload;
          return (
            <div style={{ background: '#1C1815', border: '1px solid #3A3025', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <p style={{ color: '#F5F0E8', fontSize: 13, fontWeight: 500 }}>{d.name}</p>
              <p style={{ color: '#C8A96E', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{d.value} articles ({d.percentage}%)</p>
            </div>
          );
        }} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#9A8F7E', paddingTop: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ─── Source Bar Chart ─── */
export function SourceBarChart({ data }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2018" horizontal={false} />
        <XAxis type="number" stroke="#9A8F7E" tick={{ fill: '#9A8F7E', fontSize: 10 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" stroke="#9A8F7E" tick={{ fill: '#9A8F7E', fontSize: 10 }} width={120} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#C8763A" name="Articles" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Coverage Area Chart ─── */
export function CoverageAreaChart({ data }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="warmGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C8763A" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#C8763A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2018" />
        <XAxis dataKey="week" stroke="#9A8F7E" tick={{ fill: '#9A8F7E', fontSize: 10 }}
          tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
        <YAxis stroke="#9A8F7E" tick={{ fill: '#9A8F7E', fontSize: 10 }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="articles" stroke="#C8763A" strokeWidth={2}
          fill="url(#warmGrad)" name="Articles" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── Day Distribution ─── */
export function DayDistributionChart({ data }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2018" />
        <XAxis dataKey="day" stroke="#9A8F7E" tick={{ fill: '#9A8F7E', fontSize: 10 }} />
        <YAxis stroke="#9A8F7E" tick={{ fill: '#9A8F7E', fontSize: 10 }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#C8A96E" name="Articles" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function TopicChart({ topics }) {
  return <TopicTimelineChart topics={topics} />;
}

export function TopicWordCloud({ topics, customPalette }) {
  const containerRef = useRef();
  const svgRef = useRef();
  const activePalette = customPalette || PALETTE;

  useEffect(() => {
    if (!topics || !topics.length) return;

    const wordData = [];
    topics.forEach((topic, topicIdx) => {
      topic.keywords.forEach((kw, idx) => {
        wordData.push({
          text: kw,
          value: Math.round(topic.percentage * (15 - idx)),
          topic: topic.label,
          color: activePalette[topicIdx % activePalette.length],
        });
      });
    });

    const width = containerRef.current.clientWidth || 800;
    const height = 400;

    const minVal = Math.min(...wordData.map((d) => d.value));
    const maxVal = Math.max(...wordData.map((d) => d.value));
    const fontScale = d3.scaleLinear().domain([minVal, maxVal]).range([12, 52]);

    const tooltip = d3.select(containerRef.current).select('.wc-tooltip');

    d3.select(svgRef.current).selectAll("*").remove();

    const layout = cloud()
      .size([width, height])
      .words(wordData.map((d) => ({ ...d, size: fontScale(d.value) })))
      .padding(5)
      .rotate(() => (Math.random() > 0.5 ? 0 : 90))
      .font("system-ui, -apple-system, sans-serif")
      .fontSize((d) => d.size)
      .on("end", draw);

    layout.start();

    function draw(words) {
      d3.select(svgRef.current)
        .attr("width", layout.size()[0])
        .attr("height", layout.size()[1])
        .append("g")
        .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
        .selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", (d) => d.size + "px")
        .style("font-family", "system-ui, -apple-system, sans-serif")
        .style("fill", (d) => d.color)
        .attr("text-anchor", "middle")
        .attr("transform", (d) => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
        .text((d) => d.text)
        .on("mouseover", function (event, d) {
          d3.select(this).style("opacity", 0.8).style("cursor", "pointer");
          tooltip
            .style("visibility", "visible")
            .style("top", `${Math.max(0, event.pageY - 40)}px`)
            .style("left", `${event.pageX + 10}px`)
            .html(`<div style="color: #9A8F7E; font-size: 11px; margin-bottom: 2px;">${d.topic}</div>
                   <div style="color: #F5F0E8; font-size: 12px; font-weight: 600;">${d.text} <span style="color: #C8A96E; font-family: monospace; margin-left: 4px;">Score: ${d.value}</span></div>`);
        })
        .on("mousemove", function (event) {
          tooltip
            .style("top", `${Math.max(0, event.pageY - 40)}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
          d3.select(this).style("opacity", 1);
          tooltip.style("visibility", "hidden");
        });
    }

    return () => {
      tooltip.style("visibility", "hidden");
    };
  }, [topics]);

  return (
    <div className="w-full relative" ref={containerRef}>
      <div className="bg-card w-full h-[400px] flex items-center justify-center">
        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>
      
      <div 
        className="wc-tooltip absolute z-[100] invisible pointer-events-none"
        style={{
          background: '#1C1815', 
          border: '1px solid #3A3025', 
          borderRadius: 8, 
          padding: '8px 12px', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      />

      <div className="flex flex-wrap justify-center gap-4 mt-6">
        {topics.map((t, idx) => (
          <div key={t.label} className="flex flex-row items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activePalette[idx % activePalette.length] }} />
            <span className="text-text-secondary text-xs">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
