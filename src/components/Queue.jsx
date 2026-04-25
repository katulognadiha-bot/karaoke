import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, GripVertical, Radio } from 'lucide-react';

const Queue = ({ items, onRemove, onSkip }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 900, opacity: 0.3, letterSpacing: '1px' }}>QUEUE</h3>
        <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent-blue)', background: 'rgba(33, 150, 243, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>{items.length} TRACKS</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
             <GripVertical size={40} />
             <p style={{ marginTop: '16px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Queue is empty</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div 
              key={item.dbId || item.queueId || index} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '12px', 
                borderRadius: '12px', 
                background: index === 0 ? 'rgba(33, 150, 243, 0.05)' : 'rgba(255,255,255,0.02)',
                border: index === 0 ? '1px solid rgba(33, 150, 243, 0.2)' : '1px solid transparent',
                marginBottom: '8px'
              }}
            >
              <div style={{ flexShrink: 0 }}>
                {index === 0 ? (
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Radio size={14} color="white" />
                  </div>
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, opacity: 0.3 }}>
                    {index + 1}
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} dangerouslySetInnerHTML={{ __html: item.title }} />
                <p style={{ fontSize: '9px', fontWeight: 800, opacity: 0.2, textTransform: 'uppercase', marginTop: '2px' }}>{item.channel}</p>
              </div>

              <button 
                onClick={() => onRemove(item.dbId || item.queueId || index)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.1)', cursor: 'pointer', padding: '8px' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.1)'}
              >
                <Trash2 size={16} />
              </button>
            </div>

          ))
        )}
      </div>

      {items.length > 0 && (
        <button 
          onClick={onSkip}
          style={{ marginTop: '20px', width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: '10px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px' }}
        >
          Skip Current Track
        </button>
      )}
    </div>
  );
};

export default Queue;
