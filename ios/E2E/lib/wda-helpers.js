import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ALLOWED = new Set(["PASS", "FAIL", "BLOCKED", "MANUAL"]);

export class StepTracker {
  constructor() {
    this.results = [];
    this.byId = new Map();
  }

  record({ id, step, status, detail = "", dependsOn = [], evidence = {}, remediation = "" }) {
    const normalized = ALLOWED.has(String(status).toUpperCase())
      ? String(status).toUpperCase()
      : "MANUAL";

    const blocking = dependsOn.filter((dep) => {
      const prior = this.byId.get(dep);
      return prior === "FAIL" || prior === "BLOCKED";
    });

    const finalStatus = blocking.length > 0 && normalized !== "MANUAL" ? "BLOCKED" : normalized;
    const finalDetail = blocking.length > 0
      ? `${detail}${detail ? " " : ""}(blocked by: ${blocking.join(", ")})`
      : detail;

    this.byId.set(id, finalStatus);
    this.results.push({
      id,
      step,
      status: finalStatus,
      detail: finalDetail,
      dependsOn,
      timestamp: new Date().toISOString(),
      evidence,
      remediation,
    });

    return finalStatus;
  }

  all() {
    return this.results;
  }
}

export class WdaClient {
  constructor(baseUrl, screenshotDir) {
    this.baseUrl = baseUrl;
    this.screenshotDir = screenshotDir;
    this.sessionId = null;
  }

  async request(method, path, body) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`WDA ${method} ${path} failed: ${response.status} ${text}`);
    }
    return response.json();
  }

  async status() {
    return this.request("GET", "/status");
  }

  async createSession(bundleId, args = ["-UITesting"]) {
    const response = await this.request("POST", "/session", {
      capabilities: {
        alwaysMatch: {
          bundleId,
          arguments: args,
        },
      },
    });
    this.sessionId = response.sessionId || response.value?.sessionId;
    return this.sessionId;
  }

  async deleteSession() {
    if (!this.sessionId) return;
    await this.request("DELETE", `/session/${this.sessionId}`).catch(() => {});
    this.sessionId = null;
  }

  async sessionRequest(method, path, body) {
    if (!this.sessionId) throw new Error("No active WDA session");
    return this.request(method, `/session/${this.sessionId}${path}`, body);
  }

  async findByAccessibilityId(value) {
    const res = await this.sessionRequest("POST", "/element", {
      using: "accessibility id",
      value,
    });
    return res.value;
  }

  async screenshot(name) {
    if (!existsSync(this.screenshotDir)) mkdirSync(this.screenshotDir, { recursive: true });
    const res = await this.sessionRequest("GET", "/screenshot");
    const buffer = Buffer.from(res.value, "base64");
    const path = join(this.screenshotDir, name);
    writeFileSync(path, buffer);
    return path;
  }

  async source(path) {
    const res = await this.sessionRequest("GET", "/source");
    writeFileSync(path, typeof res.value === "string" ? res.value : JSON.stringify(res.value, null, 2));
    return path;
  }
}

export function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

export function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}
