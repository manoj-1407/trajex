export default function Badge({ status, type = 'order', size = 'md', className = '' }) {
  const isOrder = type === 'order';
  const prefix = isOrder ? 'order' : 'rider';
  const cls = `badge badge-${prefix}-${status}`;
  
  const pulseStatus = isOrder ? 'in_transit' : 'available';
  const shouldPulse = status === pulseStatus;

  const sizeStyles = size === 'sm' ? {
    padding: '4px 8px', fontSize: '10px'
  } : {
    padding: '6px 12px', fontSize: '12px'
  };

  const getLabel = () => {
    if (!status) return 'Unknown';
    if (status === 'picked_up') return 'Picked Up';
    if (status === 'in_transit') return 'In Transit';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className={`${cls} ${className}`} style={sizeStyles}>
      <span className={`status-dot ${shouldPulse ? 'pulse' : ''}`} style={{ background: 'currentColor' }} />
      {getLabel()}
    </div>
  );
}
