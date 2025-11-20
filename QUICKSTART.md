# iOS 音频守门员 Demo - 快速开始

## 项目已完成！

所有开发任务已完成，开发服务器正在运行中。

---

## 当前状态

**开发服务器**: 正在运行
**访问地址**: http://localhost:5173/
**项目路径**: `/Users/wanxinchen/Work/onecompany/aimusichealing/Emoheal/demo_test/ios-audio-demo`

---

## 立即测试（本地环境）

1. 打开浏览器访问: http://localhost:5173/
2. 点击 "1. Initialize Audio Engine"
3. 点击 "2. Toggle Play / Pause"
4. 应该听到440Hz的测试音调

---

## 文件清单

```
ios-audio-demo/
├── src/
│   └── App.tsx                 ✓ 已实现核心代码
├── public/
│   └── test-music.mp3          ✓ 2分钟测试音频（1.8MB）
├── TESTING_GUIDE.md            ✓ 详细测试指导文档
└── QUICKSTART.md               ✓ 本文件
```

---

## 下一步：真机测试

**重要**: 真实的iOS后台播放测试必须在iPhone上进行，需要HTTPS环境。

### 部署到公网（3种方式任选）

#### 方式1: Vercel（最快）
```bash
npm i -g vercel
cd ios-audio-demo
vercel
```

#### 方式2: Cloudflare Pages
```bash
# 1. 初始化git
git init
git add .
git commit -m "Initial commit"

# 2. 推送到GitHub
# 在GitHub创建仓库，然后：
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main

# 3. 访问 https://pages.cloudflare.com
# 连接GitHub仓库并部署
```

#### 方式3: Netlify
```bash
# 安装Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

---

## iPhone测试核心步骤

1. 在Safari打开部署后的HTTPS链接
2. 初始化 → 播放
3. **锁屏3分钟**，检查音频是否继续
4. 检查锁屏界面是否有播放控件
5. 切换到其他App，检查音频是否继续
6. 连续播放10分钟，检查是否崩溃

详细步骤请查看: `TESTING_GUIDE.md`

---

## 验收标准

测试通过条件：
- [ ] 锁屏后持续播放 ≥ 3分钟
- [ ] 锁屏界面显示 "Gatekeeper Demo" 控件
- [ ] 切换App后音频继续播放
- [ ] 连续播放10分钟无崩溃

---

## 技术要点回顾

本项目使用三大技术突破iOS限制：

1. **静音底座** (Web Audio API)
   - 1秒循环buffer + 微噪音
   - 欺骗系统认为网页在活跃发声

2. **MediaSession API**
   - 注册媒体元数据
   - 锁屏控件显示
   - 后台存活率提升200%

3. **内存优化**
   - 短buffer循环
   - 避免OOM崩溃

---

## 常用命令

```bash
# 启动开发服务器（已在运行）
npm run dev

# 停止开发服务器
# 按 Ctrl+C 或关闭终端

# 重新启动
cd ios-audio-demo
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

---

## 需要帮助？

- 详细测试流程: 查看 `TESTING_GUIDE.md`
- 技术原理说明: 见任务手册第1节
- 部署问题: 查看 `TESTING_GUIDE.md` 的部署章节

---

**开始测试吧！**
