import { assertEquals } from "@std/assert";

// ---------------------------------------------------------------------------
// useTheme Tests - Theme Management Logic
// ---------------------------------------------------------------------------

type Theme = "egg" | "egg-dark";

/**
 * Extract theme logic from useTheme for testing.
 */
function getInitialTheme(
  storageValue: string | null,
  prefersDark: boolean,
): Theme {
  if (storageValue === "egg" || storageValue === "egg-dark") {
    return storageValue;
  }
  return prefersDark ? "egg-dark" : "egg";
}

function toggleTheme(current: Theme): Theme {
  return current === "egg" ? "egg-dark" : "egg";
}

/**
 * Mock localStorage for testing.
 */
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

Deno.test("useTheme – get initial theme from localStorage", () => {
  const theme = getInitialTheme("egg-dark", false);
  assertEquals(theme, "egg-dark");
});

Deno.test("useTheme – get initial theme: stored value overrides preference", () => {
  const theme = getInitialTheme("egg", true); // Preferences dark, but stored is light
  assertEquals(theme, "egg");
});

Deno.test("useTheme – get initial theme: invalid stored value ignored", () => {
  const theme = getInitialTheme("invalid-theme", true);
  assertEquals(theme, "egg-dark"); // Falls back to preference (dark)
});

Deno.test("useTheme – get initial theme: null storage uses system preference (dark)", () => {
  const theme = getInitialTheme(null, true);
  assertEquals(theme, "egg-dark");
});

Deno.test("useTheme – get initial theme: null storage uses system preference (light)", () => {
  const theme = getInitialTheme(null, false);
  assertEquals(theme, "egg");
});

Deno.test("useTheme – toggle theme: egg → egg-dark", () => {
  const newTheme = toggleTheme("egg");
  assertEquals(newTheme, "egg-dark");
});

Deno.test("useTheme – toggle theme: egg-dark → egg", () => {
  const newTheme = toggleTheme("egg-dark");
  assertEquals(newTheme, "egg");
});

Deno.test("useTheme – toggle twice returns to original", () => {
  let theme: Theme = "egg";
  theme = toggleTheme(theme);
  assertEquals(theme, "egg-dark");
  theme = toggleTheme(theme);
  assertEquals(theme, "egg");
});

Deno.test("useTheme – localStorage: set and get theme", () => {
  const storage = new MockLocalStorage();
  const key = "team-scrambler-theme";

  storage.setItem(key, "egg-dark");
  const retrieved = storage.getItem(key);

  assertEquals(retrieved, "egg-dark");
});

Deno.test("useTheme – localStorage: multiple keys isolated", () => {
  const storage = new MockLocalStorage();

  storage.setItem("theme", "egg-dark");
  storage.setItem("other", "value");

  assertEquals(storage.getItem("theme"), "egg-dark");
  assertEquals(storage.getItem("other"), "value");
});

Deno.test("useTheme – localStorage: remove item", () => {
  const storage = new MockLocalStorage();
  const key = "team-scrambler-theme";

  storage.setItem(key, "egg-dark");
  storage.removeItem(key);

  assertEquals(storage.getItem(key), null);
});

Deno.test("useTheme – localStorage: clear all", () => {
  const storage = new MockLocalStorage();

  storage.setItem("theme1", "egg");
  storage.setItem("theme2", "egg-dark");
  storage.clear();

  assertEquals(storage.getItem("theme1"), null);
  assertEquals(storage.getItem("theme2"), null);
});

Deno.test("useTheme – flow: SSR safe (no storage) defaults to light", () => {
  // Simulate SSR environment where localStorage is unavailable
  const theme = getInitialTheme(null, false); // No preference, no storage
  assertEquals(theme, "egg");
});

Deno.test("useTheme – flow: persist after toggle", () => {
  const storage = new MockLocalStorage();
  const key = "team-scrambler-theme";

  let theme: Theme = "egg";
  storage.setItem(key, theme);

  theme = toggleTheme(theme);
  storage.setItem(key, theme);

  const persisted = storage.getItem(key);
  assertEquals(persisted, "egg-dark");
});

Deno.test("useTheme – flow: recovery from storage on page reload", () => {
  const storage = new MockLocalStorage();
  const key = "team-scrambler-theme";

  // First session: user chooses dark
  let theme: Theme = "egg";
  theme = toggleTheme(theme);
  storage.setItem(key, theme);

  // "Page reload" - initialize again from storage
  const recovered = getInitialTheme(storage.getItem(key), false);
  assertEquals(recovered, "egg-dark");
});

Deno.test("useTheme – edge case: empty string in storage treated as default", () => {
  const theme = getInitialTheme("", false);
  assertEquals(theme, "egg"); // Falls back to system preference
});

Deno.test("useTheme – transition sequence: light → dark → light", () => {
  let theme: Theme = "egg";
  let darkPref = false;

  // Start
  assertEquals(getInitialTheme(null, darkPref), "egg");

  // Toggle to dark
  theme = toggleTheme(theme);
  assertEquals(theme, "egg-dark");

  // Toggle back to light
  theme = toggleTheme(theme);
  assertEquals(theme, "egg");
});
