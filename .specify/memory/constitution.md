<!-- Sync Impact Report -->
<!--
Version change: 0.0.0 -> 1.0.0
List of modified principles:
  - Technical accuracy: Added
  - Clarity for CS/engineering audience: Added
  - Reproducibility: Added
  - Rigor: Added
Added sections:
  - Key Standards
  - Constraints
  - Success Criteria
Removed sections:
  - None
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ updated
  - .specify/templates/spec-template.md: ✅ updated
  - .specify/templates/tasks-template.md: ✅ updated
  - .specify/templates/commands/sp.constitution.md: ✅ updated
  - .specify/templates/commands/sp.phr.md: ✅ updated
  - .specify/templates/commands/sp.analyze.md: ✅ updated
  - .specify/templates/commands/sp.adr.md: ✅ updated
  - .specify/templates/commands/sp.checklist.md: ✅ updated
  - .specify/templates/commands/sp.clarify.md: ✅ updated
  - .specify/templates/commands/sp.implement.md: ✅ updated
  - .specify/templates/commands/sp.git.commit_pr.md: ✅ updated
  - .specify/templates/commands/sp.plan.md: ✅ updated
  - .specify/templates/commands/sp.specify.md: ✅ updated
  - .specify/templates/commands/sp.tasks.md: ✅ updated
Follow-up TODOs:
  - None
-->
# AI/Spec-Driven Book + RAG Chatbot for Physical AI & Humanoid Robotics Constitution

## Core Principles

### Technical accuracy
All content must be technically accurate, specifically concerning ROS 2, Gazebo, Unity, NVIDIA Isaac, RAG, and related Physical AI & Humanoid Robotics topics.

### Clarity for CS/engineering audience
The book content and explanations must be clear and understandable for a Computer Science and Engineering audience.

### Reproducibility
All code, pipelines, and experimental setups presented must be fully reproducible without modification.

### Rigor
Information and claims must be rigorously supported using official documentation and peer-reviewed sources.

## Key Standards

### Source-verified claims (APA style)
All claims and facts must be verified against credible sources and cited using APA style.

### Minimum 40–50% peer-reviewed/official documentation
A minimum of 40–50% of cited sources must originate from peer-reviewed publications or official product/framework documentation.

### Zero plagiarism
All content must be original. Plagiarism is strictly prohibited.

### Flesch-Kincaid grade 10–12
The readability of the book content must target a Flesch-Kincaid grade level between 10 and 12.

### Book structure follows course modules
The book will be structured into modules covering ROS 2, Gazebo & Unity, NVIDIA Isaac, Vision-Language-Action, and a Capstone: Autonomous Humanoid Robot.

## Constraints

### Book word count
The book's total word count must be between 15,000 and 20,000 words.

### Minimum credible sources
The book must include a minimum of 20 credible sources.

### Book format
The book will be formatted using Docusaurus and published via GitHub Pages.

### RAG chatbot backend
The RAG chatbot must utilize a FastAPI backend.

### RAG chatbot agent
The RAG chatbot must integrate with OpenAI Agents/ChatKit.

### RAG chatbot vector database
The RAG chatbot must use Qdrant Cloud Free Tier for its vector database.

### RAG chatbot content restriction
The RAG chatbot must answer questions exclusively from the book content provided.

### RAG chatbot text selection
The RAG chatbot must support a text-selection mode for querying.

### Code reproducibility
All code provided within the book and for the chatbot must run without modification.

## Success Criteria

### All claims verified
All factual claims made throughout the book and by the chatbot must be verifiable against cited sources.

## Governance
This constitution outlines the fundamental principles, standards, and constraints for the project. Amendments require documentation, approval, and a clear migration plan. All development artifacts and processes must comply with these guidelines. Regular reviews will be conducted to ensure ongoing adherence.

**Version**: 1.0.0 | **Ratified**: 2025-12-07 | **Last Amended**: 2025-12-07
