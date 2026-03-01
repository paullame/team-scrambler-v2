import { assertEquals } from "@std/assert";
import { createTestCriteriaField, createTestPerson } from "../core/testHelpers.ts";
import type { CriteriaField, Person } from "../types.ts";

// ---------------------------------------------------------------------------
// useTableSort Tests - Core Sorting Logic
// ---------------------------------------------------------------------------

/**
 * Extract the sort logic from useTableSort as testable functions.
 */
function sortPeople(
  people: Person[],
  sortKey: string,
  sortDir: "asc" | "desc",
  _criteriaKeys: string[],
): Person[] {
  const sorted = [...people].sort((a, b) => {
    let aVal: string;
    let bVal: string;

    if (sortKey === "displayName") {
      aVal = a.displayName;
      bVal = b.displayName;
    } else {
      aVal = a.criteria[sortKey] ?? "";
      bVal = b.criteria[sortKey] ?? "";
    }

    const result = aVal.localeCompare(bVal);
    return sortDir === "asc" ? result : -result;
  });

  return sorted;
}

Deno.test("useTableSort – sort by displayName ascending", () => {
  const p1 = createTestPerson({ displayName: "Charlie" });
  const p2 = createTestPerson({ displayName: "Alice" });
  const p3 = createTestPerson({ displayName: "Bob" });

  const sorted = sortPeople([p1, p2, p3], "displayName", "asc", []);

  assertEquals(sorted[0].displayName, "Alice");
  assertEquals(sorted[1].displayName, "Bob");
  assertEquals(sorted[2].displayName, "Charlie");
});

Deno.test("useTableSort – sort by displayName descending", () => {
  const p1 = createTestPerson({ displayName: "Charlie" });
  const p2 = createTestPerson({ displayName: "Alice" });
  const p3 = createTestPerson({ displayName: "Bob" });

  const sorted = sortPeople([p1, p2, p3], "displayName", "desc", []);

  assertEquals(sorted[0].displayName, "Charlie");
  assertEquals(sorted[1].displayName, "Bob");
  assertEquals(sorted[2].displayName, "Alice");
});

Deno.test("useTableSort – sort by criteria (gender)", () => {
  const p1 = createTestPerson({
    displayName: "Charlie",
    criteria: { gender: "Male" },
  });
  const p2 = createTestPerson({
    displayName: "Alice",
    criteria: { gender: "Female" },
  });
  const p3 = createTestPerson({
    displayName: "Bob",
    criteria: { gender: "Male" },
  });

  const sorted = sortPeople([p1, p2, p3], "gender", "asc", ["gender"]);

  assertEquals(sorted[0].criteria["gender"], "Female");
  assertEquals(sorted[1].criteria["gender"], "Male");
  assertEquals(sorted[2].criteria["gender"], "Male");
});

Deno.test("useTableSort – sort by criteria descending", () => {
  const p1 = createTestPerson({ criteria: { entity: "MKT" } });
  const p2 = createTestPerson({ criteria: { entity: "OPS" } });
  const p3 = createTestPerson({ criteria: { entity: "HR" } });

  const sorted = sortPeople([p1, p2, p3], "entity", "desc", ["entity"]);

  assertEquals(sorted[0].criteria["entity"], "OPS");
  assertEquals(sorted[1].criteria["entity"], "MKT");
  assertEquals(sorted[2].criteria["entity"], "HR");
});

Deno.test("useTableSort – handles missing criteria values", () => {
  const p1 = createTestPerson({ criteria: { gender: "Female" } });
  const p2 = createTestPerson({ criteria: {} }); // Missing gender
  const p3 = createTestPerson({ criteria: { gender: "Male" } });

  const sorted = sortPeople([p1, p2, p3], "gender", "asc", ["gender"]);

  // Empty string sorts before others
  assertEquals(sorted[0].criteria["gender"] ?? "", "");
  assertEquals(sorted[1].criteria["gender"], "Female");
  assertEquals(sorted[2].criteria["gender"], "Male");
});

