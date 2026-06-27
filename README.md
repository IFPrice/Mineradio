# Mineradio

Mineradio 是一款桌面沉浸式音乐播放器，把天气电台、搜索播放、歌词舞台、粒子视觉和 3D 歌单架组合成一个更接近现场感的私人音乐空间。

1.1.1 在 1.1.0 纯净安装版基础上补齐 macOS 适配：保留原有视觉层与本地服务，增加 macOS 打包、桌面背景层、桌面歌词窗口层级、中键解锁辅助进程、架构匹配更新资产选择和 Apple Silicon / Intel 构建支持。

## 当前版本

当前版本：`1.1.1`

状态：1.1.1 macOS 适配版。

> 安全提示：`v1.0.10` 及更早旧安装包不再建议继续安装或传播，请先隔离旧安装包。本次不提供从 `v1.0.10` 到 `v1.1.0` 的软件内本地更新，请在 GitHub Release 页面手动下载 `v1.1.0` 安装包进行纯净安装。

## 核心特性

- Open-Meteo 天气电台，根据当前位置、城市和天气 mood 生成更合适的播放队列
- 首页包含天气电台、每日推荐、私人电台、继续听、听歌画像和我的歌单入口
- Wallpaper 银河首页背景，未播放状态保持干净的星河氛围
- 播放后切换到 Emily / 默认播放态视觉，歌词舞台与粒子舞台同步工作
- 基于节奏的电影镜头视觉系统
- 面向长播客和 DJ 曲目的专属视觉模式
- 歌词舞台、自定义歌词、歌词位置与视觉控制
- 自定义专辑封面上传与裁剪
- 右键唤起 3D 歌单架，支持歌单队列浏览
- 网易云音乐账号、搜索、歌单、播客等体验接入
- QQ 音乐搜索、登录态与音源补充接入
- GitHub Releases 更新检测与下载入口
- 首次启动内置「默认测试」视觉用户存档，软件内默认视觉参数与该存档一致

## 使用说明

Windows 和 macOS 用户可以在 GitHub Releases 中下载对应平台的安装包。

Windows 正式分发以 Release 资产中的 `Mineradio-*-Setup.exe` 为准，不建议直接下载 `win-unpacked` 目录作为正式分发包。安装包会创建桌面快捷方式；直接运行打包版 `Mineradio.exe` 时，应用也会在首次启动时补创建桌面快捷方式。

macOS 构建资产使用 `Mineradio-1.1.1-mac-arm64.dmg`、`Mineradio-1.1.1-mac-x64.dmg` 或对应 ZIP。未签名的本地构建首次打开时，可在 Finder 中右键应用并选择“打开”。更完整的 macOS 构建、权限和分发说明见 [README_MAC.md](./README_MAC.md)。

`v1.1.0` 不作为 `v1.0.10` 的软件内自动更新包发布。已经安装过旧版本的用户，建议卸载旧版本、隔离旧安装包后，再使用新版安装包纯净安装。

## 开发运行

```bash
npm install
npm start
npm run build:win
npm run build:mac
```

桌面版入口由 Electron 主进程加载本地服务。`npm run build:win` 会生成 Windows NSIS 安装包；`npm run build:mac` 会先准备 macOS 原生辅助文件，再生成 DMG/ZIP，产物位于 `dist/`。

## macOS 适配

- 主窗口继续使用原有透明无边框界面和自定义控制按钮。
- 动态桌面使用 Electron 的 macOS `desktop` 窗口类型，位于桌面背景层。
- 桌面歌词使用 `panel` 类型，可跨 Space 和全屏应用显示。
- 桌面歌词锁定后的中键解锁由随包附带的原生辅助进程处理。
- 更新检查会在 macOS 上优先选择与当前 CPU 架构匹配的 DMG，其次选择 ZIP。
- Windows D3D11、WorkerW、PowerShell 和固定磁盘缓存等平台专属逻辑仅在 Windows 启用。

## 更新机制

Mineradio 会请求 GitHub Releases latest 检测新版本。远端版本高于本地版本时，应用内更新入口会展示 Release 内容、下载安装包到本机用户数据目录，并通过系统打开安装包。

本地验证更新链路时，可以通过 `MINERADIO_UPDATE_MANIFEST` 指向一个本地 manifest JSON 或 HTTP 地址来模拟线上 Release。

## 第三方音乐平台说明

Mineradio 不是网易云音乐、QQ 音乐或腾讯音乐娱乐集团的官方客户端，也不隶属于任何音乐平台。

项目中的第三方平台接入仅用于个人学习、本地客户端体验和用户自有账号的播放辅助。请遵守对应平台的用户协议、版权规则和会员权益规则。项目不会提供绕过付费、绕过会员、破解音质或重新分发音乐内容的能力。

## 用户数据与隐私

登录 Cookie、搜索历史、自定义封面、自定义歌词、节奏分析缓存等数据只应保存在本机用户数据目录或浏览器本地存储中，不应提交到仓库。

更多说明见 [PRIVACY.md](./PRIVACY.md)。

## 作者支持

如果 Mineradio 陪你多听了一首歌，也欢迎请作者一杯咖啡。

[查看完整支持页](./docs/SUPPORT.md)

![Mineradio 作者支持渠道](./docs/assets/support/mineradio-author-support-poster.png)

## 致谢

Mineradio 由 XxHuberrr 主要设计与打造。emily 作为早期视觉底层想法与 `emily` 视觉预设改进方向的共创者和灵感来源之一，特此感谢。

同时感谢小天才e宝、应春日、锋将军、軌跡、林中、骊、风痕、花椰菜🥦在早期体验、测试反馈和发布准备中的帮助。

## 版权与授权

Copyright (C) 2026 XxHuberrr.

本项目采用 GPL-3.0 授权。详见 [LICENSE](./LICENSE)。

MR Logo、Mineradio 名称、界面视觉设计与原创视觉表达归作者所有；第三方依赖和第三方服务分别遵循其各自授权与服务条款。
