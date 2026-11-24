# Stream the three.js camera straight into OBS

Hermes3D has a camera-only output mode, `/office?stream=1`. OBS loads it in its
own built-in browser (Browser Source), so OBS renders the three.js scene itself.
You don't need a Chrome window, window capture or screen capture.

```
three.js camera  ->  OBS Browser Source (renders the page)  ->  OBS encoder  ->  stream/record
```

## What `?stream=1` does

- Shows only the three.js canvas at full size. The HUD, chat, panels and buttons
  are covered, so the OBS frame is the camera view.
- Renders on a fixed clock (`fps`, default 30), not on every display refresh.
  Nothing renders between ticks, so the scene can't push the GPU above the cap.
- Uses a fixed pixel ratio (`dpr`, default 1) instead of the adaptive one.
- `shadows=0` turns shadow maps off for the cheapest output.
- Works with the existing camera modes: `camera=ORBIT` slowly orbits the office.

| Param | Default | Range | Effect |
|---|---|---|---|
| `stream` | off | `1` | camera-only output |
| `fps` | 30 | 1–60 | render rate cap |
| `dpr` | 1 | 0.5–2 | pixel ratio (1 = 1920x1080 at a 1920x1080 source) |
| `shadows` | on | `0` | shadow maps off |
| `camera` | DEFAULT | `ORBIT` | slow continuous orbit |

Lowest-GPU example: `/office?stream=1&fps=24&dpr=0.75&shadows=0`

## OBS setup (OBS 30 or later; tested settings for OBS 33)

1. Start Hermes3D as usual. With the bundled demo data, run
   `npm run demo-gateway` and then
   `HERMES3D_GATEWAY_URL=ws://localhost:18789 HERMES3D_GATEWAY_ADAPTER_TYPE=demo npm start`
   (needs `npm run build` first). The app listens on `http://127.0.0.1:3000` (`PORT=` changes it).
2. In OBS, go to **Scenes**, click **+**, and name the scene `Hermes3D Camera`.
3. Under **Sources**, click **+**, choose **Browser**, name it `Hermes3D three.js camera`, and click **OK**.
4. Fill in the properties:
   - **URL:** `http://127.0.0.1:3000/office?stream=1&fps=30&dpr=1` (add `&camera=ORBIT` for a moving shot)
   - **Width:** `1920`, **Height:** `1080`
   - Turn on **Use custom frame rate** and set **FPS:** `30`. Use the same number as `fps=` in the URL.
   - Turn on **Shutdown source when not visible**. The scene stops rendering when it is off-air.
   - Leave **Custom CSS** at its default.
5. Click **OK**. Right-click the source and choose **Transform → Fit to screen**.
6. Settings → Video: set base and output to 1920x1080 and **Common FPS** to 30.
   Settings → Output: choose a hardware encoder (NVENC, Apple VT or VAAPI), not x264.
7. Settings → Advanced → Sources: leave **Enable Browser Source Hardware
   Acceleration** on. With it on, CEF renders WebGL on the GPU and hands the texture to OBS.

To do the same with obs-websocket (Tools → WebSocket Server Settings, v5 protocol):
`CreateScene {sceneName:"Hermes3D Camera"}`, then
`CreateInput {sceneName:"Hermes3D Camera", inputName:"Hermes3D three.js camera", inputKind:"browser_source", inputSettings:{url:"http://127.0.0.1:3000/office?stream=1&fps=30&dpr=1", width:1920, height:1080, fps_custom:true, fps:30, shutdown:true}}`.

## Check it without OBS

`node scripts/stream/capture-stream-frame.mjs "http://127.0.0.1:3000/office?stream=1&fps=30&dpr=1" out`
renders the page headless at 1920x1080. It writes `out/frame.png` and
`out/capture.json`, which hold the measured fps, the canvas size, the GL
renderer and whether the canvas is on top.

## Measured (11-24, headless Chromium, Apple M5 Max via ANGLE/Metal, demo data)

| URL | Rendered frames/s |
|---|---|
| `/office` (normal) | 18.6 |
| `/office?stream=1&fps=30&dpr=1` | 25.4 (cap 30; clock ticks 25.3, so there were no extra renders) |
| `/office?stream=1&fps=15&dpr=1` | 13.2 (cap 15) |

The canvas was 1920x1080 and the canvas element was on top at the center and
the corners, so no HUD was in the frame. Under load the rate lands slightly
below the cap, because the timer runs on the page's main thread; it never goes above.

## Other routes (not built)

- `canvas.captureStream()` -> WebRTC/WHIP -> OBS 30+ WHIP source. This needs a
  browser page to keep running and a relay. It adds an encode, a network hop and
  a decode, and saves no GPU over Browser Source on the same machine.
  It only pays off when the scene renders on another machine.
- Headless Chromium -> ffmpeg (no OBS). This is the offload route when OBS should
  not run on the render box.
