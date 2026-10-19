
export default function ErrorAlert({ error, onRetry }) {
  if (!error) return null;

  return (
    <div style={{
      background: '#FEF2F2',
      border: '1px solid #FECACA',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      textAlign: 'left',
      marginBottom: '20px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'var(--status-unfeasible)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px',
            fontWeight: '700',
            fontSize: '0.85rem',
          }}>
            !
          </div>
          <div>
            <h4 style={{ fontSize: '0.98rem', fontWeight: '700', color: '#B91C1C', marginBottom: '4px' }}>
              {error.message || 'Error Generating Roadmap'}
            </h4>
            {error.details && Array.isArray(error.details) && error.details.length > 0 && (
              <ul style={{
                marginTop: '6px',
                paddingLeft: '18px',
                fontSize: '0.84rem',
                color: '#7F1D1D',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}>
                {error.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: '#FCA5A5',
              color: '#B91C1C',
              background: '#FFFFFF',
              fontSize: '0.8rem',
              padding: '5px 12px',
            }}
          >
            Retry Request
          </button>
        )}
      </div>
    </div>
  );
}
