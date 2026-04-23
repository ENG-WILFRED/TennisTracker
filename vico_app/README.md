# VICO Flutter App

Flutter mobile application for the VICO Tennis Tracker Platform. Provides iOS, Android, Web, Windows, Linux, and macOS support.

## Features

- ✅ Real-time WebSocket communication
- ✅ Court booking system
- ✅ Player/Coach/Referee management
- ✅ Match tracking and scoring
- ✅ Organizational management
- ✅ Analytics dashboard
- ✅ Secure authentication (JWT)
- ✅ Offline support (cached data)
- ✅ Push notifications
- ✅ Multi-platform support

## Project Structure

```
lib/
├── main.dart                 # Entry point
├── constants/
│   └── theme.dart           # App colors, themes, styling
├── models/
│   └── models.dart          # Data models (Player, Coach, Match, etc.)
├── services/
│   ├── api_service.dart     # REST API client
│   ├── auth_service.dart    # Authentication logic
│   └── websocket_service.dart # Real-time WebSocket
├── screens/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── register_screen.dart
│   ├── dashboard/
│   │   └── dashboard_screen.dart
│   ├── players/
│   │   └── players_screen.dart
│   ├── coaches/
│   │   └── coaches_screen.dart
│   ├── matches/
│   │   └── matches_screen.dart
│   ├── courts/
│   │   └── courts_screen.dart
│   └── home_screen.dart
├── widgets/
│   └── (reusable UI components)
└── utils/
    └── extensions.dart      # Helper extensions

test/              # Unit & widget tests
android/           # Android native code
ios/               # iOS native code
web/               # Web configuration
windows/           # Windows native code
linux/             # Linux native code
macos/             # macOS native code
```

## Getting Started

### Prerequisites

- Flutter SDK (v3.22.0+)
- Dart SDK (v3.2.0+)
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

1. **Install Flutter dependencies:**

```bash
cd vico_app
flutter pub get
```

2. **Configure API endpoints** in `lib/services/api_service.dart`:

```dart
static const String baseUrl = 'http://localhost:3000/api';
static const String wsUrl = 'ws://localhost:3001';
```

3. **Update environment variables** in `.env`:

```
API_BASE_URL=http://localhost:3000/api
WS_BASE_URL=ws://localhost:3001
```

## Running the App

### Mobile Development

**Android:**
```bash
flutter run -d android
```

**iOS:**
```bash
flutter run -d ios
```

### Web
```bash
flutter run -d chrome
```

### Desktop

**Windows:**
```bash
flutter run -d windows
```

**Linux:**
```bash
flutter run -d linux
```

**macOS:**
```bash
flutter run -d macos
```

## Building for Release

### Android APK
```bash
flutter build apk --release
```

### iOS
```bash
flutter build ios --release
```

### Web
```bash
flutter build web --release
```

### Desktop Apps
```bash
flutter build windows --release
flutter build linux --release
flutter build macos --release
```

## API Integration

All API calls go through `ApiService`:

```dart
final apiService = Provider.of<ApiService>(context, listen: false);

// Fetch players
final players = await apiService.fetchPlayers();

// Get single player
final player = await apiService.getPlayer(playerId);

// Create booking
final booking = await apiService.createBooking({
  'courtId': courtId,
  'startTime': startTime,
  'endTime': endTime,
});
```

## Real-Time Features

WebSocket integration using `WebSocketService`:

```dart
final ws = WebSocketService(
  userId: userId,
  baseUrl: 'ws://localhost:3001',
);

await ws.connect();

// Subscribe to events
ws.subscribe('post-created', (data) {
  print('New post: ${data['title']}');
});
```

## Authentication

JWT-based authentication via `AuthService`:

```dart
final authService = Provider.of<AuthService>(context, listen: false);

// Login
await authService.login(email, password);

// Register
await authService.register({
  'firstName': firstName,
  'lastName': lastName,
  'email': email,
  'password': password,
  'role': role,
});

// Logout
await authService.logout();
```

## State Management

Using Provider for state management:

```dart
// Access services
Consumer<ApiService>(
  builder: (context, apiService, _) {
    // Use apiService
  },
)

// Access auth state
Consumer<AuthService>(
  builder: (context, authService, _) {
    if (authService.isAuthenticated) {
      // Show dashboard
    } else {
      // Show login
    }
  },
)
```

## Code Quality

Run linter checks:
```bash
flutter analyze
```

Format code:
```bash
dart format lib/
```

## Testing

Run tests:
```bash
flutter test
```

Run tests with coverage:
```bash
flutter test --coverage
```

## Troubleshooting

### Port Already in Use
If port 3000 or 3001 is already in use, update the URLs in `api_service.dart`.

### WebSocket Connection Failed
Ensure the WebSocket server is running on the configured port.

### SSL Certificate Issues
For development, disable SSL verification or use self-signed certificates.

## Deployment

### Firebase Hosting (Web)
```bash
flutter build web --release
firebase deploy
```

### Google Play (Android)
```bash
flutter build appbundle --release
# Upload to Google Play Console
```

### Apple App Store (iOS)
```bash
flutter build ios --release
# Upload via Xcode or Transporter
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `flutter analyze` and `flutter test`
4. Submit a pull request

## Documentation

- [Flutter Docs](https://flutter.dev/docs)
- [Provider Package](https://pub.dev/packages/provider)
- [HTTP Package](https://pub.dev/packages/http)
- [WebSocket Documentation](https://pub.dev/packages/web_socket_channel)

## License

This project is part of the VICO Tennis Tracker Platform.

## Support

For issues, questions, or feature requests, please contact the development team.
