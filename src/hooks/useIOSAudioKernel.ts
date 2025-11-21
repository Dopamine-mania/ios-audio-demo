import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * iOS Audio Gatekeeper Kernel Hook
 *
 * 核心功能：在iOS Safari环境下实现后台音频播放和锁屏控制
 *
 * 技术要点：
 * 1. 同步触发策略（Sync-Trigger）- 避免异步操作导致的权限丢失
 * 2. 状态突变更新（State Mutation）- 只在关键时刻更新MediaSession
 * 3. Duration有限性检查 - 防止Infinity导致直播模式
 * 4. JS循环实现 - 避免原生loop属性干扰MediaSession
 *
 * @version 3.2
 * @based-on Gemini AI 诊断方案
 */

interface MediaMetadataOptions {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: { src: string; sizes: string; type: string }[];
}

interface UseIOSAudioKernelOptions {
  /** 音频源URL */
  src: string;

  /** 是否循环播放 */
  loop?: boolean;

  /** MediaSession元数据（锁屏显示） */
  metadata?: MediaMetadataOptions;

  /** 播放开始回调 */
  onPlay?: () => void;

  /** 暂停回调 */
  onPause?: () => void;

  /** 播放结束回调 */
  onEnded?: () => void;

  /** 错误回调 */
  onError?: (error: Error) => void;
}

interface UseIOSAudioKernelReturn {
  /** 播放音频（同步触发，返回Promise） */
  play: () => Promise<void>;

  /** 暂停音频 */
  pause: () => void;

  /** 跳转到指定时间 */
  seek: (time: number) => void;

  /** 是否正在播放 */
  isPlaying: boolean;

  /** 音频总时长（秒） */
  duration: number;

  /** 当前播放位置（秒） */
  currentTime: number;

  /** Audio元素引用（用于绑定到DOM） */
  audioRef: React.RefObject<HTMLAudioElement | null>;

  /** 错误信息 */
  error: Error | null;

  /** 是否已初始化MediaSession */
  isInitialized: boolean;
}

export function useIOSAudioKernel(
  options: UseIOSAudioKernelOptions
): UseIOSAudioKernelReturn {
  const {
    src,
    loop = true,
    metadata = {},
    onPlay,
    onPause,
    onEnded,
    onError
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * 设置音频源
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && src) {
      audio.src = src;
    }
  }, [src]);

  /**
   * 更新MediaSession播放位置状态
   *
   * 关键原则：只在状态突变时调用，绝不在timeupdate中调用
   * 原因：频繁更新会与用户拖拽手势冲突，导致进度条无法交互
   */
  const updatePositionState = useCallback(() => {
    const audio = audioRef.current;

    // 严格检查 duration 必须是有限数值
    // 如果是Infinity，iOS会将其视为直播流，禁用进度条
    if (
      !audio ||
      !('mediaSession' in navigator) ||
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
    } catch (err) {
      console.warn('[useIOSAudioKernel] MediaSession position update failed:', err);
    }
  }, []);

  /**
   * 初始化 MediaSession API
   *
   * 作用：
   * 1. 注册锁屏控件元数据（标题、艺术家、封面）
   * 2. 绑定系统媒体控制事件（播放、暂停、跳转）
   * 3. 启用锁屏进度条交互
   */
  const initMediaSession = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !('mediaSession' in navigator)) return;

    // 设置元数据
    const defaultMetadata: MediaMetadataOptions = {
      title: 'Audio Track',
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      artwork: [
        { src: 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/png' }
      ]
    };

    navigator.mediaSession.metadata = new MediaMetadata({
      ...defaultMetadata,
      ...metadata
    });

    // 播放控制 - 状态突变时更新
    navigator.mediaSession.setActionHandler('play', () => {
      audio.play().catch(console.error);
      updatePositionState();
    });

    // 暂停控制 - 状态突变时更新
    navigator.mediaSession.setActionHandler('pause', () => {
      audio.pause();
      updatePositionState();
    });

    // 停止控制
    navigator.mediaSession.setActionHandler('stop', () => {
      audio.pause();
      audio.currentTime = 0;
      updatePositionState();
    });

    // 进度拖动控制 - 立即同步防止UI回弹
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
      audio.currentTime = Math.min(
        audio.currentTime + skipTime,
        audio.duration || 0
      );
      updatePositionState();
    });

    setIsInitialized(true);
    updatePositionState();
  }, [metadata, updatePositionState]);

  /**
   * 播放函数
   *
   * 关键：采用同步触发策略
   * 必须在用户手势的同步执行栈中调用 audio.play()
   * 如果在 await 之后调用，iOS会认为不是用户触发，拒绝授权
   */
  const play = useCallback(async (): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) {
      const err = new Error('Audio element not found');
      setError(err);
      onError?.(err);
      throw err;
    }

    try {
      // 同步调用play()，不能有任何await在前面
      await audio.play();

      // 播放成功后初始化MediaSession
      if (!isInitialized) {
        initMediaSession();
      }

      onPlay?.();
    } catch (err) {
      const error = err as Error;
      console.error('[useIOSAudioKernel] Play failed:', error);
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [isInitialized, initMediaSession, onPlay, onError]);

  /**
   * 暂停函数
   */
  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    onPause?.();
  }, [onPause]);

  /**
   * 跳转函数
   */
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    updatePositionState();
  }, [updatePositionState]);

  /**
   * 监听音频事件
   *
   * 关键：只在状态突变时更新MediaSession
   * 绝对不要在timeupdate中调用updatePositionState！
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 元数据加载完成
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
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
      updatePositionState();
    };

    // 跳转完成
    const handleSeeked = () => {
      updatePositionState();
    };

    // 倍速改变
    const handleRateChange = () => {
      updatePositionState();
    };

    // 时间更新（仅用于UI显示，不更新MediaSession！）
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    // 循环播放实现
    const handleEnded = () => {
      if (loop) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
      onEnded?.();
    };

    // 错误处理
    const handleError = () => {
      const err = new Error(`Audio error: ${audio.error?.message || 'Unknown error'}`);
      console.error('[useIOSAudioKernel] Audio error:', err);
      setError(err);
      onError?.(err);
    };

    // 绑定事件
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('ratechange', handleRateChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('seeked', handleSeeked);
      audio.removeEventListener('ratechange', handleRateChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [loop, onEnded, onError, updatePositionState]);

  return {
    play,
    pause,
    seek,
    isPlaying,
    duration,
    currentTime,
    audioRef,
    error,
    isInitialized
  };
}
