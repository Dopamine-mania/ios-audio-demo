import { useState } from 'react';
import { useIOSAudioKernel } from './hooks/useIOSAudioKernel';

function App() {
  const [status, setStatus] = useState('Waiting for user interaction...');

  // 使用 useIOSAudioKernel Hook
  const {
    play,
    pause,
    seek,
    isPlaying,
    duration,
    currentTime,
    audioRef,
    error,
    isInitialized
  } = useIOSAudioKernel({
    src: '/test-music.mp3',
    loop: true,
    metadata: {
      title: 'Resonance Gatekeeper',
      artist: 'System V4.0 - Hook Edition',
      album: 'Audio Core',
      artwork: [
        { src: 'https://via.placeholder.com/512.png?text=Play', sizes: '512x512', type: 'image/png' }
      ]
    },
    onPlay: () => {
      setStatus('Playing! Now LOCK SCREEN immediately.');
      console.log('Audio started playing');
    },
    onPause: () => {
      setStatus('Paused');
      console.log('Audio paused');
    },
    onError: (err) => {
      setStatus(`Error: ${err.message}`);
      console.error('Audio error:', err);
    }
  });

  // 同步启动函数
  const handleStart = async () => {
    setStatus('Requesting System Access...');

    try {
      await play();
    } catch (e) {
      console.error(e);
    }
  };

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui', textAlign: 'center' }}>
      <h1>iOS Gatekeeper V4.0</h1>
      <p style={{ color: '#666' }}>Hook Edition - Production Ready</p>

      {/* Audio 元素 - 由 Hook 管理 */}
      <audio
        ref={audioRef}
        playsInline
        style={{ width: '100%', marginTop: '20px' }}
        controls
      />

      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
          {isPlaying ? '✅ Playing (Test Lock Screen!)' : '▶️ TAP HERE TO START'}
        </button>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => pause()}
            disabled={!isPlaying}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              background: isPlaying ? '#FF3B30' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isPlaying ? 'pointer' : 'not-allowed'
            }}
          >
            ⏸️ Pause
          </button>

          <button
            onClick={() => seek(0)}
            disabled={!isInitialized}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              background: isInitialized ? '#FF9500' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isInitialized ? 'pointer' : 'not-allowed'
            }}
          >
            ⏮️ Restart
          </button>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>Status:</strong> {status}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
          <div>⏱️ Time: {formatTime(currentTime)} / {formatTime(duration)}</div>
          <div>🎵 Playing: {isPlaying ? 'Yes' : 'No'}</div>
          <div>🔧 Initialized: {isInitialized ? 'Yes' : 'No'}</div>
          <div>⚠️ Error: {error ? error.message : 'None'}</div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '8px', fontSize: '13px', textAlign: 'left' }}>
        <strong>🎯 V4.0 Features (useIOSAudioKernel Hook):</strong>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>✅ Encapsulated reusable hook</li>
          <li>✅ Sync-trigger strategy for iOS</li>
          <li>✅ State-mutation-only updates</li>
          <li>✅ Duration finite checks</li>
          <li>✅ JS-based loop implementation</li>
          <li>✅ Complete MediaSession integration</li>
          <li>✅ TypeScript with full type safety</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', fontSize: '12px', textAlign: 'left' }}>
        <strong>📝 Usage Example:</strong>
        <pre style={{ background: '#f8f8f8', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '11px' }}>
{`const { play, pause, seek, isPlaying } = useIOSAudioKernel({
  src: '/audio.mp3',
  loop: true,
  metadata: {
    title: 'My Audio',
    artist: 'Artist Name'
  },
  onPlay: () => console.log('Started'),
  onPause: () => console.log('Paused')
});`}
        </pre>
      </div>

      <p style={{fontSize: '12px', color: '#999', marginTop: '40px'}}>
        Debug Tip: Ensure your iPhone is NOT in Silent Mode (Ringer Switch) for initial test.
      </p>
    </div>
  );
}

export default App;
