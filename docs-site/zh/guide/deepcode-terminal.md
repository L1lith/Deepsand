---
title: 使用 DeepCode 终端
description: 如何在Deepsand中使用DeepCode CLI，它的主要斜杠命令和键盘快捷键。
---

# 使用 DeepCode 终端

Deepsand 在沙箱内运行 [DeepCode CLI](https://github.com/lessweb/deepcode-cli)。 **终端** 选项卡是实时 DeepCode 会话：以普通语言键入请求，或使用 DeepCode 的斜杠命令之一来控制会话。

您没有在自己的机器上安装 DeepCode。 Deepsand 在项目容器中启动 CLI，它可以在其中看到 `/workspace` 和您共享的目录。

了解有关 [DeepCode项目主页](https://deepcode.vegamo.cn/) 或 [DeepCode 存储库](https://github.com/lessweb/deepcode-cli) 的更多信息。

## 开始会话

1. 在侧栏中选择一个项目。
2. 按 **跑步**。
3. 等待沙箱启动。如果映像丢失，Deepsand 首先构建它并在 **活动** 中显示构建输出。
4. 当 CLI 准备就绪时，会出现 DeepCode 端子。

停止沙箱会结束容器。再次启动项目会恢复之前的 DeepCode 对话（如果存在）。

## 要求 DeepCode 做某事

输入正常请求并按 **进入**。例如：

```text
Find the failing test in this project and explain what is wrong.
```

DeepCode 可以读取和编辑工作区中的文件、运行命令以及使用为项目选择的工具。您保持控制：当它需要工作区之外的东西时，Deepsand 会暂停沙箱并首先询问您。

## 主要斜杠命令

斜杠命令以 `/` 开头。单独键入 `/` 将打开命令菜单。

|命令 |它有什么作用 |
| --- | --- |
| `/new` |开始新的对话 |
| `/resume` |选择之前的对话继续 |
| `/fork` |分叉当前对话 |
| `/continue` |继续正在进行的对话，或选择一个来继续 |
| `/model` |切换模型、思维模式和推理力度 |
| `/raw` |切换显示模式：Normal、Lite 或 Raw 回滚 |
| `/init` |使用项目说明创建 `AGENTS.md` 文件 |
| `/skills` |列出DeepCode可用的技能|
| `/mcp` |显示 MCP 服务器状态和可用工具 |
| `/undo` |将代码、对话或两者恢复到较早的点 |
| `/exit` |退出 DeepCode |

一个项目可能已经有一个`AGENTS.md`；使用 `/init` 之前进行检查，以免替换已有的指令。

## 键盘快捷键

|关键|行动|
| --- | --- |
| `Enter` |发送提示 |
| `Shift+Enter` |插入换行符 |
| `Ctrl+J` |插入换行符 |
| `Esc` |中断当前模型转动|
| `Ctrl+V` |当所选型号支持图像时粘贴图像 |
| `Ctrl+D` 两次 |退出 DeepCode |

使用 `Esc` 中断转弯后，您可以键入另一个请求。沙箱未重新启动。

## 将文件放入终端

将文件拖到终端上，系统会为您输入其路径。

- 项目文件夹内或与项目共享的目录内的文件将被引用到沙箱已看到的位置（`/workspace/...` 或 `/grants/...`）。没有任何内容被复制。
- 来自其他地方的文件被复制到沙箱内的 `/tmp/deepsand-incoming` 中，Deepsand 首先询问。该文件夹不属于任何存储库，因此删除的文件不能最终提交，并且在重新创建沙箱时它会消失。该对话框有一个 **不要再警告我** 开关，其设置与 **设置 → 行为 → 从项目外部删除文件之前发出警告** 相同。

## 保持最新状态

DeepCode CLI安装在沙箱镜像内，沙箱无法自行更新。每次启动之前，Deepsand 都会询问 npm 最新版本是什么，如果映像有旧版本，则首先重建映像的该部分 - 因此终端永远不会在已经要求您更新的版本上打开。答案会被记住一刻钟，因此这是一个请求，而不是每次运行一个请求，如果无法到达 npm，沙箱将在其已有的版本上启动。

## 会话、模型和撤消

- `/new` 以干净的对话开始。项目文件不会被删除。
- `/resume` 和 `/continue` 带回之前的对话。
- `/model` 改变了会议的模型、思维方式和推理力度。项目标题还有一个模型选择器和一个思考滑块； **均衡** 是中间停止点，是大多数工作的推荐设置。
- `/undo` 将代码、对话或两者恢复到较早的点。这是退出您不想要的更改的最快方法。

对话历史记录位于项目的 Deepsand 状态卷中，而不是存储库中。

## 权限和沙箱

终端位于容器内部，因此它看到位于 `/workspace` 的项目和您明确共享的目录，而计算机上没有其他内容。

当 DeepCode 请求另一个目录、网络目标、工具或其他资源时，Deepsand 会冻结沙箱并显示权限对话框。

- **授予访问权限** 应用请求并恢复会话。
- **现在不要**这次拒绝了； DeepCode 稍后可能会再问。
- **不要再问** 拒绝​​它，然后 Deepsand 拒绝​​该路径（及其下的所有内容）或该主机（及其子域）本身，而不仅仅是口头上的。每个块都列在“权限”中，您可以在其中再次解除它。
- 批准目录会使用新装载重新创建容器。

在共享包含敏感文件的目录之前，请阅读 [沙箱如何工作](./security)。

## 如果终端没有启动

- **图像丢失：** Deepsand 首先构建它。观看 **活动** 了解构建进度。
- **Docker Desktop 未运行或卡住：** 启动并等待发动机完成启动。如果 Docker Desktop 正在运行但其引擎没有响应，请重新启动 Docker Desktop。当 Deepsand 显示时，使用应用内 **重启Docker Desktop…** 控件。否则，在Windows上右键单击通知区域中的Docker鲸鱼并选择**重新启动**；在 macOS 上使用 Docker 菜单栏图标；在Linux上打开Docker Desktop的**故障排除**菜单。重新启动 Docker Desktop 会结束机器上的每个容器。参见 [Docker 常见问题解答](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding)。
- **API 密钥丢失或被拒绝：** 打开 **设置** 并保存有效密钥。
- **DeepCode 退出：** 再次按 **跑步**。可以使用 `/resume` 恢复之前的会话。

## 相关页面

- [入门](./getting-started)
- [获取 DeepSeek API 密钥](./deepseek-api)
- [沙箱如何工作](./security)
- [DeepCode项目主页](https://deepcode.vegamo.cn/)
