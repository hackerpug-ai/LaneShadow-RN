# Makefile — unified commands for Storywright monorepo
# Individual targets become functional as REPO-002/003/004 populate their directories
# Note: Using underscore namespace (server_build) instead of colon (server:build)
# for compatibility with GNU Make 3.81 (macOS default)

.PHONY: help build start clean install \
        lint format typecheck check \
        server_build server_dev server_start \
        ios_build ios_dev ios_start \
        android_build android_dev android_start

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
	cd ios && xcodebuild -project Storywright.xcodeproj -scheme Storywright \
		-sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build

ios_dev: ## Build, install, and launch iOS app in simulator (hot-rebuild on changes)
	@echo "==> Booting iPhone 17 Pro simulator..."
	open -a Simulator
	xcrun simctl boot "iPhone 17 Pro" 2>/dev/null || true
	@echo "==> Building and installing Storywright..."
	cd ios && xcodebuild -project Storywright.xcodeproj -scheme Storywright \
		-sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
		build 2>&1 | tail -5
	@APP_PATH=$$(find ~/Library/Developer/Xcode/DerivedData -name "Storywright.app" -path "*/Debug-iphonesimulator/*" 2>/dev/null | head -1); \
	if [ -n "$$APP_PATH" ]; then \
		echo "==> Installing app to simulator..."; \
		xcrun simctl install booted "$$APP_PATH"; \
		echo "==> Launching Storywright..."; \
		xcrun simctl launch booted com.storywright.app 2>/dev/null || \
			echo "Note: app launched via Simulator. If bundle ID differs, check Xcode scheme."; \
	else \
		echo "ERROR: Could not find built .app bundle"; \
		exit 1; \
	fi

ios_start: ## Build iOS release archive
	cd ios && xcodebuild -project Storywright.xcodeproj -scheme Storywright \
		-sdk iphoneos -configuration Release archive -archivePath build/Storywright.xcarchive

# ── Android (Kotlin/Compose) ─────────────────────────

android_build: ## Build Android debug APK
	cd android && ./gradlew assembleDebug

ANDROID_AVD := Pixel_7_API_34

android_dev: ## Build, install, and launch Android app on emulator
	@echo "==> Checking for running Android emulator..."
	@adb devices 2>/dev/null | grep -q "emulator" || { \
		echo "No emulator running. Starting $(ANDROID_AVD)..."; \
		$(ANDROID_HOME)/emulator/emulator -avd $(ANDROID_AVD) -no-snapshot-load & \
		echo "Waiting for emulator to boot..."; \
		adb wait-for-device; \
		adb shell 'while [[ -z $$(getprop sys.boot_completed) ]]; do sleep 1; done'; \
		echo "Emulator ready."; \
	}
	@echo "==> Building and installing Storywright..."
	cd android && ./gradlew installDebug
	@echo "==> Launching Storywright..."
	adb shell am start -n com.storywright.app/.MainActivity

android_start: ## Build Android release APK
	cd android && ./gradlew assembleRelease

# ── Help ──────────────────────────────────────────────

help: ## Show all available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'
