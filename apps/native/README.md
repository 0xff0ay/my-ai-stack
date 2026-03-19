# My AI Stack - Native Mobile App

React Native mobile application for the AI Agent platform.

## Features

- **Cross-platform** - iOS and Android support via Expo
- **Real-time Chat** - WebSocket streaming conversations
- **Agent Control** - Manage agents on the go
- **Voice Interface** - Speech-to-text input (planned)
- **Push Notifications** - Smart notifications

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Expo Router** - File-based routing

## Directory Structure

```
app/
├── (tabs)/               # Tab navigation screens
│   ├── index.tsx        # Home/chat screen
│   ├── agents.tsx       # Agent list
│   └── settings.tsx     # Settings
├── components/           # React components
├── hooks/               # Custom hooks
└── lib/                 # Utilities
```

## Development

```bash
# Install dependencies
bun install

# Start Expo development server
bun run dev

# Run on iOS simulator
bun run ios

# Run on Android emulator
bun run android
```

## Environment Variables

```env
EXPO_PUBLIC_API_URL="https://api.my-aistack.com"
EXPO_PUBLIC_WS_URL="wss://api.my-aistack.com"
```

## Building

```bash
# Build for production
bun run build

# Submit to app stores
bun run submit
```
