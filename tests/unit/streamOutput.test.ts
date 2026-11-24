import { describe, expect, it } from "vitest";

import {
  resolveStreamOutput,
  STREAM_OUTPUT_DISABLED,
} from "@/features/retro-office/core/streamOutput";

describe("resolveStreamOutput", () => {
  it("is off unless stream=1 is present", () => {
    expect(resolveStreamOutput("")).toEqual(STREAM_OUTPUT_DISABLED);
    expect(resolveStreamOutput("?camera=ORBIT&fps=60")).toEqual(STREAM_OUTPUT_DISABLED);
    expect(resolveStreamOutput("?stream=0")).toEqual(STREAM_OUTPUT_DISABLED);
  });

  it("defaults to 30 fps, dpr 1, shadows on", () => {
    expect(resolveStreamOutput("?stream=1")).toEqual({
      enabled: true,
      fps: 30,
      dpr: 1,
      shadows: true,
    });
  });

  it("clamps fps and dpr and honours shadows=0", () => {
    expect(resolveStreamOutput("?stream=true&fps=240&dpr=9&shadows=0")).toEqual({
      enabled: true,
      fps: 60,
      dpr: 2,
      shadows: false,
    });
    expect(resolveStreamOutput("?stream=1&fps=0&dpr=0.1")).toMatchObject({ fps: 1, dpr: 0.5 });
    expect(resolveStreamOutput("?stream=1&fps=abc")).toMatchObject({ fps: 30 });
  });
});
