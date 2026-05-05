# Makefile — unified commands for LaneShadow monorepo
# Individual targets become functional as workstreams populate their directories
# Note: Using underscore namespace (server_build) instead of colon (server:build)
# for compatibility with GNU Make 3.81 (macOS default)

.PHONY: help build start clean install \
        lint format typecheck check \
        server_build server_dev server_start \
        e2e_vars \
        ios_build ios_dev ios_start ios_sandbox ios_sandbox_story ios_test \
        ios_e2e_vars ios_e2e_devices ios_e2e_headed ios_e2e_auth_headed ios_e2e_device_headed ios_e2e_simulator \
        android_build android_dev android_start android_sandbox android_sandbox_story android_test \
        android_e2e_headed android_e2e_auth_headed \
        test

LANESHADOW_BUNDLE_ID ?= com.laneshadow.app

IOS_UDID ?= $(shell if command -v xcrun >/dev/null 2>&1; then xcrun xctrace list devices 2>/dev/null | sed '/^== Simulators ==/,$$d' | sed -nE 's/.*\([0-9]+(\.[0-9]+)*\) \(([0-9A-Fa-f-]{25,})\).*/\2/p' | head -1; fi)
IOS_E2E_RESULT_BUNDLE ?= ios/build/xcresults/ios-e2e-headed.xcresult
IOS_E2E_XCODEBUILD_LOG ?= ios/build/logs/ios-e2e-headed-xcodebuild.log
IOS_E2E_DERIVED_DATA ?= ios/build/DerivedDataE2E
IOS_SIMULATOR_ID ?= $(shell if command -v xcrun >/dev/null 2>&1; then xcrun simctl list devices available 2>/dev/null | sed -nE 's/.*iPhone 16 \(([A-F0-9-]+)\) \(Booted\).*/\1/p' | head -1; fi)
IOS_E2E_SIMULATOR_RESULT_BUNDLE ?= ios/build/xcresults/ios-e2e-simulator.xcresult
IOS_E2E_SIMULATOR_XCODEBUILD_LOG ?= ios/build/logs/ios-e2e-simulator-xcodebuild.log
IOS_E2E_SIMULATOR_DERIVED_DATA ?= ios/build/DerivedDataE2ESimulator

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
	CLERK_TEST_EMAIL_VALUE="$${CLERK_TEST_EMAIL:-$${LANESHADOW_AUTH_EMAIL:-}}"; \
	CLERK_TEST_PASSWORD_VALUE="$${CLERK_TEST_PASSWORD:-$${LANESHADOW_AUTH_PASSWORD:-}}"; \
	CLERK_PUBLISHABLE_KEY_VALUE="$${CLERK_PUBLISHABLE_KEY:-$${EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:-}}"; \
	IOS_DEVELOPMENT_TEAM_VALUE="$${IOS_DEVELOPMENT_TEAM:-$${DEVELOPMENT_TEAM:-$${APPLE_DEVELOPMENT_TEAM:-}}}"; \
	echo "Headed iOS E2E variables:"; \
	echo "  IOS_UDID=$(if $(IOS_UDID),$(IOS_UDID),<auto: no real iPhone detected>)"; \
	echo "  LANESHADOW_BUNDLE_ID=$(LANESHADOW_BUNDLE_ID)"; \
	echo "  IOS_E2E_RESULT_BUNDLE=$(IOS_E2E_RESULT_BUNDLE)"; \
	echo "  IOS_E2E_XCODEBUILD_LOG=$(IOS_E2E_XCODEBUILD_LOG)"; \
	echo "  IOS_E2E_DERIVED_DATA=$(IOS_E2E_DERIVED_DATA)"; \
	echo "  IOS_SIMULATOR_ID=$(if $(IOS_SIMULATOR_ID),$(IOS_SIMULATOR_ID),<auto: create/use iPhone 16 simulator>)"; \
	echo "  IOS_E2E_SIMULATOR_RESULT_BUNDLE=$(IOS_E2E_SIMULATOR_RESULT_BUNDLE)"; \
	echo "  IOS_E2E_SIMULATOR_XCODEBUILD_LOG=$(IOS_E2E_SIMULATOR_XCODEBUILD_LOG)"; \
	echo "  IOS_E2E_SIMULATOR_DERIVED_DATA=$(IOS_E2E_SIMULATOR_DERIVED_DATA)"; \
	echo "  IOS_DEVELOPMENT_TEAM=$$(if [ -n "$$IOS_DEVELOPMENT_TEAM_VALUE" ]; then echo "$$IOS_DEVELOPMENT_TEAM_VALUE"; else echo '<empty>'; fi)"; \
	echo "  CLERK_TEST_EMAIL=$$(if [ -n "$$CLERK_TEST_EMAIL_VALUE" ]; then echo "$$CLERK_TEST_EMAIL_VALUE"; else echo '<empty>'; fi)"; \
	echo "  CLERK_TEST_PASSWORD=$$(if [ -n "$$CLERK_TEST_PASSWORD_VALUE" ]; then echo '<set>'; else echo '<empty>'; fi)"; \
	echo "  CLERK_PUBLISHABLE_KEY=$$(if [ -n "$$CLERK_PUBLISHABLE_KEY_VALUE" ]; then echo '<set>'; else echo '<empty>'; fi)"; \
	echo "  CLERK_SECRET_KEY=$$(if [ -n "$${CLERK_SECRET_KEY:-}" ]; then echo '<set>'; else echo '<empty>'; fi)"; \
	echo "  MAILOSAUR_API_KEY=$$(if [ -n "$${MAILOSAUR_API_KEY:-}" ]; then echo '<set>'; else echo '<empty>'; fi)"; \
	echo "  MAILOSAUR_SERVER_ID=$$(if [ -n "$${MAILOSAUR_SERVER_ID:-}" ]; then echo "$$MAILOSAUR_SERVER_ID"; else echo '<empty>'; fi)"; \
	echo "  MAILOSAUR_DOMAIN=$$(if [ -n "$${MAILOSAUR_DOMAIN:-}" ]; then echo "$$MAILOSAUR_DOMAIN"; else echo '<empty>'; fi)"
	@echo ""
	@echo "List devices:"
	@echo "  make ios_e2e_devices"
	@echo ""
	@echo "Run headed E2E:"
	@echo "  make ios_e2e_headed"
	@echo "  make ios_e2e_simulator"
	@echo "  make ios_e2e_device_headed"
	@echo "  # ios_e2e_headed currently routes to the simulator target"
	@echo "  # real-device runs auto-detect IOS_UDID with xcrun xctrace; override with IOS_UDID=<device-udid>"
	@echo ""
	@echo "Headed Android E2E variables:"
	@echo "  ANDROID_SERIAL=$(ANDROID_SERIAL)"
	@echo "  ANDROID_AVD=$(ANDROID_AVD)"
	@echo "  ANDROID_PACKAGE=$(ANDROID_PACKAGE)"
	@echo "  ANDROID_ACTIVITY=$(ANDROID_ACTIVITY)"
	@echo "  ANDROID_E2E_INSTALL=$(ANDROID_E2E_INSTALL)"
	@echo "  ANDROID_E2E_TEST_CLASSES=$(ANDROID_E2E_TEST_CLASSES)"
	@echo "  ANDROID_E2E_LOG=$(ANDROID_E2E_LOG)"
	@echo "  ANDROID_E2E_SCREENSHOTS=$(ANDROID_E2E_SCREENSHOTS)"
	@echo ""
	@echo "Run headed E2E:"
	@echo "  make android_e2e_headed"
	@echo "  make android_e2e_headed ANDROID_SERIAL=<adb-serial>"

