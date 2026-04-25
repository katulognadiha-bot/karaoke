import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Search as SearchIcon, ListVideo, Music, ChevronLeft, Wifi, Terminal, LayoutGrid, Speaker } from 'lucide-react';
import Search from '../components/Search';
import Queue from '../components/Queue';
import { supabase } from '../lib/supabase';
import { recordSongPlay } from '../lib/stats';

function RemoteView() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('search');

  const [queue, setQueue] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase || !sessionId) return;
    
    // Fetch initial queue
    const fetchQueue = async () => {
      const { data } = await supabase
        .from('queue_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'queued')
        .order('created_at', { ascending: true });
      
      setQueue(data?.map(item => ({ ...item.song_data, dbId: item.id })) || []);
    };
    fetchQueue();

    // Subscribe to queue_items changes
    const channel = supabase.channel(`queue_items:${sessionId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'queue_items', 
        filter: `session_id=eq.${sessionId}` 
      }, () => {
        fetchQueue(); // Refresh list on any change
      }).subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [sessionId]);


  const handleSelectSong = async (song, action) => {
    // Atomic insert into queue_items - multiple users can do this simultaneously
    await supabase.from('queue_items').insert([{
      session_id: sessionId,
      song_data: song,
      status: 'queued'
    }]);
    
    recordSongPlay(song);
  };


  const handleRemove = async (dbId) => {
    await supabase.from('queue_items').delete().eq('id', dbId);
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
    <div style={{ 
      height: '100vh', 
      background: 'linear-gradient(to bottom, #0f0f12, #000000)', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      fontFamily: "'Outfit', sans-serif",
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      
      {/* Mobile Header */}
      <header style={{ 
        padding: '16px 20px', 
        background: 'rgba(17,17,17,0.8)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="glow-blue" style={{ backgroundColor: 'var(--accent-blue)', padding: '5px', borderRadius: '8px' }}>
            <Mic2 size={14} color="white" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
            VOCALIZE <span style={{ color: 'var(--accent-blue)', opacity: 0.6 }}>RC</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(33,150,243,0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(33,150,243,0.2)' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)' }} className="pulse" />
          <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent-blue)' }}>{sessionId}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '16px', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%' }}
          >
            {activeTab === 'search' && (
              <div style={{ paddingBottom: '20px' }}>
                 <Search onSelect={handleSelectSong} />
              </div>
            )}
            {activeTab === 'reserved' && (
              <div style={{ paddingBottom: '20px' }}>
                 <h3 style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.4, marginBottom: '16px', paddingLeft: '4px' }}>Up Next</h3>
                 <Queue items={queue} onRemove={handleRemove} onSkip={() => {}} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation (Floating App Style) */}
      <nav style={{ 
        padding: '12px 20px 24px', 
        background: 'rgba(17,17,17,0.95)', 
        backdropFilter: 'blur(30px)', 
        borderTop: '1px solid rgba(255,255,255,0.05)',
        zIndex: 100
      }}>
         <div style={{ 
           display: 'flex', 
           background: 'rgba(255,255,255,0.03)', 
           padding: '6px', 
           borderRadius: '20px', 
           gap: '6px' 
         }}>
            <button 
              onClick={() => setActiveTab('search')}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '10px', 
                borderRadius: '16px',
                border: 'none',
                background: activeTab === 'search' ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === 'search' ? 'white' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
            >
               <SearchIcon size={20} strokeWidth={activeTab === 'search' ? 3 : 2} />
               <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>Search</span>
            </button>
            <button 
              onClick={() => setActiveTab('reserved')}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '10px', 
                borderRadius: '16px',
                border: 'none',
                background: activeTab === 'reserved' ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === 'reserved' ? 'white' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
               <ListVideo size={20} strokeWidth={activeTab === 'reserved' ? 3 : 2} />
               <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>Queue</span>
               {queue.length > 0 && (
                 <span style={{ position: 'absolute', top: '6px', right: '25%', width: '14px', height: '14px', background: '#ef4444', borderRadius: '50%', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '2px solid #111' }}>
                   {queue.length}
                 </span>
               )}
            </button>
         </div>
      </nav>
    </div>
  );
}

export default RemoteView;