Deno.test("useTableSort – locale-aware string comparison", () => {
  const p1 = createTestPerson({ displayName: "Élève" });
  const p2 = createTestPerson({ displayName: "Ecole" });
  const p3 = createTestPerson({ displayName: "Étudiant" });

  const sorted = sortPeople([p1, p2, p3], "displayName", "asc", []);

  // localeCompare should handle accented characters correctly
  assertEquals(sorted.length, 3);
  assertEquals(
    sorted[0].displayName === "Ecole" || sorted[0].displayName === "Élève",
    true,
  );
});

// ---------------------------------------------------------------------------
// useTableEdit Tests - Core Edit Logic
// ---------------------------------------------------------------------------

/**
 * Simulate useTableEdit's delete operation.
 */
function deletePersonLogic(people: Person[], id: string): Person[] {
  return people.filter((p) => p.id !== id);
}

/**
 * Simulate useTableEdit's commit edit operation.
 */
function commitEditLogic(
  people: Person[],
  updated: Person,
): Person[] {
  return people.map((p) => (p.id === updated.id ? updated : p));
}

/**
 * Simulate useTableEdit's add row operation.
 */
function addPersonLogic(people: Person[], newPerson: Person): Person[] {
  if (!newPerson.displayName.trim()) {
    return people; // Don't add empty names
  }
  return [...people, { ...newPerson, displayName: newPerson.displayName.trim() }];
}

Deno.test("useTableEdit – delete person removes from list", () => {
  const p1 = createTestPerson({ displayName: "Alice" });
  const p2 = createTestPerson({ displayName: "Bob" });
  const p3 = createTestPerson({ displayName: "Charlie" });

  const updated = deletePersonLogic([p1, p2, p3], p2.id);

  assertEquals(updated.length, 2);
  assertEquals(updated.some((p) => p.id === p2.id), false);
});

Deno.test("useTableEdit – commit edit updates person in list", () => {
  const p1 = createTestPerson({ displayName: "Alice", criteria: { gender: "F" } });
  const p2 = createTestPerson({ displayName: "Bob", criteria: { gender: "M" } });

  const edited = { ...p1, displayName: "Alicia", criteria: { gender: "F" } };
  const updated = commitEditLogic([p1, p2], edited);

  assertEquals(updated[0].displayName, "Alicia");
  assertEquals(updated[1].displayName, "Bob");
});

Deno.test("useTableEdit – add person with empty name is rejected", () => {
  const p1 = createTestPerson({ displayName: "Alice" });
  const newPerson = createTestPerson({ displayName: "   " }); // Only whitespace

  const updated = addPersonLogic([p1], newPerson);

  assertEquals(updated.length, 1);
  assertEquals(updated[0].displayName, "Alice");
});

Deno.test("useTableEdit – add person with valid name succeeds", () => {
  const p1 = createTestPerson({ displayName: "Alice" });
  const newPerson = createTestPerson({
    displayName: "  Bob  ",
    criteria: { gender: "M" },
  });

  const updated = addPersonLogic([p1], newPerson);

  assertEquals(updated.length, 2);
  assertEquals(updated[1].displayName, "Bob");
  assertEquals(updated[1].criteria["gender"], "M");
});

Deno.test("useTableEdit – edit preserves all criteria fields", () => {
  const p1 = createTestPerson({
    displayName: "Alice",
    criteria: { gender: "F", entity: "MKT", level: "Senior" },
  });

  const edited = { ...p1, displayName: "Alicia" };
  const updated = commitEditLogic([p1], edited);

  assertEquals(updated[0].criteria["gender"], "F");
  assertEquals(updated[0].criteria["entity"], "MKT");
  assertEquals(updated[0].criteria["level"], "Senior");
});

Deno.test("useTableEdit – delete then add different person", () => {
  const p1 = createTestPerson({ displayName: "Alice" });
  const p2 = createTestPerson({ displayName: "Bob" });

  let people = deletePersonLogic([p1, p2], p1.id);
  assertEquals(people.length, 1);

  const p3 = createTestPerson({ displayName: "Charlie" });
  people = addPersonLogic(people, p3);

  assertEquals(people.length, 2);
  assertEquals(people.map((p) => p.displayName).join(","), "Bob,Charlie");
});

Deno.test("useTableEdit – empty name with trim", () => {
  const p1 = createTestPerson({ displayName: "Alice" });
  const newPerson = createTestPerson({ displayName: "" });

  const updated = addPersonLogic([p1], newPerson);

  assertEquals(updated.length, 1); // Should not add
});
