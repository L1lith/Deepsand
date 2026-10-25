---
title: Using the DeepCode terminal
description: How to use the DeepCode CLI inside Deepsand, its main slash commands and keyboard shortcuts.
---

# Using the DeepCode terminal

Deepsand runs the [DeepCode CLI](https://github.com/lessweb/deepcode-cli) inside the sandbox. The **Terminal** tab is a live DeepCode session: type a request in normal language, or use one of DeepCode's slash commands to control the session.

You do not install DeepCode on your own machine. Deepsand starts the CLI in the project's container, where it can see `/workspace` and the directories you have shared.

Learn more on the [DeepCode project home page](https://deepcode.vegamo.cn/) or in the [DeepCode repository](https://github.com/lessweb/deepcode-cli).

## Start a session

1. Select a project in the sidebar.
2. Press **Run**.
3. Wait for the sandbox to start. If the image is missing, Deepsand builds it first and shows the build output in **Activity**.
4. The DeepCode terminal appears when the CLI is ready.

Stopping the sandbox ends the container. Starting the project again resumes the previous DeepCode conversation when one exists.

## Ask DeepCode to do something

Type a normal request and press **Enter**. For example:

```text
Find the failing test in this project and explain what is wrong.
```

DeepCode can read and edit files in the workspace, run commands, and use the tools selected for the project. You stay in control: when it needs something outside the workspace, Deepsand pauses the sandbox and asks you first.

## Main slash commands

Slash commands start with `/`. Typing `/` on its own opens the command menu.

| Command | What it does |
| --- | --- |
| `/new` | Start a fresh conversation |
| `/resume` | Choose a previous conversation to continue |
| `/fork` | Fork the current conversation |
| `/continue` | Continue the active conversation, or pick one to resume |
| `/model` | Switch the model, thinking mode and reasoning effort |
| `/raw` | Toggle the display mode: Normal, Lite or Raw scrollback |
| `/init` | Create an `AGENTS.md` file with project instructions |
| `/skills` | List the skills available to DeepCode |
| `/mcp` | Show MCP server status and available tools |
| `/undo` | Restore code, the conversation or both to an earlier point |
| `/exit` | Quit DeepCode |

A project may already have an `AGENTS.md`; check before using `/init` so you do not replace instructions that are already there.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Enter` | Send the prompt |
| `Shift+Enter` | Insert a newline |
| `Ctrl+J` | Insert a newline |
| `Esc` | Interrupt the current model turn |
| `Ctrl+V` | Paste an image when the selected model supports images |
| `Ctrl+D` twice | Quit DeepCode |

After interrupting a turn with `Esc`, you can type another request. The sandbox is not restarted.

## Dropping files into the terminal

Drag a file onto the terminal and its path is typed in for you.

- A file inside the project folder, or inside a directory you have shared with the project, is referred to where the sandbox already sees it (`/workspace/...` or `/grants/...`). Nothing is copied.
- A file from anywhere else is copied into `/tmp/deepsand-incoming` inside the sandbox, and Deepsand asks first. That folder is not part of any repository, so a dropped file cannot end up in a commit, and it disappears when the sandbox is recreated. The dialog has a **Don't warn me again** switch, which is the same setting as **Settings → Behaviour → Warn before dropping files from outside the project**.

## Staying up to date

The DeepCode CLI is installed inside the sandbox image, and the sandbox cannot update itself. Before each start Deepsand asks npm what the latest release is and, if the image has an older one, rebuilds that part of the image first — so the terminal never opens on a version that is already asking you to update. The answer is remembered for a quarter of an hour, so this is one request rather than one per run, and if npm cannot be reached the sandbox starts on the version it already has.

## Sessions, models and undo

- `/new` starts over with a clean conversation. The project files are not deleted.
- `/resume` and `/continue` bring back an earlier conversation.
- `/model` changes the model, thinking mode and reasoning effort for the session. The project header also has a model selector and a thinking slider; **Balanced** is the middle stop and the recommended setting for most work.
- `/undo` restores code, the conversation or both to an earlier point. It is the quickest way to back out of a change you did not want.

The conversation history lives in the project's Deepsand state volume, not in your repository.

## Permissions and the sandbox

The terminal is inside the container, so it sees the project at `/workspace` and the directories you explicitly shared, and nothing else on your computer.

When DeepCode asks for another directory, a network destination, a tool or another resource, Deepsand freezes the sandbox and shows a permission dialog.

- **Grant access** applies the request and resumes the session.
- **Not now** refuses it this time; DeepCode may ask again later.
- **Don't ask again** refuses it, and Deepsand then refuses that path (and everything under it) or that host (and its subdomains) itself, not just in words. Every block is listed in Permissions, where you can lift it again.
- Approving a directory recreates the container with the new mount.

Read [How the sandbox works](./security) before sharing a directory that contains sensitive files.

## If the terminal does not start

- **The image is missing:** Deepsand builds it first. Watch **Activity** for build progress.
- **Docker Desktop is not running or is stuck:** start it and wait for the engine to finish starting. If Docker Desktop is running but its engine is not answering, restart Docker Desktop. Use the in-app **Restart Docker Desktop…** control when Deepsand shows it. Otherwise, on Windows right-click the Docker whale in the notification area and choose **Restart**; on macOS use the Docker menu bar icon; on Linux open Docker Desktop's **Troubleshoot** menu. Restarting Docker Desktop ends every container on the machine. See [the Docker FAQ](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).
- **The API key is missing or rejected:** open **Settings** and save a valid key.
- **DeepCode exited:** press **Run** again. The previous session can be resumed with `/resume`.

## Related pages

- [Getting started](./getting-started)
- [Get a DeepSeek API key](./deepseek-api)
- [How the sandbox works](./security)
- [DeepCode project home page](https://deepcode.vegamo.cn/)
