---
title: Under the hood
description: Architecture, isolation, permission flow, networking, and the command-line tools behind Deepsand.
---

# Under the hood

This page is for developers who want the technical shape of the system. If you are looking for a plain-language explanation, start with [What is Deepsand?](./what-is-deepsand).

## Architecture

Deepsand is a Tauri desktop app with three main layers:

- **The window** is a SolidJS interface. It renders state and sends intents; it does not decide policy.
- **The Tauri layer** exposes desktop commands and translates the same command surface to a loopback HTTP server for remote clients.
- **`deepsand-core`** owns the rules. Path validation, the `docker run` plan, the permission broker, the egress proxy, the encrypted secret store, and the state store all live there.

The desktop app and the command-line driver `deepsandctl` use the same core, so they cannot drift apart on a security decision.

## One project, one container

Each project gets its own Docker container and its own state volume. The project directory is mounted at `/workspace`; other host directories require explicit grants.

`policy::plan_run` builds the complete `docker run` argv in one place. The Activity tab shows that exact plan, including the mounts, capabilities, network mode and read-only paths.

The container is deliberately constrained:

- The root filesystem is read-only, with sized tmpfs mounts for `/tmp` and `/run`.
- The response spool and state directory are mounted read-only.
- Container-runtime sockets are rejected by name.
- Capabilities are dropped before DeepCode runs, and `no-new-privileges` is set.
- Container-runtime sockets and other forbidden mounts fail closed rather than producing a weaker plan.

## Permissions

The sandbox can ask for more access, but it cannot grant it. A permission request is written to a spool; the host broker validates it and pauses the container. The operator sees the request and decides.

Approving a directory request recreates the container with the new bind mount and resumes the session. Denying is final and is reported to the model.

A request for something the sandbox already has is refused with an explanation. There is no automatic approval path, because a silent approval would be consent the operator never gave.

## Networking

Network policy has four modes:

| Mode | Behaviour |
| --- | --- |
| `none` | Only the model endpoint through the Deepsand egress proxy. |
| `allowlisted` | The model endpoint, the proxy, and named hosts, addresses and ports. |
| `internet` | Internet access, with local and private ranges blocked inside the container. |
| `full` | Internet access without the local-network block. |

A hostname entry is resolved by the proxy, which refuses private, loopback, link-local and reserved results. An address entry is enforced directly by the container, which is what lets a database client or other non-HTTP program connect. A named port is published on the host loopback only.

## Secrets and updates

Secrets are encrypted at rest with a key held by the operating system keystore. They are passed to the container through an environment file, never as a command-line value, and are injected only when the sandbox starts.

Release builds verify signed updates before installing them. The signing key is never stored in the repository.

## Command line

`deepsandctl` provides the headless surface:

```bash
deepsandctl doctor
deepsandctl plan <project> --offline
deepsandctl run <project>
deepsandctl watch <project>
deepsandctl requests <project>
deepsandctl network <project> <mode>
```

`plan --offline` prints the exact `docker run` argv without starting a container, which is useful for reviewing a changed policy.

## Read more

- [The full security model](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md)
- [Architecture notes](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md)
- [How the sandbox works](./security)
