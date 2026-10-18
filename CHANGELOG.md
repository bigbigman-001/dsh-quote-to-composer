# Changelog

遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## 0.9.2

- README 重写：下载表（Windows / macOS / tgz）、分平台安装步骤、用法、FAQ、兼容性、开发者说明
- 新增 `docs/INSTALL-windows.md`，`docs/INSTALL-macOS.md` 同步更新
- `package.json` 的 `files` 补上截图、`screenshots.json` 与安装说明
- 交互逻辑不变

## 0.9.1

- `.dqc-chip` 背景在 `color-mix()` 前加纯色兜底，兼容较旧的 Chromium
- 无交互变化

## 0.9.0

- 包名从 `@local/dsh-quote-to-composer` 改为 `dsh-quote-to-composer`，去掉 `private`，
  补齐 `license` / `repository` / `homepage` / `bugs` / `keywords` / `engines`
- 新增 `LICENSE`（MIT）、英文 README、商店截图与 `screenshots.json`
- 新增 `scripts/publish.ps1`（自动写仓库字段、提交、推送）与 `docs/PUBLISH.md`

## 0.8.2

- 引用空行写进芯片的 `clipboardText`（`serializeQuote()`），不再插入后补空行：
  连续插入两条引用时不再多出空白行，追问也不会被 Markdown 懒续行吞进引用块
- 悬停卡片去掉尾部空行

## 0.8.1

- 审查修复：`occurrences` 与芯片对齐、去掉会错标的 `data-dqc-quote`、悬停不再叠加原生 `title`、
  快捷键只在真的插入成功后才吞掉按键

## 0.8.0

- 引用改为输入框里的**迷你引用条**（21px 灰底圆角、12px 字），悬停浮出深色卡片显示被引用全文
- 恢复芯片插入路径（`insertReference` → `ReferenceChipNode`），失败才回退纯文本

## 0.7.0

- 引用以 `> 引用` 普通文本插入，不再出现引用框

## 0.6.0

- 浮动胶囊改为深色 tooltip 风格、全圆角、28px 高、浅蓝引号图标
- 文案缩短为「引用」，完整说明放进 `title` / `aria-label`

## 0.5.0

- 胶囊出现在鼠标右下方（靠近边缘自动翻转），`Esc` / 滚动 / 点击别处收起

## 0.4.0

- 去掉常驻按钮式入口，改为鼠标选区驱动 + 快捷键 `Ctrl+Shift+Q`

## 0.3.1

- 注册 `source: 'quote'` 的序列化 owner（否则发送时会报
  `slash: no serializer for reference source "quote"`）

## 0.3.0

- 首次实现引用芯片 + 发送后的引用卡片渲染

## 0.1.0 – 0.2.0

- 早期探索：助手消息动作行上的「引用到输入框」按钮；后续改为选区/浮动胶囊方案
