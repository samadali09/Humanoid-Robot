---
id: 0001
title: Update AI Book RAG Chatbot Constitution
stage: constitution
date: 2025-12-07
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 001-ai-book-rag
user: classic computer 220
command: /sp.constitution
labels: ["constitution", "update"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
null
---

## Prompt

```text
 /sp.constitution

Project: AI/Spec-Driven Book + RAG Chatbot for Physical AI & Humanoid Robotics

Core principles:
- Technical accuracy (ROS 2, Gazebo, Unity, NVIDIA Isaac, RAG).
- Clarity for CS/engineering audience.
- Reproducibility of all code and pipelines.
- Rigor using official docs and peer-reviewed sources.

Key standards:
- All claims must be source-verified (APA style).
- Minimum 40–50% peer-reviewed or official documentation.
- Zero plagiarism.
- Flesch-Kincaid grade 10–12.
- Book structure follows course modules:
  - ROS 2
  - Gazebo & Unity
  - NVIDIA Isaac
  - Vision-Language-Action
  - Capstone: Autonomous Humanoid Robot

Constraints:
- Book: 15,000–20,000 words.
- Minimum 20 credible sources.
- Format: Docusaurus + GitHub Pages.
- RAG chatbot requirements:
  - FastAPI backend
  - OpenAI Agents/ChatKit
  - Qdrant Cloud Free Tier
  - Must answer only from book content
  - Must support text-selection mode.
- All code must run without modification.

Success criteria:
- All claims verified.
```

## Response snapshot

The project constitution for "AI/Spec-Driven Book + RAG Chatbot for Physical AI & Humanoid Robotics" has been updated to version 1.0.0. The update includes detailed core principles (technical accuracy, clarity, reproducibility, rigor), key standards (source verification, documentation percentage, anti-plagiarism, readability, book structure), and constraints (word count, sources, format, RAG chatbot specifics). A new "Success Criteria" section was added, specifying that all claims must be verified. The governance section was also updated with the ratification and last amended dates.

## Outcome

- ✅ Impact: Project constitution updated with core principles, key standards, constraints, and success criteria.
- 🧪 Tests: No tests were run for this constitution update.
- 📁 Files: The `.specify/memory/constitution.md` file was modified.
- 🔁 Next prompts: Continue with project development based on the updated constitution.
- 🧠 Reflection: The constitution was successfully updated and reflects the user's input.

## Evaluation notes (flywheel)

- Failure modes observed: Attempted to run a non-existent bash script for PHR creation; successfully reverted to agent-native PHR creation.
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
