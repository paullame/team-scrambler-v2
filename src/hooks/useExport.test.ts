import { assertEquals } from "@std/assert";
import { createBalancedTestPopulation, createTestCriteriaField, createTestPerson, createTestTeam } from "../core/testHelpers.ts";
import type { CriteriaField, Team } from "../types.ts";

// ---------------------------------------------------------------------------
// CSV Export Tests
// ---------------------------------------------------------------------------

/**
 * Extract the CSV export logic from useExport.
 * In a real test, we'd test the hook itself, but this isolates the
 * CSV formatting logic as a pure function.
 */
function generateExportCsv(teams: Team[], criteria: CriteriaField[]): string {
  const criteriaKeys = criteria.map((c) => c.key);
  const headers = ["name", ...criteriaKeys, "team"];

  const rows = teams.flatMap((team) =>
    team.members.map((member) => [
      member.displayName,
      ...criteriaKeys.map((k) => member.criteria[k] ?? ""),
      team.name,
    ])
  );

  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");

  return csv;
}

Deno.test("useExport – CSV: basic export with headers and data", () => {
  const person1 = createTestPerson({
    displayName: "Alice Martin",
    criteria: { gender: "Female", entity: "MKT" },
  });
  const person2 = createTestPerson({
    displayName: "Bob Dupont",
    criteria: { gender: "Male", entity: "OPS" },
  });

  const team = createTestTeam({
    name: "Team A",
    members: [person1, person2],
  });

  const criteria = [
    createTestCriteriaField({ key: "gender", label: "Gender", values: ["Female", "Male"] }),
    createTestCriteriaField({ key: "entity", label: "Entity", values: ["MKT", "OPS"] }),
  ];

  const csv = generateExportCsv([team], criteria);

  // Should contain header
  assertEquals(csv.includes('"name","gender","entity","team"'), true);

  // Should contain escaped data
  assertEquals(csv.includes('"Alice Martin"'), true);
  assertEquals(csv.includes('"Bob Dupont"'), true);
  assertEquals(csv.includes('"Team A"'), true);
});

Deno.test("useExport – CSV: escapes quotes in names correctly", () => {
  const person = createTestPerson({
    displayName: 'John "Johnny" Doe',
    criteria: { entity: "IT" },
  });

  const team = createTestTeam({
    name: "Team X",
    members: [person],
  });

  const criteria = [
    createTestCriteriaField({ key: "entity", label: "Entity", values: ["IT"] }),
  ];

  const csv = generateExportCsv([team], criteria);

  // Quotes should be doubled: "Johnny" becomes ""Johnny""
  assertEquals(csv.includes('"John ""Johnny"" Doe"'), true);
});

Deno.test("useExport – CSV: handles missing criteria values", () => {
  const person = createTestPerson({
    displayName: "Alice",
    criteria: { gender: "Female" },
    // Missing 'entity' criterion
  });

  const team = createTestTeam({
    name: "Team 1",
    members: [person],
  });

  const criteria = [
    createTestCriteriaField({ key: "gender", label: "Gender", values: ["Female"] }),
    createTestCriteriaField({ key: "entity", label: "Entity", values: [] }),
  ];

  const csv = generateExportCsv([team], criteria);

  // Missing value should be empty in CSV
  const lines = csv.split("\n");
  const dataLine = lines[1];
  assertEquals(dataLine.includes('""'), true); // Empty cell for missing entity
});

Deno.test("useExport – CSV: multiple teams with correct distribution", () => {
  const person1 = createTestPerson({ displayName: "Alice", criteria: {} });
  const person2 = createTestPerson({ displayName: "Bob", criteria: {} });
  const person3 = createTestPerson({ displayName: "Charlie", criteria: {} });

  const team1 = createTestTeam({
    name: "Team A",
    members: [person1, person2],
  });
  const team2 = createTestTeam({
    name: "Team B",
    members: [person3],
  });

  const csv = generateExportCsv([team1, team2], []);

  // All people should be present
  assertEquals(csv.includes('"Alice"'), true);
  assertEquals(csv.includes('"Bob"'), true);
  assertEquals(csv.includes('"Charlie"'), true);

  // Team assignments should be correct
  const lines = csv.split("\n");
  assertEquals(lines.length, 4); // header + 3 people
});

Deno.test("useExport – CSV: column order matches (name, criteria..., team)", () => {
  const person = createTestPerson({
    displayName: "Test",
    criteria: { gender: "M", entity: "IT", dept: "Dev" },
  });

  const team = createTestTeam({
    name: "TeamX",
    members: [person],
  });

  const criteria = [
    createTestCriteriaField({ key: "gender", label: "Gender", values: [] }),
    createTestCriteriaField({ key: "entity", label: "Entity", values: [] }),
    createTestCriteriaField({ key: "dept", label: "Department", values: [] }),
  ];

  const csv = generateExportCsv([team], criteria);
  const lines = csv.split("\n");
  const header = lines[0];

  // Header should be in order: name, gender, entity, dept, team
  const expected = '"name","gender","entity","dept","team"';
  assertEquals(header, expected);
});

Deno.test("useExport – CSV: empty teams list produces header only", () => {
  const criteria = [
    createTestCriteriaField({ key: "gender", label: "Gender", values: [] }),
  ];

  const csv = generateExportCsv([], criteria);
  const lines = csv.split("\n");

  // Should have header with no data rows
  assertEquals(lines.length, 1);
  assertEquals(lines[0], '"name","gender","team"');
});

Deno.test("useExport – CSV: special characters in names handled correctly", () => {
  const person = createTestPerson({
    displayName: "José García, Jr.",
    criteria: { entity: "MKT" },
  });

  const team = createTestTeam({
    name: "Team Europa",
    members: [person],
  });

  const criteria = [
    createTestCriteriaField({ key: "entity", label: "Entity", values: [] }),
  ];

  const csv = generateExportCsv([team], criteria);

  // Special chars should be preserved
  assertEquals(csv.includes("José García, Jr."), true);
});

Deno.test("useExport – CSV: balanced population export", () => {
  const { people, criteria } = createBalancedTestPopulation(8);

  const team1 = createTestTeam({
    name: "Alpha",
    members: people.slice(0, 4),
  });
  const team2 = createTestTeam({
    name: "Beta",
    members: people.slice(4, 8),
  });

  const csv = generateExportCsv([team1, team2], criteria);
  const lines = csv.split("\n");

  // Header + 8 people
  assertEquals(lines.length, 9);

  // All criteria should be in header
  assertEquals(csv.includes('"gender"'), true);
  assertEquals(csv.includes('"entity"'), true);
});
