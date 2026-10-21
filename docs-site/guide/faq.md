---
title: Frequently asked questions
description: Short answers about projects, permissions, data and updates.
---

# Frequently asked questions

## Does DeepCode see my home directory?

No. The sandbox sees the project directory at `/workspace` and the directories you explicitly grant. The rest of the host filesystem is not mounted.

## What happens when I approve a directory request?

Deepsand adds the directory as a grant, recreates the container with the new mount attached, and resumes the DeepCode session. A running sandbox cannot gain a bind mount without being recreated.

## Where are my conversations stored?

Conversation history, sessions, attachments and generated skills live in a per-project Docker volume. The project folder on disk contains only your code and files.

Removing a project from Deepsand does not delete that volume. Wiping a project's DeepCode data removes the volume but leaves the project folder untouched.

## Where are API keys and secrets stored?

Secrets are encrypted at rest with a key held by the operating system's keystore, and are injected into the sandbox as environment variables only when it starts. The interface shows names and lengths, never the stored values.

Credentials can also be inherited from your host DeepCode configuration. They are not copied into the project folder.

## Can each project use a different model?

Yes. A project can inherit the host configuration or override the model, base URL and credentials in its own settings. The header selector can also choose a model for the project; **Defer to Config** means the project does not pin one.

## Which model should I use to keep costs down?

Use a flash model for most tasks. Deepsand defaults to `deepseek-v4-flash`, which is the cheaper choice for everyday coding, explanations and edits. Reserve `deepseek-v4-pro` for work where flash is clearly struggling or you need its extra capability, because the pro model costs more to run.

Switch models from the project header or with `/model` in the DeepCode terminal. If you are trying Deepsand for the first time, start with flash and only move to pro when you have a task that needs it.

## What does the thinking slider do?

The thinking slider is next to the model selector in the project header. It controls how much reasoning the model does before it answers.

| Stop | What it means |
| --- | --- |
| **Off** | Do not think before answering. Fastest, but the least careful. |
| **Quick** | A little thinking, for small well-specified edits. |
| **Balanced** | Moderate thinking. The middle stop and the sensible default for real work. |
| **Deep** | Think as hard as the model can. Slowest and most expensive. |
| **Default** | Defer to the host `settings.json`; if it says nothing, DeepCode falls back to Balanced. |

Keep the slider on **Balanced** for most tasks. It is the middle setting, and it gives good results without paying for the slowest, most expensive reasoning on every request. Move to **Deep** only for genuinely difficult problems, and use **Off** or **Quick** for small, predictable edits.

## Does Deepsand only work with DeepSeek?

No. DeepSeek is the default because it is the model and endpoint Deepsand ships with, but Deepsand configures the DeepCode CLI with a model name, base URL and API key. You can point it at another provider that exposes an API the CLI can call, commonly an OpenAI-compatible endpoint.

Set the provider's base URL and model in **Settings**, or in a project's own credentials, and store that provider's API key in the same place. The sandbox's network policy must also allow the provider's endpoint.

## What if Docker Desktop is not running or has stopped responding?

Deepsand cannot start a sandbox without the Docker engine. If Docker Desktop is not running, start it and wait for the engine to finish starting. Deepsand re-checks when the window regains focus, and the status strip offers a retry.

Sometimes Docker Desktop is still running but its engine has stopped responding. Restarting Deepsand does not fix that; Docker Desktop itself needs to be restarted.

- **Use the in-app control when it appears.** If Deepsand detects Docker Desktop, it shows **Restart Docker Desktop…** in the status strip or terminal warning. That control restarts the Docker engine, including the WSL process it uses on Windows, and waits until a container can start again.
- **Windows:** right-click the Docker whale in the notification area and choose **Restart**. If that option is missing, open Docker Desktop, select **Troubleshoot**, then **Restart Docker Desktop**.
- **macOS:** click the Docker whale in the menu bar and choose **Restart**.
- **Linux:** open the Docker Desktop menu, select **Troubleshoot**, then **Restart Docker Desktop**. If you use Docker Engine instead of Docker Desktop, restart its service, for example `sudo systemctl restart docker`.

Restarting Docker Desktop ends every container on the machine, including containers unrelated to Deepsand. Deepsand offers the restart but does not do it automatically. See [Docker's troubleshooting documentation](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/) for the platform-specific menu.

## Can I use Deepsand without internet access?

The model needs its endpoint. With the `none` network mode, only that endpoint is reachable through the Deepsand proxy. Package installs and other network access will fail unless you allow the hosts they need.

## How do I update Deepsand?

Open **Settings**, then **Updates**, and check for a newer version. Release builds download signed updates and restart the app after installing one. Installing an update stops running sandboxes.

## Is there a command-line interface?

Yes. `deepsandctl` provides headless commands such as `doctor`, `plan`, `run`, `watch`, `requests` and `network`. The desktop app and the CLI share the same policy code in `deepsand-core`.

## How do I report a security issue?

Do not open a public issue for a security problem. Contact the maintainers privately through the repository's security reporting channel and include enough detail to reproduce the problem.
