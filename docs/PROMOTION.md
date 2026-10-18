# 推广清单（dsh-quote-to-composer）

目标：让 DSH 用户能顺手发现它。三个数字够看：**star 数、Release 下载量、市场卡片点击**。

## 一、最有效的一条：先上市场

DSH 内置的 **插件市场**（dshmarket）每次打开都实时拉 `https://awesome-dsh-plugin.com/plugins.json`，
也就是 `awesome-dsh-plugin` 仓库里的条目。**收录一次 = 同时出现在三个地方**：

- DSH 里的「插件」页市场卡片（带安装按钮、star 数、评论）
- 目录站 https://awesome-dsh-plugin.com
- https://dshmarket.com 的插件页

而且每个插件在 awesome 仓库里自动有一条 **GitHub Discussion**，卡片里的评论就是那条 discussion
（giscus 渲染），有人提问你会在 GitHub 收到通知。

**动作**：仓库满 24 小时后（2026-10-19 16:49 之后）提 PR，
内容取 [docs/awesome-dsh-plugin-entry.yml](awesome-dsh-plugin-entry.yml)：

1. Fork https://github.com/awesome-dsh-plugin/awesome-dsh-plugin
2. 在 fork 里新建 `data/plugins/bigbigman-001__dsh-quote-to-composer.yml`
3. 粘那六行 → `Create pull request`
4. 等 CI：仓库年龄 / `dsh.bundle` 声明 / awesome-lint

> 合并后通常一天内站点和市场都能看到。

## 二、GitHub 仓库本身（低投入高回报）

| 事项 | 现状 | 怎么做 |
| --- | --- | --- |
| `dsh-plugin` topic | ✅ 已加 | — |
| 更多 topic | 待加 | 仓库首页 About 齿轮 → 加 `deepseek`、`deepseek-harness`、`dsh`、`llm-plugin`、`productivity` |
| Social preview | 图已备好 | Settings → Social preview → 上传 [docs/social-preview.png](social-preview.png) |
| README 演示 | ✅ 已加 GIF | `docs/demo.gif`（2 秒，选中 → 胶囊 → 引用条） |
| Release 说明 | 有 | 以后每个版本写清楚「修了什么」，Release 页 SEO 权重高 |
| About 描述 | ✅ 中文一句 | 可再加一句英文，方便英文搜索 |

## 三、中文社区（按性价比排序）

**1. V2EX · 分享创造**（开发者密度最高，DSH 用户重叠度高）

> 标题：给 DeepSeek Harness 写了个小插件：选中任意文字，一键引用到输入框
>
> 正文：
> 用 DSH 的时候经常想指着某句话追问（「这句什么意思」「这段为什么报错」），
> 只能复制粘贴，还得自己加 `>`。
> 所以写了个插件：选中文字 → 鼠标旁边冒出「引用」→ 点一下变成输入框里的迷你引用条，
> 悬停能看全文，追问一起发出去。
> 纯前端、无原生依赖，Windows/macOS 通用，MIT。
> 仓库：https://github.com/bigbigman-001/dsh-quote-to-composer
> （附件放 demo.gif）

**2. 即刻 / 小红书**（非技术受众，靠 GIF 传播）

> 给 DeepSeek Harness 写了个插件，解决一个很小但很烦的事：
> 想指着某句话追问，以前得复制粘贴，现在选中 → 点「引用」→ 直接进输入框。
> 2 秒动图演示 👇

**3. 知乎 / 掘金**：写一篇实现向的文章，标题参考
《DSH 插件实战：在没有公开 API 的前提下，把「引用」做进输入框》
提纲：为什么需要 → DSH 的 slot/composer 机制 → Lexical 装饰节点做原子引用条 →
发送时序列化 `> ` 引用块 → 踩过的坑（draftRev 失配、Markdown 懒续行吞掉追问）。
**技术文是最长效的引流**，半年后还有人从搜索引擎进来。

**4. B 站 / 视频号**：30 秒录屏，标题「DSH 冷门插件推荐」，封面用 social-preview。

## 四、英文社区

**X / Twitter**：

> Wrote a tiny plugin for DeepSeek Harness: select any text in a reply, click the
> "Quote" pill next to your cursor, and it lands in the composer as a compact
> reference chip. Hover to read it, type your follow-up, send both.
> Pure front-end, MIT, Win/macOS. github.com/bigbigman-001/dsh-quote-to-composer

**Reddit**：r/DeepSeek（最相关）、r/LocalLLaMA（受众大但需真人语气，别像广告）。
标题：`[Plugin] Select text → quote chip in the composer for DeepSeek Harness`

**Show HN**（挑工作日上午，美西时间）：

> Show HN: Quote-to-composer plugin for DeepSeek Harness
> DeepSeek Harness doesn't have a built-in way to quote part of a reply into your
> next prompt, so I built one: select text, click the pill, it becomes an inline
> reference chip in the composer that serializes to Markdown when sent.
> Pure front-end plugin, no native deps.

**dev.to / Medium**：把上面那篇技术文翻成英文再发一次。

## 五、节奏建议

- **今晚**：GitHub 优化项（social preview、topics 补充）
- **明天 16:49 后**：提收录 PR（这是主线，其他都是支线）
- **合并后 1-2 天**：发 V2EX + 即刻，观察 24 小时反馈
- **本周末**：写技术文（知乎 + 掘金 + dev.to 三处），视频有空再录
- **之后**：每次版本更新发一条 X，Release 写清楚改动

## 六、能把「看到」变「装上」的几个细节

1. 市场卡片的第一印象是 README 首屏 —— 现在首屏就是 GIF + 一句话，够用
2. 安装路径要短 —— 市场卡片一键装；README 里三条命令并列，别让人找
3. 中文用户多，**中文 README 放主位**（现在是中文优先，正确）
4. 收到 issue 当天回，哪怕只说「在看」—— 早期项目口碑全靠这个
