# Data Model: Module 1 – The Robotic Nervous System (ROS 2)

This document outlines the key conceptual entities discussed within the educational module. These are not data models in the traditional software engineering sense (e.g., for a database), but rather the fundamental concepts that learners will engage with.

## Conceptual Entities

### Entity: ROS 2 (Robot Operating System 2)
*   **Description**: The open-source middleware providing a standardized way to build robot applications. It handles communication, hardware abstraction, package management, and more.
*   **Key Attributes (conceptual)**:
    *   `Distro`: Specific version of ROS 2 (e.g., Humble Hawksbill).
    *   `Packages`: Collections of code and resources that provide specific functionalities.
    *   `Nodes`: Fundamental computational units.
    *   `Communication Mechanisms`: Topics, Services, Actions.
*   **Relationships**: Orchestrates and connects Nodes, Topics, Services.

### Entity: Node
*   **Description**: An executable process within a ROS 2 graph. Each node is responsible for a single modular task (e.g., a camera driver, a motor controller, a planning algorithm).
*   **Key Attributes (conceptual)**:
    *   `Name`: Unique identifier within the ROS graph.
    *   `Publishers`: Components that send messages to Topics.
    *   `Subscribers`: Components that receive messages from Topics.
    *   `Clients`: Components that request Services.
    *   `Servers`: Components that provide Services.
*   **Relationships**: Communicates via Topics and Services; managed by ROS 2.

### Entity: Topic
*   **Description**: An anonymous publish/subscribe messaging system for data streaming between nodes. Nodes publish data to a topic, and other nodes subscribe to receive that data.
*   **Key Attributes (conceptual)**:
    *   `Name`: Unique identifier for the data stream.
    *   `Message Type`: The structure of data being sent (e.g., `sensor_msgs/msg/LaserScan`).
*   **Relationships**: Connects Nodes (publishers to subscribers); managed by ROS 2.

### Entity: Service
*   **Description**: A request/reply communication mechanism. A client node sends a request to a server node, and the server processes it and sends back a response.
*   **Key Attributes (conceptual)**:
    *   `Name`: Unique identifier for the service.
    *   `Request Type`: The structure of data sent in the request.
    *   `Response Type`: The structure of data sent in the response.
*   **Relationships**: Connects Nodes (clients to servers); managed by ROS 2.

### Entity: URDF (Unified Robot Description Format)
*   **Description**: An XML file format in ROS used to describe all elements of a robot, including its kinematic and dynamic properties, visual appearance, and collision properties.
*   **Key Attributes (conceptual)**:
    *   `Links`: Rigid bodies of the robot (e.g., torso, upper arm).
    *   `Joints`: Connections between links, defining their relative motion.
    *   `Kinematics`: Description of robot motion without considering forces.
*   **Relationships**: Defines the structure of a Humanoid Robot; processed by ROS 2 tools.

### Entity: Python AI Agent
*   **Description**: An external software component, written in Python, designed to apply artificial intelligence algorithms (e.g., control logic, decision-making) to control or interact with a ROS 2 robot.
*   **Key Attributes (conceptual)**:
    *   `Control Logic`: Algorithms for decision making.
    *   `Perception Modules`: Processes sensor data (conceptual for this module).
*   **Relationships**: Communicates with ROS 2 via `rclpy` to control a Humanoid Robot.

### Entity: rclpy
*   **Description**: The Python client library for ROS 2, enabling Python programs to create nodes, publish/subscribe to topics, and offer/call services.
*   **Key Attributes (conceptual)**:
    *   `Node API`: Functions to create and manage nodes.
    *   `Publisher API`: Functions to create and manage publishers.
    *   `Subscriber API`: Functions to create and manage subscribers.
    *   `Service Client/Server API`: Functions to create and manage service clients and servers.
*   **Relationships**: Provides the programming interface for Python AI Agents to interact with ROS 2.

### Entity: Humanoid Robot
*   **Description**: A robot designed to resemble the human body, particularly in its physical form and capabilities, for which URDF models are created and controlled via ROS 2.
*   **Key Attributes (conceptual)**:
    *   `Links`: Individual body parts (e.g., head, torso, limbs).
    *   `Joints`: Connections allowing movement between links.
    *   `Sensors`: (Conceptual for this module) Devices to perceive the environment.
    *   `Actuators`: (Conceptual for this module) Devices to effect movement.
*   **Relationships**: Modeled by URDF; controlled by Python AI Agent through ROS 2.
