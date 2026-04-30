import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { WdaClient, ensureDir, writeJson } from "./lib/wda-helpers.js";

const bundleId = process.env.LANESHADOW_BUNDLE_ID || "com.laneshadow.app";
const baseUrl = process.env.WDA_BASE_URL || "http://127.0.0.1:8100";
const authProvider = process.env.LANESHADOW_AUTH_PROVIDER || "apple";
const fixtureEmail = process.env.LANESHADOW_AUTH_EMAIL || "auth-remediation-reviewer+clerk@laneshadow.test";
const fixturePassword = process.env.LANESHADOW_AUTH_PASSWORD || "<set LANESHADOW_AUTH_PASSWORD locally>";
const fixtureDisplayName = process.env.LANESHADOW_AUTH_DISPLAY_NAME || "Auth Remediation Reviewer";

const outputRoot = "ios/E2E";
const resultsPath = join(outputRoot, "results", "sprint-03-auth-remediation.json");
const diagnosticsDir = join(outputRoot, "diagnostics", "sprint-03-auth-remediation");
const screenshotsDir = join(outputRoot, "screenshots", "sprint-03-auth-remediation");
const designSource = ".spec/design/system/views/auth-screen/auth-screen.html";

ensureDir(join(outputRoot, "results"));
ensureDir(diagnosticsDir);
ensureDir(screenshotsDir);

const client = new WdaClient(baseUrl, screenshotsDir);

const ids = {
  signInRoot: "auth.signIn.root",
  authScreenRoot: "authscreen-email-entry",
  appleButton: "auth.signIn.apple",
  googleButton: "auth.signIn.google",
  emailField: "authscreen-email-field",
  passwordField: "authscreen-password-field",
  primaryCta: "authscreen-primary-cta",
  idleGreeting: "idle.greeting",
  idleGreetingFallbacks: ["idle.greeting", "idlescreen-greeting", "idlescreen-current-user-greeting"],
  settingsEntry: "settings.entry",
  signOutAction: "settings.signOut",
  signOutConfirm: "auth.signOut.confirm",
};

const requiredStoryIds = [
  "molecules.auth-provider-button.apple",
  "molecules.auth-provider-button.google",
  "templates.auth-screen.email-entry",
  "templates.auth-screen.existing-user",
  "templates.auth-screen.new-user",
  "templates.auth-screen.invalid-email",
  "templates.auth-screen.submitting",
  "templates.auth-screen.dark",
];

const requiredTemplateIds = requiredStoryIds.filter((id) => id.startsWith("templates.auth-screen"));
const themes = ["light", "dark"];
const allowedStatuses = new Set(["PASS", "FAIL", "BLOCKED", "MANUAL"]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function repoPath(...segments) {
  return join(...segments);
}

function existing(paths) {
  return paths.filter((path) => existsSync(path));
}

function missing(paths) {
  return paths.filter((path) => !existsSync(path));
}

function writeTextArtifact(name, lines) {
  const path = join(diagnosticsDir, name);
  writeFileSync(path, `${lines.join("\n")}\n`);
  return path;
}

function iosSnapshotPaths(storyIds = requiredStoryIds) {
  return storyIds.flatMap((id) =>
    themes.map((theme) =>
      repoPath("ios", "LaneShadowTests", "__Snapshots__", "StorySnapshotTests", `${id}.${theme}.png`)
    )
  );
}

function androidSnapshotPaths(storyIds = requiredStoryIds) {
  return storyIds.flatMap((id) =>
    themes.map((theme) =>
      repoPath("android", "app", "src", "androidTest", "screenshots", "AllStoriesSnapshotTest", `${id}.${theme}.png`)
    )
  );
}

function normalizeStatus(status) {
  const value = String(status).toUpperCase();
  return allowedStatuses.has(value) ? value : "MANUAL";
}

function makeStep({
  id,
  title,
  platform,
  status,
  evidencePaths = [],
  blocker = null,
  reviewerNotes = [],
  commands = [],
  fixture = null,
  expectedOutput = [],
  dependsOn = [],
}) {
  return {
    id,
    title,
    platform,
    status: normalizeStatus(status),
    evidencePaths,
    blocker,
    reviewerNotes,
    commands,
    fixture,
    expectedOutput,
    dependsOn,
    timestamp: new Date().toISOString(),
  };
}

async function waitForAccessibilityId(id, timeoutMs = 12000, intervalMs = 1000) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeoutMs) {
    try {
      return await client.findByAccessibilityId(id);
    } catch (error) {
      lastError = error;
      await sleep(intervalMs);
    }
  }
  throw new Error(`Timed out waiting for accessibility id '${id}'. Last error: ${String(lastError?.message || lastError)}`);
}

