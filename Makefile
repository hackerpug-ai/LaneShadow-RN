# Makefile — unified commands for LaneShadow monorepo
# Individual targets become functional as workstreams populate their directories
# Note: Using underscore namespace (server_build) instead of colon (server:build)
# for compatibility with GNU Make 3.81 (macOS default)

.PHONY: help build start clean install \
        lint format typecheck check \
        server_build server_dev server_start \
        e2e_vars \
        ios_build ios_dev ios_start ios_sandbox ios_sandbox_story ios_test \
        ios_e2e_vars ios_e2e_devices ios_e2e_install_device ios_e2e_wda_status ios_e2e_headed ios_e2e_auth_headed \
        android_build android_dev android_start android_sandbox android_sandbox_story android_test \
        android_e2e_headed android_e2e_auth_headed \
        test

LANESHADOW_BUNDLE_ID ?= com.laneshadow.app

IOS_UDID ?= $(shell if command -v ios >/dev/null 2>&1 && command -v node >/dev/null 2>&1; then ios list 2>/dev/null | node -e 'let input = ""; process.stdin.on("data", (chunk) => input += chunk); process.stdin.on("end", () => { try { const parsed = JSON.parse(input); const devices = Array.isArray(parsed) ? parsed : (parsed.deviceList || []); const device = devices[0]; if (typeof device === "string") process.stdout.write(device); else if (device) process.stdout.write(device.udid || device.UDID || device.identifier || device.DeviceIdentifier || ""); } catch {} });'; fi)
IOS_WDA_PORT ?= 8100
WDA_BASE_URL ?= http://127.0.0.1:$(IOS_WDA_PORT)
IOS_E2E_FLOW ?= ios/E2E/sprint-03-auth-remediation.js
IOS_E2E_INSTALL ?= 1
IOS_DEVICE_APP_PATH ?= ios/build/DerivedData/Build/Products/Debug-iphoneos/LaneShadow.app
IOS_DEVELOPMENT_TEAM ?= $(shell security find-identity -v -p codesigning 2>/dev/null | sed -nE 's/.*"Apple Development:.*\(([A-Z0-9]{10})\)".*/\1/p' | head -1)
LANESHADOW_AUTH_PROVIDER ?= apple
LANESHADOW_AUTH_EMAIL ?=
LANESHADOW_AUTH_PASSWORD ?=
LANESHADOW_AUTH_DISPLAY_NAME ?= Auth Remediation Reviewer

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
	LANESHADOW_AUTH_EMAIL_VALUE="$${LANESHADOW_AUTH_EMAIL:-$${CLERK_TEST_EMAIL:-}}"; \
	LANESHADOW_AUTH_PASSWORD_VALUE="$${LANESHADOW_AUTH_PASSWORD:-$${CLERK_TEST_PASSWORD:-}}"; \
	IOS_DEVELOPMENT_TEAM_VALUE="$${IOS_DEVELOPMENT_TEAM:-$${DEVELOPMENT_TEAM:-$${APPLE_DEVELOPMENT_TEAM:-$(IOS_DEVELOPMENT_TEAM)}}}"; \
	echo "Headed iOS E2E variables:"; \
	echo "  IOS_UDID=$(if $(IOS_UDID),$(IOS_UDID),<auto: no device detected>)"; \
	echo "  IOS_WDA_PORT=$(IOS_WDA_PORT)"; \
	echo "  WDA_BASE_URL=$(WDA_BASE_URL)"; \
	echo "  LANESHADOW_BUNDLE_ID=$(LANESHADOW_BUNDLE_ID)"; \
	echo "  IOS_E2E_FLOW=$(IOS_E2E_FLOW)"; \
	echo "  IOS_E2E_INSTALL=$(IOS_E2E_INSTALL)"; \
	echo "  IOS_DEVICE_APP_PATH=$(IOS_DEVICE_APP_PATH)"; \
	echo "  IOS_DEVELOPMENT_TEAM=$$(if [ -n "$$IOS_DEVELOPMENT_TEAM_VALUE" ]; then echo "$$IOS_DEVELOPMENT_TEAM_VALUE"; else echo '<empty>'; fi)"; \
	echo "  LANESHADOW_AUTH_PROVIDER=$(LANESHADOW_AUTH_PROVIDER)"; \
	echo "  LANESHADOW_AUTH_EMAIL=$$LANESHADOW_AUTH_EMAIL_VALUE"; \
	echo "  LANESHADOW_AUTH_PASSWORD=$$(if [ -n "$$LANESHADOW_AUTH_PASSWORD_VALUE" ]; then echo '<set>'; else echo '<empty>'; fi)"; \
	echo "  CLERK_TEST_EMAIL=$${CLERK_TEST_EMAIL:-}"; \
	echo "  CLERK_TEST_PASSWORD=$$(if [ -n "$${CLERK_TEST_PASSWORD:-}" ]; then echo '<set>'; else echo '<empty>'; fi)"; \
	echo "  LANESHADOW_AUTH_DISPLAY_NAME=$(LANESHADOW_AUTH_DISPLAY_NAME)"
	@echo ""
	@echo "List devices:"
	@echo "  make ios_e2e_devices"
	@echo ""
	@echo "Run headed E2E:"
	@echo "  make ios_e2e_headed"
	@echo "  # auto-detects IOS_UDID and reads CLERK_TEST_EMAIL / CLERK_TEST_PASSWORD from .env.local"
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
	@command -v ios >/dev/null || { echo "ERROR: go-ios is missing. Install with: npm install -g go-ios"; exit 1; }
	ios list

