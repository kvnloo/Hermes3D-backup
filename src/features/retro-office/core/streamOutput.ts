/**
 * Stream output mode: `/office?stream=1` turns the office page into a
 * camera-only video source for OBS (Browser Source) or any headless capture.
 *
 * - Only the three.js canvas is shown, pinned over the whole viewport.
 * - Frames are rendered on a fixed clock (`fps`, default 30) instead of every
 *   display refresh, at a fixed device-pixel ratio (`dpr`, default 1), so the
 *   GPU cost is bounded and predictable while other GPU work runs.
 * - `shadows=0` turns shadow maps off for the cheapest output.
 *
 * Example: /office?stream=1&camera=ORBIT&fps=30&dpr=1
 */
export type StreamOutputConfig = {
  enabled: boolean;
  fps: number;
  dpr: number;
  shadows: boolean;
};

export const STREAM_OUTPUT_DISABLED: StreamOutputConfig = {
  enabled: false,
  fps: 30,
  dpr: 1,
  shadows: true,
};

const clampNumber = (raw: string | null, fallback: number, min: number, max: number) => {
  if (raw === null || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const isOn = (raw: string | null) =>
  raw !== null && ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());

const isOff = (raw: string | null) =>
  raw !== null && ["0", "false", "no", "off"].includes(raw.trim().toLowerCase());

export const resolveStreamOutput = (search: string | null | undefined): StreamOutputConfig => {
  const params = new URLSearchParams(search ?? "");
  if (!isOn(params.get("stream"))) return STREAM_OUTPUT_DISABLED;
  return {
    enabled: true,
    fps: Math.round(clampNumber(params.get("fps"), 30, 1, 60)),
    dpr: clampNumber(params.get("dpr"), 1, 0.5, 2),
    shadows: !isOff(params.get("shadows")),
  };
};

export const readStreamOutput = (): StreamOutputConfig =>
  typeof window === "undefined"
    ? STREAM_OUTPUT_DISABLED
    : resolveStreamOutput(window.location.search);
