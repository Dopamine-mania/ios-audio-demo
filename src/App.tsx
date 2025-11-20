import { useState, useRef } from 'react';

// 定义 MediaSession 类型以避免 TS 报错
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

function App() {
  const [status, setStatus] = useState('Waiting for user interaction...');
  // 核心改变1：使用 useRef 直接引用 DOM 中的 audio 标签
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 初始化 MediaSession 的独立函数
  const initMediaSession = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Resonance Gatekeeper',
        artist: 'System V3',
        album: 'Audio Core',
        artwork: [
          // 使用一个极高概率能加载的图片，比如 placeholder 或你自己的 logo
          { src: 'https://via.placeholder.com/512.png?text=Play', sizes: '512x512', type: 'image/png' }
        ]
      });

      // 绑定控制中心事件，防止点击锁屏暂停后无法恢复
      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
    }
  };

  // --- 核心改变2：同步启动 ---
  // 这个函数必须绑定在 onClick 上，且不能是 async 的（至少 play() 不能在 await 之后）
  const handleStart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setStatus('Requesting System Access...');

    // 1. 立即播放！不要等待任何 fetch 或 decode
    // 即使 audio.src 还没缓冲完，这个同步的 play() 调用也会拿到 iOS 的"金牌令箭"
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

    // 可以在这里后续处理 Web Audio API 的逻辑，但 HTML5 Audio 必须先行
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui', textAlign: 'center' }}>
      <h1>iOS Gatekeeper V3</h1>
      <p style={{ color: '#666' }}>Sync-Trigger Strategy</p>

      {/*
        核心改变3：显式 DOM 元素
        playsInline: 防止 iOS 自动全屏视频播放器模式
        loop: 必须循环
        muted: 千万不要设为 true！muted 无法后台播放。
      */}
      <audio
        ref={audioRef}
        src="/test-music.mp3"
        loop
        playsInline
        style={{ width: '100%', marginTop: '20px' }}
        controls // 开发阶段显示控件方便调试
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
          {isPlaying ? 'Playing (Check Lock Screen)' : 'TAP HERE TO START'}
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#eee', borderRadius: '8px' }}>
        Status: <strong>{status}</strong>
      </div>

      <p style={{fontSize: '12px', color: '#999', marginTop: '40px'}}>
        Debug Tip: Ensure your iPhone is NOT in Silent Mode (Ringer Switch) for initial test.
      </p>
    </div>
  );
}

export default App;