ios_e2e_vars: e2e_vars ## Show variables for headed iOS/Android E2E

ios_e2e_devices: ## List connected iOS devices for IOS_UDID
	@command -v xcrun >/dev/null || { echo "ERROR: xcrun is missing"; exit 1; }
	@xcrun xctrace list devices | sed '/^== Simulators ==/,$$d'

ios_e2e_headed: ios_e2e_simulator ## Run headed iOS E2E on a simulator

ios_e2e_device_headed: ## Run headed iOS E2E on a real device (set IOS_UDID=...)
	@if [ -z "$(IOS_UDID)" ]; then \
		echo "ERROR: no iOS device detected. Connect/unlock an iPhone, trust this Mac, then run: make ios_e2e_devices"; \
		echo "       Or pass one explicitly: make ios_e2e_device_headed IOS_UDID=<device-udid>"; \
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
	CLERK_PUBLISHABLE_KEY_VALUE="$${CLERK_PUBLISHABLE_KEY:-$${EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:-}}"; \
	IOS_DEVELOPMENT_TEAM_VALUE="$${IOS_DEVELOPMENT_TEAM:-$${DEVELOPMENT_TEAM:-$${APPLE_DEVELOPMENT_TEAM:-}}}"; \
	for name in CLERK_SECRET_KEY MAILOSAUR_API_KEY MAILOSAUR_SERVER_ID MAILOSAUR_DOMAIN; do \
		eval "value=\$${$${name}:-}"; \
		if [ -z "$$value" ]; then \
			echo "ERROR: add $$name to .env.local for ios_e2e_device_headed."; \
			exit 1; \
		fi; \
	done; \
	if [ -z "$$IOS_AUTH_EMAIL_VALUE" ]; then echo "ERROR: add CLERK_TEST_EMAIL to .env.local for ios_e2e_device_headed."; exit 1; fi; \
	if [ -z "$$IOS_AUTH_PASSWORD_VALUE" ]; then echo "ERROR: add CLERK_TEST_PASSWORD to .env.local for ios_e2e_device_headed."; exit 1; fi; \
	if [ -z "$$CLERK_PUBLISHABLE_KEY_VALUE" ]; then echo "ERROR: add CLERK_PUBLISHABLE_KEY or EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env.local for ios_e2e_device_headed."; exit 1; fi; \
	if [ -z "$$IOS_DEVELOPMENT_TEAM_VALUE" ]; then \
		echo "ERROR: add IOS_DEVELOPMENT_TEAM=<Apple Team ID> to .env.local for real-device signing."; \
		exit 1; \
	fi; \
	IOS_SIGNUP_EMAIL_VALUE="$${IOS_E2E_SIGNUP_EMAIL:-ios-e2e-$$(date -u +%Y%m%d%H%M%S)-$$$$@$${MAILOSAUR_DOMAIN}}"; \
	echo "==> Using Apple development team $$IOS_DEVELOPMENT_TEAM_VALUE"; \
	echo "==> CLERK_TEST_EMAIL=$$IOS_AUTH_EMAIL_VALUE"; \
	echo "==> CLERK_TEST_PASSWORD=<set>"; \
	echo "==> CLERK_PUBLISHABLE_KEY=<set>"; \
	echo "==> Registration email $$IOS_SIGNUP_EMAIL_VALUE"; \
	mkdir -p ios/build/xcresults ios/build/logs; \
	rm -rf "$(IOS_E2E_RESULT_BUNDLE)"; \
	rm -f "$(IOS_E2E_XCODEBUILD_LOG)"; \
	node scripts/e2e/clerk-ensure-test-user.mjs --email "$$IOS_AUTH_EMAIL_VALUE" --password "$$IOS_AUTH_PASSWORD_VALUE"; \
	node scripts/e2e/clerk-cleanup-user.mjs --email "$$IOS_SIGNUP_EMAIL_VALUE"; \
	RESULT_BUNDLE_REL=$$(printf '%s\n' "$(IOS_E2E_RESULT_BUNDLE)" | sed 's#^ios/##'); \
	LOG_REL=$$(printf '%s\n' "$(IOS_E2E_XCODEBUILD_LOG)" | sed 's#^ios/##'); \
	DERIVED_DATA_REL=$$(printf '%s\n' "$(IOS_E2E_DERIVED_DATA)" | sed 's#^ios/##'); \
	cd ios; \
	set +e; \
	xcodebuild build-for-testing \
		-project LaneShadow.xcodeproj \
		-scheme LaneShadow \
		-destination "id=$(IOS_UDID)" \
		-derivedDataPath "$$DERIVED_DATA_REL" \
		DEVELOPMENT_TEAM="$$IOS_DEVELOPMENT_TEAM_VALUE" \
		CODE_SIGN_STYLE=Automatic \
		-allowProvisioningUpdates > "$$LOG_REL" 2>&1; \
	BUILD_STATUS=$$?; \
	if [ "$$BUILD_STATUS" -eq 0 ]; then \
		rm -f "$$DERIVED_DATA_REL/Build/Products"/*.e2e.xctestrun 2>/dev/null || true; \
		XCTESTRUN_PATH=$$(find "$$DERIVED_DATA_REL/Build/Products" -maxdepth 1 -name 'LaneShadow_iphoneos*.xctestrun' ! -name '*.e2e.xctestrun' | head -1); \
		if [ -z "$$XCTESTRUN_PATH" ]; then \
			echo "ERROR: missing iOS E2E .xctestrun file under $$DERIVED_DATA_REL/Build/Products" >> "$$LOG_REL"; \
			BUILD_STATUS=1; \
		else \
			PATCHED_XCTESTRUN_PATH="$${XCTESTRUN_PATH%.xctestrun}.e2e.xctestrun"; \
			cp "$$XCTESTRUN_PATH" "$$PATCHED_XCTESTRUN_PATH"; \
			for env_key in CLERK_TEST_EMAIL CLERK_TEST_PASSWORD CLERK_PUBLISHABLE_KEY EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY MAILOSAUR_API_KEY MAILOSAUR_SERVER_ID MAILOSAUR_DOMAIN E2E_SIGNUP_EMAIL; do \
				case "$$env_key" in \
					CLERK_TEST_EMAIL) env_value="$$IOS_AUTH_EMAIL_VALUE" ;; \
					CLERK_TEST_PASSWORD) env_value="$$IOS_AUTH_PASSWORD_VALUE" ;; \
					CLERK_PUBLISHABLE_KEY|EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) env_value="$$CLERK_PUBLISHABLE_KEY_VALUE" ;; \
					MAILOSAUR_API_KEY) env_value="$$MAILOSAUR_API_KEY" ;; \
					MAILOSAUR_SERVER_ID) env_value="$$MAILOSAUR_SERVER_ID" ;; \
					MAILOSAUR_DOMAIN) env_value="$$MAILOSAUR_DOMAIN" ;; \
					E2E_SIGNUP_EMAIL) env_value="$$IOS_SIGNUP_EMAIL_VALUE" ;; \
				esac; \
				plutil -replace "LaneShadowUITests.EnvironmentVariables.$$env_key" -string "$$env_value" "$$PATCHED_XCTESTRUN_PATH"; \
				plutil -replace "LaneShadowUITests.TestingEnvironmentVariables.$$env_key" -string "$$env_value" "$$PATCHED_XCTESTRUN_PATH"; \
				case "$$env_key" in \
					CLERK_PUBLISHABLE_KEY|EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) \
						plutil -replace "LaneShadowUITests.UITargetAppEnvironmentVariables.$$env_key" -string "$$env_value" "$$PATCHED_XCTESTRUN_PATH"; \
						;; \
				esac; \
			done; \
			TEST_PID=""; \
			cleanup_e2e() { \
				status=$$?; \
				trap - INT TERM HUP; \
				if [ -n "$${TEST_PID:-}" ] && kill -0 "$$TEST_PID" 2>/dev/null; then \
					kill -TERM "$$TEST_PID" 2>/dev/null || true; \
					sleep 2; \
					kill -KILL "$$TEST_PID" 2>/dev/null || true; \
					wait "$$TEST_PID" 2>/dev/null || true; \
				fi; \
				rm -f "$$PATCHED_XCTESTRUN_PATH"; \
				exit "$$status"; \
			}; \
			trap cleanup_e2e INT TERM HUP; \
			xcodebuild test-without-building \
				-xctestrun "$$PATCHED_XCTESTRUN_PATH" \
				-destination "id=$(IOS_UDID)" \
				-only-testing:LaneShadowUITests/Auth/AuthSignInE2ETests/testEmailPasswordSignInAndRestoresSession \
				-only-testing:LaneShadowUITests/Auth/AuthRegistrationE2ETests/testEmailPasswordRegistrationVerifiesAndRestoresSession \
				-resultBundlePath "$$RESULT_BUNDLE_REL" >> "$$LOG_REL" 2>&1 & \
			TEST_PID=$$!; \
			wait "$$TEST_PID"; \
			BUILD_STATUS=$$?; \
			TEST_PID=""; \
			trap - INT TERM HUP; \
			rm -f "$$PATCHED_XCTESTRUN_PATH"; \
		fi; \
	fi; \
	set -e; \
	cat "$$LOG_REL"; \
	cd ..; \
	node scripts/e2e/clerk-cleanup-user.mjs --email "$$IOS_SIGNUP_EMAIL_VALUE"; \
	exit "$$BUILD_STATUS"

ios_e2e_auth_headed: ios_e2e_headed ## Alias for ios_e2e_headed

ios_e2e_simulator: ## Run headed iOS auth E2E on a booted iPhone simulator
	@command -v xcodebuild >/dev/null || { echo "ERROR: xcodebuild is missing"; exit 1; }
	@command -v xcrun >/dev/null || { echo "ERROR: xcrun is missing"; exit 1; }
	@set -eu; \
	SIMULATOR_ID_VALUE="$(IOS_SIMULATOR_ID)"; \
	if [ -z "$$SIMULATOR_ID_VALUE" ]; then \
		SIMULATOR_ID_VALUE=$$(xcrun simctl list devices available | sed -nE 's/.*iPhone 16 \(([A-F0-9-]+)\).*/\1/p' | head -1); \
	fi; \
	if [ -z "$$SIMULATOR_ID_VALUE" ]; then \
		RUNTIME_ID=$$(xcrun simctl list runtimes -j | jq -r '.runtimes[] | select(.isAvailable == true and (.name | startswith("iOS"))) | .identifier' | head -1); \
		SIMULATOR_ID_VALUE=$$(xcrun simctl create "iPhone 16" "com.apple.CoreSimulator.SimDeviceType.iPhone-16" "$$RUNTIME_ID"); \
	fi; \
	echo "==> Running native iOS XCUITest on simulator $$SIMULATOR_ID_VALUE..."; \
	open -a Simulator; \
	xcrun simctl boot "$$SIMULATOR_ID_VALUE" 2>/dev/null || true; \
	xcrun simctl bootstatus "$$SIMULATOR_ID_VALUE" -b; \
	set -a; \
	if [ -f .env.local ]; then . ./.env.local; fi; \
	set +a; \
	IOS_AUTH_EMAIL_VALUE="$${CLERK_TEST_EMAIL:-$${LANESHADOW_AUTH_EMAIL:-}}"; \
	IOS_AUTH_PASSWORD_VALUE="$${CLERK_TEST_PASSWORD:-$${LANESHADOW_AUTH_PASSWORD:-}}"; \
	CLERK_PUBLISHABLE_KEY_VALUE="$${CLERK_PUBLISHABLE_KEY:-$${EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:-}}"; \
	for name in CLERK_SECRET_KEY MAILOSAUR_API_KEY MAILOSAUR_SERVER_ID MAILOSAUR_DOMAIN; do \
		eval "value=\$${$${name}:-}"; \
		if [ -z "$$value" ]; then \
			echo "ERROR: add $$name to .env.local for ios_e2e_simulator."; \
			exit 1; \
		fi; \
	done; \
	if [ -z "$$IOS_AUTH_EMAIL_VALUE" ]; then echo "ERROR: add CLERK_TEST_EMAIL to .env.local for ios_e2e_simulator."; exit 1; fi; \
	if [ -z "$$IOS_AUTH_PASSWORD_VALUE" ]; then echo "ERROR: add CLERK_TEST_PASSWORD to .env.local for ios_e2e_simulator."; exit 1; fi; \
	if [ -z "$$CLERK_PUBLISHABLE_KEY_VALUE" ]; then echo "ERROR: add CLERK_PUBLISHABLE_KEY or EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env.local for ios_e2e_simulator."; exit 1; fi; \
	IOS_SIGNUP_EMAIL_VALUE="$${IOS_E2E_SIGNUP_EMAIL:-ios-e2e-sim-$$(date -u +%Y%m%d%H%M%S)-$$$$@$${MAILOSAUR_DOMAIN}}"; \
	echo "==> CLERK_TEST_EMAIL=$$IOS_AUTH_EMAIL_VALUE"; \
	echo "==> CLERK_TEST_PASSWORD=<set>"; \
	echo "==> CLERK_PUBLISHABLE_KEY=<set>"; \
	echo "==> Registration email $$IOS_SIGNUP_EMAIL_VALUE"; \
	mkdir -p ios/build/xcresults ios/build/logs; \
	rm -rf "$(IOS_E2E_SIMULATOR_RESULT_BUNDLE)"; \
	rm -f "$(IOS_E2E_SIMULATOR_XCODEBUILD_LOG)"; \
	node scripts/e2e/clerk-ensure-test-user.mjs --email "$$IOS_AUTH_EMAIL_VALUE" --password "$$IOS_AUTH_PASSWORD_VALUE"; \
	node scripts/e2e/clerk-cleanup-user.mjs --email "$$IOS_SIGNUP_EMAIL_VALUE"; \
	RESULT_BUNDLE_REL=$$(printf '%s\n' "$(IOS_E2E_SIMULATOR_RESULT_BUNDLE)" | sed 's#^ios/##'); \
	LOG_REL=$$(printf '%s\n' "$(IOS_E2E_SIMULATOR_XCODEBUILD_LOG)" | sed 's#^ios/##'); \
	DERIVED_DATA_REL=$$(printf '%s\n' "$(IOS_E2E_SIMULATOR_DERIVED_DATA)" | sed 's#^ios/##'); \
	cd ios; \
	set +e; \
	xcodebuild build-for-testing \
		-project LaneShadow.xcodeproj \
		-scheme LaneShadow \
		-destination "id=$$SIMULATOR_ID_VALUE" \
		-derivedDataPath "$$DERIVED_DATA_REL" > "$$LOG_REL" 2>&1; \
	BUILD_STATUS=$$?; \
	if [ "$$BUILD_STATUS" -eq 0 ]; then \
		rm -f "$$DERIVED_DATA_REL/Build/Products"/*.e2e.xctestrun 2>/dev/null || true; \
		XCTESTRUN_PATH=$$(find "$$DERIVED_DATA_REL/Build/Products" -maxdepth 1 -name 'LaneShadow_iphonesimulator*.xctestrun' ! -name '*.e2e.xctestrun' | head -1); \
		if [ -z "$$XCTESTRUN_PATH" ]; then \
			echo "ERROR: missing iOS simulator E2E .xctestrun file under $$DERIVED_DATA_REL/Build/Products" >> "$$LOG_REL"; \
			BUILD_STATUS=1; \
		else \
			PATCHED_XCTESTRUN_PATH="$${XCTESTRUN_PATH%.xctestrun}.e2e.xctestrun"; \
			cp "$$XCTESTRUN_PATH" "$$PATCHED_XCTESTRUN_PATH"; \
			for env_key in CLERK_TEST_EMAIL CLERK_TEST_PASSWORD CLERK_PUBLISHABLE_KEY EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY MAILOSAUR_API_KEY MAILOSAUR_SERVER_ID MAILOSAUR_DOMAIN E2E_SIGNUP_EMAIL; do \
				case "$$env_key" in \
					CLERK_TEST_EMAIL) env_value="$$IOS_AUTH_EMAIL_VALUE" ;; \
					CLERK_TEST_PASSWORD) env_value="$$IOS_AUTH_PASSWORD_VALUE" ;; \
					CLERK_PUBLISHABLE_KEY|EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) env_value="$$CLERK_PUBLISHABLE_KEY_VALUE" ;; \
					MAILOSAUR_API_KEY) env_value="$$MAILOSAUR_API_KEY" ;; \
					MAILOSAUR_SERVER_ID) env_value="$$MAILOSAUR_SERVER_ID" ;; \
					MAILOSAUR_DOMAIN) env_value="$$MAILOSAUR_DOMAIN" ;; \
					E2E_SIGNUP_EMAIL) env_value="$$IOS_SIGNUP_EMAIL_VALUE" ;; \
				esac; \
				plutil -replace "LaneShadowUITests.EnvironmentVariables.$$env_key" -string "$$env_value" "$$PATCHED_XCTESTRUN_PATH"; \
				plutil -replace "LaneShadowUITests.TestingEnvironmentVariables.$$env_key" -string "$$env_value" "$$PATCHED_XCTESTRUN_PATH"; \
				case "$$env_key" in \
					CLERK_PUBLISHABLE_KEY|EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) \
						plutil -replace "LaneShadowUITests.UITargetAppEnvironmentVariables.$$env_key" -string "$$env_value" "$$PATCHED_XCTESTRUN_PATH"; \
						;; \
				esac; \
			done; \
			TEST_PID=""; \
			cleanup_e2e() { \
				status=$$?; \
				trap - INT TERM HUP; \
				if [ -n "$${TEST_PID:-}" ] && kill -0 "$$TEST_PID" 2>/dev/null; then \
					kill -TERM "$$TEST_PID" 2>/dev/null || true; \
					sleep 2; \
					kill -KILL "$$TEST_PID" 2>/dev/null || true; \
					wait "$$TEST_PID" 2>/dev/null || true; \
				fi; \
				xcrun simctl terminate "$$SIMULATOR_ID_VALUE" "$(LANESHADOW_BUNDLE_ID)" >/dev/null 2>&1 || true; \
				rm -f "$$PATCHED_XCTESTRUN_PATH"; \
				exit "$$status"; \
			}; \
			trap cleanup_e2e INT TERM HUP; \
			xcodebuild test-without-building \
				-xctestrun "$$PATCHED_XCTESTRUN_PATH" \
				-destination "id=$$SIMULATOR_ID_VALUE" \
				-only-testing:LaneShadowUITests/Auth/AuthSignInE2ETests/testEmailPasswordSignInAndRestoresSession \
				-only-testing:LaneShadowUITests/Auth/AuthRegistrationE2ETests/testEmailPasswordRegistrationVerifiesAndRestoresSession \
				-resultBundlePath "$$RESULT_BUNDLE_REL" >> "$$LOG_REL" 2>&1 & \
			TEST_PID=$$!; \
			wait "$$TEST_PID"; \
			BUILD_STATUS=$$?; \
			TEST_PID=""; \
			trap - INT TERM HUP; \
			rm -f "$$PATCHED_XCTESTRUN_PATH"; \
		fi; \
	fi; \
	set -e; \
	cat "$$LOG_REL"; \
	cd ..; \
	node scripts/e2e/clerk-cleanup-user.mjs --email "$$IOS_SIGNUP_EMAIL_VALUE"; \
	exit "$$BUILD_STATUS"

# ── Android (Kotlin/Compose) ─────────────────────────

android_build: ## Build Android debug APK
	cd android && ./gradlew assembleDebug

ANDROID_PACKAGE := com.laneshadow.app
ANDROID_ACTIVITY := com.laneshadow.MainActivity
ANDROID_AVD ?= $(shell emulator -list-avds | head -n 1)
ANDROID_SERIAL ?=
ANDROID_E2E_INSTALL ?= 1
ANDROID_E2E_TEST_CLASSES ?= com.laneshadow.e2e.auth.AuthSignInE2ETest,com.laneshadow.e2e.auth.AuthRegistrationE2ETest
ANDROID_E2E_LOG ?= android/app/build/e2e/android-e2e-headed.log
ANDROID_E2E_SCREENSHOTS ?= android/app/build/e2e/screenshots

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
	@command -v node >/dev/null || { echo "ERROR: node is missing"; exit 1; }
	@set -eu; \
	set -a; \
	if [ -f .env.local ]; then . ./.env.local; fi; \
	set +a; \
	CLERK_PUBLISHABLE_KEY_VALUE="$${CLERK_PUBLISHABLE_KEY:-$${EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:-}}"; \
	for name in CLERK_TEST_EMAIL CLERK_TEST_PASSWORD CLERK_SECRET_KEY MAILOSAUR_API_KEY MAILOSAUR_SERVER_ID MAILOSAUR_DOMAIN; do \
		eval "value=\$${$${name}:-}"; \
		if [ -z "$$value" ]; then \
			echo "ERROR: add $$name to .env.local for android_e2e_headed."; \
			exit 1; \
		fi; \
	done; \
	if [ -z "$$CLERK_PUBLISHABLE_KEY_VALUE" ]; then echo "ERROR: add CLERK_PUBLISHABLE_KEY or EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env.local for android_e2e_headed."; exit 1; fi
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
	@set -eu; \
	set -a; \
	if [ -f .env.local ]; then . ./.env.local; fi; \
	set +a; \
	ANDROID_SIGNUP_EMAIL_VALUE="$${ANDROID_E2E_SIGNUP_EMAIL:-android-e2e-$$(date -u +%Y%m%d%H%M%S)-$$$$@$${MAILOSAUR_DOMAIN}}"; \
	mkdir -p "$$(dirname "$(ANDROID_E2E_LOG)")" "$(ANDROID_E2E_SCREENSHOTS)"; \
	rm -f "$(ANDROID_E2E_LOG)"; \
	rm -rf "$(ANDROID_E2E_SCREENSHOTS)"/*; \
	node scripts/e2e/clerk-ensure-test-user.mjs --email "$$CLERK_TEST_EMAIL" --password "$$CLERK_TEST_PASSWORD"; \
	node scripts/e2e/clerk-cleanup-user.mjs --email "$$ANDROID_SIGNUP_EMAIL_VALUE"; \
	echo "==> Registration email $$ANDROID_SIGNUP_EMAIL_VALUE"; \
	cd android && if [ -n "$(ANDROID_SERIAL)" ]; then \
		ANDROID_SERIAL="$(ANDROID_SERIAL)" ./gradlew :app:connectedDebugAndroidTest \
			-Pandroid.testInstrumentationRunnerArguments.class="$(ANDROID_E2E_TEST_CLASSES)" \
			-Pandroid.testInstrumentationRunnerArguments.clerkTestEmail="$$CLERK_TEST_EMAIL" \
			-Pandroid.testInstrumentationRunnerArguments.clerkTestPassword="$$CLERK_TEST_PASSWORD" \
			-Pandroid.testInstrumentationRunnerArguments.signupEmail="$$ANDROID_SIGNUP_EMAIL_VALUE" \
			-Pandroid.testInstrumentationRunnerArguments.mailosaurApiKey="$$MAILOSAUR_API_KEY" \
			-Pandroid.testInstrumentationRunnerArguments.mailosaurServerId="$$MAILOSAUR_SERVER_ID" \
			-Pandroid.testInstrumentationRunnerArguments.mailosaurDomain="$$MAILOSAUR_DOMAIN" 2>&1 | tee "../$(ANDROID_E2E_LOG)"; \
		GRADLE_STATUS=$${PIPESTATUS[0]}; \
	else \
		./gradlew :app:connectedDebugAndroidTest \
			-Pandroid.testInstrumentationRunnerArguments.class="$(ANDROID_E2E_TEST_CLASSES)" \
			-Pandroid.testInstrumentationRunnerArguments.clerkTestEmail="$$CLERK_TEST_EMAIL" \
			-Pandroid.testInstrumentationRunnerArguments.clerkTestPassword="$$CLERK_TEST_PASSWORD" \
			-Pandroid.testInstrumentationRunnerArguments.signupEmail="$$ANDROID_SIGNUP_EMAIL_VALUE" \
			-Pandroid.testInstrumentationRunnerArguments.mailosaurApiKey="$$MAILOSAUR_API_KEY" \
			-Pandroid.testInstrumentationRunnerArguments.mailosaurServerId="$$MAILOSAUR_SERVER_ID" \
			-Pandroid.testInstrumentationRunnerArguments.mailosaurDomain="$$MAILOSAUR_DOMAIN" 2>&1 | tee "../$(ANDROID_E2E_LOG)"; \
		GRADLE_STATUS=$${PIPESTATUS[0]}; \
	fi; \
	cd ..; \
	ADB_CMD="adb"; \
	if [ -n "$(ANDROID_SERIAL)" ]; then ADB_CMD="adb -s $(ANDROID_SERIAL)"; fi; \
	$$ADB_CMD pull "/sdcard/Android/data/$(ANDROID_PACKAGE)/files/e2e-screenshots" "$(ANDROID_E2E_SCREENSHOTS)" >/dev/null 2>&1 || true; \
	node scripts/e2e/clerk-cleanup-user.mjs --email "$$ANDROID_SIGNUP_EMAIL_VALUE"; \
	exit "$$GRADLE_STATUS"

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
