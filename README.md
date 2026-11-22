# Chat Turn Rail

简体中文 · [English](README.en.md) · [下载最新版](https://github.com/JorbanSS/chat-turn-rail/releases/latest)

为 ChatGPT 网页版 **Chat 和 Work** 添加轮次导航和公式复制。通过侧边导航预览、搜索和跳回提问，点击渲染后的公式即可复制 LaTeX 源码。

## 安装

1. 从 [GitHub Releases](https://github.com/JorbanSS/chat-turn-rail/releases) 下载 ZIP 并解压。也可以在仓库首页选择 **Code → Download ZIP**。
2. 在 Chrome 打开 `chrome://extensions`，开启「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择包含 `manifest.json` 的文件夹。
4. 刷新已打开的 ChatGPT 页面。

> [!TIP]
> 升级时，将新版文件解压到 Chrome 原先加载的目录。在扩展管理页点击 Chat Turn Rail 卡片上的「重新加载」，再刷新 ChatGPT。

## 使用

| 功能 | 操作 |
| --- | --- |
| 预览和跳转 | 悬停在对话右侧的短线上预览提问，点击跳到对应轮次。导航条在会话中有至少两次提问时出现。 |
| 搜索提问 | 点击导航条顶部的数字，输入关键词。按 Enter 跳到第一个结果，按 Esc 关闭目录。 |
| 查看更早的轮次 | 在目录中点击「滚到顶部查看更早消息」，让 ChatGPT 加载上一批历史。数字表示本次打开会话后已索引的提问数。 |
| 复制 LaTeX | 悬停在支持的行内或独立公式上会高亮并显示提示，点击即可复制源码。单轮会话也能使用。长公式可以在公式区域内横向滚动。 |
| 调整导航条背景 | 点击 Chrome 工具栏中的扩展图标，切换默认开启的「透明导航条背景」。 |

导航条会跟随页面主题，在 Work 分栏中贴着聊天区。窗口较窄时，可以通过数字按钮打开目录。

## 权限与隐私

扩展只在 ChatGPT 页面上运行，在内存中为当前会话的提问建立索引。点击公式时，LaTeX 会写入系统剪贴板。浏览器存储只保存导航条背景偏好。扩展本身不发送网络请求。

## 本地开发

项目使用 Manifest V3 和原生 JavaScript，可直接在 Chrome 加载项目根目录，无需构建。

- [`manifest.json`](manifest.json) 定义注入范围、版本和权限。
- [`navigator.js`](navigator.js) 和 [`styles.js`](styles.js) 负责轮次索引和导航界面。
- [`formula-copy.js`](formula-copy.js) 和 [`formula-copy.css`](formula-copy.css) 负责公式复制和提示。
- [`settings.html`](settings.html)、[`settings.js`](settings.js) 和 [`defaults.js`](defaults.js) 负责工具栏设置。

扩展依赖 ChatGPT 网页的消息与公式结构。遇到识别或布局问题时，可在 [GitHub Issues](https://github.com/JorbanSS/chat-turn-rail/issues) 反馈。

[MIT 许可证](LICENSE)
