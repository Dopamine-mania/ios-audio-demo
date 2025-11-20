import { useState, useRef, useEffect } from 'react';

// 全局变量：保持引用防止被垃圾回收(GC)
let audioContext: AudioContext | null = null;
let silentSourceNode: AudioBufferSourceNode | null = null;

function App() {
  const [status, setStatus] = useState('Ready. Click "Initialize Audio" first.');
  const [isPlaying, setIsPlaying] = useState(false);
  const isInitialized = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- 核心功能 1: 初始化音频上下文 ---
  const initializeAudio = async () => {
    if (isInitialized.current) return;

    try {
      setStatus('Initializing Audio Context...');

      // 1. 创建 Web Audio Context (兼容写法)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();

      // 2. 【关键技巧】创建静音底座 (Silent Base)
      // 内存优化：只创建 1秒 的 buffer，而不是 30分钟
      const silentBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 1, audioContext.sampleRate);

      // 噪音注入：填充极微小的噪音 (0.00001)，防止系统检测到纯静音而优化掉音频线程
      const channelData = silentBuffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.random() * 0.00001;
      }

      // 3. 启动静音循环
      silentSourceNode = audioContext.createBufferSource();
      silentSourceNode.buffer = silentBuffer;
      silentSourceNode.loop = true; // 无限循环
      silentSourceNode.connect(audioContext.destination);
      silentSourceNode.start(0);

      setStatus('Initializing HTML5 Audio...');

      // 4. 【Plan B】初始化 HTML5 Audio 元素
      if (audioRef.current) {
        audioRef.current.load();
        // 预加载音频
        await audioRef.current.play().catch(() => {
          // 可能会因为浏览器策略失败，这是正常的
        });
        audioRef.current.pause();
      }

      // 5. 【护身符】注册 MediaSession
      // 这会让锁屏界面显示播放控件，极大幅度降低被杀后台的概率
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Gatekeeper Demo',
          artist: 'Resonance Team',
          album: 'V2.1 (HTML5 Audio)',
          artwork: [
            { src: 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/png' }
          ]
        });

        // 绑定系统原生控制中心的按钮事件
        navigator.mediaSession.setActionHandler('play', () => {
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
            setStatus('Playing... Now LOCK YOUR SCREEN!');
          }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            setStatus('Paused.');
          }
        });
      }

      isInitialized.current = true;
      setStatus('Ready to play. Do not close tab!');
    } catch (error) {
      console.error('Initialization failed:', error);
      setStatus(`Error: ${(error as Error).message}`);
    }
  };

  // --- 核心功能 2: 播放控制 ---
  const togglePlayPause = async () => {
    if (!isInitialized.current) {
      setStatus('Please initialize audio first!');
      return;
    }

    // iOS 策略要求：必须确保 Context 是运行状态
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      // 暂停逻辑
      audioRef.current.pause();
      setIsPlaying(false);
      setStatus('Paused.');
      if (navigator.mediaSession) navigator.mediaSession.playbackState = 'paused';
    } else {
      // 播放逻辑
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setStatus('Playing... Now LOCK YOUR SCREEN!');
        if (navigator.mediaSession) navigator.mediaSession.playbackState = 'playing';
      } catch (error) {
        console.error('Play failed:', error);
        setStatus('Play failed. Try again.');
      }
    }
  };

  // 监听音频事件
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      setStatus('Audio ended. Click Play to restart.');
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setStatus('Audio error occurred.');
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui, sans-serif', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      {/* 【Plan B】HTML5 Audio 标签 */}
      <audio
        ref={audioRef}
        src="/test-music.mp3"
        loop
        preload="auto"
        style={{ display: 'none' }}
      />

      <h1>iOS Audio Gatekeeper</h1>
      <p style={{color: '#666', marginBottom: '30px'}}>
        V2.1 (Plan B: HTML5 Audio + Web Audio API)
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <button
          onClick={initializeAudio}
          disabled={isInitialized.current}
          style={{
            padding: '15px', fontSize: '18px',
            background: isInitialized.current ? '#ccc' : '#007AFF',
            color: 'white', border: 'none', borderRadius: '12px',
            cursor: isInitialized.current ? 'not-allowed' : 'pointer'
          }}
        >
          1. Initialize Audio Engine
        </button>

        <button
          onClick={togglePlayPause}
          disabled={!isInitialized.current}
          style={{
            padding: '15px', fontSize: '18px',
            background: !isInitialized.current ? '#ccc' : '#34C759',
            color: 'white', border: 'none', borderRadius: '12px',
            cursor: !isInitialized.current ? 'not-allowed' : 'pointer'
          }}
        >
          2. Toggle Play / Pause
        </button>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#f5f5f7', borderRadius: '12px', border: '1px solid #e1e1e1' }}>
        <strong>Status Log:</strong>
        <div style={{marginTop: '5px', color: '#FF3B30', fontWeight: '600'}}>{status}</div>
      </div>

      <p style={{marginTop: '30px', fontSize: '14px', color: '#888'}}>
        Test Requirement: Lock screen for &gt; 1 minute and check if audio continues.
      </p>

      <div style={{marginTop: '20px', padding: '10px', background: '#fff3cd', borderRadius: '8px', fontSize: '12px', color: '#856404'}}>
        <strong>🔧 Plan B Enabled:</strong> Using HTML5 Audio + Web Audio API dual approach for maximum iOS compatibility.
      </div>
    </div>
  );
}

export default App;
