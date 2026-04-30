# Makefile — unified commands for LaneShadow monorepo
# Individual targets become functional as workstreams populate their directories
# Note: Using underscore namespace (server_build) instead of colon (server:build)
# for compatibility with GNU Make 3.81 (macOS default)

.PHONY: help build start clean install \
        lint format typecheck check \
        server_build server_dev server_start \
        e2e_vars \
        ios_build ios_dev ios_start ios_sandbox ios_sandbox_story ios_test \
        ios_e2e_vars ios_e2e_devices ios_e2e_headed ios_e2e_auth_headed \
        android_build android_dev android_start android_sandbox android_sandbox_story android_test \
        android_e2e_headed android_e2e_auth_headed \
        test

LANESHADOW_BUNDLE_ID ?= com.laneshadow.app

IOS_UDID ?= $(shell if command -v xcrun >/dev/null 2>&1; then xcrun xctrace list devices 2>/dev/null | sed '/^== Simulators ==/,$$d' | sed -nE 's/.*iPhone.*\(([0-9A-Fa-f-]{25,})\).*/\1/p' | head -1; fi)
IOS_E2E_RESULT_BUNDLE ?= ios/build/xcresults/ios-e2e-headed.xcresult
IOS_E2E_XCODEBUILD_LOG ?= ios/build/logs/ios-e2e-headed-xcodebuild.log

# ── All Projects ──────────────────────────────────────

build: server_build ios_build android_build ## Build all projects

start: server_start ios_start android_start ## Production builds for all projects

clean: ## Remove all build artifacts
	rm -rf server/node_modules
	cd android && ./gradlew clean 2>/dev/null || echo "Android not yet initialized"
	@echo "Cleaned all build artifacts"

install: ## Install all dependencies
	cd server && npm install 2>/dev/null || echo "Server not yet initialized"
	cd ios && xcodebuild -resolvePackageDependencies -project Storywright.xcodeproj -scheme Storywright 2>/dev/null || echo "iOS not yet initialized"
	cd android && ./gradlew dependencies 2>/dev/null || echo "Android not yet initialized"
	@echo "Installed all dependencies"

# ── Lint / Format / Typecheck ──────────────────────────

lint: ## Biome lint + format check (no writes)
	pnpm exec biome check server/

format: ## Biome format --write + organize imports
	pnpm exec biome check --write server/

typecheck: ## TypeScript typecheck via tsgo (Go compiler, ~10x faster)
	cd server && npx tsgo --noEmit

check: typecheck lint ## Run all checks (typecheck + lint)

# ── Server (Convex) ───────────────────────────────────

server_build: ## Typecheck server TypeScript
	cd server && npx tsc --noEmit

server_dev: ## Start Convex dev with hot-reload (Ctrl+C to quit)
	cd server && exec npx convex dev

server_start: ## Deploy to production Convex
	cd server && npx convex deploy

# ── iOS (Swift/SwiftUI) ──────────────────────────────

ios_build: ## Build iOS app for simulator
	@SIMULATOR_ID=$$(xcrun simctl list devices available | sed -nE 's/.*iPhone 16 \\(([A-F0-9-]+)\\).*/\\1/p' | head -1); \
	if [ -z "$$SIMULATOR_ID" ]; then \
		RUNTIME_ID=$$(xcrun simctl list runtimes -j | jq -r '.runtimes[] | select(.isAvailable == true and (.name | startswith("iOS"))) | .identifier' | head -1); \
		SIMULATOR_ID=$$(xcrun simctl create "iPhone 16" "com.apple.CoreSimulator.SimDeviceType.iPhone-16" "$$RUNTIME_ID"); \
	fi; \
	cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow \
		-derivedDataPath build/DerivedData \
		-destination "id=$$SIMULATOR_ID" build

