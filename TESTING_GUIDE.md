# iOS 音频后台播放测试指导文档

## 项目概述

**守门员Demo (Gatekeeper Demo)** - iOS后台音频播放技术验证项目

**核心目标**: 验证在iOS Safari浏览器环境下，Web应用在锁屏或切换App后，音频能否持续、稳定地后台播放。

---

## 技术实现原理

### 三大核心技术

1. **Web Audio API - 静音底座技术**
   - 创建1秒的静音循环buffer（内存优化）
   - 注入极微小噪音(0.00001)防止系统优化
   - 无限循环播放，欺骗系统认为网页在活跃发声

2. **MediaSession API - 系统级媒体会话**
   - 注册媒体元数据（歌名、艺术家、封面）
   - 锁屏界面显示原生播放控件
   - 提升后台存活率200%

3. **内存优化策略**
   - 避免长Buffer（只用1秒循环）
   - 防止OOM（内存溢出）导致页面崩溃

---

## 本地测试（开发环境）

### 当前状态
开发服务器已启动: **http://localhost:5173/**

### 本地测试步骤

1. **打开浏览器**
   ```
   在浏览器中访问: http://localhost:5173/
   ```

2. **初始化音频引擎**
   - 点击蓝色按钮 "1. Initialize Audio Engine"
   - 等待状态显示 "Ready to play. Do not close tab!"

3. **开始播放**
   - 点击绿色按钮 "2. Toggle Play / Pause"
   - 应该听到440Hz的测试音调（持续播放）

4. **桌面环境测试**
   - 切换到其他浏览器标签页
   - 最小化浏览器窗口
   - 验证音频是否继续播放

### 注意事项
- 本地测试无法完全模拟iOS环境的限制
- 主要用于验证代码逻辑和基本播放功能
- **真实测试必须在iPhone设备上进行**

---

## iOS真机测试（关键环节）

### 前置要求

1. **HTTPS环境**
   - Web Audio API和MediaSession API要求HTTPS
   - localhost在移动设备上无法访问
   - 需要部署到公网HTTPS服务

2. **推荐部署平台**
   - **Vercel** (推荐): https://vercel.com
   - **Cloudflare Pages**: https://pages.cloudflare.com
   - **Netlify**: https://netlify.com

### 部署步骤

#### 方法1: 使用Vercel（最简单）

```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 在项目目录下登录并部署
cd ios-audio-demo
vercel

# 3. 按照提示完成部署
# - 首次使用需要登录GitHub账号
# - 选择项目配置（使用默认设置）
# - 部署完成后会得到一个https://...vercel.app的链接
```

#### 方法2: 使用GitHub + Vercel网页版

```bash
# 1. 初始化git仓库（如果还没有）
cd ios-audio-demo
git init
git add .
git commit -m "Initial commit: iOS Audio Gatekeeper Demo"

# 2. 推送到GitHub
# 在GitHub上创建新仓库
git remote add origin https://github.com/你的用户名/ios-audio-demo.git
git push -u origin main

# 3. 在Vercel网站上:
# - 登录 https://vercel.com
# - 点击 "Import Project"
# - 选择你的GitHub仓库
# - 点击 "Deploy"
# - 等待部署完成，获取HTTPS链接
```

### iPhone测试流程

#### 测试环境准备
- iPhone设备（任意iOS版本，建议iOS 15+）
- Safari浏览器
- 耳机或外放音量开启
- 确保设备不处于静音模式

#### 标准测试步骤

**第一阶段：基础播放测试**

1. 在iPhone Safari中打开部署的HTTPS链接
2. 点击 "1. Initialize Audio Engine"
3. 等待状态显示 "Ready to play"
4. 点击 "2. Toggle Play / Pause"
5. 确认听到测试音频

**第二阶段：锁屏测试（核心验证）**

1. 确保音频正在播放
2. 按下iPhone电源键锁屏
3. **关键观察点**:
   - 音频是否继续播放？✓ 通过 / ✗ 失败
   - 锁屏界面是否出现播放控件？✓ 通过 / ✗ 失败
   - 控件上是否显示 "Gatekeeper Demo"？✓ 通过 / ✗ 失败
4. 保持锁屏状态 **3-5分钟**
5. 每隔1分钟检查音频是否仍在播放

**第三阶段：App切换测试**

1. 解锁iPhone，确保音频仍在播放
2. 按Home键或上滑返回主屏幕
3. 打开其他非音频App（如微信、设置、备忘录）
4. 在其他App中停留1-2分钟
5. 验证音频是否持续播放

**第四阶段：长时间稳定性测试**

