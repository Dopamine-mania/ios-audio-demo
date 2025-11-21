# useIOSAudioKernel 代码示例集

本文件包含各种实际应用场景的完整代码示例。

## 目录

1. [基础播放器](#1-基础播放器)
2. [进度条播放器](#2-进度条播放器)
3. [播放列表播放器](#3-播放列表播放器)
4. [冥想音频播放器](#4-冥想音频播放器)
5. [自动播放下一首](#5-自动播放下一首)
6. [音量控制](#6-音量控制)
7. [播放速率控制](#7-播放速率控制)
8. [错误重试机制](#8-错误重试机制)

---

## 1. 基础播放器

最简单的音频播放器实现。

```typescript
import { useIOSAudioKernel } from './hooks/useIOSAudioKernel';

function BasicPlayer() {
  const { play, pause, isPlaying, audioRef } = useIOSAudioKernel({
    src: '/audio/relaxation.mp3',
    loop: true,
    metadata: {
      title: '放松音乐',
      artist: 'Emoheal',
      album: '冥想系列'
    }
  });

  return (
    <div className="basic-player">
      <audio ref={audioRef} />

      <h2>放松音乐</h2>

      <div className="controls">
        {!isPlaying ? (
          <button onClick={play} className="play-btn">
            ▶️ 开始播放
          </button>
        ) : (
          <button onClick={pause} className="pause-btn">
            ⏸️ 暂停
          </button>
        )}
      </div>
    </div>
  );
}

export default BasicPlayer;
```

---

## 2. 进度条播放器

带有可拖动进度条和时间显示的播放器。

```typescript
import { useIOSAudioKernel } from './hooks/useIOSAudioKernel';
import './ProgressPlayer.css';

function ProgressPlayer() {
  const {
    play,
    pause,
    seek,
    isPlaying,
    duration,
    currentTime,
    audioRef
  } = useIOSAudioKernel({
    src: '/audio/meditation.mp3',
    loop: false,
    metadata: {
      title: '深度冥想',
      artist: 'Emoheal Therapy',
      artwork: [
        {
          src: '/images/meditation-cover.jpg',
          sizes: '512x512',
          type: 'image/jpeg'
        }
      ]
    }
  });

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="progress-player">
      <audio ref={audioRef} />

      <div className="player-card">
        <div className="artwork">
          <img src="/images/meditation-cover.jpg" alt="专辑封面" />
        </div>

        <div className="info">
          <h2 className="title">深度冥想</h2>
          <p className="artist">Emoheal Therapy</p>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <input
            type="range"
            className="progress-slider"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
          />

          <div className="time-display">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="duration">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="controls">
          <button
            className="control-btn"
            onClick={() => seek(Math.max(0, currentTime - 10))}
          >
            ⏪ -10s
          </button>

          {!isPlaying ? (
            <button className="play-btn-large" onClick={play}>
              ▶️
            </button>
          ) : (
            <button className="pause-btn-large" onClick={pause}>
              ⏸️
            </button>
          )}

          <button
            className="control-btn"
            onClick={() => seek(Math.min(duration, currentTime + 10))}
          >
            ⏩ +10s
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProgressPlayer;
```

**CSS 样式 (ProgressPlayer.css)**:

```css
.progress-player {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.player-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.artwork {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 20px;
}

.artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  text-align: center;
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 5px 0;
  color: #333;
}

.artist {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.progress-section {
  position: relative;
  margin-bottom: 20px;
}

.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.1s linear;
}

.progress-slider {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  opacity: 0;
  cursor: pointer;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.control-btn {
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #e0e0e0;
  transform: scale(1.05);
}

.play-btn-large,
.pause-btn-large {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 70px;
  height: 70px;
  font-size: 28px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.play-btn-large:hover,
.pause-btn-large:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.6);
}
```

---

## 3. 播放列表播放器

支持多首歌曲切换的播放列表。

```typescript
import { useState, useEffect } from 'react';
import { useIOSAudioKernel } from './hooks/useIOSAudioKernel';

interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  artwork: string;
  duration?: number;
}

const PLAYLIST: Track[] = [
  {
    id: '1',
    title: '宁静海洋',
    artist: 'Emoheal',
    src: '/audio/ocean.mp3',
    artwork: '/images/ocean.jpg'
  },
  {
    id: '2',
    title: '森林漫步',
    artist: 'Emoheal',
    src: '/audio/forest.mp3',
    artwork: '/images/forest.jpg'
  },
  {
    id: '3',
    title: '星空冥想',
    artist: 'Emoheal',
    src: '/audio/stars.mp3',
    artwork: '/images/stars.jpg'
  }
];

function PlaylistPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wasPlaying, setWasPlaying] = useState(false);
  const currentTrack = PLAYLIST[currentIndex];

  const {
    play,
    pause,
    isPlaying,
    duration,
    currentTime,
    audioRef,
    isInitialized
  } = useIOSAudioKernel({
    src: currentTrack.src,
    loop: false,
    metadata: {
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: [
        {
          src: currentTrack.artwork,
          sizes: '512x512',
          type: 'image/jpeg'
        }
      ]
    },
    onEnded: () => {
      // 自动播放下一首
      playNext();
    },
    onError: (error) => {
      console.error('播放失败:', error);
      // 尝试播放下一首
      playNext();
    }
  });

  // 当切换歌曲时，如果之前在播放，自动播放新歌曲
  useEffect(() => {
    if (wasPlaying && isInitialized) {
      play();
    }
  }, [currentIndex, isInitialized]);

  const playNext = () => {
    if (currentIndex < PLAYLIST.length - 1) {
      setWasPlaying(isPlaying);
      setCurrentIndex(currentIndex + 1);
    } else {
      // 播放列表结束，回到第一首
      setWasPlaying(false);
      setCurrentIndex(0);
    }
  };

  const playPrevious = () => {
    if (currentTime > 3) {
      // 如果已播放超过3秒，重新播放当前歌曲
      audioRef.current?.seek(0);
    } else if (currentIndex > 0) {
      setWasPlaying(isPlaying);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const selectTrack = (index: number) => {
    if (index !== currentIndex) {
      setWasPlaying(isPlaying);
      setCurrentIndex(index);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="playlist-player">
      <audio ref={audioRef} />

      {/* 当前播放 */}
      <div className="now-playing">
        <img
          src={currentTrack.artwork}
          alt={currentTrack.title}
          className="now-playing-artwork"
        />
        <div className="now-playing-info">
          <h2>{currentTrack.title}</h2>
          <p>{currentTrack.artist}</p>
          <div className="time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="player-controls">
        <button
          className="control-btn"
          onClick={playPrevious}
          disabled={currentIndex === 0 && currentTime < 3}
        >
          ⏮️
        </button>

        {!isPlaying ? (
          <button className="play-btn" onClick={play}>
            ▶️
          </button>
        ) : (
          <button className="pause-btn" onClick={pause}>
            ⏸️
          </button>
        )}

        <button
          className="control-btn"
          onClick={playNext}
          disabled={currentIndex === PLAYLIST.length - 1 && !isPlaying}
        >
          ⏭️
        </button>
      </div>

      {/* 播放列表 */}
      <div className="playlist">
        <h3>播放列表</h3>
        {PLAYLIST.map((track, index) => (
          <div
            key={track.id}
            className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
            onClick={() => selectTrack(index)}
          >
            <img src={track.artwork} alt={track.title} className="playlist-thumb" />
            <div className="playlist-item-info">
              <div className="playlist-item-title">{track.title}</div>
              <div className="playlist-item-artist">{track.artist}</div>
            </div>
            {index === currentIndex && isPlaying && (
              <div className="now-playing-indicator">
                🎵
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlaylistPlayer;
```

---

## 4. 冥想音频播放器

专门为冥想设计的播放器，包含定时器功能。

```typescript
import { useState, useEffect } from 'react';
import { useIOSAudioKernel } from './hooks/useIOSAudioKernel';

function MeditationPlayer() {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  const {
    play,
    pause,
    seek,
    isPlaying,
    currentTime,
    audioRef
  } = useIOSAudioKernel({
    src: '/audio/meditation-background.mp3',
    loop: true,
    metadata: {
      title: '冥想引导',
      artist: 'Emoheal Meditation',
      artwork: [
        {
          src: '/images/meditation.jpg',
          sizes: '512x512',
          type: 'image/jpeg'
        }
      ]
    },
    onPlay: () => {
      console.log('开始冥想');
    },
    onPause: () => {
      console.log('暂停冥想');
    }
  });

  // 定时器倒计时
  useEffect(() => {
    if (!isPlaying || !selectedDuration) {
      return;
    }

    const startTime = Date.now();
    const endTime = startTime + selectedDuration * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

      setRemainingTime(remaining);

      if (remaining === 0) {
        pause();
        clearInterval(interval);
        // 可以在这里添加铃声提示
        alert('冥想时间结束！');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, selectedDuration]);

  const startMeditation = (minutes: number) => {
    setSelectedDuration(minutes * 60);
    setRemainingTime(minutes * 60);
    play();
  };

  const stopMeditation = () => {
    pause();
    seek(0);
    setSelectedDuration(null);
    setRemainingTime(null);
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="meditation-player">
      <audio ref={audioRef} />

      <div className="meditation-card">
        <h1>冥想练习</h1>
        <p className="subtitle">选择冥想时长，开始您的心灵之旅</p>

        {!isPlaying ? (
          <div className="duration-selection">
            <button
              className="duration-btn"
              onClick={() => startMeditation(5)}
            >
              5分钟<br />
              <span className="duration-desc">快速放松</span>
            </button>
            <button
              className="duration-btn"
              onClick={() => startMeditation(10)}
            >
              10分钟<br />
              <span className="duration-desc">深度冥想</span>
            </button>
            <button
              className="duration-btn"
              onClick={() => startMeditation(15)}
            >
              15分钟<br />
              <span className="duration-desc">完整体验</span>
            </button>
            <button
              className="duration-btn"
              onClick={() => startMeditation(20)}
            >
              20分钟<br />
              <span className="duration-desc">专注训练</span>
            </button>
          </div>
        ) : (
          <div className="meditation-active">
            <div className="timer-circle">
              <div className="timer-text">
                {formatTime(remainingTime)}
              </div>
              <div className="timer-label">剩余时间</div>
            </div>

            <div className="meditation-controls">
              <button className="pause-btn" onClick={pause}>
                ⏸️ 暂停
              </button>
              <button className="stop-btn" onClick={stopMeditation}>
                ⏹️ 结束
              </button>
            </div>

            <div className="meditation-tips">
              <p>💡 提示：可以锁定屏幕，音频将继续播放</p>
              <p>🧘 保持舒适的坐姿，专注于呼吸</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MeditationPlayer;
```

---

## 5. 自动播放下一首

实现播放队列和自动播放。

```typescript
import { useState, useEffect } from 'react';
import { useIOSAudioKernel } from './hooks/useIOSAudioKernel';

interface Track {
  id: string;
  title: string;
  src: string;
}

function AutoPlayQueue() {
  const [queue, setQueue] = useState<Track[]>([
    { id: '1', title: '曲目 1', src: '/audio/track1.mp3' },
    { id: '2', title: '曲目 2', src: '/audio/track2.mp3' },
    { id: '3', title: '曲目 3', src: '/audio/track3.mp3' }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    play,
    pause,
    isPlaying,
    audioRef
  } = useIOSAudioKernel({
    src: queue[currentIndex].src,
    loop: false,
    metadata: {
      title: queue[currentIndex].title,
      artist: 'Emoheal'
    },
    onEnded: () => {
      // 自动播放下一首
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  });

  // 切换歌曲时自动播放
  useEffect(() => {
    if (currentIndex > 0) {
      play();
    }
  }, [currentIndex]);

  return (
    <div>
      <audio ref={audioRef} />
      <h2>当前播放: {queue[currentIndex].title}</h2>
      <button onClick={play} disabled={isPlaying}>播放</button>
      <button onClick={pause} disabled={!isPlaying}>暂停</button>
      <p>队列: {currentIndex + 1} / {queue.length}</p>
    </div>
  );
}

export default AutoPlayQueue;
```

---

## 6. 音量控制

添加音量滑块控制。

```typescript
import { useState, useEffect } from 'react';
import { useIOSAudioKernel } from './hooks/useIOSAudioKernel';

function VolumeControlPlayer() {
  const [volume, setVolume] = useState(0.8);

  const { play, pause, isPlaying, audioRef } = useIOSAudioKernel({
    src: '/audio/music.mp3',
    metadata: { title: '音乐' }
  });

  // 同步音量到 audio 元素
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  return (
    <div className="volume-player">
      <audio ref={audioRef} />

      <button onClick={play} disabled={isPlaying}>播放</button>
      <button onClick={pause} disabled={!isPlaying}>暂停</button>

      <div className="volume-control">
        <span>🔈</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
        <span>🔊</span>
        <span className="volume-value">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
}

export default VolumeControlPlayer;
```

---

## 7. 播放速率控制

调整播放速度（0.5x - 2x）。

```typescript
import { useState, useEffect } from 'react';
import { useIOSAudioKernel } from './hooks/useIOSAudioKernel';

function PlaybackRatePlayer() {
  const [rate, setRate] = useState(1.0);

  const { play, pause, isPlaying, audioRef } = useIOSAudioKernel({
    src: '/audio/podcast.mp3',
    metadata: { title: '播客' }
  });

  // 同步播放速率
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, [rate, audioRef]);

  const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="rate-player">
      <audio ref={audioRef} />

      <button onClick={play} disabled={isPlaying}>播放</button>
      <button onClick={pause} disabled={!isPlaying}>暂停</button>

      <div className="rate-control">
        <label>播放速度:</label>
        {rates.map((r) => (
          <button
            key={r}
            className={rate === r ? 'active' : ''}
            onClick={() => setRate(r)}
          >
            {r}x
          </button>
        ))}
      </div>
    </div>
  );
}

export default PlaybackRatePlayer;
```

---

## 8. 错误重试机制

自动重试失败的音频加载。

```typescript
import { useState, useEffect } from 'react';
import { useIOSAudioKernel } from './hooks/useIOSAudioKernel';

function RetryPlayer() {
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const MAX_RETRIES = 3;

  const {
    play,
    pause,
    isPlaying,
    audioRef,
    error
  } = useIOSAudioKernel({
    src: '/audio/music.mp3',
    metadata: { title: '音乐' },
    onError: (err) => {
      setErrorMessage(err.message);

      if (retryCount < MAX_RETRIES) {
        console.log(`重试 ${retryCount + 1}/${MAX_RETRIES}...`);
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          play();
        }, 2000);
      } else {
        console.error('达到最大重试次数');
      }
    },
    onPlay: () => {
      // 播放成功，重置重试计数
      setRetryCount(0);
      setErrorMessage(null);
    }
  });

  return (
    <div className="retry-player">
      <audio ref={audioRef} />

      <button onClick={play} disabled={isPlaying}>播放</button>
      <button onClick={pause} disabled={!isPlaying}>暂停</button>

      {errorMessage && (
        <div className="error-message">
          ⚠️ {errorMessage}
          {retryCount > 0 && retryCount < MAX_RETRIES && (
            <p>正在重试... ({retryCount}/{MAX_RETRIES})</p>
          )}
          {retryCount >= MAX_RETRIES && (
            <p>加载失败，请检查网络连接</p>
          )}
        </div>
      )}
    </div>
  );
}

export default RetryPlayer;
```

---

## 更多示例

查看项目中的 `src/App.tsx` 以了解完整的 V4.0 Demo 实现。

## 参考资料

- [完整文档](./HOOK_DOCUMENTATION.md)
- [快速参考](./QUICK_REFERENCE.md)
- [测试指南](./TESTING_GUIDE.md)

---

**版本**: V4.0
**最后更新**: 2025-11-21