ios_dev: ## Build, install, and launch iOS app in simulator (hot-rebuild on changes)
	@SIMULATOR_ID=$$(xcrun simctl list devices available | sed -nE 's/.*iPhone 16 \\(([A-F0-9-]+)\\).*/\\1/p' | head -1); \
	if [ -z "$$SIMULATOR_ID" ]; then \
		RUNTIME_ID=$$(xcrun simctl list runtimes -j | jq -r '.runtimes[] | select(.isAvailable == true and (.name | startswith("iOS"))) | .identifier' | head -1); \
		SIMULATOR_ID=$$(xcrun simctl create "iPhone 16" "com.apple.CoreSimulator.SimDeviceType.iPhone-16" "$$RUNTIME_ID"); \
	fi; \
	echo "==> Ensuring iPhone 16 simulator exists ($$SIMULATOR_ID)..."; \
	echo "==> Booting iPhone 16 simulator..."; \
	open -a Simulator; \
	xcrun simctl boot "$$SIMULATOR_ID" 2>/dev/null || true; \
	echo "==> Building and installing LaneShadow..."; \
	cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow \
		-derivedDataPath build/DerivedData \
		-destination "id=$$SIMULATOR_ID" \
		build 2>&1 | tail -5; \
	APP_PATH="build/DerivedData/Build/Products/Debug-iphonesimulator/LaneShadow.app"; \
	if [ -d "$$APP_PATH" ]; then \
		echo "==> Installing app to simulator..."; \
		xcrun simctl install "$$SIMULATOR_ID" "$$APP_PATH"; \
		echo "==> Launching LaneShadow..."; \
		xcrun simctl launch "$$SIMULATOR_ID" com.laneshadow.app 2>/dev/null || \
			echo "Note: app launched via Simulator. If bundle ID differs, check Xcode scheme."; \
	else \
		echo "ERROR: Could not find built .app bundle"; \
		exit 1; \
	fi

ios_start: ## Build iOS release archive
	cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow \
		-derivedDataPath build/DerivedData \
		-configuration Release \
		-destination 'generic/platform=iOS Simulator' \
		build

ios_sandbox: ## Launch iOS app into NativeSandbox (debug builds only)
	@SIMULATOR_ID=$$(xcrun simctl list devices available | sed -nE 's/.*iPhone 16 \(([A-F0-9-]+)\).*/\1/p' | head -1); \
	if [ -z "$$SIMULATOR_ID" ]; then \
		RUNTIME_ID=$$(xcrun simctl list runtimes -j | jq -r '.runtimes[] | select(.isAvailable == true and (.name | startswith("iOS"))) | .identifier' | head -1); \
		SIMULATOR_ID=$$(xcrun simctl create "iPhone 16" "com.apple.CoreSimulator.SimDeviceType.iPhone-16" "$$RUNTIME_ID"); \
	fi; \
	echo "==> Booting iPhone 16 simulator ($$SIMULATOR_ID)..."; \
	open -a Simulator; \
	xcrun simctl boot "$$SIMULATOR_ID" 2>/dev/null || true; \
	echo "==> Building LaneShadow (Debug)..."; \
	cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow \
		-derivedDataPath build/DerivedData \
		-destination "id=$$SIMULATOR_ID" \
		build 2>&1 | tail -5; \
	APP_PATH="build/DerivedData/Build/Products/Debug-iphonesimulator/LaneShadow.app"; \
	if [ ! -d "$$APP_PATH" ]; then echo "ERROR: missing $$APP_PATH"; exit 1; fi; \
	echo "==> Installing app..."; \
	xcrun simctl install "$$SIMULATOR_ID" "$$APP_PATH"; \
	echo "==> Launching sandbox (-LaneShadowSandbox)..."; \
	xcrun simctl launch "$$SIMULATOR_ID" com.laneshadow.app -LaneShadowSandbox

