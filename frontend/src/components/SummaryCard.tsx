type Props = {
  title: string
  value: string
}

function SummaryCard({ title, value }: Props) {
  return (
    <div className="summary-card">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  )
}

export default SummaryCard