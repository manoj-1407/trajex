export function SkeletonText({ width = '100%', height = '16px', style = {} }) {
  return (
    <div 
      className="skeleton" 
      style={{ width, height, borderRadius: 'var(--radius-sm)', ...style }} 
    />
  );
}

export function SkeletonCircle({ size = '40px', style = {} }) {
  return (
    <div 
      className="skeleton" 
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, ...style }} 
    />
  );
}

export function SkeletonBadge({ style = {} }) {
  return (
    <div 
      className="skeleton" 
      style={{ width: '80px', height: '24px', borderRadius: 'var(--radius-full)', ...style }} 
    />
  );
}

export function SkeletonCard({ lines = 3, style = {} }) {
  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', ...style }}>
      <SkeletonCircle size="48px" style={{ marginBottom: '8px' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonText key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonTableRow({ cols = 5, style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderBottom: '1px solid var(--border-subtle)', ...style }}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonText key={i} width={i === 0 ? '80px' : i === cols - 1 ? '40px' : '100%'} style={{ flex: i === cols - 1 ? 0 : 1 }} />
      ))}
    </div>
  );
}

export function SkeletonChart({ height = '300px', style = {} }) {
  return (
    <div className="glass-card" style={{ padding: '24px', height, display: 'flex', flexDirection: 'column', ...style }}>
      <SkeletonText width="120px" height="20px" style={{ marginBottom: '24px' }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', overflow: 'hidden' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ flex: 1, height: `${20 + Math.random() * 80}%`, borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonKPI({ style = {} }) {
  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px', ...style }}>
      <SkeletonCircle size="48px" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonText width="60px" height="12px" />
        <SkeletonText width="100px" height="32px" />
      </div>
    </div>
  );
}
