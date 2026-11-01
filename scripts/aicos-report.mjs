#!/usr/bin/env node
// Sends an AI team report (aicos.report/v1) to the CEO's AI Company OS dashboard.
// Dependency-free so it works in any repository (Node 18+).
//
//   node scripts/aicos-report.mjs <report.json>
//
// The agent key comes from AICOS_AGENT_KEY, or on macOS from the Keychain item
// "aicos-agent-key". It is never written to disk. The dashboard validates every
// report fully before applying it; this script only does basic checks.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const path = process.argv[2];
if (!path) {
  console.error("usage: node scripts/aicos-report.mjs <report.json>");
  process.exit(2);
}

let report;
try {
  report = JSON.parse(readFileSync(path, "utf8"));
} catch (e) {
  console.error(`INVALID ${path}: ${e.message}`);
  process.exit(1);
}
const problems = [];
if (report.schema !== "aicos.report/v1") problems.push('schema must be "aicos.report/v1"');
if (typeof report.reportId !== "string" || report.reportId.length < 8) problems.push("reportId: at least 8 characters");
if (Number.isNaN(Date.parse(report.sentAt))) problems.push("sentAt: ISO date-time");
if (!["claude_code", "claude_code_web", "claude_chat"].includes(report.source)) problems.push("source: claude_code | claude_code_web | claude_chat");
if (!Array.isArray(report.actions) || report.actions.length === 0) problems.push("actions: at least one");
if (JSON.stringify(report).length > 1_000_000) problems.push("report larger than 1 MB — split it");
if (problems.length) {
  console.error(`INVALID ${path}\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}

function agentKey() {
  if (process.env.AICOS_AGENT_KEY) return process.env.AICOS_AGENT_KEY.trim();
  if (process.platform === "darwin") {
    try {
      return execFileSync("security", ["find-generic-password", "-s", "aicos-agent-key", "-w"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      /* not in Keychain */
    }
  }
  return null;
}

const key = agentKey();
if (!key) {
  console.error(
    "NO_AGENT_KEY: no agent key on this machine, so the report was NOT sent.\n" +
      "Fallback: show the CEO the report JSON to paste into Execution Center → Import team report.\n" +
      "Setup: dashboard → Settings → AI team channel → Create agent key.",
  );
  process.exit(3);
}

const here = dirname(fileURLToPath(import.meta.url));
const configPath = [join(process.cwd(), "aicos.config.json"), join(here, "..", "aicos.config.json")].find(existsSync);
if (!configPath) {
  console.error("aicos.config.json not found (it holds the public dashboard connection settings).");
  process.exit(2);
}
const config = JSON.parse(readFileSync(configPath, "utf8"));

const res = await fetch(`${config.supabaseUrl}/rest/v1/rpc/submit_agent_report`, {
  method: "POST",
  headers: { apikey: config.supabasePublishableKey, "Content-Type": "application/json" },
  body: JSON.stringify({ p_key: key, p_payload: report }),
});
const body = await res.text();
if (!res.ok) {
  console.error(`SEND FAILED (${res.status}): ${body.slice(0, 500)}`);
  process.exit(1);
}
console.log(`SENT: report #${body} with ${report.actions.length} action(s) is in the CEO's inbox; the dashboard applies it on its next sync.`);