ios_sandbox_story: ## Launch iOS sandbox directly to one story (set STORY_ID=...)
	@if [ -z "$(STORY_ID)" ]; then echo "ERROR: set STORY_ID=<tier/component/state>"; exit 1; fi
	@SIMULATOR_ID=$$(xcrun simctl list devices available | sed -nE 's/.*iPhone 16 \(([A-F0-9-]+)\).*/\1/p' | head -1); \
	if [ -z "$$SIMULATOR_ID" ]; then \
		RUNTIME_ID=$$(xcrun simctl list runtimes -j | jq -r '.runtimes[] | select(.isAvailable == true and (.name | startswith("iOS"))) | .identifier' | head -1); \
		SIMULATOR_ID=$$(xcrun simctl create "iPhone 16" "com.apple.CoreSimulator.SimDeviceType.iPhone-16" "$$RUNTIME_ID"); \
	fi; \
	ENCODED_ID=$$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$(STORY_ID)"); \
	echo "==> Booting iPhone 16 simulator ($$SIMULATOR_ID)..."; \
	open -a Simulator; \
	xcrun simctl boot "$$SIMULATOR_ID" 2>/dev/null || true; \
	echo "==> Building LaneShadow (Debug)..."; \
	cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow \
		-derivedDataPath build/DerivedData \
		-destination "id=$$SIMULATOR_ID" \
		build 2>&1 | tail -5; \
	APP_PATH="build/DerivedData/Build/Products/Debug-iphonesimulator/LaneShadow.app"; \
	if [ ! -d "$$APP_PATH" ]; then echo "ERROR: missing $$APP_PATH"; exit 1; fi; \
	echo "==> Installing app..."; \
	xcrun simctl install "$$SIMULATOR_ID" "$$APP_PATH"; \
	echo "==> Opening sandbox story ($(STORY_ID))..."; \
	xcrun simctl openurl "$$SIMULATOR_ID" "laneshadow-sandbox://sandbox?id=$$ENCODED_ID"

ios_test: ## Run iOS unit tests
	@SIMULATOR_ID=$$(xcrun simctl list devices available | sed -nE 's/.*iPhone 16 \\(([A-F0-9-]+)\\).*/\\1/p' | head -1); \
	if [ -z "$$SIMULATOR_ID" ]; then \
		RUNTIME_ID=$$(xcrun simctl list runtimes -j | jq -r '.runtimes[] | select(.isAvailable == true and (.name | startswith("iOS"))) | .identifier' | head -1); \
		SIMULATOR_ID=$$(xcrun simctl create "iPhone 16" "com.apple.CoreSimulator.SimDeviceType.iPhone-16" "$$RUNTIME_ID"); \
	fi; \
	cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow \
		-derivedDataPath build/DerivedData \
		-destination "id=$$SIMULATOR_ID" \
		-only-testing:LaneShadowTests \
		-only-testing:LaneShadowUITests

e2e_vars: ## Show variables for headed iOS/Android E2E
	@set -a; \
	if [ -f .env.local ]; then . ./.env.local; fi; \
	set +a; \
	IOS_AUTH_EMAIL_VALUE="$${CLERK_TEST_EMAIL:-$${LANESHADOW_AUTH_EMAIL:-}}"; \
	IOS_AUTH_PASSWORD_VALUE="$${CLERK_TEST_PASSWORD:-$${LANESHADOW_AUTH_PASSWORD:-}}"; \
	IOS_DEVELOPMENT_TEAM_VALUE="$${IOS_DEVELOPMENT_TEAM:-$${DEVELOPMENT_TEAM:-$${APPLE_DEVELOPMENT_TEAM:-}}}"; \
	echo "Headed iOS E2E variables:"; \
	echo "  IOS_UDID=$(if $(IOS_UDID),$(IOS_UDID),<auto: no real iPhone detected>)"; \
	echo "  LANESHADOW_BUNDLE_ID=$(LANESHADOW_BUNDLE_ID)"; \
	echo "  IOS_E2E_RESULT_BUNDLE=$(IOS_E2E_RESULT_BUNDLE)"; \
	echo "  IOS_E2E_XCODEBUILD_LOG=$(IOS_E2E_XCODEBUILD_LOG)"; \
	echo "  IOS_DEVELOPMENT_TEAM=$$(if [ -n "$$IOS_DEVELOPMENT_TEAM_VALUE" ]; then echo "$$IOS_DEVELOPMENT_TEAM_VALUE"; else echo '<empty>'; fi)"; \
	echo "  CLERK_TEST_EMAIL=$$IOS_AUTH_EMAIL_VALUE"; \
	echo "  CLERK_TEST_PASSWORD=$$(if [ -n "$$IOS_AUTH_PASSWORD_VALUE" ]; then echo '<set>'; else echo '<empty>'; fi)"
	@echo ""
	@echo "List devices:"
	@echo "  make ios_e2e_devices"
	@echo ""
	@echo "Run headed E2E:"
	@echo "  make ios_e2e_headed"
	@echo "  # auto-detects IOS_UDID with xcrun xctrace and reads CLERK_TEST_EMAIL / CLERK_TEST_PASSWORD from .env.local"
	@echo "  # override with IOS_UDID=<device-udid> when needed"
	@echo ""
	@echo "Headed Android E2E variables:"
	@echo "  ANDROID_SERIAL=$(ANDROID_SERIAL)"
	@echo "  ANDROID_AVD=$(ANDROID_AVD)"
	@echo "  ANDROID_PACKAGE=$(ANDROID_PACKAGE)"
	@echo "  ANDROID_ACTIVITY=$(ANDROID_ACTIVITY)"
	@echo "  ANDROID_E2E_INSTALL=$(ANDROID_E2E_INSTALL)"
	@echo "  ANDROID_E2E_TEST_CLASSES=$(ANDROID_E2E_TEST_CLASSES)"
	@echo ""
	@echo "Run headed E2E:"
	@echo "  make android_e2e_headed"
	@echo "  make android_e2e_headed ANDROID_SERIAL=<adb-serial>"

