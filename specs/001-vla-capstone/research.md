# Research for Module 4 – Vision-Language-Action (VLA) & Capstone

## Phase 0: Outline & Research

### Research Task: Determine Specific Versions/Models for VLA Ecosystem Tools

**Question**: What are the exact recommended versions/models for OpenAI Whisper, the LLM, and the specific Python 3.x version and ROS 2 distribution (and its version) that should be targeted for compatibility and examples within this module?

**Context**: The module focuses on Vision-Language-Action (VLA) for humanoid robotics, relying on OpenAI Whisper, Large Language Models (LLMs), and ROS 2. To ensure consistency, reproducibility, and currency for learners, specific versions/models of these tools and platforms need to be defined.

**Decision**: OpenAI Whisper (latest stable API), GPT-4 (or equivalent current flagship LLM API), Python 3.10, ROS 2 Humble (LTS).
**Rationale**: This choice provides learners with access to a modern, stable, and widely supported technology stack.
*   **OpenAI Whisper (latest stable API)**: Ensures access to the most up-to-date and accurate speech recognition capabilities.
*   **GPT-4 (or equivalent current flagship LLM API)**: Represents the state-of-the-art in LLM capabilities for cognitive planning, allowing for complex natural language understanding and action generation. Using an equivalent flagship API ensures high performance while providing flexibility.
*   **Python 3.10**: A stable and well-supported Python version, compatible with ROS 2 Humble.
*   **ROS 2 Humble (LTS)**: As an LTS release, it offers long-term stability, extensive documentation, and a large community, which is ideal for educational content and ensuring reproducibility.
This combination balances cutting-edge AI capabilities with a robust and supported robotics framework, providing the best learning experience.
**Alternatives Considered**:
*   **OpenAI Whisper (self-hosted model), Llama 2 (or other open-source LLM), Python 3.11/3.12, ROS 2 Jazzy (LTS)**: While promoting open-source solutions and newer Python/ROS versions, this option might introduce more complexity in setup (e.g., local LLM inference requiring significant computational resources) and potentially less refined tools compared to actively managed API services.
*   **Older Whisper model (e.g., `base`), GPT-3.5 (or older LLM API), Python 3.8, ROS 2 Foxy (LTS)**: This stack offers high compatibility with older hardware and existing tutorials. However, it would mean missing out on the significant advancements in LLM capabilities (GPT-4 vs. GPT-3.5) and using an older ROS 2 distribution, potentially limiting the module's relevance for current robotics development.
