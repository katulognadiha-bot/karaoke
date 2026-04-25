import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Info, Check, ExternalLink, AlertCircle, X } from 'lucide-react';

const ApiSettings = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('idle'); // idle, saved, error

  useEffect(() => {
    const saved = localStorage.getItem('vocalize_custom_api_key');
    if (saved) setApiKey(saved);
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('vocalize_custom_api_key', apiKey.trim());
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      localStorage.removeItem('vocalize_custom_api_key');
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '32px',
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(33,150,243,0.1), rgba(20,20,20,0.95))',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px'
            }}
          >
            <button 
              onClick={onClose}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'white', opacity: 0.4, cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--accent-blue)', padding: '10px', borderRadius: '12px' }}>
                <Key size={20} color="white" />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>YouTube API Settings</h2>
            </div>

            <p style={{ fontSize: '13px', opacity: 0.6, lineHeight: 1.6, marginBottom: '24px' }}>
              Gamitin ang sarili mong API Key para maiwasan ang limitasyon sa pag-search. Ang key na ito ay mase-save lamang sa iyong device.
            </p>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4, marginBottom: '8px' }}>Your API Key</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your YouTube API Key here..."
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <button 
                onClick={handleSave}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '14px',
                  background: status === 'saved' ? '#4ade80' : 'var(--accent-blue)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s'
                }}
              >
                {status === 'saved' ? <Check size={16} /> : null}
                {status === 'saved' ? 'Saved Successfully' : 'Save Configuration'}
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Info size={14} color="var(--accent-blue)" />
                <h4 style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Tutorial: How to get a key</h4>
              </div>
              
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Pumunta sa Google Cloud Console.',
                  'Gumawa ng bagong "Project".',
                  'I-enable ang "YouTube Data API v3".',
                  'Pumunta sa "Credentials" at i-click ang "Create Credentials" > "API Key".'
                ].map((step, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '12px', fontSize: '12px', opacity: 0.7, lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 900 }}>{idx + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>

              <a 
                href="https://console.cloud.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  marginTop: '16px', 
                  fontSize: '11px', 
                  color: 'var(--accent-blue)', 
                  textDecoration: 'none', 
                  fontWeight: 800 
                }}
              >
                Open Google Cloud Console <ExternalLink size={12} />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ApiSettings;
