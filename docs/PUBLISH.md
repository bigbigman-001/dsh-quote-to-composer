# 发布指南：从零开始上架 dsh-market

本文按顺序做完，这个插件就能被任何人用 `dsh plugin add` 安装，并出现在 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 列表 / dsh-market 里。

全程分两段：

- **第一段（必须）**：把代码放到 GitHub —— 需要 GitHub 账号，约 15 分钟。
- **第二段（必须）**：往 awesome-dsh-plugin 提一个 PR（只加一个 YAML 文件），合并后上架。

发布到 npm 是**可选**的，只影响市场里是否显示下载量，不影响收录。

---

## 0. 先确认本地已经就绪

```powershell
git --version
```

本机已是 `git version 2.39.2.windows.1`。没有的话去 <https://git-scm.com/download/win> 装一个，一路默认即可。

仓库内容已经准备好：`package.json` 里有 `dsh.bundle.patch`、根目录有 `cordis.patch.yml`、有真实可运行的 `client.js`、`LICENSE`、中英文 README、两张截图、`screenshots.json`（市场详情页截图）。

---

## 1. 注册 GitHub 账号

1. 打开 <https://github.com/signup>。
2. 依次填：邮箱 → 密码（≥8 位，含数字或小写字母）→ 用户名（**只用字母、数字、连字符**，例如 `xiaoming`，这个用户名会出现在仓库地址里）。
3. 收邮件，填 6 位验证码。
4. 登录后如果弹问卷（team size / 用途），随便选或跳过。
5. 建议顺手开二次验证：右上头像 → Settings → Password and authentication → Two-factor authentication → 用手机 App（Authenticator / 微信小程序类 TOTP 工具均可）扫码。**不开也能发代码**，开了更安全。

> 用户名一旦定下就是仓库地址的一部分：`https://github.com/<用户名>/dsh-quote-to-composer`，后面所有命令都要用它。

---

## 2. 在 GitHub 上建空仓库

1. 打开 <https://github.com/new>。
2. **Repository name**：`dsh-quote-to-composer`（必须和插件包名一致）。
3. **Public**（保持选中；Private 无法被市场收录）。
4. **不要**勾 `Add a README file` / `.gitignore` / `license` —— 本地已经有这些文件，勾了会冲突。
5. 点 **Create repository**。下一个页面会显示几条命令，先放着，第 3 步用我们自己的命令。

---

## 3. 把本地代码推上去

在 PowerShell 里执行（把 `你的用户名` 换成第 1 步的用户名）：

```powershell
cd "D:\deepseek harness\plugins\dsh-quote-to-composer"

git init -b main
git add -A
git commit -m "feat: dsh-quote-to-composer 0.9.0 — quote selection into composer"

git remote add origin https://github.com/你的用户名/dsh-quote-to-composer.git
git push -u origin main
```

几个可能遇到的情况：

- **弹出一个浏览器窗口要求登录 GitHub** → 这是 Git Credential Manager（git 自带），点 `Sign in with your browser`，授权即可。之后都不用再登录。
- **`remote origin already exists`** → 说明之前加过，改用：
  ```powershell
  git remote set-url origin https://github.com/你的用户名/dsh-quote-to-composer.git
  ```
- **`src refspec main does not match any`** → 还没有提交，先确认 `git commit` 那步没报错（首次提交需要配置身份）：
  ```powershell
  git config --global user.name "你的名字"
  git config --global user.email "你的邮箱"
  ```
- **不想用浏览器登录** → 生成 Personal Access Token：GitHub 右上头像 → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → 勾 `repo` → 生成后把 token 当密码用（用户名填 GitHub 用户名）。
- **推送被墙/超时** → 重试一次；仍失败可给 git 设代理：
  ```powershell
  git config --global http.proxy http://127.0.0.1:7890   # 端口换成你自己的代理
  ```

推送成功后刷新仓库页面，应该能看到 `client.js`、`package.json`、`cordis.patch.yml`、`README.md` 等文件。

> 也可以直接用仓库里的脚本一把做完（会顺手补 `repository`/`homepage`/`bugs` 字段）：
> ```powershell
> powershell -ExecutionPolicy Bypass -File .\scripts\publish.ps1 -GitHubUser 你的用户名
> ```
>
> 脚本只做三件事：在本目录里 `git init` + 提交（会在插件目录生成 `.git`）、设置 `origin`、推送。
> **不会安装任何软件，也不会改你的全局 git 配置**——如果本机全局配置里有 GitHub 镜像改写（比如 `ghfast.top`），
> 脚本只在那一条推送命令上临时用一份空的 `GIT_CONFIG_GLOBAL` 绕开，你的 `~/.gitconfig` 原样不动；
> 直连失败时会自动回退到镜像再试一次。

---

## 4. 给仓库加 `dsh-plugin` topic

在仓库首页右侧 **About** 那一栏，点右边的齿轮 → **Topics** 输入 `dsh-plugin` → 回车 → **Save changes**。

这是 CI 的必检项，漏了会被打回。

---

## 5. 等满 1 天

CI 会检查**仓库创建时间 ≥ 24 小时**，这是硬门槛（防止 PR 前几分钟才建的仓库）。

仓库刚建好就先放着，第二天再提 PR。期间可以继续改代码、补截图，push 上去即可。

---

## 6. 向 awesome-dsh-plugin 提 PR（只加一个文件）

