import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface MirrorPaneProps {
  relationships: Record<string, { positive: number; negative: number; neutral: number }>;
  patterns: Record<string, number>;
  toneCounts: Record<string, number>;
}

const COLORS = ['var(--accent)', 'var(--text-2)', 'var(--accent-2)', 'var(--gilt)', 'var(--success)', 'var(--error)'];

export default function MirrorPane({ relationships, patterns, toneCounts }: MirrorPaneProps) {
  const patternData = Object.entries(patterns)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const toneData = Object.entries(toneCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const relationshipData = Object.entries(relationships)
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
      <div className="ds-empty-state">
        <p>No patterns detected yet. Keep writing.</p>
      </div>
    );
  }

  return (
    <div className="mirror-pane animate-up">
      {patternData.length > 0 && (
        <section className="mirror-section">
          <h2 className="mirror-section-title">Behavioral Patterns</h2>
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
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={relationshipData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'var(--bg-3)' }} contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '4px' }} />
                <Bar dataKey="positive" stackId="a" fill="var(--success)" />
                <Bar dataKey="neutral" stackId="a" fill="var(--text-3)" />
                <Bar dataKey="negative" stackId="a" fill="var(--error)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
