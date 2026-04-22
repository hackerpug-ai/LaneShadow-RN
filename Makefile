# Makefile — unified commands for LaneShadow monorepo
# Individual targets become functional as workstreams populate their directories
# Note: Using underscore namespace (server_build) instead of colon (server:build)
# for compatibility with GNU Make 3.81 (macOS default)

.PHONY: help build start clean install \
        lint format typecheck check \
        server_build server_dev server_start \
        ios_build ios_dev ios_start ios_sandbox ios_sandbox_story ios_test \
        android_build android_dev android_start android_sandbox android_sandbox_story android_test \
        test

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
		-only-testing:LaneShadowTests

# ── Android (Kotlin/Compose) ─────────────────────────

android_build: ## Build Android debug APK
	cd android && ./gradlew assembleDebug

ANDROID_PACKAGE := com.laneshadow.app
ANDROID_ACTIVITY := com.laneshadow.MainActivity
ANDROID_AVD ?= $(shell emulator -list-avds | head -n 1)

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

test: ## Run all platform tests (iOS + Android)
	@echo "Running iOS tests..."
	$(MAKE) ios_test
	@echo "Running Android tests..."
	$(MAKE) android_test

# ── Help ──────────────────────────────────────────────

help: ## Show all available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'
