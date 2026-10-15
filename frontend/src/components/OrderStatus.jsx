const STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

const LABELS = {
  PENDING_PAYMENT: 'Awaiting payment',
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
}

export function StatusBadge({ status }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{LABELS[status] || status}</span>
}

// Placed -> Confirmed -> Shipped -> Delivered, with steps up to the current one filled in
export function StatusTracker({ status }) {
  const current = STEPS.indexOf(status)
  if (current === -1) return null

  return (
    <ol className="status-tracker">
      {STEPS.map((step, i) => (
        <li key={step} className={i <= current ? 'done' : ''} aria-current={i === current ? 'step' : undefined}>
          <span className="dot">{i <= current ? '✓' : i + 1}</span>
          <span className="step-label">{LABELS[step]}</span>
        </li>
      ))}
    </ol>
  )
}
