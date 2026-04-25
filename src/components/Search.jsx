import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Play, Plus, TrendingUp, Music } from 'lucide-react';
import { searchYoutube } from '../lib/youtube';
import { getPopularSongs } from '../lib/stats';

const Search = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [popularSongs, setPopularSongs] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      const popular = await getPopularSongs();
      setPopularSongs(popular);
      setIsInitialLoad(false);
    };
    fetchPopular();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) {
      setResults([]);
      return;
    }
    setLoading(true);
    const songs = await searchYoutube(query);
    setResults(songs);
    setLoading(false);
  };

  const displayList = query ? results : popularSongs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '24px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) setResults([]);
          }}
          placeholder="I-search ang kanta..."
          className="search-input"
        />
        <SearchIcon style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.2 }} size={18} />
      </form>

      {!query && popularSongs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingLeft: '4px' }}>
          <TrendingUp size={14} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.4 }}>Popular Now</h3>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}
            >
              <div style={{ width: '24px', height: '24px', border: '2px solid rgba(33, 150, 243, 0.2)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </motion.div>
          ) : (
            <motion.div
              key={query ? 'results' : 'popular'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {displayList.map((item, idx) => (
                <div key={item.id} className="song-row" style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={item.thumbnail} alt="" className="song-thumb" />
                    {!query && (
                       <div style={{ 
                         position: 'absolute', 
                         top: '-6px', 
                         left: '-6px', 
                         width: '20px', 
                         height: '20px', 
                         background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'rgba(255,255,255,0.1)',
                         borderRadius: '50%',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         fontSize: '10px',
                         fontWeight: 900,
                         border: '2px solid #111',
                         color: idx < 3 ? '#000' : '#fff',
                         zIndex: 2
                       }}>
                         {idx + 1}
                       </div>
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} dangerouslySetInnerHTML={{ __html: item.title }} />
                    <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.3, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                       {item.channel}
                       {!query && item.play_count && (
                         <>
                           <span style={{ opacity: 0.2 }}>•</span>
                           <span style={{ color: 'var(--accent-blue)' }}>{item.play_count} plays</span>
                         </>
                       )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => onSelect(item, 'reserve')}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <Plus size={16} />
                    </button>
                    <button className="btn-primary" onClick={() => onSelect(item, 'play')}>PLAY</button>
                  </div>
                </div>
              ))}
              
              {!query && popularSongs.length === 0 && !isInitialLoad && (
                <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.3 }}>
                   <Music size={32} style={{ marginBottom: '12px' }} />
                   <p style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>No history yet</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Search;
