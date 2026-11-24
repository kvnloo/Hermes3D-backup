// Capture what OBS Browser Source would show for the camera-only stream output,
// and measure the real render rate. Headless: no window, no screen capture.
//
// usage: node scripts/stream/capture-stream-frame.mjs [url] [outdir]
//   default url: http://127.0.0.1:3000/office?stream=1&fps=30&dpr=1
//   CHROME=/path/to/chrome-headless-shell  to use a specific browser binary
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const url = process.argv[2] ?? "http://127.0.0.1:3000/office?stream=1&fps=30&dpr=1";
const out = process.argv[3] ?? "stream-capture";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME || undefined,
  args: ["--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.waitForFunction(() => (window.__hermes3dStream?.frames ?? 0) > 30, null, { timeout: 180_000 });
await page.waitForTimeout(8_000);

const sample = () =>
  page.evaluate(() => ({ frames: window.__hermes3dStream.frames, t: performance.now() }));
const a = await sample();
await page.waitForTimeout(10_000);
const b = await sample();

const info = await page.evaluate(() => {
  const host = document.querySelector("[data-stream-output]");
  const canvas = host?.querySelector("canvas");
  const gl = canvas?.getContext("webgl2") || canvas?.getContext("webgl");
  const dbg = gl?.getExtension("WEBGL_debug_renderer_info");
  return {
    config: window.__hermes3dStream,
    canvasPx: canvas ? [canvas.width, canvas.height] : null,
    glRenderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null,
    canvasOnTop: document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.tagName === "CANVAS",
  };
});
await page.screenshot({ path: path.join(out, "frame.png") });
const report = {
  url,
  measuredFps: +(((b.frames - a.frames) * 1000) / (b.t - a.t)).toFixed(2),
  ...info,
};
fs.writeFileSync(path.join(out, "capture.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
await browser.close();
