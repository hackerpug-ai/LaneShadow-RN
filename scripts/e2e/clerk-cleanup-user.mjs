#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(resolve(process.cwd(), ".env.local"));

const email = readEmailArg(process.argv.slice(2));
const secretKey = process.env.CLERK_SECRET_KEY;

if (!email) {
  console.error("Usage: node scripts/e2e/clerk-cleanup-user.mjs --email <email>");
  process.exit(2);
}

if (!secretKey) {
  console.error("Missing CLERK_SECRET_KEY for Clerk E2E cleanup.");
  process.exit(2);
}

const users = await listUsersByEmail(email, secretKey);
for (const user of users) {
  if (typeof user.id === "string" && user.id.length > 0) {
    await deleteUser(user.id, secretKey);
  }
}

console.log(`Clerk cleanup: deleted ${users.length} user(s) for ${email}.`);

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

function readEmailArg(args) {
  const emailFlagIndex = args.indexOf("--email");
  if (emailFlagIndex !== -1) {
    return args[emailFlagIndex + 1] ?? "";
  }

  const inline = args.find((arg) => arg.startsWith("--email="));
  return inline?.slice("--email=".length) ?? "";
}

async function listUsersByEmail(emailAddress, key) {
  const url = new URL("https://api.clerk.com/v1/users");
  url.searchParams.set("email_address", emailAddress);
  url.searchParams.set("limit", "100");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Clerk user lookup failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
}

async function deleteUser(userID, key) {
  const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userID)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Clerk user delete failed for ${userID} with HTTP ${response.status}`);
  }
}