ios_e2e_install_device: ## Build and install iOS app on a real device (set IOS_UDID=...)
	@if [ -z "$(IOS_UDID)" ]; then \
		echo "ERROR: no iOS device detected. Connect/unlock an iPhone, trust this Mac, then run: make ios_e2e_devices"; \
		echo "       Or pass one explicitly: make ios_e2e_headed IOS_UDID=<device-udid>"; \
		exit 1; \
	fi
	@command -v xcodebuild >/dev/null || { echo "ERROR: xcodebuild is missing"; exit 1; }
	@command -v xcrun >/dev/null || { echo "ERROR: xcrun is missing"; exit 1; }
	@echo "==> Building LaneShadow for device $(IOS_UDID)..."
	@set -e; \
	set -a; \
	if [ -f .env.local ]; then . ./.env.local; fi; \
	set +a; \
	IOS_DEVELOPMENT_TEAM_VALUE="$${IOS_DEVELOPMENT_TEAM:-$${DEVELOPMENT_TEAM:-$${APPLE_DEVELOPMENT_TEAM:-$(IOS_DEVELOPMENT_TEAM)}}}"; \
	if [ -z "$$IOS_DEVELOPMENT_TEAM_VALUE" ]; then \
		echo "WARN: IOS_DEVELOPMENT_TEAM is empty. Add IOS_DEVELOPMENT_TEAM=<Apple Team ID> to .env.local if signing fails."; \
	else \
		echo "==> Using Apple development team $$IOS_DEVELOPMENT_TEAM_VALUE"; \
		if ! defaults read com.apple.dt.Xcode IDEProvisioningTeams 2>/dev/null | grep -q "$$IOS_DEVELOPMENT_TEAM_VALUE"; then \
			echo "WARN: Team $$IOS_DEVELOPMENT_TEAM_VALUE is not visible in Xcode provisioning accounts."; \
			echo "      If xcodebuild reports 'No Account for Team', add the Apple ID in Xcode Settings > Accounts or set IOS_DEVELOPMENT_TEAM to a team that is signed into Xcode."; \
		fi; \
	fi; \
	cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow \
		-derivedDataPath build/DerivedData \
		-destination "id=$(IOS_UDID)" \
		$${IOS_DEVELOPMENT_TEAM_VALUE:+DEVELOPMENT_TEAM=$$IOS_DEVELOPMENT_TEAM_VALUE} \
		CODE_SIGN_STYLE=Automatic \
		-allowProvisioningUpdates \
		build
	@if [ ! -d "$(IOS_DEVICE_APP_PATH)" ]; then \
		echo "ERROR: missing $(IOS_DEVICE_APP_PATH)"; \
		exit 1; \
	fi
	@echo "==> Installing $(IOS_DEVICE_APP_PATH) on $(IOS_UDID)..."
	xcrun devicectl device install app --device "$(IOS_UDID)" "$(IOS_DEVICE_APP_PATH)"

ios_e2e_wda_status: ## Check local WDA status endpoint
	@curl -fsS "$(WDA_BASE_URL)/status"

