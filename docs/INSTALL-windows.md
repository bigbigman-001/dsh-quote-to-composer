# 在 Windows 上安装 dsh-quote-to-composer

这个插件只改浏览器端的界面，不碰宿主进程，不需要管理员权限，也不用关杀毒。
前提：这台 Windows 上已经能正常打开 DeepSeek Harness 桌面 App。

三种装法，任选一种。

## 方式 A（推荐）：在 DSH 里点几下，不用命令行

1. 打开 DSH，左侧点 **插件**
2. 右上角点 **添加插件**
3. 输入框里填：

   ```
   github:bigbigman-001/dsh-quote-to-composer
   ```

   网络慢就勾上对话框里的「中国大陆镜像源」再装。
4. 点 **安装**，然后刷新页面（F5 或 Ctrl+R）

## 方式 B：下载本页附带的 zip，解压后按目录安装

1. 下载 `dsh-quote-to-composer-0.9.2-windows.zip`，右键 → 全部解压，得到 `dsh-quote-to-composer` 文件夹
2. 把文件夹放到一个固定位置，例如 `D:\plugins\dsh-quote-to-composer`（**路径不要太深、不要放中文路径**更稳妥）
3. DSH → **插件** → **添加插件**，填这个目录的路径：

   ```
   D:\plugins\dsh-quote-to-composer
   ```

4. **安装** → 刷新页面

> 方式 B 的好处：以后更新插件，换掉文件夹内容、刷新页面就行，不用重新安装。

## 方式 C：命令行（和上面等价，需要 `dsh` CLI 可用）

```powershell
dsh plugin --profile desktop add github:bigbigman-001/dsh-quote-to-composer
```

或装本地目录：

```powershell
dsh plugin --profile desktop add D:\plugins\dsh-quote-to-composer
```

`--profile` 后面换成你实际用的 profile 名（桌面 App 通常就是 `desktop`）。装完刷新页面。

## 装好之后怎么用

1. 在任意回复、代码块、表格里**用鼠标选中一段文字**，松开鼠标
2. 指针右下方出现深色胶囊「引用」，点它
   - 也可以按 **`Ctrl+Shift+Q`**
   - 每条助手回复的动作行里还有「引用这条回复」，一次引用整条
3. 输入框里出现灰底圆角的迷你「引用」条，**鼠标悬停**能看被引用的全文
4. 接着写你的问题，一起发出去；发出的消息里引用会渲染成一张引用卡片

## 卸载 / 停用

- 停用：插件页里把它的开关关掉，刷新页面即可
- 彻底移除：插件页 → 已安装插件 → `dsh-quote-to-composer` → 卸载

## 已知小边界

- 装完必须刷新一次页面，客户端模块才会加载
- 引用条只在**输入框**里显示；发出后由同一插件的渲染规则变成引用卡片
- 如果某次插入失败（比如正好卡在发送中），会退化成纯文本 `> …` 插入，功能不受影响
- 插件的快捷键监听在整个页面上（只在真的选中了文字时才生效）

## 这个包里有什么

```
dsh-quote-to-composer/     插件本体（package.json、client.js、cordis.patch.yml …）
INSTALL-windows.md         本说明
```

插件是纯前端代码，**Windows / macOS 用的是完全相同的文件**，两个平台的包只是附带说明不同。
