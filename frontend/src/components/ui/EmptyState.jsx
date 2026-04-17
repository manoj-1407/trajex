import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action, // { label, onClick, icon }
  compact = false
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: compact ? '32px 24px' : '64px 24px',
      background: 'transparent',
      borderRadius: 'var(--radius-lg)'
    }}>
      {Icon && (
        <Icon 
          size={compact ? 32 : 48} 
          color="var(--border)" 
          style={{ marginBottom: compact ? '12px' : '20px' }} 
        />
      )}
      
      <h3 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      
      {subtitle && (
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          margin: compact ? '0' : '0 0 24px 0',
          maxWidth: '320px',
          lineHeight: 1.5
        }}>
          {subtitle}
        </p>
      )}

      {action && (
        <div style={{ marginTop: compact ? '16px' : '0' }}>
          <Button 
            variant="secondary" 
            onClick={action.onClick}
            icon={action.icon ? <action.icon size={16} /> : undefined}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