1. Fork：打开 <https://github.com/awesome-dsh-plugin/awesome-dsh-plugin> → 右上 **Fork** → **Create fork**（默认配置即可）。
2. 在你自己的 fork 里进入 `data/plugins/` 目录 → **Add file** → **Create new file**。
3. 文件名（区分大小写，双下划线）：

   ```
   <你的GitHub用户名>__dsh-quote-to-composer.yml
   ```

   例如用户名是 `xiaoming`，文件名就是 `xiaoming__dsh-quote-to-composer.yml`。

4. 内容（**把 `OWNER` 全部换成你的用户名**）：

   ```yaml
   url: https://github.com/OWNER/dsh-quote-to-composer
   name: OWNER/dsh-quote-to-composer
   category: ui
   description:
     en: 'Select text anywhere in DeepSeek Harness, click the quote pill next to the pointer, and the selection lands in the composer as a small quote chip; hover the chip to read the full quote.'
     zh: '在 DeepSeek Harness 里选中文字，点鼠标旁的「引用」胶囊，选区就变成输入框里的迷你引用条；悬停引用条可看被引用全文。'
   ```

   仓库里也存了一份：`docs/awesome-dsh-plugin-entry.yml`。

5. 底部 **Commit changes** → 直接提交到 `main`。
6. 回到 fork 首页，会看到 **Compare & pull request** 横幅 → 点它；标题写 `Add dsh-quote-to-composer`，描述一句话即可 → **Create pull request**。

### 写作规则（避免被打回）

- `url` 必须和仓库地址**完全一致**；`name` 是 `用户名/仓库名`。
- **只有 `description.en` 必填**，`zh` 可以不写（维护者会补）。
- 描述里含 `: `（英文冒号+空格）**必须整体加引号**，否则 YAML 解析失败（上面模板已经加了）。
- 描述只写功能，不写"最强/最好用"这类词，且必须与代码相符（维护者会读代码核对）。
- `category` 用 `ui`（UI 增强）。可选值：`agi` `ui` `usage` `theme` `model` `identity` `session` `memory` `tools` `wsl` `browser` `vision` `voice` `docs` `skill` `workflow` `git` `notify` `dev` `security` `remote` `market` `fun`。选得不准维护者会改，不会打回。
- 一个 PR 最多 3 条条目。
- 不要手工改 `README.md` / `README.zh.md` —— 它们由脚本从 `data/plugins/*.yml` 生成。

---

## 7. 等 CI

PR 上会自动跑检查，顺序是：条目数量 → `dsh.bundle` → 仓库年龄 → awesome-lint/站点构建。任何一项失败都会说明要改什么，**在同一分支继续 push 修复即可，不用重开 PR**。

常见失败原因：

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `dsh.bundle` 检查失败 | `package.json` 只有 `dsh.client` | 本仓库两者都有，一般不会触发；确认 `dsh.bundle.patch` 没被改掉 |
| 仓库年龄不足 | 仓库未满 1 天 | 等够 24 小时再 push |
| awesome-lint 报错 | YAML 格式/引号/文件名不对 | 按报错改那一行 |
| 被要求补 topic | 漏加 `dsh-plugin` | 见第 4 步 |

CI 变绿后由维护者人工 review 代码，然后合并。合并后 `main` 上的 README 会自动重新生成，你的条目就出现在列表里了。

---

## 8. 上架之后别人怎么装

```powershell
dsh plugin --profile desktop add github:你的用户名/dsh-quote-to-composer
```

自己本机也要从 `link:` 换成 GitHub 安装的话，先移除本地条目再装：

```powershell
dsh plugin --profile desktop remove dsh-quote-to-composer
dsh plugin --profile desktop add github:你的用户名/dsh-quote-to-composer
```

---

## 9.（可选）发布到 npm

只影响市场里是否显示下载量，不影响收录。

```powershell
npm login          # 第一次会让你在浏览器里授权
npm publish        # 包名 dsh-quote-to-composer 已确认未被占用
```

发布前确保 `package.json` 的 `repository` 字段指回 GitHub 仓库（第 3 步的 `publish.ps1` 会自动写），否则 npm 包和仓库不会关联。以后更新：

```powershell
npm version patch   # 或 minor / major
npm publish
```

---

## 10. 以后更新版本

1. 改代码，把 `package.json` 的 `version` 加一（例如 `0.9.1`）。
2. `git add -A; git commit -m "fix: ..."; git push`。
3. 只想改商店里那一行描述 → 回到第 6 步，编辑你那个 YAML 文件再提一个 PR（同样只动你自己的文件）。

---

## 附：本次发布前的清单

- [x] `package.json` 含 `dsh.bundle.patch` 与 `dsh.client`
- [x] 根目录有 `cordis.patch.yml`
- [x] 包名 `dsh-quote-to-composer`（npm 上未被占用）
- [x] 去掉 `private: true`，补 `license: MIT`
- [x] `LICENSE`、`README.md`、`README.en.md`
- [x] `docs/screenshot-pill.png`、`docs/screenshot-chip.png` + `screenshots.json`
- [ ] 建 GitHub 仓库并推送（第 1–3 步）
- [ ] 加 `dsh-plugin` topic（第 4 步）
- [ ] 等满 24 小时（第 5 步）
- [ ] 提 PR（第 6 步）
