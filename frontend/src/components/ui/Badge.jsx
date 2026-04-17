export default function Badge({ status, type = 'order', size = 'md', className = '' }) {
  const isOrder = type === 'order';
  const prefix = isOrder ? 'order' : 'rider';
  const cls = `badge badge-${prefix}-${status}`;
  
  const pulseStatus = isOrder ? 'in_transit' : 'available';
  const shouldPulse = status === pulseStatus;

  const sizeStyles = size === 'sm' ? {
    padding: '4px 10px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em'
  } : {
    padding: '6px 14px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em'
  };

  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    assigned: 'Assigned',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    failed: 'Failed',
    cancelled: 'Cancelled',
    available: 'Available',
    busy: 'Busy',
    offline: 'Offline'
  };

  return (
    <div className={`${cls} ${className} glass-stack`} style={{ ...sizeStyles, display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '100px', textTransform: 'uppercase' }}>
      <span className={`status-dot ${shouldPulse ? 'pulse' : ''}`} style={{ width: '6px', height: '6px', background: 'currentColor' }} />
      {labels[status] || status.toUpperCase()}
    </div>
  );
}