ios_e2e_headed: ## Run headed iOS E2E on a real device (set IOS_UDID=...)
	@if [ -z "$(IOS_UDID)" ]; then \
		echo "ERROR: no iOS device detected. Connect/unlock an iPhone, trust this Mac, then run: make ios_e2e_devices"; \
		echo "       Or pass one explicitly: make ios_e2e_headed IOS_UDID=<device-udid>"; \
		exit 1; \
	fi
	@command -v ios >/dev/null || { echo "ERROR: go-ios is missing. Install with: npm install -g go-ios"; exit 1; }
	@command -v node >/dev/null || { echo "ERROR: node is missing"; exit 1; }
	@if [ "$(IOS_E2E_INSTALL)" = "1" ]; then \
		$(MAKE) ios_e2e_install_device IOS_UDID="$(IOS_UDID)" IOS_DEVICE_APP_PATH="$(IOS_DEVICE_APP_PATH)"; \
	fi
	@echo "==> Starting WDA on device $(IOS_UDID)..."
	@set -e; \
	set -a; \
	if [ -f .env.local ]; then . ./.env.local; fi; \
	set +a; \
	LANESHADOW_AUTH_EMAIL_VALUE="$${LANESHADOW_AUTH_EMAIL:-$${CLERK_TEST_EMAIL:-}}"; \
	LANESHADOW_AUTH_PASSWORD_VALUE="$${LANESHADOW_AUTH_PASSWORD:-$${CLERK_TEST_PASSWORD:-}}"; \
	if [ -z "$$LANESHADOW_AUTH_PASSWORD_VALUE" ]; then \
		echo "WARN: CLERK_TEST_PASSWORD/LANESHADOW_AUTH_PASSWORD is empty; email/password auth will be recorded as BLOCKED unless provider auth succeeds."; \
	fi; \
	mkdir -p ios/E2E/diagnostics; \
	IOS_TUNNEL_PORT=$$(ios tunnel ls --udid "$(IOS_UDID)" 2>/dev/null | node -e 'let input = ""; process.stdin.on("data", c => input += c); process.stdin.on("end", () => { try { const rows = JSON.parse(input); const row = Array.isArray(rows) ? rows[0] : null; if (row?.userspaceTunPort) process.stdout.write(String(row.userspaceTunPort)); } catch {} });'); \
	if [ -z "$$IOS_TUNNEL_PORT" ]; then \
		echo "==> Starting iOS userspace tunnel for $(IOS_UDID)..."; \
		ios tunnel start --userspace --udid "$(IOS_UDID)" > ios/E2E/diagnostics/wda-tunnel.log 2>&1 & \
		TUNNEL_PID=$$!; \
		for attempt in 1 2 3 4 5 6 7 8 9 10; do \
			IOS_TUNNEL_PORT=$$(ios tunnel ls --udid "$(IOS_UDID)" 2>/dev/null | node -e 'let input = ""; process.stdin.on("data", c => input += c); process.stdin.on("end", () => { try { const rows = JSON.parse(input); const row = Array.isArray(rows) ? rows[0] : null; if (row?.userspaceTunPort) process.stdout.write(String(row.userspaceTunPort)); } catch {} });'); \
			if [ -n "$$IOS_TUNNEL_PORT" ]; then break; fi; \
			sleep 1; \
		done; \
	else \
		TUNNEL_PID=""; \
	fi; \
	if [ -n "$$IOS_TUNNEL_PORT" ]; then \
		echo "==> Using iOS userspace tunnel port $$IOS_TUNNEL_PORT"; \
		IOS_TUNNEL_ARGS="--userspace-port=$$IOS_TUNNEL_PORT"; \
	else \
		echo "WARN: No iOS userspace tunnel discovered; trying standard go-ios forwarding."; \
		IOS_TUNNEL_ARGS=""; \
	fi; \
	ios runwda --udid "$(IOS_UDID)" $$IOS_TUNNEL_ARGS > ios/E2E/diagnostics/wda-runwda.log 2>&1 & \
	WDA_PID=$$!; \
	sleep 3; \
	ios forward "$(IOS_WDA_PORT)" 8100 --udid "$(IOS_UDID)" $$IOS_TUNNEL_ARGS > ios/E2E/diagnostics/wda-forward.log 2>&1 & \
	FORWARD_PID=$$!; \
	cleanup() { \
		kill $$WDA_PID $$FORWARD_PID >/dev/null 2>&1 || true; \
		if [ -n "$$TUNNEL_PID" ]; then kill $$TUNNEL_PID >/dev/null 2>&1 || true; fi; \
		wait $$WDA_PID $$FORWARD_PID >/dev/null 2>&1 || true; \
	}; \
	trap cleanup EXIT INT TERM; \
	echo "==> Waiting for WDA at $(WDA_BASE_URL)/status..."; \
	for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do \
		if ! kill -0 $$WDA_PID >/dev/null 2>&1; then \
			echo "ERROR: WDA exited before becoming ready. See ios/E2E/diagnostics/wda-runwda.log"; \
			tail -n 40 ios/E2E/diagnostics/wda-runwda.log || true; \
			exit 1; \
		fi; \
		if ! kill -0 $$FORWARD_PID >/dev/null 2>&1; then \
			echo "ERROR: WDA port forward exited before WDA became ready. See ios/E2E/diagnostics/wda-forward.log"; \
			tail -n 40 ios/E2E/diagnostics/wda-forward.log || true; \
			exit 1; \
		fi; \
		if curl -fsS "$(WDA_BASE_URL)/status" >/dev/null 2>&1; then \
			echo "==> WDA is ready."; \
			break; \
		fi; \
		if [ "$$attempt" = "30" ]; then \
			echo "ERROR: WDA did not become ready. See ios/E2E/diagnostics/wda-runwda.log and ios/E2E/diagnostics/wda-forward.log"; \
			exit 1; \
		fi; \
		sleep 2; \
	done; \
	echo "==> Running $(IOS_E2E_FLOW) against $(LANESHADOW_BUNDLE_ID)..."; \
	LANESHADOW_BUNDLE_ID="$(LANESHADOW_BUNDLE_ID)" \
	WDA_BASE_URL="$(WDA_BASE_URL)" \
	LANESHADOW_AUTH_PROVIDER="$(LANESHADOW_AUTH_PROVIDER)" \
	LANESHADOW_AUTH_EMAIL="$$LANESHADOW_AUTH_EMAIL_VALUE" \
	LANESHADOW_AUTH_PASSWORD="$$LANESHADOW_AUTH_PASSWORD_VALUE" \
	LANESHADOW_AUTH_DISPLAY_NAME="$(LANESHADOW_AUTH_DISPLAY_NAME)" \
	node "$(IOS_E2E_FLOW)"

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
