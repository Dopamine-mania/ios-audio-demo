import React, { useState, useRef } from 'react';

// 全局变量：保持引用防止被垃圾回收(GC)
let audioContext: AudioContext | null = null;
let musicSourceNode: AudioBufferSourceNode | null = null;
let silentSourceNode: AudioBufferSourceNode | null = null;
let musicBuffer: AudioBuffer | null = null;
let isPlaying = false;

function App() {
  const [status, setStatus] = useState('Ready. Click "Initialize Audio" first.');
  const isInitialized = useRef(false);

  // --- 核心功能 1: 初始化音频上下文 ---
  const initializeAudio = async () => {
    if (isInitialized.current) return;

    try {
      setStatus('Initializing Audio Context...');

      // 1. 创建 Context (兼容写法)
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

      setStatus('Loading music file...');
      // 4. 加载真正的音乐文件
      const response = await fetch('/test-music.mp3');
      const arrayBuffer = await response.arrayBuffer();
      musicBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // 5. 【护身符】注册 MediaSession
      // 这会让锁屏界面显示播放控件，极大幅度降低被杀后台的概率
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Gatekeeper Demo',
          artist: 'Resonance Team',
          album: 'V1.0',
          artwork: [
            { src: 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/png' }
          ]
        });

        // 绑定系统原生控制中心的按钮事件
        navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
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
    if (!isInitialized.current || !audioContext || !musicBuffer) {
      setStatus('Please initialize audio first!');
      return;
    }

    // iOS 策略要求：必须确保 Context 是运行状态
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (isPlaying) {
      // 暂停逻辑
      try {
        musicSourceNode?.stop();
        musicSourceNode = null;
        isPlaying = false;
        setStatus('Paused.');
        if(navigator.mediaSession) navigator.mediaSession.playbackState = 'paused';
      } catch (e) { console.log(e); }
    } else {
      // 播放逻辑
      musicSourceNode = audioContext.createBufferSource();
      musicSourceNode.buffer = musicBuffer;
      musicSourceNode.loop = true; // 音乐也开启循环方便测试
      musicSourceNode.connect(audioContext.destination);
      musicSourceNode.start(0);
      isPlaying = true;
      setStatus('Playing... Now LOCK YOUR SCREEN!');
      if(navigator.mediaSession) navigator.mediaSession.playbackState = 'playing';
    }
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui, sans-serif', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1>iOS Audio Gatekeeper</h1>
      <p style={{color: '#666', marginBottom: '30px'}}>
        V2.0 (Memory Optimized + MediaSession)
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <button
          onClick={initializeAudio}
          disabled={isInitialized.current}
          style={{
            padding: '15px', fontSize: '18px',
            background: isInitialized.current ? '#ccc' : '#007AFF',
            color: 'white', border: 'none', borderRadius: '12px'
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
            color: 'white', border: 'none', borderRadius: '12px'
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
    </div>
  );
}

export default App;
