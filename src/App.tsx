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

  // 更新MediaSession播放位置状态 - 修正版
  const updatePositionState = () => {
    const audio = audioRef.current;

    // 【关键修复1】严格检查 duration 必须是有限数值
    if (
      !audio ||
      !navigator.mediaSession ||
      !Number.isFinite(audio.duration) ||
      audio.duration <= 0
    ) {
      return;
    }

    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: audio.currentTime
      });
    } catch (error) {
      console.warn('MediaSession position update failed:', error);
    }
  };

  // 初始化 MediaSession 的独立函数
  const initMediaSession = () => {
    const audio = audioRef.current;
    if (!audio || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Resonance Gatekeeper',
      artist: 'System V3.2',
      album: 'Audio Core',
      artwork: [
        { src: 'https://via.placeholder.com/512.png?text=Play', sizes: '512x512', type: 'image/png' }
      ]
    });

    // 播放控制 - 状态突变时更新
    navigator.mediaSession.setActionHandler('play', () => {
      audio.play();
      setIsPlaying(true);
      updatePositionState(); // 状态突变时更新
    });

    // 暂停控制 - 状态突变时更新
    navigator.mediaSession.setActionHandler('pause', () => {
      audio.pause();
      setIsPlaying(false);
      updatePositionState(); // 状态突变时更新
    });

    // 停止控制
    navigator.mediaSession.setActionHandler('stop', () => {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      updatePositionState();
    });

    // 【关键修复2】进度拖动控制 - 立即同步防止UI回弹
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        audio.currentTime = details.seekTime;
        updatePositionState(); // 立即告诉系统我们跳过去了
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

  // 【关键修复3】只在状态突变时监听，绝不在 timeupdate 中更新
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 音频元数据加载完成（获取到时长）
    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      updatePositionState();
    };

    // 播放开始
    const handlePlay = () => {
      setIsPlaying(true);
      updatePositionState(); // 状态突变
    };

    // 暂停
    const handlePause = () => {
      setIsPlaying(false);
      updatePositionState(); // 状态突变
    };

    // 跳转完成后同步一次
    const handleSeeked = () => {
      updatePositionState();
    };

    // 倍速改变时（虽然我们没用到，但为了完整性）
    const handleRateChange = () => {
      updatePositionState();
    };

    // 【关键修复4】实现循环播放 - 不使用原生loop属性
    const handleEnded = () => {
      audio.currentTime = 0;
      audio.play();
    };

    // 【重要】移除了 timeupdate 监听器！
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('ratechange', handleRateChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('seeked', handleSeeked);
      audio.removeEventListener('ratechange', handleRateChange);
      audio.removeEventListener('ended', handleEnded);
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
      <h1>iOS Gatekeeper V3.2</h1>
      <p style={{ color: '#666' }}>Fixed: No Over-feeding</p>

      {/* 【关键修复5】移除 loop 属性，改用 JS 实现循环 */}
      <audio
        ref={audioRef}
        src="/test-music.mp3"
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
          {isPlaying ? '✅ Playing (Test Progress Bar!)' : '▶️ TAP HERE TO START'}
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#eee', borderRadius: '8px' }}>
        Status: <strong>{status}</strong>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '8px', fontSize: '13px', textAlign: 'left' }}>
        <strong>🔧 V3.2 Fixes (Based on Gemini):</strong>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>❌ Removed timeupdate listener</li>
          <li>✅ Only update on state changes</li>
          <li>✅ Check duration is finite</li>
          <li>✅ Removed native loop attribute</li>
          <li>✅ JS-based loop via ended event</li>
        </ul>
      </div>

      <p style={{fontSize: '12px', color: '#999', marginTop: '40px'}}>
        Debug Tip: Ensure your iPhone is NOT in Silent Mode (Ringer Switch) for initial test.
      </p>
    </div>
  );
}

export default App;
