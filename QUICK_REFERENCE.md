# useIOSAudioKernel 快速参考

## 🚀 一分钟上手

```typescript
import { useIOSAudioKernel } from './hooks/useIOSAudioKernel';

function App() {
  const { play, pause, isPlaying, audioRef } = useIOSAudioKernel({
    src: '/audio.mp3',
    metadata: { title: 'My Song', artist: 'Artist' }
  });

  return (
    <>
      <audio ref={audioRef} />
      <button onClick={play}>播放</button>
      <button onClick={pause}>暂停</button>
    </>
  );
}
```

## 📋 API 速查表

### 输入参数

```typescript
{
  src: string;              // 必填：音频 URL
  loop?: boolean;           // 可选：循环播放
  metadata?: {              // 可选：锁屏显示信息
    title?: string;
    artist?: string;
    album?: string;
    artwork?: Array<{ src, sizes, type }>;
  };
  onPlay?: () => void;      // 可选：播放回调
  onPause?: () => void;     // 可选：暂停回调
  onEnded?: () => void;     // 可选：结束回调
  onError?: (e) => void;    // 可选：错误回调
}
```

### 返回值

```typescript
{
  play: () => Promise<void>;           // 播放（同步触发）
  pause: () => void;                   // 暂停
  seek: (time: number) => void;        // 跳转
  isPlaying: boolean;                  // 播放状态
  duration: number;                    // 总时长
  currentTime: number;                 // 当前位置
  audioRef: RefObject<HTMLAudioElement>; // Audio 引用
  error: Error | null;                 // 错误对象
  isInitialized: boolean;              // 初始化状态
}
```

## 🎯 核心概念

### 1️⃣ 同步触发策略
```typescript
// ❌ 错误 - 有 await 在 play() 之前
const handlePlay = async () => {
  await fetchAudioData();  // 💥 时间断裂！
  await audio.play();
};

// ✅ 正确 - play() 立即同步调用
const handlePlay = async () => {
  await audio.play();      // ✨ 同步触发
  fetchAudioData();        // 之后再做其他事
};
```

### 2️⃣ 状态突变更新
```typescript
// ❌ 错误 - 过度喂养
audio.addEventListener('timeupdate', updatePosition);

// ✅ 正确 - 只在状态变化时更新
audio.addEventListener('play', updatePosition);
audio.addEventListener('pause', updatePosition);
audio.addEventListener('seeked', updatePosition);
```

### 3️⃣ 时长有限性检查
```typescript
// ❌ 错误 - 可能传入 Infinity
setPositionState({ duration: audio.duration });

// ✅ 正确 - 检查有限性
if (Number.isFinite(audio.duration) && audio.duration > 0) {
  setPositionState({ duration: audio.duration });
}
```

### 4️⃣ JavaScript 循环
```typescript
// ❌ 原生 loop 可能干扰 MediaSession
<audio src="..." loop />

// ✅ JS 手动循环
audio.addEventListener('ended', () => {
  audio.currentTime = 0;
  audio.play();
});
```

## 🔧 常用模式

### 带进度条
```typescript
const { currentTime, duration, seek } = useIOSAudioKernel({...});

<input
  type="range"
  min="0"
  max={duration}
  value={currentTime}
  onChange={(e) => seek(parseFloat(e.target.value))}
/>
```

### 播放列表
```typescript
const [index, setIndex] = useState(0);
const track = tracks[index];

const { play, isPlaying } = useIOSAudioKernel({
  src: track.src,
  metadata: { title: track.title },
  onEnded: () => setIndex(i => i + 1)
});

useEffect(() => {
  if (isPlaying) play();
}, [index]);
```

### 错误处理
```typescript
const [error, setError] = useState(null);

const { play } = useIOSAudioKernel({
  src: '/audio.mp3',
  onError: (e) => {
    setError(e.message);
    console.error('播放失败:', e);
  }
});

{error && <div className="error">{error}</div>}
```

## ⚠️ 核心注意事项

1. ✅ 首次播放必须由**用户手势**触发（点击、触摸）
2. ✅ 必须在 **HTTPS** 环境使用（localhost 可以）
3. ✅ iOS **静音开关**必须关闭（初次测试）
4. ✅ `<audio ref={audioRef} />` 必须渲染到 DOM
5. ✅ 更新代码后清除 Safari 缓存

## 🧪 测试清单

- [ ] 本地 localhost 开发环境测试
- [ ] 部署到 HTTPS 生产环境
- [ ] iPhone Safari 打开并点击播放
- [ ] 锁屏测试：按电源键，验证音频继续
- [ ] 锁屏控件：验证播放/暂停按钮
- [ ] 进度条：验证可拖动
- [ ] 多任务：切换到其他 App，验证后台播放
- [ ] 控制中心：验证显示正确信息

## 🐛 故障排除

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 锁屏立即停止 | play() 前有 await | 移除 play() 前的异步操作 |
| 进度条不能拖 | timeupdate 更新过度 | 移除 timeupdate 监听器 |
| 没有锁屏控件 | MediaSession 未初始化 | 检查 metadata 是否提供 |
| 音频无法播放 | 静音开关打开 | 关闭 iPhone 静音开关 |
| 控件闪现消失 | 时间断裂问题 | 使用同步触发策略 |

## 📚 完整文档

查看完整文档: [HOOK_DOCUMENTATION.md](./HOOK_DOCUMENTATION.md)

## 🎓 技术演进

- **V2.0**: Web Audio API + MediaSession（失败：锁屏停止）
- **V3.0**: 同步触发策略（成功：锁屏播放）
- **V3.1**: 添加 seek 控制（失败：进度条锁定）
- **V3.2**: 状态突变更新（成功：进度条可拖动）
- **V4.0**: Hook 封装（生产就绪）

---

**快速链接**:
- [完整文档](./HOOK_DOCUMENTATION.md)
- [测试指南](./TESTING_GUIDE.md)
- [代码示例](./EXAMPLES.md)
