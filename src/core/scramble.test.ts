import { assertEquals, assertGreater, assertLessOrEqual } from "@std/assert";
import { scramble } from "./scramble.ts";
import type { CriteriaField, Person, ScramblerConfig } from "../types.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePerson(
  displayName: string,
  criteria: Record<string, string> = {},
): Person {
  return { id: crypto.randomUUID(), displayName, criteria };
}

const CRITERIA: CriteriaField[] = [
  { key: "gender", label: "Gender", values: ["female", "male"] },
  { key: "entity", label: "Entity", values: ["HR", "IT", "MKT", "OPS"] },
];

function makeConfig(
  overrides: Partial<ScramblerConfig> = {},
): ScramblerConfig {
  return {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: ["gender", "entity"],
    ...overrides,
  };
}

/** 20 people: 10 female, 10 male; 5 each in HR, IT, MKT, OPS */
const PEOPLE: Person[] = [
  makePerson("Alice", { gender: "female", entity: "HR" }),
  makePerson("Bob", { gender: "male", entity: "HR" }),
  makePerson("Claire", { gender: "female", entity: "IT" }),
  makePerson("David", { gender: "male", entity: "IT" }),
  makePerson("Eva", { gender: "female", entity: "MKT" }),
  makePerson("Frank", { gender: "male", entity: "MKT" }),
  makePerson("Grace", { gender: "female", entity: "OPS" }),
  makePerson("Hugo", { gender: "male", entity: "OPS" }),
  makePerson("Iris", { gender: "female", entity: "HR" }),
  makePerson("Jack", { gender: "male", entity: "HR" }),
  makePerson("Kara", { gender: "female", entity: "IT" }),
  makePerson("Leo", { gender: "male", entity: "IT" }),
  makePerson("Mia", { gender: "female", entity: "MKT" }),
  makePerson("Nick", { gender: "male", entity: "MKT" }),
  makePerson("Olivia", { gender: "female", entity: "OPS" }),
  makePerson("Pete", { gender: "male", entity: "OPS" }),
  makePerson("Quinn", { gender: "female", entity: "HR" }),
  makePerson("Ryan", { gender: "male", entity: "HR" }),
  makePerson("Sara", { gender: "female", entity: "IT" }),
  makePerson("Tom", { gender: "male", entity: "IT" }),
];

// ---------------------------------------------------------------------------
// Basic output shape
// ---------------------------------------------------------------------------

Deno.test("scramble – returns empty array for empty input", () => {
  const teams = scramble([], CRITERIA, makeConfig());
  assertEquals(teams.length, 0);
});

Deno.test("scramble – correct number of teams (teamCount mode)", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 4 }));
  assertEquals(teams.length, 4);
});

Deno.test("scramble – correct number of teams (teamSize mode)", () => {
  // 20 people / size 5 = 4 teams
  const teams = scramble(
    PEOPLE,
    CRITERIA,
    makeConfig({ mode: "teamSize", teamSize: 5 }),
  );
  assertEquals(teams.length, 4);
});

Deno.test("scramble – teamSize rounds up team count", () => {
  // 20 people / size 6 = ceil(20/6) = 4 teams
  const teams = scramble(
    PEOPLE,
    CRITERIA,
    makeConfig({ mode: "teamSize", teamSize: 6 }),
  );
  assertEquals(teams.length, 4);
});

Deno.test("scramble – every person appears exactly once", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 4 }));
  const allMembers = teams.flatMap((t) => t.members);
  const ids = new Set(allMembers.map((p) => p.id));
  assertEquals(allMembers.length, PEOPLE.length);
  assertEquals(ids.size, PEOPLE.length);
});

Deno.test("scramble – no person is duplicated", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 3 }));
  const allIds = teams.flatMap((t) => t.members.map((p) => p.id));
  const uniqueIds = new Set(allIds);
  assertEquals(allIds.length, uniqueIds.size);
});

// ---------------------------------------------------------------------------
// Team sizing
// ---------------------------------------------------------------------------

Deno.test("scramble – teams differ in size by at most 1", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 3 }));
  const sizes = teams.map((t) => t.members.length);
  const min = Math.min(...sizes);
  const max = Math.max(...sizes);
  assertLessOrEqual(max - min, 1);
});

Deno.test("scramble – teamCount capped at people count", () => {
  const small = PEOPLE.slice(0, 3);
  const teams = scramble(small, CRITERIA, makeConfig({ teamCount: 10 }));
  assertEquals(teams.length, 3);
});