1. 开始播放音频
2. 锁屏或切换App
3. 持续 **10分钟以上**
4. 观察是否出现：
   - 音频突然停止
   - Safari页面自动刷新（Crash）
   - 音频断断续续

---

## 验收标准 (Definition of Done)

### 必须通过的测试项

- [ ] **锁屏持续播放**: 锁屏后音频持续播放 ≥ 3分钟 无中断
- [ ] **锁屏控件显示**: 锁屏界面出现播放控件，显示 "Gatekeeper Demo"
- [ ] **App切换播放**: 切换到其他App后，音频持续播放无中断
- [ ] **无崩溃**: 连续播放10分钟，Safari未自动刷新（无内存溢出）
- [ ] **可恢复控制**: 解锁后能正常暂停/播放，控制按钮响应正常

### 可选高级测试

- [ ] 来电话时音频行为（自动暂停/恢复）
- [ ] 蓝牙耳机连接/断开时的表现
- [ ] 低电量模式下的后台存活率
- [ ] 同时打开多个Safari标签的影响

---

## 常见问题与解决方案

### Q1: 本地测试无法播放音频
**原因**: 浏览器安全策略要求用户手势触发
**解决**: 必须先点击按钮，不能自动播放

### Q2: 锁屏后音频立即停止
**可能原因**:
1. 没有在HTTPS环境下测试
2. iOS版本过旧（<iOS 14）
3. 静音底座未启动（检查代码）

**解决方案**:
- 确保使用HTTPS部署链接
- 检查浏览器控制台是否有错误
- 尝试Plan B方案（见下方）

### Q3: Safari页面在后台被杀掉
**原因**: 内存占用过高或iOS积极的后台管理
**解决方案**:
- 已实现：1秒Buffer循环（内存优化）
- 已实现：MediaSession API注册
- 如仍失败，尝试Plan B

### Q4: 找不到test-music.mp3
**原因**: 音频文件未正确放置
**检查**: 文件应在 `ios-audio-demo/public/test-music.mp3`
**解决**:
```bash
ls -lh ios-audio-demo/public/test-music.mp3
# 应该显示: -rw-r--r-- 1.8M test-music.mp3
```

---

## Plan B: HTML5 Audio 占位法

如果当前V2.0方案在特定iOS版本失效，可尝试此备用方案：

### 实现步骤

1. 创建静音音频文件（已有test-music.mp3可复用）

2. 在 `App.tsx` 中添加隐藏的 `<audio>` 标签：
```tsx
<audio id="html5-holder" src="/test-music.mp3" loop style={{display: 'none'}}></audio>
```

3. 在 `initializeAudio` 函数中同时启动HTML5播放器：
```tsx
const html5Audio = document.getElementById('html5-holder') as HTMLAudioElement;
html5Audio.volume = 0.01; // 极低音量
html5Audio.play();
```

### 原理
利用HTML5 `<audio>` 标签的高系统优先级保活Web Audio API。

---

## 项目文件结构

```
ios-audio-demo/
├── public/
│   └── test-music.mp3          # 测试音频文件（2分钟，1.8MB）
├── src/
│   ├── App.tsx                 # 核心实现代码
│   └── ...
├── package.json
├── vite.config.ts
├── TESTING_GUIDE.md            # 本文档
└── README.md                   # Vite默认文档
```

---

## 技术支持与反馈

### 测试记录表

请在测试后填写：

| 测试项 | 结果 | 备注 |
|--------|------|------|
| 锁屏3分钟播放 | ✓ / ✗ |  |
| 锁屏控件显示 | ✓ / ✗ |  |
| App切换播放 | ✓ / ✗ |  |
| 10分钟无崩溃 | ✓ / ✗ |  |

### 测试环境信息

- **设备型号**: iPhone ______________
- **iOS版本**: iOS ______________
- **Safari版本**: Safari ______________
- **测试日期**: 20____年____月____日
- **测试人员**: ____________________

---

## 下一步行动

### 本地开发完成后：

1. [ ] 将代码推送到GitHub仓库
2. [ ] 部署到Vercel/Cloudflare Pages
3. [ ] 获取HTTPS部署链接
4. [ ] 在iPhone Safari中打开链接进行真机测试
5. [ ] 填写测试记录表
6. [ ] 根据测试结果决定是否需要Plan B

### 当前可执行的操作：

```bash
# 本地访问测试（仅验证基本功能）
# 浏览器打开: http://localhost:5173/

# 停止开发服务器（测试完成后）
# Ctrl + C 或在终端中输入
npm run dev --stop
```

---

**祝测试顺利！任何问题请及时反馈。**

---

*文档版本: v1.0*
*最后更新: 2025-11-20*
