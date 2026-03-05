# Vico App (Flutter)

This folder contains a starter Flutter app scaffold (`vico_app`) that is intended to call the existing TennisTracker web APIs directly (no server copy).

What I created:
- `pubspec.yaml` — minimal dependencies
- `lib/main.dart` — simple Material app and a home page that calls the API
- `lib/services/api_service.dart` — small HTTP client wrapper to call your web APIs
- `.gitignore` — basic ignores

Next steps (recommended):
1. Install Flutter on your machine: https://flutter.dev/docs/get-started/install
2. Change into the folder and run the Flutter create command to initialize native files (if you want full platform support):

```bash
cd vico_app
flutter create .
flutter pub get
flutter run
```

3. Update `lib/services/api_service.dart` `baseUrl` to point to your deployed TennisTracker URL (e.g. `https://app.example.com`). The starter uses `/api/*` paths to call endpoints on the web app.

Notes:
- I scaffolded a small UI that fetches players and displays them. Porting the whole Next.js UI to Flutter will require manual conversion of pages/components; I can continue porting key pages next if you want.
- If you want this to target web as well, run `flutter create .` and enable web via Flutter docs.

Tell me which pages to port next (e.g., Coaches list, Coach profile, Players list).