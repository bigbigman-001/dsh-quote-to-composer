# 在 macOS 上安装 dsh-quote-to-composer

这个插件只改浏览器端的界面，不碰宿主进程，所以在 Mac 上直接装即可。
需要的是这台 Mac 上已经能用的 DeepSeek Harness（桌面 App 或 `dsh web` 都行）。

两种装法，任选一种。

## 方式 A：装 `.tgz` 压缩包（推荐，一步）

1. 把 `dsh-quote-to-composer-0.9.1.tgz` 传到 Mac，例如放到 `~/Downloads`。
2. 打开 DSH → 左侧栏 **插件** → **添加插件**。
3. 在输入框里填**绝对路径**（把 `你的用户名` 换成实际用户名）：

   ```
   /Users/你的用户名/Downloads/dsh-quote-to-composer-0.9.1.tgz
   ```

4. 点 **安装**，等提示成功后 **刷新页面**（⌘R）。

## 方式 B：解压后按目录安装

1. 双击 `dsh-quote-to-composer-0.9.1.zip` 解压，得到一个文件夹。
2. 把文件夹放到固定位置，例如 `~/Documents/dsh-quote-to-composer`。
3. DSH → **插件** → **添加插件**，填这个目录的绝对路径：

   ```
   /Users/你的用户名/Documents/dsh-quote-to-composer
   ```

4. **安装** → **刷新页面**。

方式 B 的好处：以后改插件文件不用重新安装，刷新页面就生效。

## 方式 C：命令行（和上面等价）

```sh
dsh plugin --profile desktop add /Users/你的用户名/Downloads/dsh-quote-to-composer-0.9.1.tgz
```

`--profile` 后面换成你实际用的 profile 名（桌面 App 通常就是 `desktop`）。
装完在 DSH 里 ⌘R 刷新。

## 装好之后怎么用

1. 在任意回复、代码块、表格里**用鼠标选中一段文字**，松开鼠标。
2. 指针右下方会出现一个深色胶囊「引用」，点它。
   - 也可以按 **`Ctrl+Shift+Q`**（Mac 上也是 Ctrl；`Cmd+Shift+Q` 是系统注销，故意不用）。
   - 每条助手回复的动作行里还有「引用这条回复」，一次引用整条。
3. 输入框里会出现一条灰底圆角的迷你「引用」条 —— **鼠标悬停**它能看被引用的全文。
4. 接着输入你的问题，一起发出去；发出的消息里引用会渲染成一张引用卡片。

## 卸载

插件页里关掉开关即可停用；彻底移除：

```sh
dsh plugin --profile desktop remove dsh-quote-to-composer
```

## 已知小边界

- 装完必须刷新一次页面，客户端模块才会加载。
- 引用条只在「输入框」里显示；发出的消息里由同一插件的渲染规则变成引用卡片。
- 如果某次插入失败（比如正好在发送中），会退化成纯文本 `> …` 插入，功能不受影响。
- 插件不支持 `Cmd+Shift+Q`（macOS 上是注销快捷键），请用 `Ctrl+Shift+Q`。

## 文件清单

```
dsh-quote-to-composer-0.9.1.tgz   插件压缩包（方式 A / C 用）
dsh-quote-to-composer-0.9.1.zip   解压即用的目录（方式 B 用）
INSTALL-macOS.md                  本说明
```
