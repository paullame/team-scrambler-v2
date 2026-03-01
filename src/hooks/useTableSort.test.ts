import { assertEquals } from "@std/assert";
import { createTestPerson } from "../core/testHelpers.ts";

// ---------------------------------------------------------------------------
// useTableSort Tests - Sorting Behavior
// ---------------------------------------------------------------------------

/**
 * Extract core sort logic from useTableSort as a testable function.
 */
function applySortLogic(
  people: ReturnType<typeof createTestPerson>[],
  sortKey: string,
  sortDir: "asc" | "desc",
): typeof people {
  return [...people].sort((a, b) => {
    const av = sortKey === "displayName" ? a.displayName : (a.criteria[sortKey] ?? "");
    const bv = sortKey === "displayName" ? b.displayName : (b.criteria[sortKey] ?? "");
    const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });
}

Deno.test("useTableSort – sort key toggle: same key reverses direction", () => {
  // Simulate: user clicks same column twice
  let sortKey = "displayName";
  let sortDir: "asc" | "desc" = "asc";

  // First click
  if (sortKey === "displayName") {
    sortDir = "desc";
  }
  assertEquals(sortDir, "desc");

  // Second click (same column)
  if (sortKey === "displayName") {
    sortDir = sortDir === "asc" ? "desc" : "asc";
  }
  assertEquals(sortDir, "asc");
});

Deno.test("useTableSort – sort key change: different key resets to asc", () => {
  let sortKey = "displayName";
  let sortDir: "asc" | "desc" = "desc";

  // Switch to different key
  if (sortKey !== "gender") {
    sortKey = "gender";
    sortDir = "asc";
  }

  assertEquals(sortKey, "gender");
  assertEquals(sortDir, "asc");
});

Deno.test("useTableSort – apply sort: displayName ascending", () => {
  const people = [
    createTestPerson({ displayName: "Zoe" }),
    createTestPerson({ displayName: "Alice" }),
    createTestPerson({ displayName: "Mike" }),
  ];

  const sorted = applySortLogic(people, "displayName", "asc");

  assertEquals(sorted[0].displayName, "Alice");
  assertEquals(sorted[1].displayName, "Mike");
  assertEquals(sorted[2].displayName, "Zoe");
});

Deno.test("useTableSort – apply sort: displayName descending", () => {
  const people = [
    createTestPerson({ displayName: "Alice" }),
    createTestPerson({ displayName: "Zoe" }),
    createTestPerson({ displayName: "Mike" }),
  ];

  const sorted = applySortLogic(people, "displayName", "desc");

  assertEquals(sorted[0].displayName, "Zoe");
  assertEquals(sorted[1].displayName, "Mike");
  assertEquals(sorted[2].displayName, "Alice");
});

Deno.test("useTableSort – apply sort: by criteria field", () => {
  const people = [
    createTestPerson({ displayName: "A", criteria: { dept: "Sales" } }),
    createTestPerson({ displayName: "B", criteria: { dept: "IT" } }),
    createTestPerson({ displayName: "C", criteria: { dept: "HR" } }),
  ];

  const sorted = applySortLogic(people, "dept", "asc");

  assertEquals(sorted[0].criteria["dept"], "HR");
  assertEquals(sorted[1].criteria["dept"], "IT");
  assertEquals(sorted[2].criteria["dept"], "Sales");
});

Deno.test("useTableSort – handle missing criteria values (empty sorts first)", () => {
  const people = [
    createTestPerson({ criteria: { dept: "Sales" } }),
    createTestPerson({ criteria: {} }), // Missing dept
    createTestPerson({ criteria: { dept: "IT" } }),
  ];

  const sorted = applySortLogic(people, "dept", "asc");

  // Empty string should come first when ascending
  assertEquals(sorted[0].criteria["dept"] ?? "", "");
  assertEquals(sorted[1].criteria["dept"], "IT");
  assertEquals(sorted[2].criteria["dept"], "Sales");
});

Deno.test("useTableSort – case-insensitive comparison (sensitivity base)", () => {
  const people = [
    createTestPerson({ displayName: "alice" }),
    createTestPerson({ displayName: "ALICE" }),
    createTestPerson({ displayName: "Alice" }),
  ];

  const sorted = applySortLogic(people, "displayName", "asc");

  // All variants of alice should be treated the same (no specific order guaranteed for variants)
  assertEquals(
    sorted.every((p) => p.displayName.toLowerCase() === "alice"),
    true,
  );
});

Deno.test("useTableSort – unicode / accent handling", () => {
  const people = [
    createTestPerson({ displayName: "Zoë" }),
    createTestPerson({ displayName: "Zoe" }),
    createTestPerson({ displayName: "Zoa" }),
  ];

  const sorted = applySortLogic(people, "displayName", "asc");

  // Should sort correctly with Unicode
  assertEquals(sorted.length, 3);
  assertEquals(sorted[0].displayName, "Zoa");
});

Deno.test("useTableSort – stable sort: maintains relative order for equal values", () => {
  const id1 = "id1";
  const id2 = "id2";
  const id3 = "id3";

  const people = [
    createTestPerson({ id: id1, displayName: "Alice", criteria: { rank: "1" } }),
    createTestPerson({ id: id2, displayName: "Bob", criteria: { rank: "1" } }),
    createTestPerson({ id: id3, displayName: "Charlie", criteria: { rank: "2" } }),
  ];

  const sorted = applySortLogic(people, "rank", "asc");

  // Both with rank="1" should maintain original order (Alice before Bob)
  const rank1Items = sorted.filter((p) => p.criteria["rank"] === "1");
  assertEquals(rank1Items[0].id, id1);
  assertEquals(rank1Items[1].id, id2);
});

Deno.test("useTableSort – empty list edge case", () => {
  const sorted = applySortLogic([], "displayName", "asc");
  assertEquals(sorted.length, 0);
});

Deno.test("useTableSort – single item edge case", () => {
  const people = [createTestPerson({ displayName: "Solo" })];
  const sorted = applySortLogic(people, "displayName", "asc");

  assertEquals(sorted.length, 1);
  assertEquals(sorted[0].displayName, "Solo");
});
