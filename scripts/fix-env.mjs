import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
const keyPath = join(root, "firebase-service-account.json");

let json;
if (existsSync(keyPath)) {
  json = JSON.parse(readFileSync(keyPath, "utf8"));
} else {
  const raw = readFileSync(envPath, "utf8").trim();
  const start = raw.indexOf("{");
  if (start === -1) {
    console.error("Could not find JSON in .env. Save your Firebase key as firebase-service-account.json");
    process.exit(1);
  }
  json = JSON.parse(raw.slice(start));
}

writeFileSync(envPath, `FIREBASE_SERVICE_ACCOUNT_KEY=${JSON.stringify(json)}\n`);
console.log("Fixed .env — one line, project:", json.project_id);

if (existsSync(keyPath)) {
  unlinkSync(keyPath);
  console.log("Removed firebase-service-account.json (no longer needed)");
}