ios_e2e_vars: e2e_vars ## Show variables for headed iOS/Android E2E

ios_e2e_devices: ## List connected iOS devices for IOS_UDID
	@command -v xcrun >/dev/null || { echo "ERROR: xcrun is missing"; exit 1; }
	@xcrun xctrace list devices | sed '/^== Simulators ==/,$$d'

ios_e2e_headed: ## Run headed iOS E2E on a real device (set IOS_UDID=...)
	@if [ -z "$(IOS_UDID)" ]; then \
		echo "ERROR: no iOS device detected. Connect/unlock an iPhone, trust this Mac, then run: make ios_e2e_devices"; \
		echo "       Or pass one explicitly: make ios_e2e_headed IOS_UDID=<device-udid>"; \
		exit 1; \
	fi
	@command -v xcodebuild >/dev/null || { echo "ERROR: xcodebuild is missing"; exit 1; }
	@command -v xcrun >/dev/null || { echo "ERROR: xcrun is missing"; exit 1; }
	@echo "==> Running native iOS XCUITest on device $(IOS_UDID)..."
	@set -eu; \
	set -a; \
	if [ -f .env.local ]; then . ./.env.local; fi; \
	set +a; \
	IOS_AUTH_EMAIL_VALUE="$${CLERK_TEST_EMAIL:-$${LANESHADOW_AUTH_EMAIL:-}}"; \
	IOS_AUTH_PASSWORD_VALUE="$${CLERK_TEST_PASSWORD:-$${LANESHADOW_AUTH_PASSWORD:-}}"; \
	IOS_DEVELOPMENT_TEAM_VALUE="$${IOS_DEVELOPMENT_TEAM:-$${DEVELOPMENT_TEAM:-$${APPLE_DEVELOPMENT_TEAM:-}}}"; \
	if [ -z "$$IOS_AUTH_EMAIL_VALUE" ] || [ -z "$$IOS_AUTH_PASSWORD_VALUE" ]; then \
		echo "ERROR: add CLERK_TEST_EMAIL and CLERK_TEST_PASSWORD to .env.local for ios_e2e_headed."; \
		exit 1; \
	fi; \
	if [ -z "$$IOS_DEVELOPMENT_TEAM_VALUE" ]; then \
		echo "ERROR: add IOS_DEVELOPMENT_TEAM=<Apple Team ID> to .env.local for real-device signing."; \
		exit 1; \
	fi; \
	echo "==> Using Apple development team $$IOS_DEVELOPMENT_TEAM_VALUE"; \
	echo "==> CLERK_TEST_EMAIL=$$IOS_AUTH_EMAIL_VALUE"; \
	echo "==> CLERK_TEST_PASSWORD=<set>"; \
	mkdir -p ios/build/xcresults ios/build/logs; \
	rm -rf "$(IOS_E2E_RESULT_BUNDLE)"; \
	rm -f "$(IOS_E2E_XCODEBUILD_LOG)"; \
	RESULT_BUNDLE_REL=$$(printf '%s\n' "$(IOS_E2E_RESULT_BUNDLE)" | sed 's#^ios/##'); \
	LOG_REL=$$(printf '%s\n' "$(IOS_E2E_XCODEBUILD_LOG)" | sed 's#^ios/##'); \
	cd ios; \
	set +e; \
	xcodebuild test \
		-project LaneShadow.xcodeproj \
		-scheme LaneShadow \
		-destination "id=$(IOS_UDID)" \
		-only-testing:LaneShadowUITests/AuthEmailPasswordE2ETests/testEmailPasswordSignInAndRestoresSession \
		-resultBundlePath "$$RESULT_BUNDLE_REL" \
		DEVELOPMENT_TEAM="$$IOS_DEVELOPMENT_TEAM_VALUE" \
		CODE_SIGN_STYLE=Automatic \
		-allowProvisioningUpdates > "$$LOG_REL" 2>&1; \
	XCODEBUILD_STATUS=$$?; \
	set -e; \
	cat "$$LOG_REL"; \
	exit "$$XCODEBUILD_STATUS"

