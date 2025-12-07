# Research for Module 1 – The Robotic Nervous System (ROS 2)

## Phase 0: Outline & Research

### Research Task: Determine ROS 2 Distro and Python Version

**Question**: What is the exact ROS 2 distro version and corresponding Python version that should be used for the module's examples and content?

**Context**: The module aims to provide practical examples for students and beginner robotics engineers integrating Python AI agents with ROS 2. Compatibility and stability are key.

**Decision**: ROS 2 Humble Hawksbill (LTS) with Python 3.10.
**Rationale**: Humble Hawksbill is a Long Term Support (LTS) release, ensuring stability and long-term support which is beneficial for educational content aimed at students and beginners. It is widely adopted and well-documented. Python 3.10 is the corresponding Python version for ROS 2 Humble on its recommended Ubuntu 22.04 platform.
**Alternatives Considered**:
*   ROS 2 Foxy Fitzroy (LTS): Older LTS release, Python 3.8. Less current for new projects.
*   ROS 2 Iron Irwini: Not an LTS release, Python 3.10. Less ideal for long-term educational material.
*   ROS 2 Jazzy Jalisco (LTS, latest): Newer LTS release, Python 3.12. While newer, Humble has a larger existing user base and more established resources for beginners. The goal is stability and broad compatibility.