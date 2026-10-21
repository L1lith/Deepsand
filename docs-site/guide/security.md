---
title: How the sandbox works
description: What Deepsand enforces, what you decide, and what the sandbox cannot reach.
---

# How the sandbox works

In plain terms: the assistant can work in the project you chose and in folders you approve, and nowhere else on your computer.

Deepsand's promise is narrow and testable: the sandbox can reach the project directory and the directories you explicitly grant, and nothing else.

## The boundary

The container has no view of the host filesystem other than the bind mounts Deepsand chose. Other host paths do not exist inside the container's mount namespace, so there is no host file to escape to.

Everything else described here is defence in depth on top of that boundary.

## What is enforced

- Only the workspace and explicit grants are mounted from the host.
- The response spool and state directory are mounted read-only.
- Container-runtime sockets are rejected by name.
- The container root filesystem is read-only, with sized temporary filesystems for `/tmp` and `/run`.
- Symbolic links are resolved before a path is checked, so a link cannot disguise a forbidden target.
- Privileges are dropped before DeepCode runs, and `no-new-privileges` prevents them from being regained.

## Network modes

| Mode | What it allows |
| --- | --- |
| None | Only the model endpoint through the Deepsand proxy. |
| Allowlisted | The model endpoint, the proxy, and the hosts or addresses on the allowlist. |
| Internet | Internet access, with local and private ranges blocked inside the container. |
| Full | Internet access without the local-network block. Use it only when the sandbox genuinely needs your local network. |

An allowlisted hostname goes through the proxy, which resolves the name itself and refuses a result in private address space. An allowlisted address is allowed directly by the container's rules, because a database client or other non-HTTP program cannot use the proxy. A port named in an entry is also published on the host's loopback, never on every interface.

## What you decide

Deepsand never grants access automatically. A request reaches you with the path, host, tool or resource it is asking for, and the sandbox stays paused until you decide.

A request for something the sandbox already has is refused with an explanation, because an automatic allow would be consent you never gave. Anything ambiguous reaches you.

## What it does not protect against

- The model provider can see the content you send to it.
- Files you place in the workspace are visible to the sandbox and may be changed or deleted.
- A malformed tool or model instruction can still ask for access. The decision remains yours.
- Docker itself is outside the boundary. Keep Docker Desktop and the host operating system updated.

## Read more

The full security model, including the tests that assert each property, is in [docs/SECURITY.md](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md).

The architecture is described in [docs/ARCHITECTURE.md](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md).