ios_e2e_auth_headed: ios_e2e_headed ## Alias for ios_e2e_headed

# ── Android (Kotlin/Compose) ─────────────────────────

android_build: ## Build Android debug APK
	cd android && ./gradlew assembleDebug

ANDROID_PACKAGE := com.laneshadow.app
ANDROID_ACTIVITY := com.laneshadow.MainActivity
ANDROID_AVD ?= $(shell emulator -list-avds | head -n 1)
ANDROID_SERIAL ?=
ANDROID_E2E_INSTALL ?= 1
ANDROID_E2E_TEST_CLASSES ?= com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest

android_dev: ## Build, install, and launch Android app on emulator
	@echo "==> Checking for running Android emulator..."
	@adb devices 2>/dev/null | grep -q "emulator" || { \
		if [ -z "$(ANDROID_AVD)" ]; then \
			echo "ERROR: No Android AVD found. Create one in Android Studio first."; \
			exit 1; \
		fi; \
		echo "No emulator running. Starting $(ANDROID_AVD)..."; \
		emulator -avd $(ANDROID_AVD) -no-snapshot-load & \
		echo "Waiting for emulator to boot..."; \
		adb wait-for-device; \
		adb shell 'while [[ -z $$(getprop sys.boot_completed) ]]; do sleep 1; done'; \
		echo "Emulator ready."; \
	}
	@echo "==> Building and installing LaneShadow..."
	cd android && ./gradlew installDebug
	@echo "==> Launching LaneShadow..."
	adb shell am start -W -n $(ANDROID_PACKAGE)/$(ANDROID_ACTIVITY)

android_start: ## Build Android release APK
	cd android && ./gradlew assembleRelease

android_sandbox: ## Launch Android app into NativeSandbox (debug builds only)
	@echo "==> Checking for running Android emulator..."
	@adb devices 2>/dev/null | grep -q "emulator" || { \
		if [ -z "$(ANDROID_AVD)" ]; then \
			echo "ERROR: No Android AVD found. Create one in Android Studio first."; \
			exit 1; \
		fi; \
		echo "No emulator running. Starting $(ANDROID_AVD)..."; \
		emulator -avd $(ANDROID_AVD) -no-snapshot-load & \
		echo "Waiting for emulator to boot..."; \
		adb wait-for-device; \
		adb shell 'while [[ -z $$(getprop sys.boot_completed) ]]; do sleep 1; done'; \
		echo "Emulator ready."; \
	}
	@echo "==> Building and installing LaneShadow (debug)..."
	cd android && ./gradlew installDebug
	@echo "==> Launching sandbox (extra: com.laneshadow.extra.OPEN_SANDBOX=true)..."
	adb shell am start -W \
		-n $(ANDROID_PACKAGE)/$(ANDROID_ACTIVITY) \
		--ez com.laneshadow.extra.OPEN_SANDBOX true

