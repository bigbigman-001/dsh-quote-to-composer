# Changelog

遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## 0.9.8

- 结构精简（行为不变）：
  - 浮动胶囊改名 `pill`（此前叫 chip，和输入框里的引用芯片同名混用，
    是最容易写出 bug 的命名）；CSS 类名保持 `.dqc-chip` 不变
  - 两处重复的触发源注册合并为 `registerSourceSafe()`；插槽注册合并为 `slotInject()`
  - 样式表改为可读的模板字符串；逐条与 0.9.7 的 CSS 做过等价比对（唯一差异见下条）
  - 压制核心“引用文本”按钮只保留一个机制（JS 内联 !important + MutationObserver），
    删掉样式表里的重复规则
- 已验证：node --check 通过；CSS 规范化后与旧版逐条相等

## 0.9.7

- 代码清理（无行为变化）：移除调试期的版本号标记（pill 提示文字、console 日志）
- 样式表与 JS 压制改用同一个 `CORE_QUOTE_SELECTOR` 常量，不再两处手写选择器
- 移除只对 <0.2.2 旧主机生效、现已不可能走到的死分支：
  `uiConversation.events` 注册表回退、`QuoteBlock` 读摊平 props 的旧路径
  （`engines.dsh` 已锁 `>=0.2.2-rc.1 <0.3.0`，旧主机装不上）
- 注释与 0.2.2 实际契约逐条同步（规则 order、节点渲染器入参、注册表归属）

## 0.9.6

- 核心“引用文本”按钮的隐藏不再只靠样式表：改用 JS 直接给按钮/容器打内联
  `display:none!important`（内联 !important 压过任何样式表），并用
  MutationObserver 在 DOM 变化时重新压制，杜绝样式加载顺序导致的漏网
- 小条提示文字带上插件版本号（`v0.9.6`）：看不到版本号 = 页面还在跑旧缓存

## 0.9.5

- 修复选区同时出现两个引用框：隐藏核心 `message-quotes` 的“引用文本”按钮
  （`[data-text-interaction-surface]` 容器 + aria-label 兜底，双保险）
- 版本号升 0.9.5：强制宿主重新加载 client.js，避免模块缓存吃旧代码

## 0.9.4

适配 DSH 0.2.2（该版本核心自带了 `message-quotes`，抢占了文本规则 id `quote`，
旧版注册时抛 "user-text rule "quote" is already registered"，把整个 web 端启动带崩）：

- 规则 / 触发源 / 插槽 key 从 `quote` 改名为 `quoteToComposer`，并新增 `quote` 别名注册：
  ≤0.9.2 存的旧草稿里的旧芯片也能重新挂上 codec，不再报
  `no serializer for reference source "quote"`
- 文本规则 `order` 从 20 改为 -20：0.2.2 规则按 order 升序先到先得，核心引用规则是 -10，
  必须排到它前面才能继续渲染我们自己的小卡片
- 规则 `match` 返回值补上 `id/start/end/data`（0.2.2 的候选校验要求 `node.id === rule.id`）；
  节点渲染器改收 `{node, raw, interactive}`，引用文本读 `node.data.raw`（兼容旧版摊平的 props）
- 触发源注册改为同步 try/catch：旧版 `ctx.effect` 里的 "already registered" 抛出会崩启动
- 芯片 CSS / DOM 查询同步改名，并兼容 `quote` 旧属性值
- 隐藏核心 `message-quotes` 在选区上自带的“引用文本”按钮（`[data-text-interaction-surface]`），
  避免和本插件的悬浮小条同时出现、选一次文字冒出两个引用框

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
