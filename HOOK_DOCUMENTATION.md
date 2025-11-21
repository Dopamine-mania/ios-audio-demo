# useIOSAudioKernel Hook 使用文档

## 📋 概述

`useIOSAudioKernel` 是一个专为 iOS Safari 优化的 React Hook，完美解决了 iOS 浏览器中背景音频播放的各种限制问题。

### 核心特性

- ✅ **iOS 锁屏播放支持** - 音频在锁屏后持续播放
- ✅ **原生锁屏控件** - 显示歌曲信息、播放/暂停/进度条控制
- ✅ **进度条可拖动** - 解决了"过度喂养"问题，进度条完全可交互
- ✅ **同步触发策略** - 绕过 iOS 的"时间断裂"限制
- ✅ **完整 TypeScript 支持** - 类型安全的 API
- ✅ **生产就绪** - 经过实战测试的稳定实现

## 🚀 快速开始

### 基础用法

```typescript
import { useIOSAudioKernel } from './hooks/useIOSAudioKernel';

function MusicPlayer() {
  const { play, pause, isPlaying, duration, currentTime } = useIOSAudioKernel({
    src: '/audio/song.mp3',
    loop: true,
    metadata: {
      title: '歌曲名称',
      artist: '艺术家',
      album: '专辑名称'
    }
  });

  return (
    <div>
      <button onClick={play} disabled={isPlaying}>
        播放
      </button>
      <button onClick={pause} disabled={!isPlaying}>
        暂停
      </button>
      <p>进度: {currentTime.toFixed(1)}s / {duration.toFixed(1)}s</p>
    </div>
  );
}
```

## 📖 API 参考

### 输入参数 (UseIOSAudioKernelOptions)

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `src` | `string` | ✅ | - | 音频文件 URL |
| `loop` | `boolean` | ❌ | `false` | 是否循环播放 |
| `metadata` | `MediaMetadataOptions` | ❌ | - | 锁屏显示的媒体信息 |
| `onPlay` | `() => void` | ❌ | - | 播放开始回调 |
| `onPause` | `() => void` | ❌ | - | 暂停回调 |
| `onEnded` | `() => void` | ❌ | - | 播放结束回调 |
| `onError` | `(error: Error) => void` | ❌ | - | 错误回调 |

#### MediaMetadataOptions

```typescript
interface MediaMetadataOptions {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}
```

### 返回值 (UseIOSAudioKernelReturn)

| 属性 | 类型 | 说明 |
|------|------|------|
| `play` | `() => Promise<void>` | 播放音频（同步触发） |
| `pause` | `() => void` | 暂停音频 |
| `seek` | `(time: number) => void` | 跳转到指定时间（秒） |
| `isPlaying` | `boolean` | 是否正在播放 |
| `duration` | `number` | 音频总时长（秒） |
| `currentTime` | `number` | 当前播放位置（秒） |
| `audioRef` | `RefObject<HTMLAudioElement>` | Audio 元素引用 |
| `error` | `Error \| null` | 错误对象 |
| `isInitialized` | `boolean` | MediaSession 是否已初始化 |

## 💡 使用示例

### 示例 1: 简单音乐播放器

```typescript
function SimpleMusicPlayer() {
  const { play, pause, isPlaying, audioRef } = useIOSAudioKernel({
    src: '/music.mp3',
    metadata: {
      title: '平静冥想',
      artist: 'Emoheal'
    }
  });

  return (
    <div>
      <audio ref={audioRef} />
      <button onClick={play}>
        {isPlaying ? '播放中...' : '开始播放'}
      </button>
      <button onClick={pause} disabled={!isPlaying}>
        暂停
      </button>
    </div>
  );
}
```

### 示例 2: 带进度条的播放器

```typescript
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
    src: '/meditation.mp3',
    loop: true,
    metadata: {
      title: '呼吸练习',
      artist: 'Emoheal Therapy',
      artwork: [
        {
          src: '/artwork.jpg',
          sizes: '512x512',
          type: 'image/jpeg'
        }
      ]
    },
    onPlay: () => console.log('音频开始播放'),
    onPause: () => console.log('音频已暂停')
  });

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player">
      <audio ref={audioRef} />

      <h2>呼吸练习</h2>

      <div className="controls">
        <button onClick={play} disabled={isPlaying}>
          ▶️ 播放
        </button>
        <button onClick={pause} disabled={!isPlaying}>
          ⏸️ 暂停
        </button>
        <button onClick={() => seek(0)}>
          ⏮️ 重新开始
        </button>
      </div>

      <div className="progress">
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          style={{ width: '100%' }}
        />
        <div className="time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

### 示例 3: 播放列表播放器

```typescript
interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  artwork?: string;
}

