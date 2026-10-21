---
title: What is Deepsand?
description: A plain-language guide to what Deepsand does, who it is for, and why it is safer than giving an AI assistant your whole computer.
---

# What is Deepsand?

Deepsand is a desktop app that lets an AI coding assistant help with a project inside its own separate workspace.

Think of it as a workbench in another room. You bring in the project you want help with. The assistant can use that workbench and the materials you hand it, but it cannot wander through the rest of your home.

## What it is useful for

- Fixing a bug in a website or small program.
- Adding a feature to an existing project.
- Explaining code you inherited or do not recognize.
- Writing tests, documentation, or a first draft.
- Exploring an unfamiliar repository without giving an assistant access to everything else on your machine.

You do not need to know how Docker works, and you do not need to be a professional developer to start. If you can choose a folder and press a button, you can use the basic flow.

## Why not just use a chat window?

A chat window can suggest code, but it cannot run your project, read the files around it, or check whether its suggestion actually works.

Deepsand gives the assistant a real project and real tools. It can run commands, edit files, and test the result, while the workspace keeps that work away from the rest of your computer.

## What "a separate workspace" means

The assistant sees the project folder you choose and the folders you deliberately share. It does not automatically see your documents, photos, downloads, other projects, passwords, or the rest of your disk.

When it needs something outside the workspace, it has to ask. Deepsand pauses the assistant and shows you the request. Nothing is shared until you approve it.

## Who it is for

- **People who are new to coding:** get help with a small project without learning a container tool first.
- **Experienced developers:** give an AI agent a bounded environment, inspect the exact Docker command, and control network and tool access.
- **Anyone who wants a second pair of hands:** keep the assistant focused on one project instead of exposing a whole machine.

## What you stay in control of

- Which folder each project uses.
- Which extra folders, if any, the assistant may reach.
- Which websites it may contact.
- Which tools are installed in the workspace.
- Which model and credentials are used.
- When the workspace starts and stops.

## Learn more

- [Install Deepsand and create your first project](./getting-started)
- [How the sandbox works](./security)
- [Under the hood](./for-developers) for the technical design
- [Frequently asked questions](./faq)
