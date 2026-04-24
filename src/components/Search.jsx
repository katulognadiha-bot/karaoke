import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Play, Plus, Radio } from 'lucide-react';
import { searchYoutube } from '../lib/youtube';

const Search = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    const songs = await searchYoutube(query);
    setResults(songs);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '24px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="I-search ang kanta..."
          className="search-input"
        />
        <SearchIcon style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.2 }} size={18} />
      </form>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <div style={{ width: '24px', height: '24px', border: '2px solid rgba(33, 150, 243, 0.2)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : (
            results.map((item, idx) => (
              <div key={item.id} className="song-row">
                <img src={item.thumbnail} alt="" className="song-thumb" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} dangerouslySetInnerHTML={{ __html: item.title }} />
                  <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.3, letterSpacing: '0.5px' }}>{item.channel}</p>
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
            ))
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
