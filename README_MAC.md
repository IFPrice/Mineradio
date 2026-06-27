# Mineradio macOS 版

该端口保留上游 `public/` 中的界面、粒子视觉、歌词舞台、3D 歌单架、网易云/QQ 音乐接入和本地服务，不重写视觉层。

## 构建

环境要求：

- macOS
- Node.js 22 或更高版本
- Xcode Command Line Tools：`xcode-select --install`

```bash
npm ci
npm run build:mac
```

构建结果位于 `dist/`，同时生成 Apple Silicon (`arm64`) 与 Intel (`x64`) 的 DMG/ZIP。也可单独构建：

```bash
npm run build:mac:arm64
npm run build:mac:x64
npm run build:mac:dir
```

## macOS 适配内容

- 主窗口继续使用原有透明无边框界面和自定义控制按钮。
- 动态桌面使用 Electron 的 macOS `desktop` 窗口类型，位于桌面背景层。
- 桌面歌词使用 `panel` 类型，可跨 Space 和全屏应用显示。
- 桌面歌词锁定后的中键解锁由随包附带的原生辅助进程处理。
- Windows D3D11/WorkerW/PowerShell 专属逻辑仅在 Windows 启用。
- 更新检查会在 macOS 上优先选择与当前 CPU 架构匹配的 DMG，其次选择 ZIP。
- 节拍缓存改为应用用户数据目录，不再使用 `D:\MineradioCache`。
- 增加 ICNS 图标生成、DMG/ZIP 打包、Intel/Apple Silicon 构建和 GitHub Actions。

## 本地未签名构建

自己编译的应用首次打开时可在 Finder 中右键应用并选择“打开”。不要全局关闭 Gatekeeper。

正式分发应使用 Developer ID Application 证书签名并完成 Apple 公证。GitHub Actions 工作流支持这些 secrets：

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

## 输入监控权限

桌面歌词在“锁定/鼠标穿透”状态下使用全局中键监听。部分 macOS 版本可能要求在“系统设置 → 隐私与安全性 → 输入监控”中允许 Mineradio；播放器主体不依赖该权限。

## 授权

上游代码使用 GPL-3.0。修改版分发时必须继续遵守 GPL-3.0，并保留版权与源码提供义务。`Mineradio` 名称、Logo 和原创视觉表达还涉及上游作者声明的独立权利；公开发布同名构建前应取得作者许可。
