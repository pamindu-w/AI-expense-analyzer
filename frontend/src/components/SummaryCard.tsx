type Props = {
  title: string
  value: string
  accent?: string
}

function SummaryCard({ title, value, accent = '#f59e0b' }: Props) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inconsolata:wght@400;500&display=swap');

        .summary-card {
          position: relative;
          background: #0e0e1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1.6rem;
          overflow: hidden;
          transition: background 0.2s, transform 0.2s;
        }
        .summary-card:hover {
          background: #121220;
          transform: translateY(-2px);
        }
        .summary-card-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }
        .summary-card-title {
          font-family: 'Inconsolata', monospace;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(232,232,240,0.4);
          margin-bottom: 0.7rem;
        }
        .summary-card-value {
          font-family: 'Syne', sans-serif;
          font-size: 1.9rem;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: -0.02em;
        }
      `}</style>

      <div className="summary-card">
        <div className="summary-card-bar" style={{ background: accent }} />
        <p className="summary-card-title">{title}</p>
        <p className="summary-card-value">{value}</p>
      </div>
    </>
  )
}

export default SummaryCard