import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Settings, QrCode, Music, Search as SearchIcon, ListVideo, LayoutGrid, Radio, Heart } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Player from '../components/Player';
import Search from '../components/Search';
import Queue from '../components/Queue';
import { supabase } from '../lib/supabase';

function HostView() {
  const [activeTab, setActiveTab] = useState('search');
  const [currentVideo, setCurrentVideo] = useState(null);
  const [queue, setQueue] = useState([]);
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('vocalize_session_id') || Math.random().toString(36).substring(2, 6).toUpperCase();
    localStorage.setItem('vocalize_session_id', saved);
    return saved;
  });

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel(`queue:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'queues', filter: `session_id=eq.${sessionId}` }, 
        payload => {
          setQueue(payload.new.items || []);
          if (payload.new.current_video && (!currentVideo || payload.new.current_video.id !== currentVideo.id)) {
            setCurrentVideo(payload.new.current_video);
          }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [sessionId, currentVideo]);

  const handleSelectSong = (song, action) => {
    if (action === 'play') {
      setCurrentVideo(song);
    } else {
      setQueue([...queue, { ...song, queueId: Date.now() }]);
    }
  };

  const handleSongEnded = () => {
    if (queue.length > 0) {
      const n = queue[0];
      const nq = queue.slice(1);
      setCurrentVideo(n);
      setQueue(nq);
    } else {
      setCurrentVideo(null);
    }
  };

  const handleRemove = (id) => {
    setQueue(queue.filter(item => item.queueId !== id));
  };

  const remoteUrl = `${window.location.origin}/remote?id=${sessionId}`;

  return (
    <div className="ktv-app">
      {/* Header */}
      <header className="ktv-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--accent-blue)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <Mic2 size={18} color="white" />
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>
            VOCAL<span style={{ color: 'var(--accent-blue)' }}>IZE</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '6px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, opacity: 0.3, letterSpacing: '1px' }}>ROOM ID</span>
            <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '2px', color: 'var(--accent-blue)' }}>{sessionId}</span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn-icon"><QrCode size={18} /></button>
            <button className="btn-icon"><Settings size={18} /></button>
            <button 
              className="btn-icon" 
              onClick={() => document.documentElement.requestFullscreen()}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Workspace */}
      <main className="ktv-main">
        {/* Stage */}
        <section className="ktv-stage" style={{ padding: '24px', gap: '20px' }}>
          {/* Main Video Area */}
          <div style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', border: '1px solid var(--glass-border)' }}>
            {currentVideo ? (
              <Player videoId={currentVideo.id} onEnded={handleSongEnded} />
            ) : (
              /* Idle Video Stage Placeholders */
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to top, #0c0c0c, #101014)' }}>
                <div style={{ opacity: 0.1, marginBottom: '24px' }}>
                  <Music size={100} />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, opacity: 0.2, textTransform: 'uppercase', letterSpacing: '8px' }}>Studio Ready</h2>
              </div>
            )}
            
            <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', zIndex: 10 }}>
               LIVE 1080P
            </div>
          </div>

          {/* Dedicated Now Performing Area (Below Video) */}
          <AnimatePresence mode="wait">
            {currentVideo && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="glass-panel"
                style={{ padding: '24px 40px', background: 'linear-gradient(90deg, rgba(33,150,243,0.1), transparent)', borderLeft: '4px solid var(--accent-blue)' }}
              >
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                       <span style={{ display: 'block', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '6px', color: 'var(--accent-blue)', marginBottom: '8px' }}>Now Performing</span>
                       <h2 style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1.1, color: '#fff' }} dangerouslySetInnerHTML={{ __html: currentVideo.title }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <Radio className="neon-text" size={32} style={{ marginBottom: '8px' }} />
                       <div style={{ fontSize: '10px', fontWeight: 900, opacity: 0.3, letterSpacing: '1px' }}>DTS SURROUND</div>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Bar */}
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
             <div style={{ display: 'flex', gap: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>
                   <div style={{ width: '6px', height: '6px', background: '#4CAF50', borderRadius: '50%' }}></div>
                   Engine Online
                </div>
                <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>Latency: <span style={{ color: 'var(--accent-blue)' }}>12ms</span></div>
             </div>
             <div style={{ fontSize: '11px', fontWeight: 600, fontStyle: 'italic', opacity: 0.3 }}>
                SYSTEM STANDBY / READY
             </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="ktv-sidebar">
           <div className="segmented-tabs">
              <button onClick={() => setActiveTab('search')} className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}>BROWSE</button>
              <button onClick={() => setActiveTab('reserved')} className={`tab-btn ${activeTab === 'reserved' ? 'active' : ''}`}>QUEUE</button>
           </div>

           <div style={{ flex: 1, padding: '0 24px 24px', overflowY: 'auto' }}>
              <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   style={{ height: '100%' }}
                 >
                    {activeTab === 'search' && <Search onSelect={handleSelectSong} />}
                    {activeTab === 'reserved' && <Queue items={queue} onRemove={handleRemove} onSkip={handleSongEnded} />}
                 </motion.div>
              </AnimatePresence>
           </div>

           <div style={{ padding: '24px', borderTop: '1px solid var(--glass-border)' }}>
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <h4 style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>Phone Remote</h4>
                    <p style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 800, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                       {window.location.host}/remote?id={sessionId}
                    </p>
                 </div>
                 <div style={{ background: '#fff', padding: '4px', borderRadius: '6px', marginLeft: '12px' }}>
                    <QRCodeSVG value={remoteUrl} size={40} />
                 </div>
              </div>
           </div>
        </aside>
      </main>
    </div>
  );
}

export default HostView;
