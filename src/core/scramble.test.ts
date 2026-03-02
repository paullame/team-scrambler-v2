import { assertEquals, assertGreater, assertLessOrEqual } from "@std/assert";
import { computeMetrics, scramble, TEAM_EMOJIS } from "./scramble.ts";
import type { CriteriaField, Person, ScramblerConfig, Team } from "../types.ts";
import { createTestTeam } from "./testHelpers.ts";

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

// ---------------------------------------------------------------------------
// computeMetrics – direct unit tests
// ---------------------------------------------------------------------------

function makeMember(name: string, criteria: Record<string, string>): Person {
  return { id: crypto.randomUUID(), displayName: name, criteria };
}

Deno.test("computeMetrics – counts values per criterion", () => {
  const members: Person[] = [
    makeMember("A", { gender: "female", entity: "HR" }),
    makeMember("B", { gender: "male", entity: "IT" }),
    makeMember("C", { gender: "female", entity: "HR" }),
  ];
  const criteria: CriteriaField[] = [
    { key: "gender", label: "Gender", values: ["female", "male"] },
    { key: "entity", label: "Entity", values: ["HR", "IT"] },
  ];
  const dist = computeMetrics(members, criteria, ["gender", "entity"]);

  assertEquals(dist.length, 2);
  const genderDist = dist.find((d) => d.key === "gender")!;
  assertEquals(genderDist.counts["female"], 2);
  assertEquals(genderDist.counts["male"], 1);

  const entityDist = dist.find((d) => d.key === "entity")!;
  assertEquals(entityDist.counts["HR"], 2);
  assertEquals(entityDist.counts["IT"], 1);
});

Deno.test("computeMetrics – ratios equal count / team size", () => {
  const members: Person[] = [
    makeMember("A", { gender: "female" }),
    makeMember("B", { gender: "male" }),
    makeMember("C", { gender: "female" }),
    makeMember("D", { gender: "female" }),
  ];
  const criteria: CriteriaField[] = [{ key: "gender", label: "Gender", values: ["female", "male"] }];
  const [dist] = computeMetrics(members, criteria, ["gender"]);

  assertEquals(Math.abs(dist.ratios["female"] - 3 / 4) < 1e-9, true);
  assertEquals(Math.abs(dist.ratios["male"] - 1 / 4) < 1e-9, true);
});

Deno.test("computeMetrics – only criteria in balanceCriteria are returned", () => {
  const members: Person[] = [
    makeMember("A", { gender: "female", entity: "HR" }),
  ];
  const criteria: CriteriaField[] = [
    { key: "gender", label: "Gender", values: ["female"] },
    { key: "entity", label: "Entity", values: ["HR"] },
  ];
  // Only balance on gender
  const dist = computeMetrics(members, criteria, ["gender"]);
  assertEquals(dist.length, 1);
  assertEquals(dist[0].key, "gender");
});

Deno.test("computeMetrics – empty members → empty counts and ratios", () => {
  const criteria: CriteriaField[] = [{ key: "gender", label: "Gender", values: ["female", "male"] }];
  const [dist] = computeMetrics([], criteria, ["gender"]);
  assertEquals(Object.keys(dist.counts).length, 0);
  assertEquals(Object.keys(dist.ratios).length, 0);
});

Deno.test("computeMetrics – criterion key absent from balanceCriteria is silently excluded", () => {
  const members: Person[] = [makeMember("A", { gender: "female", entity: "HR" })];
  const criteria: CriteriaField[] = [
    { key: "gender", label: "Gender", values: [] },
    { key: "entity", label: "Entity", values: [] },
  ];
  // balanceCriteria contains a key not in criteria — should just be ignored
  const dist = computeMetrics(members, criteria, ["gender", "nonexistent"]);
  assertEquals(dist.length, 1);
  assertEquals(dist[0].key, "gender");
});

Deno.test("computeMetrics – members with empty-string criteria value are not counted", () => {
  const members: Person[] = [
    makeMember("A", { gender: "" }),
    makeMember("B", { gender: "female" }),
  ];
  const criteria: CriteriaField[] = [{ key: "gender", label: "Gender", values: ["female"] }];
  const [dist] = computeMetrics(members, criteria, ["gender"]);
  // Empty string should be skipped
  assertEquals(Object.keys(dist.counts).length, 1);
  assertEquals(dist.counts["female"], 1);
});

Deno.test("computeMetrics – returns key and label from criterion definition", () => {
  const members: Person[] = [makeMember("A", { gender: "female" })];
  const criteria: CriteriaField[] = [{ key: "gender", label: "Genre", values: [] }];
  const [dist] = computeMetrics(members, criteria, ["gender"]);
  assertEquals(dist.key, "gender");
  assertEquals(dist.label, "Genre");
});

Deno.test("computeMetrics – empty balanceCriteria returns empty array", () => {
  const members: Person[] = [makeMember("A", { gender: "female" })];
  const criteria: CriteriaField[] = [{ key: "gender", label: "Gender", values: [] }];
  const dist = computeMetrics(members, criteria, []);
  assertEquals(dist, []);
});

// ---------------------------------------------------------------------------
// scramble – TEAM_EMOJIS cycling
// ---------------------------------------------------------------------------

Deno.test("scramble – emoji index wraps around when there are more than 20 teams", () => {
  // Need 21+ people to create 21 teams
  const people: Person[] = Array.from({ length: 21 }, (_, i) => makeMember(`P${i}`, {}));
  const teams = scramble(people, [], makeConfig({ mode: "teamCount", teamCount: 21 }));
  assertEquals(teams.length, 21);
  // Team 21 (index 20) should wrap to TEAM_EMOJIS[20 % 20] = TEAM_EMOJIS[0]
  assertEquals(teams[20].emoji, TEAM_EMOJIS[0]);
  // Team 1 (index 0) and Team 21 (index 20) share the same emoji (wrap-around)
  assertEquals(teams[0].emoji, teams[20].emoji);
});