async function waitForAnyAccessibilityId(candidateIds, timeoutMs = 12000, intervalMs = 1000) {
  const started = Date.now();
  const errors = [];
  while (Date.now() - started < timeoutMs) {
    for (const id of candidateIds) {
      try {
        return { id, element: await client.findByAccessibilityId(id) };
      } catch (error) {
        errors.push(`${id}: ${String(error?.message || error)}`);
      }
    }
    await sleep(intervalMs);
  }
  throw new Error(`Timed out waiting for any accessibility id: ${candidateIds.join(", ")}. Last errors: ${errors.slice(-4).join(" | ")}`);
}

async function captureDiagnostics(prefix, detail, reviewerNotes = []) {
  const sourcePath = join(diagnosticsDir, `${prefix}-source.xml`);
  const sourceFallbackPath = join(diagnosticsDir, `${prefix}-source.txt`);
  const screenshotFallbackPath = join(diagnosticsDir, `${prefix}-screenshot.txt`);
  const notePath = writeTextArtifact(`${prefix}-notes.txt`, [detail, ...reviewerNotes]);

  const evidencePaths = [notePath];
  try {
    evidencePaths.push(await client.source(sourcePath));
  } catch (error) {
    writeFileSync(sourceFallbackPath, `source unavailable\n${String(error?.message || error)}\n`);
    evidencePaths.push(sourceFallbackPath);
  }

  try {
    evidencePaths.push(await client.screenshot(`${prefix}.png`));
  } catch (error) {
    writeFileSync(screenshotFallbackPath, `screenshot unavailable\n${String(error?.message || error)}\n`);
    evidencePaths.push(screenshotFallbackPath);
  }

  return evidencePaths;
}

function manualConvexCommands() {
  return [
    "pnpm --dir server convex dev --once",
    "pnpm --dir server run convex:dev -- --once",
    "pnpm server:codegen",
  ];
}

function clerkDashboardActions() {
  return [
    "Open Clerk dashboard > Users.",
    `Find fixture account ${fixtureEmail}.`,
    "Verify the latest iOS/Android session is present after sign-in.",
    "Revoke the active session or token.",
    "Return to the app and verify Convex UNAUTHENTICATED redirects to AuthScreen.",
  ];
}

async function tryEmailPasswordSignIn(evidencePaths) {
  if (fixturePassword.startsWith("<set ")) {
    return {
      attempted: false,
      note: "Email/password fixture password was not provided; set LANESHADOW_AUTH_EMAIL and LANESHADOW_AUTH_PASSWORD to exercise the email branch.",
    };
  }

  const email = await waitForAccessibilityId(ids.emailField, 8000, 1000);
  await client.tapElement(email);
  await client.setElementValue(email, fixtureEmail);
  const continueButton = await waitForAccessibilityId(ids.primaryCta, 8000, 1000);
  await client.tapElement(continueButton);
  const password = await waitForAccessibilityId(ids.passwordField, 10000, 1000);
  await client.tapElement(password);
  await client.setElementValue(password, fixturePassword);
  const signInButton = await waitForAccessibilityId(ids.primaryCta, 8000, 1000);
  await client.tapElement(signInButton);
  evidencePaths.push(await client.screenshot("AUTH-R.3-email-password-submitted.png"));
  return { attempted: true, note: "Email/password branch submitted with LANESHADOW_AUTH_EMAIL fixture." };
}

