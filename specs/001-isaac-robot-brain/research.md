# Research for Module 3 – The AI-Robot Brain (NVIDIA Isaac™)

## Phase 0: Outline & Research

### Research Task: Determine Specific Versions for NVIDIA Isaac Ecosystem Tools

**Question**: What are the exact recommended versions of NVIDIA Isaac Sim, Isaac ROS, and Nav2 that should be used for this module's examples? What specific Python 3.x version and ROS 2 distribution (and its version) should be targeted for compatibility with these tools?

**Context**: The module focuses on the NVIDIA Isaac ecosystem (Isaac Sim, Isaac ROS) and Nav2 for advanced robotics. To ensure consistency, reproducibility, and currency for learners, specific versions of these tools, and the compatible Python/ROS 2 versions, need to be defined.

**Decision**: Latest Stable NVIDIA Isaac Sim/ROS, Nav2, Python 3.10, ROS 2 Humble (LTS).
**Rationale**: This choice provides a modern yet stable environment for learners. Utilizing the latest stable versions ensures access to current features and best practices while leveraging the Long Term Support (LTS) nature of ROS 2 Humble guarantees prolonged support and a wealth of community resources. Python 3.10 is the standard for ROS 2 Humble, ensuring seamless integration. This balance is optimal for educational content that needs to be both relevant and accessible.
**Alternatives Considered**:
*   **Latest Developer Preview NVIDIA Isaac Sim/ROS, Nav2, Python 3.11/3.12, ROS 2 Jazzy (LTS)**: While offering the absolute cutting edge, developer preview versions can be less stable, have fewer community resources, and require more frequent updates, which might be challenging for students and beginners.
*   **Older LTS NVIDIA Isaac Sim/ROS, Nav2, Python 3.8, ROS 2 Foxy (LTS)**: This would offer high stability and extensive existing tutorials. However, it would mean using older versions of the Isaac ecosystem and ROS 2, potentially not exposing learners to the latest features and modern best practices in humanoid robotics development.
