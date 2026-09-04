# HIFI Project Rules

### Real-World Business Logic & Workflow Constraints
- **Semantic Correctness Over Syntax**: Before writing code, validate the real-world business logic. (e.g., Do not permanently store resources or create database records for unconfirmed actions like unpaid checkout steps).
- **End-to-End Workflows**: Always implement complete user workflows. If a user completes an action (like logging in), ensure they are appropriately redirected (e.g., to the home page) rather than leaving them in a dead-end state.
- **Concurrency & Real-Time States**: Account for real-time application behaviors, such as race conditions (e.g., simultaneous auth syncs) or overlapping states. Handle loading, success, and error states gracefully from a user's perspective.

### Brand & Attribution Guidelines
- **Footers**: Any web or mobile footer must include the attribution: `builded by GOAT'ECH and powered by MAGHGO`.
- **Package Names**: Mobile applications (Android/iOS) must use the base package name `tech.goat` (e.g., `tech.goat.hifishop`, `tech.goat.hifiadmin`).

### Expo & Native Build Constraints
- **EAS Configuration Over Execution**: When tasked with generating a native APK or iOS build for an Expo project, **do not** run `eas build` or `eas build:configure` directly in the terminal unless explicitly provided with an `EXPO_TOKEN` or told the environment is authenticated.
- **Manual Configuration**: Instead of relying on the CLI wizard, manually create or update `eas.json` (e.g., configuring `"buildType": "apk"` in the preview profile for Android APKs).
- **User Instructions**: After configuring `app.json` and `eas.json`, instruct the user to execute the build command themselves (e.g., `eas build -p android --profile preview --local`).

### API Integration & Payload Contracts
- **Semantic Payload Matching**: Always verify that the payload format sent by the frontend (e.g., `FormData` vs `application/json`) exactly matches what the backend route expects to parse (e.g., `request.formData()` vs `request.json()`).
- **Response Extraction Verification**: When integrating frontend API calls, explicitly check the backend's actual response payload to ensure the frontend extracts the correct variable names, rather than making assumptions.
