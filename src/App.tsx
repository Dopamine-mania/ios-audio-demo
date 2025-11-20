import { useState, useRef, useEffect } from 'react';

// 定义 MediaSession 类型以避免 TS 报错
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

function App() {
  const [status, setStatus] = useState('Waiting for user interaction...');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 更新MediaSession播放位置状态
  const updatePositionState = () => {
    const audio = audioRef.current;
    if (!audio || !navigator.mediaSession) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration || 120, // 如果duration未知，默认120秒
        playbackRate: audio.playbackRate,
        position: audio.currentTime
      });
    } catch (error) {
      console.error('Error updating position state:', error);
    }
  };

  // 初始化 MediaSession 的独立函数
  const initMediaSession = () => {
    const audio = audioRef.current;
    if (!audio || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Resonance Gatekeeper',
      artist: 'System V3',
      album: 'Audio Core',
      artwork: [
        { src: 'https://via.placeholder.com/512.png?text=Play', sizes: '512x512', type: 'image/png' }
      ]
    });

    // 播放/暂停控制
    navigator.mediaSession.setActionHandler('play', () => {
      audio.play();
      setIsPlaying(true);
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audio.pause();
      setIsPlaying(false);
    });

    // 停止控制
    navigator.mediaSession.setActionHandler('stop', () => {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    });

    // 进度拖动控制（关键！）
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        audio.currentTime = details.seekTime;
        updatePositionState();
      }
    });

    // 快退控制
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skipTime = details.seekOffset || 10;
      audio.currentTime = Math.max(audio.currentTime - skipTime, 0);
      updatePositionState();
    });

    // 快进控制
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skipTime = details.seekOffset || 10;
      audio.currentTime = Math.min(audio.currentTime + skipTime, audio.duration || 0);
      updatePositionState();
    });

    // 初始化位置状态
    updatePositionState();
  };

  // 监听音频事件
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 音频元数据加载完成（获取到时长）
    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      updatePositionState();
    };

    // 播放位置更新（定期更新位置状态）
    const handleTimeUpdate = () => {
      updatePositionState();
    };

    // 播放开始
    const handlePlay = () => {
      setIsPlaying(true);
      updatePositionState();
    };

    // 暂停
    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // 同步启动函数
  const handleStart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setStatus('Requesting System Access...');

    // 立即播放！不要等待任何 fetch 或 decode
    audio.play()
      .then(() => {
        setStatus('Playing! Now LOCK SCREEN immediately.');
        setIsPlaying(true);
        initMediaSession(); // 注册锁屏信息
      })
      .catch((e) => {
        console.error(e);
        setStatus(`Fail: ${e.message}`);
      });
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui', textAlign: 'center' }}>
      <h1>iOS Gatekeeper V3.1</h1>
      <p style={{ color: '#666' }}>Sync-Trigger + Seekable Controls</p>

      <audio
        ref={audioRef}
        src="/test-music.mp3"
        loop
        playsInline
        style={{ width: '100%', marginTop: '20px' }}
        controls
      />

      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button
          onClick={handleStart}
          style={{
            padding: '20px',
            fontSize: '20px',
            background: isPlaying ? '#34C759' : '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontWeight: 'bold'
          }}
        >
          {isPlaying ? '✅ Playing (Check Lock Screen)' : '▶️ TAP HERE TO START'}
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#eee', borderRadius: '8px' }}>
        Status: <strong>{status}</strong>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '8px', fontSize: '13px', textAlign: 'left' }}>
        <strong>✅ Features Enabled:</strong>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>🔒 Lock Screen Playback</li>
          <li>📊 Lock Screen Controls</li>
          <li>⏩ Seek / Progress Bar (Drag)</li>
          <li>⏪⏩ Skip Forward/Backward</li>
        </ul>
      </div>

      <p style={{fontSize: '12px', color: '#999', marginTop: '40px'}}>
        Debug Tip: Ensure your iPhone is NOT in Silent Mode (Ringer Switch) for initial test.
      </p>
    </div>
  );
}

export default App;
