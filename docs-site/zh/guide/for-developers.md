---
title: 在引擎盖下
description: Deepsand 背后的架构、隔离、权限流、网络和命令行工具。
---

# 在引擎盖下

此页面适用于想要了解系统技术形态的开发人员。如果您正在寻找通俗易懂的语言解释，请从 [Deepsand是什么？](./what-is-deepsand) 开始。

## 建筑学

Deepsand 是一个 Tauri 桌面应用程序，具有三个主要层：

- **窗户** 是一个 SolidJS 接口。它呈现状态并发送意图；它不决定政策。
- **金牛座层** 公开桌面命令并将相同的命令表面转换为远程客户端的环回 HTTP 服务器。
- **`deepsand-core`** 拥有规则。路径验证、`docker run` 计划、权限代理、出口代理、加密秘密存储和状态存储都位于此处。

桌面应用程序和命令行驱动程序 `deepsandctl` 使用相同的内核，因此它们不会在安全决策上出现分歧。

## 一个项目，一个容器

每个项目都有自己的 Docker 容器和自己的状态卷。工程目录挂载在`/workspace`；其他主机目录需要显式授予。

`policy::plan_run` 在一个地方构建完整的 `docker run` argv。 “活动”选项卡显示确切的计划，包括安装、功能、网络模式和只读路径。

容器被故意约束：

- 根文件系统是只读的，具有 `/tmp` 和 `/run` 大小的 tmpfs 挂载。
- 响应假脱机和状态目录以只读方式安装。
- 容器运行时套接字按名称拒绝。
- 在 DeepCode 运行之前删除功能，并设置 `no-new-privileges`。
- 容器运行时套接字和其他禁止的安装无法关闭，而不是产生较弱的计划。

## 权限

沙箱可以请求更多访问权限，但无法授予它。将权限请求写入假脱机；主机代理验证它并暂停容器。操作员看到请求并做出决定。

批准目录请求会使用新的绑定安装重新创建容器并恢复会话。拒绝是最终决定，并将报告给模型。

对沙箱已有内容的请求会被拒绝并给出解释。没有自动批准路径，因为静默批准将意味着操作员从未给予同意。

## 联网

网络策略有四种模式：

|模式|行为 |
| --- | --- |
| `none` |仅通过 Deepsand 出口代理的模型端点。 |
| `allowlisted` |模型端点、代理以及命名主机、地址和端口。 |
| `internet` |互联网访问，本地和私有范围被阻止在容器内。 |
| `full` |不受本地网络限制的互联网访问。 |

主机名条目由代理解析，代理拒绝私有、环回、链接本地和保留结果。地址条目由容器直接强制执行，这使得数据库客户端或其他非 HTTP 程序可以进行连接。命名端口仅在主机环回上发布。

## 秘密和更新





## 命令行

`deepsandctl` 提供无头表面：

```bash
deepsandctl doctor
deepsandctl plan <project> --offline
deepsandctl run <project>
deepsandctl watch <project>
deepsandctl requests <project>
deepsandctl network <project> <mode>
```



## 阅读更多

- [完整的安全模型](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md)
- [架构笔记](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md)
- [沙箱如何工作](./security)