Deno.test("scramble – single person produces one team", () => {
  const teams = scramble(
    [PEOPLE[0]],
    CRITERIA,
    makeConfig({ teamCount: 4 }),
  );
  assertEquals(teams.length, 1);
  assertEquals(teams[0].members.length, 1);
});

// ---------------------------------------------------------------------------
// Team structure
// ---------------------------------------------------------------------------

Deno.test("scramble – each team has a unique id", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 4 }));
  const ids = new Set(teams.map((t) => t.id));
  assertEquals(ids.size, 4);
});

Deno.test("scramble – teams are named 'Team 1', 'Team 2', …", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 3 }));
  assertEquals(teams.map((t) => t.name), ["Team 1", "Team 2", "Team 3"]);
});

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

Deno.test("scramble – metrics generated for balanced criteria only", () => {
  const teams = scramble(
    PEOPLE,
    CRITERIA,
    makeConfig({ balanceCriteria: ["gender"] }),
  );
  for (const team of teams) {
    assertEquals(team.metrics.length, 1);
    assertEquals(team.metrics[0].key, "gender");
  }
});

Deno.test("scramble – metrics cover all balanced criteria", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig());
  for (const team of teams) {
    const keys = team.metrics.map((m) => m.key).sort();
    assertEquals(keys, ["entity", "gender"]);
  }
});

Deno.test("scramble – metrics counts sum to team size", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 4 }));
  for (const team of teams) {
    const genderMetric = team.metrics.find((m) => m.key === "gender")!;
    const total = Object.values(genderMetric.counts).reduce((a, b) => a + b, 0);
    assertEquals(total, team.members.length);
  }
});

Deno.test("scramble – no metrics when balanceCriteria is empty", () => {
  const teams = scramble(
    PEOPLE,
    CRITERIA,
    makeConfig({ balanceCriteria: [] }),
  );
  for (const team of teams) {
    assertEquals(team.metrics, []);
  }
});

Deno.test("scramble – ratios are present for every count entry", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 4 }));
  for (const team of teams) {
    for (const metric of team.metrics) {
      for (const key of Object.keys(metric.counts)) {
        assertEquals(key in metric.ratios, true);
      }
    }
  }
});

Deno.test("scramble – ratios sum to ≤ 1 per criterion (accounting for missing values)", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 4 }));
  for (const team of teams) {
    for (const metric of team.metrics) {
      const total = Object.values(metric.ratios).reduce((a, b) => a + b, 0);
      // Allow tiny floating-point drift; total must be in (0, 1].
      assertEquals(total <= 1.0001, true);
      assertEquals(total > 0, true);
    }
  }
});

Deno.test("scramble – ratio equals count / team size", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 4 }));
  for (const team of teams) {
    for (const metric of team.metrics) {
      for (const [val, count] of Object.entries(metric.counts)) {
        const expected = count / team.members.length;
        assertEquals(Math.abs(metric.ratios[val] - expected) < 1e-9, true);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Balance quality
// ---------------------------------------------------------------------------

Deno.test("scramble – gender is roughly balanced across 4 teams", () => {
  // 20 people: 10 female, 10 male → expect 2-3 female per team
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 4 }));
  for (const team of teams) {
    const metric = team.metrics.find((m) => m.key === "gender")!;
    const female = metric.counts["female"] ?? 0;
    assertGreater(female, 0);
    assertLessOrEqual(female, 4);
  }
});

Deno.test("scramble – total gender counts preserved after scramble", () => {
  const teams = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 4 }));
  let totalFemale = 0;
  let totalMale = 0;
  for (const team of teams) {
    const metric = team.metrics.find((m) => m.key === "gender")!;
    totalFemale += metric.counts["female"] ?? 0;
    totalMale += metric.counts["male"] ?? 0;
  }
  assertEquals(totalFemale, 10);
  assertEquals(totalMale, 10);
});

// ---------------------------------------------------------------------------
// Randomness
// ---------------------------------------------------------------------------

Deno.test("scramble – two calls produce different orderings (probabilistic)", () => {
  const r1 = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 4 }));
  const r2 = scramble(PEOPLE, CRITERIA, makeConfig({ teamCount: 4 }));
  const names1 = r1.flatMap((t) => t.members.map((p) => p.displayName)).join(",");
  const names2 = r2.flatMap((t) => t.members.map((p) => p.displayName)).join(",");
  // With 20 people this collision probability is astronomically small.
  assertEquals(names1 === names2, false);
});
