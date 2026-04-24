import React, { useEffect, useRef } from 'react';

const Player = ({ videoId, onEnded, onReady, isPlaying }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Load YouTube API if not loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (playerRef.current && videoId) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId]);

  useEffect(() => {
    if (playerRef.current && playerRef.current.getPlayerState) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  const initPlayer = () => {
    if (!containerRef.current) return;
    
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId || '',
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        disablekb: 1,
        iv_load_policy: 3
      },
      events: {
        onReady: (event) => {
          onReady && onReady(event.target);
          if (isPlaying) event.target.playVideo();
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            onEnded && onEnded();
          }
        },
      },
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} className="group">
      {/* The actual YouTube Player */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }}></div>
      
      {/* The Transparent Shield (Blocks clicks on YT links) */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 5, 
          cursor: 'default',
          background: 'transparent'
        }}
      ></div>

      {/* Subtle bottom gradient for aesthetics */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)', pointerEvents: 'none', zIndex: 6 }}></div>
    </div>
  );
};

export default Player;
