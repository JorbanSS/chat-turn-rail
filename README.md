# Chat Turn Rail

简体中文 · [English](README.en.md)

为 ChatGPT 网页版的 **Chat 和 Work** 添加会话内轮次导航。悬停短线预览提问，点击跳回对应轮次，也可以从目录里搜索。

## 安装

1. 在 GitHub 仓库点击 **Code → Download ZIP**，或下载发布包，然后解压。
2. 在 Chrome 打开 `chrome://extensions`，开启「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择包含 `manifest.json` 的文件夹。
4. 刷新 ChatGPT 网页，打开一条已有至少两次提问的会话。

从旧版升级时，将新文件覆盖到 Chrome 原先加载的目录，再在扩展管理页点击 **Chat Turn Rail** 卡片上的「重新加载」，然后刷新 ChatGPT。

## 使用

- **预览和跳转** · 将鼠标移到正文右侧的短线上，预览那轮提问。点击短线可跳转。
- **搜索目录** · 点击导航条顶部的数字打开目录，输入关键词筛选。按 Enter 跳到第一个结果，按 Esc 关闭。
- **浏览更早的轮次** · 数字表示本次打开会话后已索引的提问数。已索引的轮次会保留在目录中，即使网页卸载了屏幕外的消息。点「滚到顶部查看更早消息」可以触发网页加载上一批历史。刷新或切换会话会重新索引。
- **设置透明背景** · 导航条底板和边框默认透明。可点击 Chrome 工具栏中的扩展图标切换，已保存的选择会保留。展开的目录和悬停预览使用实色背景。

导航条会跟随网页的浅色或深色主题。在 Work 分栏中，它会贴着聊天区。窄窗口会收起短线，保留数字入口。

## 权限与隐私

扩展只在 ChatGPT 网页上运行，从当前会话的页面内容读取提问，并在内存中建立索引。浏览器存储只保存透明背景偏好。扩展本身不发送网络请求。

## 开发

项目使用 Manifest V3 和原生 JavaScript，可直接加载仓库根目录。

| 文件 | 用途 |
| --- | --- |
| `manifest.json` | 注入范围、权限和工具栏入口 |
| `navigator.js` | 提问索引、跳转和目录交互 |
| `styles.js` | 导航条、目录和预览样式 |
| `defaults.js` | 页面和设置菜单共用的默认值 |
| `settings.html`、`settings.js` | 工具栏设置菜单 |

扩展依赖 ChatGPT 网页的消息结构，网站改版可能影响识别或跳转。当前验证覆盖 Chromium 中的模拟 Chat、Work 和虚拟滚动会话。

交互灵感来自 ChatGPT 网页版的长会话目录和 Codex 的轮次导航。Chat Turn Rail 是独立维护的 Chrome 扩展。[ChatGPT 更新日志](https://help.openai.com/en/articles/6825453-chatgpt-release-notes#june-8-2026)

## 许可证

[MIT](LICENSE)