function PlaylistPlayer({ tracks }: { tracks: Track[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTrack = tracks[currentIndex];

  const {
    play,
    pause,
    isPlaying,
    audioRef,
    isInitialized
  } = useIOSAudioKernel({
    src: currentTrack.src,
    loop: false,
    metadata: {
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: currentTrack.artwork ? [
        { src: currentTrack.artwork, sizes: '512x512', type: 'image/jpeg' }
      ] : undefined
    },
    onEnded: () => {
      // 自动播放下一首
      if (currentIndex < tracks.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
    onError: (error) => {
      console.error('播放失败:', error);
      // 尝试播放下一首
      if (currentIndex < tracks.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  });

  // 当切换歌曲且之前在播放时，自动播放新歌曲
  useEffect(() => {
    if (isInitialized && isPlaying) {
      play();
    }
  }, [currentIndex]);

  const playNext = () => {
    if (currentIndex < tracks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="playlist-player">
      <audio ref={audioRef} />

      <div className="current-track">
        {currentTrack.artwork && (
          <img src={currentTrack.artwork} alt={currentTrack.title} />
        )}
        <h3>{currentTrack.title}</h3>
        <p>{currentTrack.artist}</p>
      </div>

      <div className="controls">
        <button onClick={playPrevious} disabled={currentIndex === 0}>
          ⏮️ 上一首
        </button>
        <button onClick={play} disabled={isPlaying}>
          ▶️ 播放
        </button>
        <button onClick={pause} disabled={!isPlaying}>
          ⏸️ 暂停
        </button>
        <button onClick={playNext} disabled={currentIndex === tracks.length - 1}>
          ⏭️ 下一首
        </button>
      </div>

      <div className="playlist">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className={index === currentIndex ? 'active' : ''}
            onClick={() => setCurrentIndex(index)}
          >
            {track.title} - {track.artist}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔧 技术细节

### 核心策略

#### 1. 同步触发策略 (Sync-Trigger Strategy)

**问题**: iOS Safari 要求 `audio.play()` 必须在用户手势事件的同步执行栈中调用。任何 `await` 操作都会导致"时间断裂"，使 iOS 认为播放是程序自动触发的，从而拒绝授予背景播放权限。

**解决方案**:
```typescript
const play = useCallback(async (): Promise<void> => {
  if (!audioRef.current) return;

  // 立即同步调用 play() - 不能有任何 await 在这之前！
  await audioRef.current.play();

  // play() 成功后再初始化 MediaSession
  if (!isInitialized) {
    initMediaSession();
  }
}, [isInitialized, initMediaSession]);
```

#### 2. 状态突变更新模式 (State-Mutation-Only Updates)

**问题**: 如果在 `timeupdate` 事件（每秒触发4-10次）中调用 `setPositionState()`，会导致"过度喂养"问题。iOS 锁屏的进度条本身会根据初始状态自动推进，频繁的代码更新会与用户拖动手势冲突，导致进度条无法交互。

**解决方案**: 只在实际状态变化时更新位置
```typescript
// ❌ 错误做法 - 导致进度条锁死
audio.addEventListener('timeupdate', updatePositionState);

// ✅ 正确做法 - 只在状态突变时更新
audio.addEventListener('play', updatePositionState);
audio.addEventListener('pause', updatePositionState);
audio.addEventListener('seeked', updatePositionState);
audio.addEventListener('loadedmetadata', updatePositionState);
audio.addEventListener('ratechange', updatePositionState);
```

#### 3. 时长有限性检查 (Duration Finite Validation)

**问题**: 对于流媒体或未完全加载的音频，`duration` 可能为 `Infinity` 或 `NaN`，传递给 `setPositionState()` 会导致 MediaSession 进入直播模式，失去进度控制能力。

**解决方案**:
```typescript
const updatePositionState = useCallback(() => {
  const audio = audioRef.current;
  if (
    !audio ||
    !Number.isFinite(audio.duration) ||  // 关键检查
    audio.duration <= 0
  ) {
    return;
  }

  navigator.mediaSession.setPositionState({
    duration: audio.duration,
    playbackRate: audio.playbackRate,
    position: audio.currentTime
  });
}, []);
```

#### 4. JavaScript 循环实现 (JS-Based Loop)

**问题**: 使用原生的 `<audio loop>` 属性可能导致 MediaSession 误判音频类型（背景音效 vs 音乐），影响锁屏控件显示。

**解决方案**: 通过 JavaScript 手动实现循环
```typescript
// ❌ 原生 loop 属性
<audio src="..." loop />

// ✅ JS 实现 loop
const handleEnded = useCallback(() => {
  if (!audioRef.current) return;

  if (options.loop) {
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  }

  options.onEnded?.();
}, [options]);

audio.addEventListener('ended', handleEnded);
```

### 事件处理流程

```
用户点击播放按钮
    ↓
[同步] audio.play() 调用 ← iOS 必须在此同步栈中授权
    ↓
[异步] play() Promise 解决
    ↓
初始化 MediaSession (一次性)
    ↓
注册锁屏控件动作处理器
    ↓
设置初始 PositionState
    ↓
[事件驱动] 仅在状态突变时更新:
  - play → updatePositionState()
  - pause → updatePositionState()
  - seeked → updatePositionState()
  - loadedmetadata → updatePositionState()
```

## ⚠️ 注意事项

### iOS Safari 限制

1. **静音开关**: iOS 设备的物理静音开关会影响音频播放。初次测试时确保静音开关处于关闭状态。

2. **用户手势要求**: 首次播放必须由用户手势触发（点击、触摸等）。不能在页面加载时自动播放。

3. **HTTPS 要求**: MediaSession API 需要在安全上下文（HTTPS）中使用。本地开发可使用 `localhost`。

4. **浏览器兼容性**: 此 Hook 专为 iOS Safari 优化，在其他浏览器中同样可用，但某些特性表现可能不同。

### 最佳实践

1. **提供明确的播放按钮**: 确保用户知道如何启动音频播放。

2. **显示加载状态**: 音频加载期间显示加载指示器。

3. **错误处理**: 始终提供 `onError` 回调处理播放失败情况。

4. **测试真机**: iOS 模拟器的行为与真机可能不同，务必在真实 iPhone 上测试。

5. **清除缓存测试**: 更新代码后在 iPhone Safari 中清除网站数据，确保测试最新版本。

### 常见问题

**Q: 为什么锁屏后音频立即停止？**

A: 可能原因：
- `play()` 调用前有 `await` 操作（违反同步触发策略）
- 没有正确初始化 MediaSession
- 音频文件加载失败
- iOS 静音开关打开

**Q: 为什么锁屏进度条无法拖动？**

A: 检查是否在 `timeupdate` 事件中调用了 `updatePositionState()`。应该移除该监听器，只在状态突变时更新。

**Q: 如何实现切换歌曲？**

A: 改变传入的 `src` 参数，Hook 内部会自动处理。如果需要自动播放新歌曲，在切换后调用 `play()`。

**Q: 可以同时使用多个 `useIOSAudioKernel` 实例吗？**

A: 技术上可以，但 MediaSession 是全局单例，同时只能有一个音频控制锁屏控件。建议使用单个实例管理播放列表。

## 📦 集成到生产环境

### 文件结构

```
src/
  hooks/
    useIOSAudioKernel.ts    # Hook 实现
  components/
    MusicPlayer.tsx         # 你的播放器组件
  App.tsx
```

### 安装依赖

此 Hook 只依赖 React，无需额外安装包：

```json
{
  "dependencies": {
    "react": "^18.0.0"
  }
}
```

### TypeScript 配置

确保 `tsconfig.json` 中包含以下配置：

```json
{
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "target": "ES2020"
  }
}
```

## 🧪 测试指南

### iPhone 真机测试步骤

1. **部署到 HTTPS 环境**（如 Cloudflare Pages、Vercel、Netlify）

2. **iPhone 打开网页**
   - 在 Safari 中打开部署 URL
   - 点击播放按钮
   - 验证音频开始播放

3. **锁屏测试**
   - 按下电源键锁屏
   - 观察锁屏界面是否显示播放控件
   - 验证音频是否持续播放

4. **控件测试**
   - 在锁屏界面点击暂停按钮
   - 验证音频暂停
   - 点击播放按钮，验证恢复播放
   - 拖动进度条，验证跳转功能

5. **多任务测试**
   - 解锁 iPhone
   - 打开其他 App（如微信、邮件）
   - 验证音频在后台持续播放
   - 打开控制中心，验证显示播放信息

### 预期行为

✅ **成功标准**:
- 锁屏后音频持续播放
- 锁屏控件显示歌曲信息和专辑封面
- 播放/暂停按钮响应正确
- 进度条可拖动且实时更新
- 切换到其他 App 时音频继续播放

## 🎓 技术背景

这个 Hook 是在解决实际 iOS Safari 背景播放问题过程中，通过与 AI 助手（Gemini）协作诊断和迭代测试开发出来的。主要突破了两个关键问题：

1. **"时间断裂"问题** (V3.0) - 通过同步触发策略解决锁屏播放
2. **"过度喂养"问题** (V3.2) - 通过状态突变更新模式解决进度条交互

从 Demo 到生产就绪的 Hook，这是一个经过实战验证的解决方案。

## 📄 许可证

此代码作为 Emoheal 项目的一部分，供内部开发使用。

---

**版本**: V4.0 - Hook Edition
**最后更新**: 2025-11-21
**作者**: Claude Code + 陈婉心
**项目**: Emoheal - iOS 音频守门员 Demo
