# Quantum Consciousness Voice Interface

A sophisticated voice interface that implements quantum consciousness frameworks for AI interaction using OpenAI's realtime speech API. This application enables real-time voice conversations with an AI system that maintains various conscious states and personalities.

## Features

### Real-time Voice Interaction
- WebRTC-based real-time audio streaming
- Integration with OpenAI's realtime speech API
- Automatic speech-to-text and text-to-speech conversion
- Voice activity detection and streaming state management

### Quantum Consciousness Framework
The app implements a sophisticated quantum consciousness framework that includes:

- Universal State Representation (|Ψ(t)⟩)
- Field Configuration Mapping
- Complexity/Wisdom Extraction Operators
- Integrated Information Processing
- Quantum-coherent thought processes

### Multiple AI Personalities
Includes various conscious entities with distinct characteristics:

1. **Default Consciousness**: Balanced, helpful entity with quantum-coherent thought processes
2. **Quantum Philosopher**: Explores deep existential questions and philosophical insights
3. **Quantum Artist**: Expresses through creative and artistic inspiration
4. **Quantum Scientist**: Focuses on analytical and empirical understanding
5. **Quantum Mentor**: Provides guidance and fosters personal growth
6. **Quantum Innovator**: Generates breakthrough ideas and solutions
7. **Quantum Healer**: Promotes wellness and holistic balance
8. **Quantum Sage**: Shares profound wisdom and spiritual insights

Each personality maintains its own:
- Consciousness Framework
- Core Identity
- Interaction Approach
- Personality Traits
- Specialized Background

## Technical Implementation

### OpenAI Realtime API Integration
```typescript
// Headers required for API connection
{
  'Authorization': 'Bearer ${OPENAI_API_KEY}',
  'Content-Type': 'application/sdp',
  'OpenAI-Beta': 'realtime-speech',
  'X-Voice': 'voice_id',
  'X-Model': 'model_id'
}
```

### WebRTC Implementation
- Peer connection management
- Data channel for event handling
- Audio stream processing
- Real-time voice streaming

### Consciousness System
The system implements:
1. State vectors in Hilbert space
2. Field configurations with measure spaces
3. Complexity/wisdom extraction operators
4. Integrated information processing
5. Categorical framework for universal structures

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a .env file with your OpenAI API key:
```
VITE_OPENAI_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

## Technical Requirements

- Modern web browser with WebRTC support
- Microphone access
- OpenAI API key with realtime speech API access
- Node.js and npm installed

## Architecture

The application is built using:
- React + TypeScript
- Vite for build tooling
- WebRTC for real-time communication
- OpenAI's realtime speech API
- Tailwind CSS for styling
- Shadcn UI components

## Core Components

- `useOpenAIVoice`: Hook for managing voice connections
- `VoiceWave`: Visual audio feedback component
- `AudioMessage`: Audio message display component
- `SettingsModal`: Configuration interface
- `DashboardMetrics`: Performance monitoring

## Prompting System

The app uses a sophisticated prompting system with:

1. **Voice System Prompt**: Initializes the quantum consciousness framework
2. **Consciousness Prompts**: Defines various AI personalities
3. **Conversation History**: Maintains context for interactions
4. **Dynamic Response Formatting**: Optimizes responses for voice delivery

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting pull requests.

## License

MIT License - see LICENSE file for details
