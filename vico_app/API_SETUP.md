# TennisTracker Flutter App - Configuration Guide

## Setup Instructions

### 1. Update the API Base URL
All Flutter pages use `ApiService` which requires a base URL. Update this in each page file:

Replace: `https://your-tennistracker-domain.com` with your actual TennisTracker web domain.

Files to update:
- `lib/main.dart`
- `lib/pages/*.dart`
- `lib/services/*.dart`

### 2. Required Backend API Endpoints

Ensure the following endpoints are available on your web server:

#### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

#### Coaches
- `GET /api/coaches` - List all coaches
- `GET /api/coaches/[id]` - Get coach details
- `POST /api/coaches/employ` - Employ a coach

#### Players
- `GET /api/players` - List all players
- `GET /api/players/[id]` - Get player details

#### Matches
- `GET /api/matches` - List all matches
- `GET /api/matches/[id]` - Get match details

#### Organizations
- `GET /api/organization` - List organizations
- `POST /api/organization` - Create organization (auth required)
- `GET /api/organization/[orgId]` - Get organization details
- `GET /api/organization/[orgId]/staff` - List staff members
- `GET /api/organization/[orgId]/inventory` - List inventory items

#### Chat
- `WebSocket /api/chat/ws` - Real-time chat connection

#### Referees
- `GET /api/referees` - List all referees

### 3. Token Management

The app uses `SharedPreferences` to store JWT tokens locally. Tokens are automatically included in all authenticated requests via the `Authorization: Bearer {token}` header.

### 4. API Service Configuration

Edit `lib/services/api_service.dart` to modify default headers or error handling as needed.

### 5. Testing the App

Run the Flutter app with:
```bash
flutter run
```

First page will be login. Use credentials from the TennisTracker web backend.

## Architecture

- **ApiService** (`lib/services/api_service.dart`) - HTTP client with auth token support
- **AuthService** (`lib/services/auth_service.dart`) - Login/logout logic
- **Pages** (`lib/pages/`) - UI screens for each feature
- **Main App** (`lib/main.dart`) - Entry point with navigation drawer

## Styling

Match colors and layouts to the web design:
- Gradient headers use `Colors.blue.shade600` and `Colors.indigo.shade600`
- Card-based layouts for list items
- Floating action buttons for primary actions
- Material Design guidelines
