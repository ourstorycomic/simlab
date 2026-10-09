# Anatomy Atelier — AI Discernment Studio

An educational anatomy comparison lab for practicing critical judgment about AI-generated visual content. Students rotate an AI-generated organ mesh, compare it with two curated images of real human anatomy, document uncertainty, and export their reasoning.

> **AI disclosure:** This is an AI-assisted educational prototype. AI contributed to the upstream application, 3D study meshes, social-card imagery, interface code, and educational copy. The real-anatomy reference photographs and scans are human-created or clinically acquired works from the sources listed in [ATTRIBUTION.md](ATTRIBUTION.md). See [AI-DISCLOSURE.md](AI-DISCLOSURE.md) for the full disclosure.

This repository holds the **already-built** site. There is no build step and nothing to install: `index.html` and the folders beside it are the finished website. Student reflections stay in the browser's `localStorage`; nothing is sent anywhere.

## Publishing

Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.

The asset paths in this build are keyed to a repository named **Anatomy-Studio-GPT-5.6**. Renaming the repository or using a different one will break the images and 3D models, and the site would need rebuilding from source.

## Rights

Adapted from [thebuggeddev/anatomy](https://github.com/thebuggeddev/anatomy), which had no explicit license when this package was prepared. Read [LICENSE.md](LICENSE.md), [ATTRIBUTION.md](ATTRIBUTION.md), and [AI-DISCLOSURE.md](AI-DISCLOSURE.md) before redistributing. Reference images retain their individual licenses.

This site is not a diagnostic tool, medical reference, or replacement for an instructor-approved anatomy atlas.
