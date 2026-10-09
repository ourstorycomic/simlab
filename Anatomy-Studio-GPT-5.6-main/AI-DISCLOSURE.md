# AI Disclosure

## Label

**AI-assisted educational prototype — generated anatomy must be checked against real evidence.**

This label is also displayed in the application header.

## Where AI contributed

AI materially contributed to this project's creation. The known uses are:

1. **Upstream application development.** The original [`thebuggeddev/anatomy`](https://github.com/thebuggeddev/anatomy) repository describes the project as built with GPT-5.6 Sol.
2. **Educational adaptation.** OpenAI Codex assisted with interface implementation, code revision, responsive styling, debugging, source mapping, captions, reflection prompts, export behavior, and repository documentation. A human directed the goals and reviewed the results.
3. **3D study meshes.** Embedded GLB metadata identifies Tripo-generated nodes and materials. These models are presented as generated study representations, not documentary scans or validated medical models.
4. **Social-card imagery.** The two promotional/social-preview cards were created with AI image generation during development and are used as visual identity assets.
5. **Anatomy illustrations.** Stylized anatomy artwork inherited from the upstream application may be AI-generated. It is decorative and is not presented as real anatomical evidence.
6. **Educational text.** Some captions, interface copy, prompts, examples, and explanatory anatomy text were drafted or revised with AI assistance. They have not been independently peer reviewed as a medical textbook.

## What is not labeled as AI-generated

The images in `public/references/` are sourced photographs, dissections, clinical images, or microscopy images. They were selected to provide real-world evidence alongside the generated mesh. They were not generated for this project. Their creators, source records, and licenses are listed in [ATTRIBUTION.md](ATTRIBUTION.md).

## Safeguards built into the activity

- Generated meshes and real references are visibly separated.
- Each real reference has an original-source link.
- Students are prompted to name visible evidence, viewing-angle differences, and uncertainty.
- The interface states that it is not a diagnostic source.
- The export preserves the student's evidence checks, confidence, and revision trail.

## Limitations

- AI-generated meshes may contain anatomical errors, missing structures, invented detail, misleading proportions, or unrealistic textures.
- A photograph or clinical image can also be difficult to interpret without labels, orientation, clinical context, and expert instruction.
- Inclusion of a source does not mean the source endorses this project.
- Source mapping and captions should be rechecked periodically because external pages and license metadata can change.
- The activity should be used with instructor-approved references and not for diagnosis or clinical decisions.

## Recommended citation of this disclosure

> Anatomy Atelier is an AI-assisted educational prototype. AI contributed to code, generated 3D study meshes, social imagery, and educational text. Real-anatomy reference images are separately attributed and linked to their source records.

