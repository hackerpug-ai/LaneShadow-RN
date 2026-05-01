#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(resolve(process.cwd(), ".env.local"));

const args = process.argv.slice(2);
const email = readArg(args, "--email") || process.env.CLERK_TEST_EMAIL || process.env.LANESHADOW_AUTH_EMAIL;
const password =
  readArg(args, "--password") || process.env.CLERK_TEST_PASSWORD || process.env.LANESHADOW_AUTH_PASSWORD;
const secretKey = process.env.CLERK_SECRET_KEY;

if (!email || !password) {
  console.error(
    "Usage: node scripts/e2e/clerk-ensure-test-user.mjs --email <email> --password <password>"
  );
  process.exit(2);
}

if (!secretKey) {
  console.error("Missing CLERK_SECRET_KEY for Clerk E2E login user setup.");
  process.exit(2);
}

const existingUsers = await listUsersByEmail(email, secretKey);
if (existingUsers.length === 0) {
  await createUser(email, password, secretKey);
  console.log(`Clerk login seed: created user for ${email}.`);
} else {
  await updateUserPassword(existingUsers[0].id, password, secretKey);
  console.log(`Clerk login seed: synced password for ${email}.`);
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = stripQuotes(line.slice(equalsIndex + 1).split("#")[0].trim());
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function readArg(args, name) {
  const flagIndex = args.indexOf(name);
  if (flagIndex !== -1) {
    return args[flagIndex + 1] ?? "";
  }

  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  return inline?.slice(name.length + 1) ?? "";
}

async function listUsersByEmail(emailAddress, key) {
  const url = new URL("https://api.clerk.com/v1/users");
  url.searchParams.set("email_address", emailAddress);
  url.searchParams.set("limit", "100");

  const payload = await clerkRequest(url, key);
  return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
}

async function createUser(emailAddress, userPassword, key) {
  await clerkRequest("https://api.clerk.com/v1/users", key, {
    method: "POST",
    body: {
      email_address: [emailAddress],
      password: userPassword,
      first_name: "LaneShadow",
      last_name: "E2E",
      skip_password_checks: true,
    },
  });
}

async function updateUserPassword(userID, userPassword, key) {
  await clerkRequest(`https://api.clerk.com/v1/users/${encodeURIComponent(userID)}`, key, {
    method: "PATCH",
    body: {
      password: userPassword,
      skip_password_checks: true,
      sign_out_of_other_sessions: true,
    },
  });
}

async function clerkRequest(url, key, options = {}) {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const detail = payload?.errors?.[0]?.message ?? payload?.errors?.[0]?.code ?? "unknown Clerk error";
    throw new Error(`Clerk request failed with HTTP ${response.status}: ${detail}`);
  }

  return payload;
}
