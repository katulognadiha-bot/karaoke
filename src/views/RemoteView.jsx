import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Search as SearchIcon, ListVideo, Music, ChevronLeft, Wifi, Terminal, LayoutGrid, Speaker } from 'lucide-react';
import Search from '../components/Search';
import Queue from '../components/Queue';
import { supabase } from '../lib/supabase';

function RemoteView() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('search');
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState(null);

  // SFX Broadcast Channel
  const sendSFX = async (type) => {
    if (!supabase || !sessionId) return;
    const channel = supabase.channel(`queue:${sessionId}`);
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'sound_effect',
          payload: { type },
        });
      }
    });
  };

  useEffect(() => {
    if (!supabase || !sessionId) return;
    const channel = supabase.channel(`remote:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'queues', filter: `session_id=eq.${sessionId}` }, 
        payload => setQueue(payload.new.items || [])
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [sessionId]);

  const updateDB = async (nq) => {
    if (!supabase) return;
    await supabase.from('queues').update({ items: nq }).eq('session_id', sessionId);
  };

  const handleSelectSong = (song, action) => {
    const nq = [...queue, { ...song, queueId: Date.now() }];
    setQueue(nq);
    updateDB(nq);
  };

  const handleRemove = (qid) => {
    const nq = queue.filter(item => item.queueId !== qid);
    setQueue(nq);
    updateDB(nq);
  };

  if (!sessionId) {
    return (
      <div style={{ height: '100vh', background: '#0c0c0c', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
         <Terminal size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
         <h2 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>Room ID Needed</h2>
         <p style={{ fontSize: '14px', opacity: 0.4, marginBottom: '32px' }}>Please scan the QR code on the TV to connect your remote.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#0c0c0c', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Mobile Header */}
      <header style={{ padding: '20px', background: '#111', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--accent-blue)', padding: '6px', borderRadius: '8px' }}>
            <Mic2 size={16} color="white" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '-0.5px' }}>
            VOCAL<span style={{ color: 'var(--accent-blue)' }}>IZE</span> <span style={{ opacity: 0.2, fontWeight: 400, marginLeft: '4px' }}>REMOTE</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(33,150,243,0.1)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(33,150,243,0.2)' }}>
          <Wifi size={12} color="var(--accent-blue)" />
          <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent-blue)', letterSpacing: '1px' }}>{sessionId}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ height: '100%' }}
          >
            {activeTab === 'search' && <Search onSelect={handleSelectSong} />}
            {activeTab === 'reserved' && <Queue items={queue} onRemove={handleRemove} onSkip={() => {}} />}
            {activeTab === 'sfx' && (
              <div style={{ padding: '10px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.3, marginBottom: '24px' }}>Party Sound Board</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   {[
                     { id: 'applause', label: 'Applause', icon: '👏', color: '#4ade80' },
                     { id: 'airhorn', label: 'Airhorn', icon: '📢', color: '#fb7185' },
                     { id: 'cheer', label: 'Cheers', icon: '🎉', color: '#fbbf24' },
                     { id: 'fail', label: 'Fail', icon: '👎', color: '#94a3b8' }
                   ].map(sfx => (
                     <motion.button
                       key={sfx.id}
                       whileTap={{ scale: 0.95 }}
                       onClick={() => sendSFX(sfx.id)}
                       style={{ 
                         background: 'rgba(255,255,255,0.03)', 
                         border: '1px solid rgba(255,255,255,0.05)', 
                         borderRadius: '24px', 
                         padding: '32px 20px',
                         display: 'flex',
                         flexDirection: 'column',
                         alignItems: 'center',
                         gap: '12px',
                         cursor: 'pointer'
                       }}
                     >
                        <span style={{ fontSize: '32px' }}>{sfx.icon}</span>
                        <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'white' }}>{sfx.label}</span>
                     </motion.button>
                   ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav style={{ padding: '16px 20px 32px', background: 'rgba(17,17,17,0.8)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
         <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '16px', gap: '4px' }}>
            <button 
              onClick={() => setActiveTab('search')}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '12px', 
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'search' ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === 'search' ? 'white' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
               <SearchIcon size={20} />
               <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Browse</span>
            </button>
            <button 
              onClick={() => setActiveTab('reserved')}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '12px', 
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'reserved' ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === 'reserved' ? 'white' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
               <ListVideo size={20} />
               <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Queue</span>
               {queue.length > 0 && (
                 <span style={{ position: 'absolute', top: '8px', right: '30%', width: '16px', height: '16px', background: '#ef4444', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '2px solid #111' }}>
                   {queue.length}
                 </span>
               )}
            </button>
            <button 
              onClick={() => setActiveTab('sfx')}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '12px', 
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'sfx' ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === 'sfx' ? 'white' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
               <Speaker size={20} />
               <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>SFX</span>
            </button>
         </div>
      </nav>
    </div>
  );
}

export default RemoteView;
