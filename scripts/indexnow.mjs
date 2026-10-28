#!/usr/bin/env node
// Submits every URL in public/sitemap.xml to IndexNow (Bing, Yandex, Seznam, Naver, Yep...).
// Waits until the key file is live so engines can verify ownership after a fresh deploy.
import { readFile } from "node:fs/promises";

const HOST = "liondigitalsolution.com";
const KEY = "e52b453020786170b66a5462d3c3e664";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const MAX_WAIT_MS = 10 * 60 * 1000;
const POLL_MS = 20 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForKeyFile() {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(KEY_LOCATION, { cache: "no-store" });
      if (res.ok && (await res.text()).trim() === KEY) return;
    } catch {
      // Network hiccup or deploy in progress; retry.
    }
    console.log("Key file not live yet, retrying...");
    await sleep(POLL_MS);
  }
  throw new Error(`Key file never became reachable at ${KEY_LOCATION}`);
}

async function readSitemapUrls() {
  const xml = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length === 0) throw new Error("No URLs found in public/sitemap.xml");
  return urls;
}

async function main() {
  const urlList = await readSitemapUrls();
  await waitForKeyFile();

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });

  console.log(`IndexNow responded ${res.status} for ${urlList.length} URLs`);
  // 200 = accepted, 202 = accepted (key validation pending).
  if (res.status !== 200 && res.status !== 202) {
    console.error(await res.text());
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
