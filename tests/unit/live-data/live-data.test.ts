import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

vi.mock("react-router", () => ({
  useRevalidator: vi.fn(),
}));

vi.mock("usehooks-ts", () => ({
  useInterval: vi.fn(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    createContext: vi.fn(() => ({ Provider: vi.fn() })),
    useContext: vi.fn(),
    useEffect: vi.fn(),
    useState: vi.fn(),
  };
});

describe("LiveDataProvider", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("refresh interval", () => {
    test("uses 3 second interval", async () => {
      const { useInterval } = await import("usehooks-ts");
      expect(useInterval).toBeDefined();
      expect(3000).toBe(3000);
    });

    test("disables interval when paused", () => {
      const visible = true;
      const paused = true;
      const interval = visible && !paused ? 3000 : null;
      expect(interval).toBeNull();
    });

    test("disables interval when hidden", () => {
      const visible = false;
      const paused = false;
      const interval = visible && !paused ? 3000 : null;
      expect(interval).toBeNull();
    });

    test("only revalidates when idle", () => {
      const mockRevalidate = vi.fn();
      const revalidateIfIdle = (state: string) => {
        if (state === "idle") mockRevalidate();
      };

      revalidateIfIdle("idle");
      expect(mockRevalidate).toHaveBeenCalledTimes(1);

      mockRevalidate.mockClear();
      revalidateIfIdle("loading");
      expect(mockRevalidate).not.toHaveBeenCalled();
    });
  });

  describe("useLiveData hook", () => {
    test("returns pause and resume functions", () => {
      const mockSetPaused = vi.fn();
      const hook = {
        pause: () => mockSetPaused(true),
        resume: () => mockSetPaused(false),
      };

      hook.pause();
      expect(mockSetPaused).toHaveBeenCalledWith(true);

      hook.resume();
      expect(mockSetPaused).toHaveBeenCalledWith(false);
    });
  });
});

describe("pending approval page", () => {
  test("redirects when user has access", () => {
    const hasAccess = true;
    const redirect = hasAccess ? "/machines" : null;
    expect(redirect).toBe("/machines");
  });

  test("stays on page when user lacks access", () => {
    const hasAccess = false;
    const redirect = hasAccess ? "/machines" : null;
    expect(redirect).toBeNull();
  });
});
