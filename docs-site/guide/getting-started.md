---
title: Getting started
description: Install Deepsand, create your first project, and run its sandbox.
---

# Getting started

Deepsand helps you work with an AI coding assistant on a real project without giving that assistant access to the rest of your computer. You do not need to understand Docker or the command line to use the basic flow.

If you want the bigger picture first, read [What is Deepsand?](./what-is-deepsand).

## Requirements

- Docker Desktop on Windows or macOS, or Docker Engine on Linux.
- A Windows, macOS or Linux computer. The [downloads page](../download) detects the system and lists the matching installers.
- No Node.js or Rust installation is needed unless you are building Deepsand from source.

Docker Desktop must be running before Deepsand can start a sandbox. If the daemon is still starting, the status strip says so and offers to check again. Docker Desktop can also be running but unresponsive; if Deepsand says the daemon is not answering, restart Docker Desktop. When Deepsand detects Docker Desktop it shows a **Restart Docker Desktop…** control. See [what to do if Docker Desktop is not running or has stopped responding](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).

## Install

Open the [Deepsand downloads page](../download). It detects your operating system and lists the latest Windows, macOS and Linux installers from the current GitHub release. Choose the package for your computer, install it, then start Deepsand.

If you are developing Deepsand itself, the repository README has the source-build and hot-reload commands.

## First run

You do not need DeepCode installed or configured before using Deepsand. Deepsand runs DeepCode inside the sandbox and comes with sensible defaults for the model and endpoint.

The one thing you need is a model API key. The next section explains how to get a DeepSeek key, or you can use a key from another provider. Save it in **Settings → API key**.

If you already use the DeepCode CLI on this computer, Deepsand can instead inherit the model, base URL and key from your existing DeepCode configuration. A project can also override those credentials in its own settings.

## Get an API key

Deepsand needs an API key from a model provider before the assistant can run.

- **If you do not have one:** follow [Get a DeepSeek API key](./deepseek-api). It walks through creating an account, adding credit, making a key and coming back to Deepsand.
- **If you already have one:** open **Settings**, paste it into the **API key** field and select **Save key**.
- **If you want a project-specific key:** open that project's settings and enter it there instead.

The app-wide key is kept in your operating system's keystore, not in Deepsand's state file. The window only shows the last four characters after saving.

## Create a project

1. Select **New project** in the sidebar.
2. Give the project a name.
3. Choose the working directory.
4. Create the project.

The working directory becomes `/workspace` inside the sandbox. Deepsand refuses paths such as the filesystem root, your home directory, credential stores and its own data directory.

## Choose a model

Use a **flash model** for most tasks. Deepsand defaults to `deepseek-v4-flash`, which is the cheaper choice for everyday coding, explanations and edits. Switch to `deepseek-v4-pro` only when flash is clearly struggling with a task; the pro model costs more to run.

You can change the model in **Settings**, from the project header, or with `/model` in the DeepCode terminal.

## Choose a thinking level

The thinking slider is next to the model selector in the project header. It controls how much reasoning the model does before answering.

- **Off:** no thinking. Fastest, but the least careful.
- **Quick:** a little thinking, for small well-specified edits.
- **Balanced:** moderate thinking and the middle stop. This is the sensible default for real work.
- **Deep:** maximum reasoning. Slowest and most expensive.
- **Default:** defer to the host `settings.json`; if it says nothing, DeepCode falls back to Balanced.

Keep the slider on **Balanced** for most tasks. It gives good results without paying for the slowest, most expensive reasoning on every request. Use **Deep** only for genuinely difficult problems, and **Off** or **Quick** for small, predictable edits.

## Run a project

1. Select the project.
2. Press **Run**.
3. If the image is missing, Deepsand builds it first and shows the build output in the Activity tab.
4. The DeepCode CLI starts inside the container and appears in the terminal.

Stopping the sandbox ends the container. Starting it again resumes the previous DeepCode session when one exists.

## Using the DeepCode terminal

The **Terminal** tab is the live DeepCode CLI session. Type a request and press **Enter**, or use a slash command to control the session. `/new` starts a fresh conversation, `/resume` continues an earlier one, `/model` changes the model, and `/` opens the command menu.

Read [Using the DeepCode terminal](./deepcode-terminal) for the main commands, keyboard shortcuts and recovery steps.

## Answering permission requests

When DeepCode needs a directory, a network destination, a tool or another resource, Deepsand pauses the sandbox and shows the request.

- **Grant access** allows the request and resumes the session.
- **Deny** refuses it and tells the model the decision is final.
- A directory grant recreates the container with the new mount attached.

Read [How the sandbox works](./security) before granting access to a directory that contains sensitive files.

## Where to find things

| Area | What it shows |
| --- | --- |
| Terminal | The live DeepCode session inside the sandbox. |
| Permissions | Shared directories, the network allowlist and the audit trail. |
| Tools | Tools baked into the project image. Changing the selection rebuilds the image. |
| Secrets | Encrypted values injected as environment variables at start. |
| Activity | The exact `docker run` arguments, the build log and blocked egress attempts. |

## Next steps

- [How the sandbox works](./security)
- [Frequently asked questions](./faq)
