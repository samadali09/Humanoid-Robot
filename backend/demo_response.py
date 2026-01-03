"""
Demo/Test data for chat widget without needing embeddings
"""

DEMO_RESPONSES = {
    "what is ros 2": {
        "response": "ROS 2 (Robot Operating System 2) is the next generation of ROS, designed for production robotics applications. It provides improved real-time performance, security features, and multi-platform support including Windows, macOS, and Linux.",
        "citations": [
            {
                "chunk_id": "demo_1",
                "text": "ROS 2 is a complete rewrite of the original ROS with modern software engineering practices...",
                "citation": "Module 1: ROS 2 - The Nervous System",
                "score": 0.95
            }
        ]
    },
    "simulation": {
        "response": "Simulation in robotics involves creating virtual environments to test robot behavior before deployment. Common tools include Gazebo for physics-based simulation and Unity for visualization and AI training scenarios.",
        "citations": [
            {
                "chunk_id": "demo_2",
                "text": "Gazebo provides accurate physics simulation for robotics development...",
                "citation": "Module 2: Digital Twin Simulation",
                "score": 0.88
            }
        ]
    },
    "default": {
        "response": "I'm currently running in demo mode. The RAG system is being set up. Please try questions about:\n\n• What is ROS 2?\n• How does simulation work?\n• Tell me about robotics\n\nOnce the vector database is populated with your book content, I'll be able to answer any question about the material!",
        "citations": []
    }
}

def get_demo_response(message: str):
    """Get a demo response based on keywords"""
    message_lower = message.lower()

    if "ros" in message_lower or "ros2" in message_lower:
        return DEMO_RESPONSES["what is ros 2"]
    elif "simulation" in message_lower or "gazebo" in message_lower or "unity" in message_lower:
        return DEMO_RESPONSES["simulation"]
    else:
        return DEMO_RESPONSES["default"]