android_sandbox_story: ## Launch Android sandbox directly to one story (set STORY_ID=...)
	@if [ -z "$(STORY_ID)" ]; then echo "ERROR: set STORY_ID=<tier/component/state>"; exit 1; fi
	@echo "==> Checking for running Android emulator..."
	@adb devices 2>/dev/null | grep -q "emulator" || { \
		if [ -z "$(ANDROID_AVD)" ]; then \
			echo "ERROR: No Android AVD found. Create one in Android Studio first."; \
			exit 1; \
		fi; \
		echo "No emulator running. Starting $(ANDROID_AVD)..."; \
		emulator -avd $(ANDROID_AVD) -no-snapshot-load & \
		echo "Waiting for emulator to boot..."; \
		adb wait-for-device; \
		adb shell 'while [[ -z $$(getprop sys.boot_completed) ]]; do sleep 1; done'; \
		echo "Emulator ready."; \
	}
	@echo "==> Building and installing LaneShadow (debug)..."
	cd android && ./gradlew installDebug
	@ENCODED_ID=$$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$(STORY_ID)"); \
	echo "==> Opening sandbox story ($(STORY_ID))..."; \
	adb shell am start -W \
		-a android.intent.action.VIEW \
		-d "app-sandbox://sandbox?id=$$ENCODED_ID"

android_test: ## Run Android instrumented tests
	cd android && ./gradlew connectedDebugAndroidTest

android_e2e_headed: ## Run headed Android E2E on a device/emulator
	@command -v adb >/dev/null || { echo "ERROR: adb is missing"; exit 1; }
	@echo "==> Checking for a connected Android device/emulator..."
	@adb devices 2>/dev/null | awk 'NR > 1 && $$2 == "device" { found = 1 } END { exit found ? 0 : 1 }' || { \
		if [ -z "$(ANDROID_AVD)" ]; then \
			echo "ERROR: No Android device/emulator connected and no ANDROID_AVD found. Create one in Android Studio or set ANDROID_AVD=<name>."; \
			exit 1; \
		fi; \
		echo "No Android device found. Starting headed emulator $(ANDROID_AVD)..."; \
		emulator -avd "$(ANDROID_AVD)" -no-snapshot-load & \
		adb wait-for-device; \
		adb shell 'while [[ -z $$(getprop sys.boot_completed) ]]; do sleep 1; done'; \
		echo "Emulator ready."; \
	}
	@if [ "$(ANDROID_E2E_INSTALL)" = "1" ]; then \
		echo "==> Building and installing Android debug app..."; \
		set -a; \
		if [ -f .env.local ]; then . ./.env.local; fi; \
		set +a; \
		cd android && ./gradlew installDebug; \
	fi
	@echo "==> Launching LaneShadow before instrumentation..."
	@ADB_CMD="adb"; \
	if [ -n "$(ANDROID_SERIAL)" ]; then ADB_CMD="adb -s $(ANDROID_SERIAL)"; fi; \
	$$ADB_CMD shell am start -W -n "$(ANDROID_PACKAGE)/$(ANDROID_ACTIVITY)"
	@echo "==> Running Android auth instrumentation: $(ANDROID_E2E_TEST_CLASSES)"
	@set -a; \
	if [ -f .env.local ]; then . ./.env.local; fi; \
	set +a; \
	cd android && if [ -n "$(ANDROID_SERIAL)" ]; then \
		ANDROID_SERIAL="$(ANDROID_SERIAL)" ./gradlew :app:connectedDebugAndroidTest \
			-Pandroid.testInstrumentationRunnerArguments.class="$(ANDROID_E2E_TEST_CLASSES)"; \
	else \
		./gradlew :app:connectedDebugAndroidTest \
			-Pandroid.testInstrumentationRunnerArguments.class="$(ANDROID_E2E_TEST_CLASSES)"; \
	fi

android_e2e_auth_headed: android_e2e_headed ## Alias for android_e2e_headed

test: ## Run all platform tests (iOS + Android)
	@echo "Running iOS tests..."
	$(MAKE) ios_test
	@echo "Running Android tests..."
	$(MAKE) android_test

# ── Help ──────────────────────────────────────────────

help: ## Show all available commands
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'
