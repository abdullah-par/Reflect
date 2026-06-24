import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import TypewriterText from './TypewriterText';
import './MirrorPane.css';

interface MirrorPaneProps {
  relationships: Record<string, { positive: number; negative: number; neutral: number }>;
  patterns: Record<string, number>;
  toneCounts: Record<string, number>;
}

interface RelationshipDataPoint {
  name: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

const COLORS = ['var(--accent)', 'var(--text-2)', 'var(--accent-2)', 'var(--gilt)', 'var(--success)', 'var(--text-3)'];

const RelationshipTick = (props: any) => {
  const { x, y, payload, relationshipData } = props;
  const entry = (relationshipData as RelationshipDataPoint[]).find(d => d.name === payload.value);
  const isNegativeMajority = entry ? entry.negative > (entry.positive + entry.neutral) : false;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill={isNegativeMajority ? 'var(--accent-2)' : 'var(--text-2)'}
        fontSize={12}
        fontFamily="var(--font-ui)"
        fontWeight={isNegativeMajority ? 'bold' : 'normal'}
      >
        {payload.value}
      </text>
    </g>
  );
};

export default function MirrorPane({ relationships, patterns, toneCounts }: MirrorPaneProps) {
  const patternData = Object.entries(patterns)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const toneData = Object.entries(toneCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const relationshipData: RelationshipDataPoint[] = Object.entries(relationships)
    .map(([name, counts]) => ({
      name,
      positive: counts.positive,
      negative: counts.negative,
      neutral: counts.neutral,
      total: counts.positive + counts.negative + counts.neutral
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  if (patternData.length === 0 && toneData.length === 0 && relationshipData.length === 0) {
    return (
      <div className="mirror-empty-state">
        <svg className="mirror-empty-flourish" width="120" height="32" viewBox="0 0 120 32" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 16C30 16 35 6 45 16C55 26 60 16 65 16C70 16 75 26 85 16C95 6 110 16 110 16" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="60" cy="16" r="3.5" fill="currentColor" />
          <path d="M54 16C56 12 64 12 66 16" strokeWidth="1" />
        </svg>
        <p className="mirror-empty-text">No patterns detected yet. Keep writing.</p>
      </div>
    );
  }

  // Interpretive Summaries
  const topPattern = patternData[0];
  const patternInterpretiveText = topPattern 
    ? `A recurring theme of "${topPattern.name.toLowerCase()}" stands out as the most prominent behavior in your recent reflections.`
    : '';

  const topTone = toneData[0];
  const toneInterpretiveText = topTone
    ? `Your emotional landscape is primarily marked by ${topTone.name.toLowerCase()}, shading the majority of your expressions.`
    : '';

  let highestNegRatioRelation = '';
  let maxRatio = -1;

  relationshipData.forEach(rel => {
    if (rel.negative > 0) {
      const ratio = rel.positive === 0 ? rel.negative * 10 : rel.negative / rel.positive;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        highestNegRatioRelation = rel.name;
      }
    }
  });

  const relationshipInterpretiveText = highestNegRatioRelation
    ? `Interaction dynamics with ${highestNegRatioRelation} present the most significant emotional friction, with negative tones outweighing positive ones.`
    : (relationshipData.length > 0 
        ? `Your interactions with ${relationshipData[0].name} represent your most active relational focus, trending neutral to positive.`
        : '');

  return (
    <div className="mirror-pane animate-up">
      {patternData.length > 0 && (
        <section className="mirror-section">
          <h2 className="mirror-section-title">Behavioral Patterns</h2>
          {patternInterpretiveText && (
            <div className="mirror-interpretive">
              <TypewriterText text={patternInterpretiveText} speed={20} delay={250} />
            </div>
          )}
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={patternData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={150} tick={{ fill: 'var(--text-2)', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'var(--bg-3)' }} contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '4px' }} />
                <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {toneData.length > 0 && (
        <section className="mirror-section delay-1 animate-up">
          <h2 className="mirror-section-title">Emotional Tones</h2>
          {toneInterpretiveText && (
            <div className="mirror-interpretive">
              <TypewriterText text={toneInterpretiveText} speed={20} delay={750} />
            </div>
          )}
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={toneData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {toneData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '4px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {relationshipData.length > 0 && (
        <section className="mirror-section delay-2 animate-up">
          <h2 className="mirror-section-title">Relationship Dynamics</h2>
          {relationshipInterpretiveText && (
            <div className="mirror-interpretive">
              <TypewriterText text={relationshipInterpretiveText} speed={20} delay={1250} />
            </div>
          )}
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={relationshipData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" tick={<RelationshipTick relationshipData={relationshipData} />} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'var(--bg-3)' }} contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '4px' }} />
                <Bar dataKey="positive" stackId="a" fill="var(--success)">
                  {relationshipData.map((entry, index) => {
                    const isNegativeMajority = entry.negative > (entry.positive + entry.neutral);
                    return (
                      <Cell
                        key={`cell-pos-${index}`}
                        fill="var(--success)"
                        stroke={isNegativeMajority ? 'var(--accent-2)' : undefined}
                        strokeWidth={isNegativeMajority ? 1 : 0}
                      />
                    );
                  })}
                </Bar>
                <Bar dataKey="neutral" stackId="a" fill="var(--text-3)">
                  {relationshipData.map((entry, index) => {
                    const isNegativeMajority = entry.negative > (entry.positive + entry.neutral);
                    return (
                      <Cell
                        key={`cell-neu-${index}`}
                        fill="var(--text-3)"
                        stroke={isNegativeMajority ? 'var(--accent-2)' : undefined}
                        strokeWidth={isNegativeMajority ? 1 : 0}
                      />
                    );
                  })}
                </Bar>
                <Bar dataKey="negative" stackId="a" fill="var(--accent-2)">
                  {relationshipData.map((entry, index) => {
                    const isNegativeMajority = entry.negative > (entry.positive + entry.neutral);
                    return (
                      <Cell
                        key={`cell-neg-${index}`}
                        fill="var(--accent-2)"
                        stroke={isNegativeMajority ? 'var(--accent-2)' : undefined}
                        strokeWidth={isNegativeMajority ? 1 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}

