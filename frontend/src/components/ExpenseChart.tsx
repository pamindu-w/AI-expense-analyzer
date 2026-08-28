import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'

type ChartData = {
  name: string
  value: number
}

type Props = {
  data: ChartData[]
}

const COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Bills: '#ef4444',
  Entertainment: '#8b5cf6',
  Other: '#10b981',
}

const FALLBACK_COLORS = ['#f59e0b', '#3b82f6', '#ec4899', '#ef4444', '#8b5cf6', '#10b981']

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload
    const color = COLORS[name] || '#f59e0b'
    return (
      <div style={{
        background: '#13131f',
        border: `1px solid ${color}40`,
        borderRadius: '8px',
        padding: '0.7rem 1rem',
        fontFamily: "'Inconsolata', monospace",
        boxShadow: `0 0 20px ${color}20`,
      }}>
        <p style={{ color: 'rgba(232,232,240,0.5)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{name}</p>
        <p style={{ color: '#fff', fontSize: '1.1rem', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Rs {value.toFixed(2)}</p>
      </div>
    )
  }
  return null
}

function ExpenseChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        color: 'rgba(232,232,240,0.2)',
        fontFamily: "'Inconsolata', monospace",
        fontSize: '0.85rem',
        letterSpacing: '0.1em',
        gap: '0.5rem',
      }}>
        <span style={{ fontSize: '2rem' }}>◎</span>
        <span>No expense data yet</span>
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inconsolata:wght@400;500&display=swap');
      `}</style>

      <div style={{ width: '100%' }}>
        <div style={{ position: 'relative', width: '100%', height: '280px' }}>
          {/* Center label */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}>
            <p style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(232,232,240,0.35)',
              marginBottom: '0.2rem',
            }}>Total</p>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1,
            }}>Rs {total.toFixed(0)}</p>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                    opacity={0.9}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom legend */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginTop: '1rem',
          justifyContent: 'center',
        }}>
          {data.map((entry, index) => {
            const color = COLORS[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
            const pct = ((entry.value / total) * 100).toFixed(1)
            return (
              <div key={entry.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: `${color}12`,
                border: `1px solid ${color}30`,
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontFamily: "'Inconsolata', monospace",
              }}>
                <span style={{
                  width: '7px', height: '7px',
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.8rem', color: 'rgba(232,232,240,0.65)' }}>{entry.name}</span>
                <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500 }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default ExpenseChart