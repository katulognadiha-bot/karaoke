import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Settings, QrCode, Music, Search as SearchIcon, ListVideo, LayoutGrid, Radio, Heart, Play, Pause, SkipForward, Maximize, MicOff, Trophy, Star } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Player from '../components/Player';
import Search from '../components/Search';
import Queue from '../components/Queue';
import { supabase } from '../lib/supabase';

function HostView() {
  const [activeTab, setActiveTab] = useState('search');
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [queue, setQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('vocalize_session_id') || Math.random().toString(36).substring(2, 6).toUpperCase();
    localStorage.setItem('vocalize_session_id', saved);
    return saved;
  });

  // Scoring & Audio States
  const [isScoringEnabled, setIsScoringEnabled] = useState(true);
  const [micIntensity, setMicIntensity] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [finalScore, setFinalScore] = useState(null);
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  
  const stageRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationRef = useRef(null);
  const pointsRef = useRef(0);
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (!supabase) return;

    // Initialize session in DB
    const initSession = async () => {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (!data) {
        await supabase.from('queues').insert([
          { session_id: sessionId, items: [], current_video: null }
        ]);
      } else {
        setQueue(data.items || []);
        setCurrentVideo(data.current_video);
      }
    };

    initSession();

    const channel = supabase.channel(`queue:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'queues', filter: `session_id=eq.${sessionId}` }, 
        payload => {
          const newQueue = payload.new.items || [];
          // If queue increased, show notification
          if (newQueue.length > queue.length) {
            const addedSong = newQueue[newQueue.length - 1];
            const id = Date.now();
            setNotifications(prev => [...prev, { id, title: addedSong.title }]);
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== id));
            }, 3000);
          }
          setQueue(newQueue);
          if (payload.new.current_video && (!currentVideo || payload.new.current_video.id !== currentVideo.id)) {
            setCurrentVideo(payload.new.current_video);
          }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [sessionId, queue.length]);

  const updateDB = async (nq, current = currentVideo) => {
    if (!supabase) return;
    await supabase.from('queues').update({ items: nq, current_video: current }).eq('session_id', sessionId);
  };

  const handleSelectSong = (song, action) => {
    if (action === 'play') {
      setCurrentVideo(song);
      updateDB(queue, song);
    } else {
      const nq = [...queue, { ...song, queueId: Date.now() }];
      setQueue(nq);
      updateDB(nq);
      
      // Local notification
      const id = Date.now();
      setNotifications(prev => [...prev, { id, title: song.title }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 3000);
    }
  };

  const handleSongEnded = () => {
    if (isScoringEnabled && currentScore > 0) {
      setFinalScore(currentScore);
      setShowFinalScore(true);
      
      // Show score for 6 seconds then skip
      setTimeout(() => {
        setShowFinalScore(false);
        proceedToNext();
      }, 6000);
    } else {
      proceedToNext();
    }
  };

  const proceedToNext = () => {
    if (queue.length > 0) {
      const n = queue[0];
      const nq = queue.slice(1);
      setCurrentVideo(n);
      setQueue(nq);
      updateDB(nq, n);
    } else {
      setCurrentVideo(null);
      updateDB([], null);
    }
    setCurrentScore(0);
  };

  const handleRemove = (id) => {
    const nq = queue.filter(item => item.queueId !== id);
    setQueue(nq);
    updateDB(nq);
  };

  // Initialize Audio Analyzer
  useEffect(() => {
    if (!isScoringEnabled) return;

    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        setIsMicActive(true);
      } catch (err) {
        console.error("Mic access denied:", err);
        setIsMicActive(false);
      }
    };

    startMic();

    return () => {
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      cancelAnimationFrame(animationRef.current);
    };
  }, [isScoringEnabled]);

  // Scoring Logic Loop
  useEffect(() => {
    if (isPlaying && currentVideo && isMicActive && isScoringEnabled) {
      // Reset points for new song
      pointsRef.current = 0;
      frameCountRef.current = 0;
      
      const updateScore = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);
        
        // Calculate RMS (Volume Intensity)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        
        // Update Intensity for UI
        setMicIntensity(rms * 100);
        
        // Scoring: If loud enough, add points
        if (rms > 0.05) {
          pointsRef.current += 1;
        }
        frameCountRef.current += 1;
        
        // Convert to 0-100 scale (roughly)
        const possiblePoints = frameCountRef.current;
        const rawScore = (pointsRef.current / possiblePoints) * 100;
        // Boost score a bit to make it "fun" (minimum 60 if you try)
        const mappedScore = Math.min(100, Math.max(0, rawScore * 2 + 30));
        setCurrentScore(Math.floor(mappedScore));
        
        animationRef.current = requestAnimationFrame(updateScore);
      };
      
      updateScore();
    } else {
      cancelAnimationFrame(animationRef.current);
      setMicIntensity(0);
    }
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, currentVideo, isMicActive, isScoringEnabled]);

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

          <div 
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid var(--glass-border)', 
              padding: '6px 16px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              borderColor: isMicActive ? 'var(--accent-blue)' : 'var(--glass-border)',
              opacity: isScoringEnabled ? 1 : 0.5
            }}
          >
            {isMicActive ? <Mic2 size={14} color="var(--accent-blue)" className="pulse" /> : <MicOff size={14} opacity={0.5} />}
            <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
               {isMicActive ? 'Mic Active' : 'Mic Off'}
            </span>
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
        <section className="ktv-stage" style={{ padding: '24px', gap: '24px' }}>
          {/* Main Video Area */}
          <div 
            ref={stageRef}
            style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', border: '1px solid var(--glass-border)' }}
            onMouseEnter={() => {
              const el = document.getElementById('player-controls');
              if (el) el.style.opacity = '1';
            }}
            onMouseLeave={() => {
              const el = document.getElementById('player-controls');
              if (el) el.style.opacity = '0';
            }}
          >
            {currentVideo ? (
              <div style={{ width: '100%', height: '100%' }}>
                <Player videoId={currentVideo.id} onEnded={handleSongEnded} isPlaying={isPlaying} />
                
                {/* Floating Controls Overlay */}
                <div 
                  id="player-controls"
                  style={{ 
                    position: 'absolute', 
                    bottom: '20px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    zIndex: 100, 
                    opacity: 0, 
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 24px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '40px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                   <button 
                     onClick={() => {
                       if (stageRef.current) stageRef.current.requestFullscreen();
                     }}
                     style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                     title="Fullscreen"
                   >
                      <Maximize size={18} />
                   </button>
                   <button 
                     onClick={() => setIsPlaying(!isPlaying)}
                     style={{ background: 'var(--accent-blue)', color: 'white', border: 'none', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(33,150,243,0.3)' }}
                   >
                      {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: '2px' }} />}
                   </button>
                   <button 
                     onClick={handleSongEnded}
                     style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                     title="Skip Song"
                   >
                      <SkipForward size={18} fill="white" />
                   </button>
                </div>

                {/* Live Scoring Visuals */}
                {isScoringEnabled && isPlaying && (
                  <>
                    {/* Mic Meter (Vertical) */}
                    <div style={{ position: 'absolute', bottom: '80px', left: '24px', width: '6px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', zIndex: 10 }}>
                       <motion.div 
                         animate={{ height: `${Math.min(100, micIntensity * 3)}%` }}
                         style={{ position: 'absolute', bottom: 0, width: '100%', background: 'var(--accent-blue)', boxShadow: '0 0 10px var(--accent-blue)' }}
                       />
                    </div>
                    
                    {/* Live Score Badge */}
                    <div style={{ position: 'absolute', top: '20px', right: '110px', zIndex: 10 }}>
                       <div className="glass-panel" style={{ padding: '6px 16px', background: 'rgba(0,0,0,0.5)', borderColor: 'var(--accent-blue)', color: 'white', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Star size={12} fill="var(--accent-blue)" color="var(--accent-blue)" />
                          <span style={{ fontSize: '14px', fontWeight: 900 }}>{currentScore}</span>
                       </div>
                    </div>
                  </>
                )}
              </div>
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

            {/* Final Score Reveal Modal */}
            <AnimatePresence>
              {showFinalScore && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'absolute', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
                >
                  <motion.div 
                    initial={{ scale: 0.5, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    className="glass-panel glow-blue"
                    style={{ padding: '60px', borderRadius: '32px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(33,150,243,0.1), rgba(0,0,0,0.5))', border: '1px solid var(--accent-blue)', maxWidth: '400px', width: '90%' }}
                  >
                    <Trophy size={80} color="var(--accent-blue)" style={{ margin: '0 auto 24px', filter: 'drop-shadow(0 0 20px rgba(33,150,243,0.5))' }} />
                    <h3 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', color: 'var(--accent-blue)', marginBottom: '12px' }}>Final Performance Score</h3>
                    <div style={{ fontSize: '100px', fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: '16px', letterSpacing: '-4px' }}>
                       {finalScore}
                    </div>
                    <div className="glass-panel" style={{ padding: '12px 24px', display: 'inline-block', borderRadius: '40px', background: 'var(--accent-blue)', color: 'white', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                       {finalScore >= 95 ? 'Legendary Singer!' : finalScore >= 85 ? 'Certified Pro' : finalScore >= 70 ? 'Great Effort!' : 'Keep Practicing'}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications Overlay */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 100 }}>
              <AnimatePresence>
                {notifications.map(n => (
                  <motion.div
                    key={n.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="glass-panel glow-blue"
                    style={{ padding: '12px 20px', background: 'rgba(33,150,243,0.9)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}
                  >
                    <div style={{ background: 'white', padding: '4px', borderRadius: '50%' }}><Music size={12} color="#2196F3" /></div>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.7, letterSpacing: '1px' }}>New Song Reserved</div>
                      <div style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} dangerouslySetInnerHTML={{ __html: n.title }} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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
