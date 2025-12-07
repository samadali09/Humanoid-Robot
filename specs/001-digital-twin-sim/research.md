# Research for Module 2 – The Digital Twin (Gazebo & Unity)

## Phase 0: Outline & Research

### Research Task: Determine Specific Versions for Simulation Tools

**Question**: What are the exact versions of Gazebo and Unity that should be used for this module's examples? If Python scripting/integration is involved with Gazebo, what specific Python 3.x version should be targeted?

**Context**: The module focuses on Gazebo and Unity for digital twin creation. To ensure consistency and reproducibility for learners, specific versions of these tools, as well as the Python version (if used with Gazebo), need to be defined.

**Decision**: Gazebo Fortress (LTS) & Unity 2022 LTS, Python 3.10.
**Rationale**: This choice prioritizes stability and long-term relevance, which is crucial for educational content aimed at students and beginners. LTS versions generally have extensive community support and a more stable feature set, reducing potential compatibility issues for learners. Python 3.10 is a widely supported version and aligns with current ROS 2 LTS distributions (like Humble Hawksbill, which may be relevant for advanced integrations not covered in this module but common in robotics).
**Alternatives Considered**:
*   **Gazebo Garden & Unity 2023.x (latest stable), Python 3.11**: This option would showcase the absolute latest features, but might lead to more frequent updates, potential breaking changes, and less established community resources, which could be challenging for beginners.
*   **Gazebo Classic 11 & Unity 2021 LTS, Python 3.8**: This option focuses on older, more established versions. While offering maximum compatibility with very old systems, it might not prepare learners for current industry practices and could limit exposure to newer features and improvements in simulation technology.
