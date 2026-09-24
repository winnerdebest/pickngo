# PickNGo Mobile Application (Expo & React Native)

Cross-platform iOS and Android mobile app for **PickNGo** — Nigerian bike-based errands and delivery service.

## Architecture Overview

- **Framework**: Expo SDK 57 (React Native 0.86) + TypeScript
- **Navigation**: Expo Router (file-based routing in `app/`)
- **Theme & Dark Mode**: `ThemeContext` (`src/context/ThemeContext.tsx`, `src/constants/theme.ts`) with Dark Mode as default matching `#121212` brand matte background, toggleable in Profile settings
- **Icons**: Professional `@expo/vector-icons` (Ionicons, Feather, MaterialCommunityIcons via `src/components/Icon.tsx`), replacing all emojis
- **State Management**: React Context (`src/context/AuthContext.tsx`) persisted with `expo-secure-store`
- **Networking**: Axios (`src/api/client.ts`) with custom error interceptor
- **Real-Time Updates**: Native WebSockets with auto-reconnection (`src/utils/websocket.ts`, `src/hooks/useTaskWebSocket.ts`, `src/hooks/useAvailableTasksWebSocket.ts`)

---

## Brand System & Colors

- **Matte Charcoal Black** (`#121212`): Official brand dark tone, background, elevated cards (`#1C1C20`, `#24242A`)
- **Electric Speed Coral** (`#FF5733`): Official accent tone for delivery bike emblem, wordmark accent (`PickNGo`), buttons, active states, live indicators
- **Surfaces**: Theme-adaptive dark surfaces (`#1C1C20`), borders (`#2C2C34`), light mode alternatives
- **Status Colors**: Success Green (`#10B981`), Warning Amber (`#F59E0B`), Error Red (`#EF4444`)
- **Logo Component**: `src/components/Logo.tsx` rendering official logo assets (`assets/logo.png`)
- **Vector Icons**: `src/components/Icon.tsx` rendering clean glyphs across tabs, forms, lists, and status indicators

---

## Directory Structure

```
mobile/
├── app/                          # Expo Router file-based screens
│   ├── _layout.tsx               # Root layout (AuthProvider, SafeArea, StatusBar)
│   ├── index.tsx                 # Splash/entry redirect based on auth & role
│   ├── (auth)/                   # Auth stack
│   │   ├── _layout.tsx
│   │   ├── login.tsx             # Email login with Customer/Runner toggle
│   │   ├── signup.tsx            # Full registration form
│   │   └── role-select.tsx       # Customer vs Runner role selection (+ bike plate)
│   ├── (customer)/               # Customer flow (Tab + nested screens)
│   │   ├── _layout.tsx           # Customer tab navigation
│   │   ├── index.tsx             # Customer Home (Post task, active order, quick categories)
│   │   ├── create-task.tsx       # Task creation with live fee calculations
│   │   ├── fund-task.tsx         # Escrow lock payment summary
│   │   ├── track-task.tsx        # Real-time WebSocket task tracker & dispute
│   │   ├── confirm-rate.tsx      # Delivery confirmation & 5-star rating
│   │   ├── history.tsx           # Task history with status tabs
│   │   └── profile.tsx           # Profile info, role switcher, logout
│   └── (runner)/                 # Runner flow (Tab + nested screens)
│       ├── _layout.tsx           # Runner tab navigation
│       ├── index.tsx             # Live WebSocket available tasks feed
│       ├── task-detail.tsx       # Task breakdown, trust-tier validation & Accept action
│       ├── active-task.tsx       # Step-by-step active errand executor
│       ├── history.tsx           # Completed runs & earnings summary
│       └── profile.tsx           # Trust tier (Bronze->Platinum), trust score, stats
└── src/
    ├── api/                      # Backend API clients & TypeScript types
    │   ├── client.ts             # Axios instance configured for Render backend
    │   ├── customers.ts          # Customer endpoints
    │   ├── runners.ts            # Runner endpoints
    │   ├── tasks.ts              # Task & escrow lifecycle endpoints
    │   └── types.ts              # Complete schema definitions
    ├── constants/
    │   ├── colors.ts             # Centralized design tokens
    │   └── config.ts             # API & WebSocket URLs (https://pickngo.onrender.com)
    ├── context/
    │   └── AuthContext.tsx        # Session management & SecureStore persistence
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useTaskWebSocket.ts
    │   └── useAvailableTasksWebSocket.ts
    ├── components/               # Reusable UI component library
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   ├── StatusBadge.tsx
    │   ├── TrustBadge.tsx
    │   ├── StarRating.tsx
    │   ├── LiveIndicator.tsx
    │   ├── TaskCard.tsx
    │   ├── LoadingOverlay.tsx
    │   ├── ErrorMessage.tsx
    │   ├── EmptyState.tsx
    │   └── Header.tsx
    └── utils/
        ├── formatters.ts         # Naira currency (₦) & date helpers
        └── websocket.ts          # WebSocket client with exponential backoff & heartbeat
```

---

## Live Endpoints & Real-Time WebSockets

- **API Base URL**: `https://pickngo.onrender.com/api/v1`
- **WebSocket Base URL**: `wss://pickngo.onrender.com`
  - `/ws/tasks/{task_id}`: Customer & runner live status sync
  - `/ws/available-tasks`: Real-time available task broadcast for runners

---

## Development Commands

```bash
# Start local development server
npm start

# Run on Android emulator / device
npm run android

# Run on iOS simulator / device
npm run ios

# Run web preview
npm run web
```