// ---------------------------------------------------------------------------
// scramble – greedy algorithm correctness
// ---------------------------------------------------------------------------

Deno.test("scramble – greedy produces perfectly balanced gender split for ideal population", () => {
  // 8 people: 4 female, 4 male → 2 teams of 4 → each team should get exactly 2F+2M
  const people: Person[] = [
    makeMember("F1", { gender: "female" }),
    makeMember("F2", { gender: "female" }),
    makeMember("F3", { gender: "female" }),
    makeMember("F4", { gender: "female" }),
    makeMember("M1", { gender: "male" }),
    makeMember("M2", { gender: "male" }),
    makeMember("M3", { gender: "male" }),
    makeMember("M4", { gender: "male" }),
  ];
  const criteria: CriteriaField[] = [{ key: "gender", label: "Gender", values: ["female", "male"] }];
  const config: ScramblerConfig = { mode: "teamCount", teamCount: 2, teamSize: 4, balanceCriteria: ["gender"] };

  // Run multiple times to account for random shuffle — greedy should always balance perfectly
  let alwaysPerfect = true;
  for (let trial = 0; trial < 20; trial++) {
    const teams = scramble(people, criteria, config);
    for (const team of teams) {
      const metric = team.metrics.find((m) => m.key === "gender")!;
      if (metric.counts["female"] !== 2 || metric.counts["male"] !== 2) {
        alwaysPerfect = false;
        break;
      }
    }
    if (!alwaysPerfect) break;
  }
  assertEquals(alwaysPerfect, true);
});

Deno.test("scramble – greedy assigns person with absent criterion without throwing", () => {
  // Person missing a balance criterion key — should assign to a team without error
  const people: Person[] = [
    makeMember("A", { gender: "female" }),
    makeMember("B", {}), // missing gender
    makeMember("C", { gender: "male" }),
    makeMember("D", {}), // missing gender
  ];
  const criteria: CriteriaField[] = [{ key: "gender", label: "Gender", values: ["female", "male"] }];
  const config: ScramblerConfig = { mode: "teamCount", teamCount: 2, teamSize: 2, balanceCriteria: ["gender"] };
  const teams = scramble(people, criteria, config);
  const allMembers = teams.flatMap((t) => t.members);
  assertEquals(allMembers.length, 4);
});

Deno.test("scramble – teams have correct names when many teams created", () => {
  const people: Person[] = Array.from({ length: 5 }, (_, i) => makeMember(`P${i}`, {}));
  const teams = scramble(people, [], makeConfig({ mode: "teamCount", teamCount: 5 }));
  assertEquals(teams.map((t) => t.name), ["Team 1", "Team 2", "Team 3", "Team 4", "Team 5"]);
});

Deno.test("scramble – two-criteria balance preserves all global counts", () => {
  // 12 people: 6F/6M, 4 per entity (ENG/HR/MKT) → 3 teams of 4
  const people: Person[] = [
    makeMember("F-ENG-1", { gender: "female", entity: "ENG" }),
    makeMember("F-ENG-2", { gender: "female", entity: "ENG" }),
    makeMember("F-HR-1", { gender: "female", entity: "HR" }),
    makeMember("F-HR-2", { gender: "female", entity: "HR" }),
    makeMember("F-MKT-1", { gender: "female", entity: "MKT" }),
    makeMember("F-MKT-2", { gender: "female", entity: "MKT" }),
    makeMember("M-ENG-1", { gender: "male", entity: "ENG" }),
    makeMember("M-ENG-2", { gender: "male", entity: "ENG" }),
    makeMember("M-HR-1", { gender: "male", entity: "HR" }),
    makeMember("M-HR-2", { gender: "male", entity: "HR" }),
    makeMember("M-MKT-1", { gender: "male", entity: "MKT" }),
    makeMember("M-MKT-2", { gender: "male", entity: "MKT" }),
  ];
  const criteria: CriteriaField[] = [
    { key: "gender", label: "Gender", values: ["female", "male"] },
    { key: "entity", label: "Entity", values: ["ENG", "HR", "MKT"] },
  ];
  const config: ScramblerConfig = { mode: "teamCount", teamCount: 3, teamSize: 4, balanceCriteria: ["gender", "entity"] };
  const teams = scramble(people, criteria, config);

  // Total counts must be preserved
  const totalFemale = teams.flatMap((t) => t.members).filter((p) => p.criteria["gender"] === "female").length;
  const totalMale = teams.flatMap((t) => t.members).filter((p) => p.criteria["gender"] === "male").length;
  assertEquals(totalFemale, 6);
  assertEquals(totalMale, 6);

  // Each team metrics must be defined for both criteria
  for (const team of teams) {
    const keys = team.metrics.map((m) => m.key).sort();
    assertEquals(keys, ["entity", "gender"]);
  }
});

// ---------------------------------------------------------------------------
// computeMetrics – createTestTeam integration
// ---------------------------------------------------------------------------

Deno.test("computeMetrics – createTestTeam with pre-set members", () => {
  const members: Person[] = [
    makeMember("A", { level: "senior" }),
    makeMember("B", { level: "junior" }),
    makeMember("C", { level: "senior" }),
  ];
  const _team: Team = createTestTeam({ members });
  const criteria: CriteriaField[] = [{ key: "level", label: "Level", values: ["senior", "junior"] }];
  const dist = computeMetrics(members, criteria, ["level"]);
  assertEquals(dist[0].counts["senior"], 2);
  assertEquals(dist[0].counts["junior"], 1);
});