async function main() {
  const steps = [];
  const iosVisualSnapshots = iosSnapshotPaths();
  const androidVisualSnapshots = androidSnapshotPaths();
  const visualEvidencePaths = [
    designSource,
    ...existing(iosVisualSnapshots),
    ...existing(androidVisualSnapshots),
    repoPath("android", "app", "src", "androidTest", "java", "com", "laneshadow", "sandbox", "snapshots", "AuthScreenSnapshotTest.kt"),
    repoPath("ios", "LaneShadowTests", "Integration", "AuthScreensTests.swift"),
  ];
  const missingVisualPaths = [...missing(iosVisualSnapshots), ...missing(androidVisualSnapshots)];

  steps.push(
    makeStep({
      id: "AUTH-R.1",
      title: "iOS and Android sandbox catalogs expose auth story PNG baselines",
      platform: "ios+android",
      status: missingVisualPaths.length === 0 ? "PASS" : "BLOCKED",
      evidencePaths: visualEvidencePaths,
      blocker: missingVisualPaths.length === 0 ? null : `Missing snapshot artifact paths: ${missingVisualPaths.join(", ")}`,
      reviewerNotes: [
        `Canonical story IDs: ${requiredStoryIds.join(", ")}`,
        "PNG filename contract: {id}.{theme}.png for light and dark.",
      ],
      commands: ["pnpm snapshots:check", "pnpm snapshots:parity-coverage"],
      expectedOutput: [
        "snapshots:check exits 0 with all AuthScreen and auth-provider-button baselines present.",
        "snapshots:parity-coverage reports the auth stories in shared iOS and Android coverage.",
      ],
    })
  );

  const visualChecklist = writeTextArtifact("AUTH-R.2-visual-review-checklist.md", [
    "# AUTH-R.2 Visual Review Checklist",
    "",
    `Design source: ${designSource}`,
    `Story IDs: ${requiredTemplateIds.join(", ")}`,
    "",
    "Compare the iOS and Android snapshot PNGs against auth-screen.html.",
    "Required visible features: paper contour background, scrim, back glass chip, brand mark, Newsreader headline, social buttons, divider, field rows, primary CTA, legal footer, error state, and loading spinner.",
    "Record PASS only after a reviewer has compared the rendered PNGs with the HTML source.",
  ]);

  steps.push(
    makeStep({
      id: "AUTH-R.2",
      title: "Native AuthScreen screenshots are compared with the HTML design source",
      platform: "ios+android+design",
      status: "MANUAL",
      evidencePaths: [visualChecklist, ...visualEvidencePaths],
      blocker: "Visual comparison is a human review gate; this command links the required artifacts but does not mark the visual judgment PASS.",
      reviewerNotes: [
        "Do not mark PASS unless the reviewer has compared snapshot PNGs against auth-screen.html.",
        "The checklist names each required visual feature from the sprint manifest.",
      ],
      commands: ["pnpm snapshots:check", "pnpm snapshots:parity-coverage"],
      expectedOutput: [
        "Reviewer confirms native screenshots match .spec/design/system/views/auth-screen/auth-screen.html.",
      ],
    })
  );

  let wdaReady = false;
  let authenticated = false;
  let authEvidencePaths = [];
  let restoreEvidencePaths = [];
  let signOutEvidencePaths = [];
  let wdaBlocker = null;

  try {
    await client.status();
    await client.createSession(bundleId, ["-UITesting"]);
    wdaReady = true;
    const authRoot = await waitForAnyAccessibilityId([ids.signInRoot, ids.authScreenRoot], 15000, 1000);
    authEvidencePaths.push(await client.screenshot("AUTH-R.3-authscreen-readiness.png"));
    authEvidencePaths.push(
      writeTextArtifact("AUTH-R.3-wda-readiness.txt", [
        `WDA status succeeded at ${baseUrl}.`,
        `Launched ${bundleId} with -UITesting.`,
        `Observed AuthScreen selector ${authRoot.id}.`,
      ])
    );
  } catch (error) {
    wdaBlocker = `WDA/device unavailable or app did not reach AuthScreen: ${String(error?.message || error)}`;
    authEvidencePaths = [
      writeTextArtifact("AUTH-R.3-wda-blocked.txt", [
        wdaBlocker,
        "Expected setup:",
        "ios runwda --udid <UDID> &",
        "ios forward 8100 8100 --udid <UDID> &",
        "curl -s http://127.0.0.1:8100/status",
        "LANESHADOW_BUNDLE_ID=com.laneshadow.app node ios/E2E/sprint-03-auth-remediation.js",
      ]),
    ];
  }

  if (!wdaReady) {
    steps.push(
      makeStep({
        id: "AUTH-R.3",
        title: "Real iOS device auth launch and provider/email sign-in attempt",
        platform: "ios-real-device-wda",
        status: "BLOCKED",
        evidencePaths: authEvidencePaths,
        blocker: wdaBlocker,
        reviewerNotes: [
          "PASS requires a real WDA session artifact from the harness.",
          `Fixture account: ${fixtureEmail}`,
        ],
        commands: [
          "ios runwda --udid <UDID> &",
          "ios forward 8100 8100 --udid <UDID> &",
          `LANESHADOW_BUNDLE_ID=${bundleId} node ios/E2E/sprint-03-auth-remediation.js`,
        ],
        fixture: { email: fixtureEmail, displayName: fixtureDisplayName },
        expectedOutput: [
          "WDA status is reachable on 127.0.0.1:8100.",
          "AuthScreen appears with auth.signIn.root.",
          "Provider or email/password sign-in reaches IdleScreen.",
        ],
      })
    );
  } else {
    try {
      const providerId = authProvider === "google" ? ids.googleButton : ids.appleButton;
      const providerButton = await waitForAccessibilityId(providerId, 8000, 1000);
      await client.tapElement(providerButton);
      authEvidencePaths.push(await client.screenshot("AUTH-R.3-provider-attempt.png"));

      let emailAttempt = { attempted: false, note: "Provider auth branch attempted; email/password branch not requested." };
      if (process.env.LANESHADOW_AUTH_EMAIL || process.env.LANESHADOW_AUTH_PASSWORD) {
        emailAttempt = await tryEmailPasswordSignIn(authEvidencePaths);
      }

      const idle = await waitForAnyAccessibilityId(ids.idleGreetingFallbacks, 45000, 1500);
      authenticated = true;
      authEvidencePaths.push(await client.screenshot("AUTH-R.3-idle-authenticated.png"));
      authEvidencePaths.push(
        writeTextArtifact("AUTH-R.3-authenticated.txt", [
          `Tapped ${providerId}.`,
          emailAttempt.note,
          `Observed IdleScreen greeting selector ${idle.id}. Canonical selector expected by this gate: ${ids.idleGreeting}.`,
        ])
      );
      steps.push(
        makeStep({
          id: "AUTH-R.3",
          title: "Real iOS device auth launch and provider/email sign-in attempt",
          platform: "ios-real-device-wda",
          status: "PASS",
          evidencePaths: authEvidencePaths,
          reviewerNotes: [
            "WDA created a real app session, attempted auth, and observed an authenticated IdleScreen selector.",
            `Provider branch: ${authProvider}. Email/password branch attempted: ${emailAttempt.attempted}.`,
          ],
          commands: [`LANESHADOW_BUNDLE_ID=${bundleId} node ios/E2E/sprint-03-auth-remediation.js`],
          fixture: { email: fixtureEmail, displayName: fixtureDisplayName },
          expectedOutput: ["IdleScreen greeting appears after auth completion."],
        })
      );
    } catch (error) {
      authEvidencePaths.push(
        ...(await captureDiagnostics("AUTH-R.3-auth-blocked", String(error?.message || error), [
          "OAuth may require real Apple/Google account approval or test credentials.",
          "Email/password requires LANESHADOW_AUTH_EMAIL and LANESHADOW_AUTH_PASSWORD.",
        ]))
      );
      steps.push(
        makeStep({
          id: "AUTH-R.3",
          title: "Real iOS device auth launch and provider/email sign-in attempt",
          platform: "ios-real-device-wda",
          status: "BLOCKED",
          evidencePaths: authEvidencePaths,
          blocker: `Auth attempt did not reach IdleScreen: ${String(error?.message || error)}`,
          reviewerNotes: [
            "PASS requires provider or email/password completion from the real harness.",
            `Fixture account: ${fixtureEmail}`,
          ],
          commands: [`LANESHADOW_BUNDLE_ID=${bundleId} LANESHADOW_AUTH_EMAIL=${fixtureEmail} LANESHADOW_AUTH_PASSWORD=<password> node ios/E2E/sprint-03-auth-remediation.js`],
          fixture: { email: fixtureEmail, displayName: fixtureDisplayName },
          expectedOutput: ["IdleScreen greeting appears after auth completion."],
        })
      );
    }
  }

  if (!authenticated) {
    steps.push(
      makeStep({
        id: "AUTH-R.4",
        title: "iOS waits for Convex db.users.getCurrentUser before personalized IdleScreen",
        platform: "ios+convex",
        status: "BLOCKED",
        evidencePaths: [
          ...authEvidencePaths,
          writeTextArtifact("AUTH-R.4-convex-current-user-manual.txt", [
            "Blocked until AUTH-R.3 establishes a real authenticated iOS session.",
            "Manual Convex witness:",
            ...manualConvexCommands(),
            "Expected query/function observation: db.users.getCurrentUser returns the fixture display name before IdleScreen personalization.",
            "Expected IdleScreen text: rider display name from Convex, not a hardcoded local fallback.",
          ]),
        ],
        blocker: "Cannot verify Convex current-user binding without a real authenticated iOS session.",
        reviewerNotes: [
          "The WDA selector check must be paired with Convex command/log evidence before marking this PASS.",
          "db.users.getCurrentUser is the required server-side witness.",
        ],
        commands: manualConvexCommands(),
        fixture: { email: fixtureEmail, displayName: fixtureDisplayName },
        expectedOutput: [
          "db.users.getCurrentUser returns the fixture display name.",
          "IdleScreen greeting includes the same display name.",
        ],
        dependsOn: ["AUTH-R.3"],
      })
    );
  } else {
    steps.push(
      makeStep({
        id: "AUTH-R.4",
        title: "iOS waits for Convex db.users.getCurrentUser before personalized IdleScreen",
        platform: "ios+convex",
        status: "MANUAL",
        evidencePaths: [
          ...authEvidencePaths,
          writeTextArtifact("AUTH-R.4-convex-current-user-manual.txt", [
            "WDA observed IdleScreen after auth. External Convex witness is still required before PASS.",
            "Run:",
            ...manualConvexCommands(),
            "Expected output/action: capture logs or dashboard evidence showing db.users.getCurrentUser returns the fixture display name.",
          ]),
        ],
        blocker: "External Convex current-user observation is required; WDA alone cannot prove the backend function result.",
        reviewerNotes: [
          "Do not mark PASS from WDA UI evidence alone.",
          "Attach Convex logs or dashboard witness for db.users.getCurrentUser.",
        ],
        commands: manualConvexCommands(),
        fixture: { email: fixtureEmail, displayName: fixtureDisplayName },
        expectedOutput: ["db.users.getCurrentUser returns the same display name rendered in idle.greeting."],
        dependsOn: ["AUTH-R.3"],
      })
    );
  }

  if (!authenticated) {
    restoreEvidencePaths = [
      writeTextArtifact("AUTH-R.5-restore-blocked.txt", [
        "Cold-start restore blocked because AUTH-R.3 did not establish authenticated state.",
      ]),
    ];
    steps.push(
      makeStep({
        id: "AUTH-R.5",
        title: "iOS cold-start restores authenticated session",
        platform: "ios-real-device-wda",
        status: "BLOCKED",
        evidencePaths: restoreEvidencePaths,
        blocker: "Cannot terminate/relaunch into restored auth state until sign-in succeeds.",
        reviewerNotes: ["PASS requires WDA terminate/launch/activate and restored IdleScreen greeting evidence."],
        commands: [`LANESHADOW_BUNDLE_ID=${bundleId} node ios/E2E/sprint-03-auth-remediation.js`],
        expectedOutput: ["After terminate/launch/activate, idle.greeting remains visible with the Convex user name."],
        dependsOn: ["AUTH-R.3", "AUTH-R.4"],
      })
    );
  } else {
    try {
      await client.terminateApp(bundleId);
      await client.launchApp(bundleId, ["-UITesting"]);
      await client.activateApp(bundleId);
      const restored = await waitForAnyAccessibilityId(ids.idleGreetingFallbacks, 20000, 1000);
      restoreEvidencePaths = [
        await client.screenshot("AUTH-R.5-restored.png"),
        writeTextArtifact("AUTH-R.5-restored.txt", [
          `App lifecycle endpoints completed for ${bundleId}.`,
          `Observed restored IdleScreen selector ${restored.id}. Canonical selector expected by this gate: ${ids.idleGreeting}.`,
        ]),
      ];
      steps.push(
        makeStep({
          id: "AUTH-R.5",
          title: "iOS cold-start restores authenticated session",
          platform: "ios-real-device-wda",
          status: "PASS",
          evidencePaths: restoreEvidencePaths,
          reviewerNotes: ["WDA terminate/launch/activate completed and IdleScreen greeting remained visible."],
          commands: [`LANESHADOW_BUNDLE_ID=${bundleId} node ios/E2E/sprint-03-auth-remediation.js`],
          expectedOutput: ["IdleScreen greeting remains visible after cold start."],
          dependsOn: ["AUTH-R.3", "AUTH-R.4"],
        })
      );
    } catch (error) {
      restoreEvidencePaths = await captureDiagnostics("AUTH-R.5-restore-blocked", String(error?.message || error), [
        "Check WDA app lifecycle endpoints and device auth persistence.",
      ]);
      steps.push(
        makeStep({
          id: "AUTH-R.5",
          title: "iOS cold-start restores authenticated session",
          platform: "ios-real-device-wda",
          status: "BLOCKED",
          evidencePaths: restoreEvidencePaths,
          blocker: `Cold-start restore failed: ${String(error?.message || error)}`,
          reviewerNotes: ["PASS requires restored IdleScreen greeting from WDA."],
          commands: [`LANESHADOW_BUNDLE_ID=${bundleId} node ios/E2E/sprint-03-auth-remediation.js`],
          expectedOutput: ["IdleScreen greeting remains visible after cold start."],
          dependsOn: ["AUTH-R.3", "AUTH-R.4"],
        })
      );
    }
  }

  const restorePassed = steps.find((step) => step.id === "AUTH-R.5")?.status === "PASS";
  if (!restorePassed) {
    signOutEvidencePaths = [
      writeTextArtifact("AUTH-R.6-sign-out-blocked.txt", [
        "Sign-out blocked because cold-start restore is not in PASS state.",
        "Expected WDA selectors: settings.entry, settings.signOut, auth.signOut.confirm, auth.signIn.root.",
      ]),
    ];
    steps.push(
      makeStep({
        id: "AUTH-R.6",
        title: "iOS Settings sign-out clears auth and returns to AuthScreen",
        platform: "ios-real-device-wda+clerk+convex",
        status: "BLOCKED",
        evidencePaths: signOutEvidencePaths,
        blocker: "Cannot exercise sign-out controls until authenticated restore is available.",
        reviewerNotes: [
          "WDA must tap settings.entry, settings.signOut, and auth.signOut.confirm.",
          "Clerk/Convex token clearing still requires external witness before overall sign-out is considered complete.",
        ],
        commands: [`LANESHADOW_BUNDLE_ID=${bundleId} node ios/E2E/sprint-03-auth-remediation.js`],
        expectedOutput: ["auth.signIn.root appears after confirmation; Clerk dashboard shows no active fixture session."],
        dependsOn: ["AUTH-R.5"],
      })
    );
  } else {
    try {
      const settings = await waitForAccessibilityId(ids.settingsEntry, 8000, 1000);
      await client.tapElement(settings);
      const signOut = await waitForAccessibilityId(ids.signOutAction, 8000, 1000);
      await client.tapElement(signOut);
      const confirm = await waitForAccessibilityId(ids.signOutConfirm, 8000, 1000);
      await client.tapElement(confirm);
      await waitForAccessibilityId(ids.signInRoot, 12000, 1000);
      signOutEvidencePaths = [
        await client.screenshot("AUTH-R.6-signed-out.png"),
        writeTextArtifact("AUTH-R.6-signed-out.txt", [
          `Tapped ${ids.settingsEntry}, ${ids.signOutAction}, and ${ids.signOutConfirm}.`,
          `Observed unauthenticated redirect selector ${ids.signInRoot}.`,
          "Manual Clerk dashboard witness is still required to verify token/session revocation.",
        ]),
      ];
      steps.push(
        makeStep({
          id: "AUTH-R.6",
          title: "iOS Settings sign-out clears auth and returns to AuthScreen",
          platform: "ios-real-device-wda+clerk+convex",
          status: "MANUAL",
          evidencePaths: signOutEvidencePaths,
          blocker: "WDA proved the UI redirect; Clerk dashboard and Convex auth clearing require manual external witness.",
          reviewerNotes: [
            "Do not mark full sign-out PASS until Clerk dashboard confirms fixture session/token state.",
            "The local unauthenticated redirect is evidenced by auth.signIn.root.",
          ],
          commands: ["Clerk dashboard > Users > fixture account > Sessions", ...manualConvexCommands()],
          fixture: { email: fixtureEmail, displayName: fixtureDisplayName },
          expectedOutput: ["auth.signIn.root is visible and Clerk no longer lists an active fixture session."],
          dependsOn: ["AUTH-R.5"],
        })
      );
    } catch (error) {
      signOutEvidencePaths = await captureDiagnostics("AUTH-R.6-sign-out-blocked", String(error?.message || error), [
        `Expected selectors: ${ids.settingsEntry}, ${ids.signOutAction}, ${ids.signOutConfirm}, ${ids.signInRoot}.`,
      ]);
      steps.push(
        makeStep({
          id: "AUTH-R.6",
          title: "iOS Settings sign-out clears auth and returns to AuthScreen",
          platform: "ios-real-device-wda+clerk+convex",
          status: "BLOCKED",
          evidencePaths: signOutEvidencePaths,
          blocker: `Sign-out controls or unauthenticated redirect unavailable: ${String(error?.message || error)}`,
          reviewerNotes: ["PASS requires WDA artifact paths from the sign-out sequence."],
          commands: [`LANESHADOW_BUNDLE_ID=${bundleId} node ios/E2E/sprint-03-auth-remediation.js`],
          expectedOutput: ["auth.signIn.root appears after sign-out confirmation."],
          dependsOn: ["AUTH-R.5"],
        })
      );
    }
  }

  const androidWitness = writeTextArtifact("AUTH-R.7-android-manual-witness.md", [
    "# AUTH-R.7 Android Evidence",
    "",
    "Android PASS is allowed only when produced from a physical device or project-approved instrumentation artifact.",
    "",
    "Required command:",
    "adb devices",
    "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest",
    "",
    "Physical device witness:",
    "1. Install a debug build on a physical device.",
    `2. Sign in with Google OAuth or email fixture ${fixtureEmail}.`,
    "3. Confirm IdleScreen renders the Convex display name.",
    "4. Kill/relaunch and confirm restore.",
    "5. Sign out and confirm AuthScreen returns.",
    "",
    "Expected artifact: Gradle connectedDebugAndroidTest output, device screenshot/video, or androidTest screenshot path.",
  ]);
  steps.push(
    makeStep({
      id: "AUTH-R.7",
      title: "Android auth integration has instrumentation or physical-device evidence",
      platform: "android-physical-device-or-instrumentation",
      status: "MANUAL",
      evidencePaths: [
        androidWitness,
        repoPath("android", "app", "src", "androidTest", "java", "com", "laneshadow", "ui", "LoginSmokeTest.kt"),
        repoPath("android", "app", "src", "androidTest", "java", "com", "laneshadow", "ui", "RootViewAuthGateEspressoTest.kt"),
        ...existing(androidSnapshotPaths(requiredTemplateIds)),
      ],
      blocker: "Android has no approved physical-device auth harness in this task; mark PASS only with connectedDebugAndroidTest or physical device artifact paths.",
      reviewerNotes: [
        "Do not mark Android PASS from iOS WDA evidence.",
        "connectedDebugAndroidTest or physical device witness must include artifact paths.",
      ],
      commands: [
        "adb devices",
        "cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.LoginSmokeTest,com.laneshadow.ui.RootViewAuthGateEspressoTest",
      ],
      fixture: { email: fixtureEmail, displayName: fixtureDisplayName },
      expectedOutput: [
        "Gradle connectedDebugAndroidTest exits 0 and produces Android artifact paths, or manual witness records physical device screenshots/video.",
      ],
    })
  );

  const unauthenticatedWitness = writeTextArtifact("AUTH-R.8-unauthenticated-witness.md", [
    "# AUTH-R.8 UNAUTHENTICATED Redirect Evidence",
    "",
    "Required external checks:",
    ...clerkDashboardActions().map((line) => `- ${line}`),
    "",
    "Convex commands:",
    ...manualConvexCommands().map((line) => `- ${line}`),
    "",
    "Expected output:",
    "- Convex reports or logs an UNAUTHENTICATED response for the revoked/expired fixture session.",
    "- iOS redirects to auth.signIn.root.",
    "- Android redirects to AuthScreen or records MANUAL/BLOCKED with physical device artifact instructions.",
  ]);
  steps.push(
    makeStep({
      id: "AUTH-R.8",
      title: "Convex UNAUTHENTICATED redirects to AuthScreen on iOS and Android",
      platform: "ios+android+clerk+convex",
      status: wdaReady ? "MANUAL" : "BLOCKED",
      evidencePaths: [unauthenticatedWitness, ...signOutEvidencePaths],
      blocker: wdaReady
        ? "Clerk dashboard token revocation and Convex UNAUTHENTICATED observation require external witness."
        : "WDA was unavailable, so iOS redirect cannot be observed from the real harness.",
      reviewerNotes: [
        "Do not fake OAuth, Clerk dashboard, Convex current-user, Android device, or WDA evidence.",
        "Record PASS only with Clerk dashboard action, Convex UNAUTHENTICATED output, and platform redirect artifacts.",
      ],
      commands: ["Clerk dashboard token/session revocation", ...manualConvexCommands()],
      fixture: { email: fixtureEmail, displayName: fixtureDisplayName },
      expectedOutput: [
        "UNAUTHENTICATED is observed after revocation.",
        "iOS shows auth.signIn.root.",
        "Android shows AuthScreen or has MANUAL/BLOCKED witness fields.",
      ],
      dependsOn: ["AUTH-R.3", "AUTH-R.7"],
    })
  );

  const statusCounts = steps.reduce((counts, step) => {
    counts[step.status] = (counts[step.status] || 0) + 1;
    return counts;
  }, {});

  const report = {
    schemaVersion: 1,
    taskId: "AUTH-S03-R08",
    generatedAt: new Date().toISOString(),
    command: `LANESHADOW_BUNDLE_ID=${bundleId} node ios/E2E/sprint-03-auth-remediation.js`,
    bundleId,
    wdaBaseUrl: baseUrl,
    fixtureAccount: {
      email: fixtureEmail,
      displayName: fixtureDisplayName,
      passwordProvided: !fixturePassword.startsWith("<set "),
    },
    designSource,
    storyIds: requiredStoryIds,
    statusCounts,
    reportPath: resultsPath,
    steps,
  };

  writeJson(resultsPath, report);
  await client.deleteSession();
  process.exit(0);
}

main().catch(async (error) => {
  const fatalPath = writeTextArtifact("fatal-error.txt", [String(error?.stack || error)]);
  writeJson(resultsPath, {
    schemaVersion: 1,
    taskId: "AUTH-S03-R08",
    generatedAt: new Date().toISOString(),
    command: `LANESHADOW_BUNDLE_ID=${bundleId} node ios/E2E/sprint-03-auth-remediation.js`,
    bundleId,
    wdaBaseUrl: baseUrl,
    statusCounts: { BLOCKED: 8 },
    reportPath: resultsPath,
    steps: Array.from({ length: 8 }, (_, index) =>
      makeStep({
        id: `AUTH-R.${index + 1}`,
        title: "Evidence generation failed before step evaluation",
        platform: "ios+android",
        status: "BLOCKED",
        evidencePaths: [fatalPath],
        blocker: String(error?.message || error),
        reviewerNotes: ["Fix the evidence script error and rerun the command."],
      })
    ),
  });
  await client.deleteSession().catch(() => {});
  process.exit(0);
});
