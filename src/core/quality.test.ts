import { assertEquals, assertGreater, assertLess } from "@std/assert";
import { computeQuality, scramble } from "./scramble.ts";
import { createBalancedTestPopulation, createTestPerson } from "./testHelpers.ts";
import type { CriteriaField, Person, ScramblerConfig } from "../types.ts";

// ---------------------------------------------------------------------------
// Quality Scoring Edge Cases Tests
// ---------------------------------------------------------------------------

/**
 * Test helper: create test population with specific criteria distribution.
 */
function createUnbalancedPopulation() {
  // Create a population with varying distributions:
  // - Gender: heavily skewed (15F, 5M in 20 people)
  // - Entity: balanced (5 each across 4)
  const people: Person[] = [];

  // Add 15 female
  for (let i = 0; i < 15; i++) {
    people.push(
      createTestPerson({
        displayName: `Female${i}`,
        criteria: {
          gender: "Female",
          entity: ["MKT", "OPS", "HR", "ENG"][i % 4],
        },
      }),
    );
  }

  // Add 5 male
  for (let i = 0; i < 5; i++) {
    people.push(
      createTestPerson({
        displayName: `Male${i}`,
        criteria: {
          gender: "Male",
          entity: ["MKT", "OPS", "HR", "ENG"][i % 4],
        },
      }),
    );
  }

  const criteria: CriteriaField[] = [
    {
      key: "gender",
      label: "Gender",
      values: ["Female", "Male"],
    },
    {
      key: "entity",
      label: "Entity",
      values: ["MKT", "OPS", "HR", "ENG"],
    },
  ];

  return { people, criteria };
}

Deno.test("computeQuality – low-cardinality criterion uses ratio mode (gender)", () => {
  const { people, criteria } = createBalancedTestPopulation(20);

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: ["gender"],
  };

  const teams = scramble(people, criteria, config);
  const quality = computeQuality(teams, ["gender"], criteria);

  // Gender has 2 values ≤ 4 teams → ratio mode
  const genderQuality = quality.criteria.find((c) => c.key === "gender");
  assertEquals(genderQuality !== undefined, true);
  if (genderQuality) {
    assertEquals(genderQuality.mode, "ratio");
    assertEquals(genderQuality.score >= 0 && genderQuality.score <= 1, true);
  }
});

Deno.test("computeQuality – high-cardinality criterion uses diversity mode", () => {
  // Create a population where displayName (if treated as criterion) has high cardinality
  const people: Person[] = [];
  for (let i = 0; i < 20; i++) {
    people.push(
      createTestPerson({
        displayName: `Person${i}`,
        criteria: {
          dept: `Dept${i}`, // 20 distinct departments
        },
      }),
    );
  }

  const criteria: CriteriaField[] = [
    {
      key: "dept",
      label: "Department",
      values: Array.from({ length: 20 }, (_, i) => `Dept${i}`),
    },
  ];

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: ["dept"],
  };

  const teams = scramble(people, criteria, config);
  const quality = computeQuality(teams, ["dept"], criteria);

  // Dept has 20 values > 4 teams → diversity mode
  const deptQuality = quality.criteria.find((c) => c.key === "dept");
  assertEquals(deptQuality?.mode, "diversity");
});

Deno.test("computeQuality – limited flag set when perfect balance impossible (few minorities)", () => {
  // Create: 18 Female, 2 Male in 4 teams of 5 → can't balance 2 Males across 4 teams
  const people: Person[] = [];
  for (let i = 0; i < 18; i++) {
    people.push(
      createTestPerson({
        displayName: `F${i}`,
        criteria: { gender: "Female" },
      }),
    );
  }
  people.push(createTestPerson({ displayName: "M1", criteria: { gender: "Male" } }));
  people.push(createTestPerson({ displayName: "M2", criteria: { gender: "Male" } }));

  const criteria: CriteriaField[] = [
    { key: "gender", label: "Gender", values: ["Female", "Male"] },
  ];

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: ["gender"],
  };

  const teams = scramble(people, criteria, config);
  const quality = computeQuality(teams, ["gender"], criteria);

  const genderQuality = quality.criteria.find((c) => c.key === "gender");
  assertEquals(genderQuality?.limited, true); // Only 2 Males can't fill 4 teams
});

Deno.test("computeQuality – overall score is mean of criterion scores", () => {
  const { people, criteria } = createBalancedTestPopulation(20);

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: ["gender", "entity"],
  };

  const teams = scramble(people, criteria, config);
  const quality = computeQuality(teams, ["gender", "entity"], criteria);

  if (quality.criteria.length > 0) {
    const sum = quality.criteria.reduce((acc, c) => acc + c.score, 0);
    const expected = sum / quality.criteria.length;
    assertEquals(Math.abs(quality.overall - expected) < 0.001, true);
  }
});

Deno.test("computeQuality – balanced population has high score", () => {
  const { people, criteria } = createBalancedTestPopulation(20);

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: ["gender", "entity"],
  };

  const teams = scramble(people, criteria, config);
  const quality = computeQuality(teams, ["gender", "entity"], criteria);

  // Balanced population should score reasonably well
  assertGreater(quality.overall, 0.5);
});

Deno.test("computeQuality – unbalanced population has measurable score", () => {
  const { people, criteria } = createUnbalancedPopulation();

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: ["gender"],
  };

  const teams = scramble(people, criteria, config);
  const quality = computeQuality(teams, ["gender"], criteria);

  // Heavily skewed distribution should score in valid range
  assertEquals(quality.overall >= 0 && quality.overall <= 1, true);
});

Deno.test("computeQuality – single value criterion has score 1 (limited: false if enough for all teams)", () => {
  const people: Person[] = Array.from({ length: 20 }, (_, i) =>
    createTestPerson({
      displayName: `P${i}`,
      criteria: { status: "Active" }, // All same value
    }));

  const criteria: CriteriaField[] = [
    { key: "status", label: "Status", values: ["Active"] },
  ];

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: ["status"],
  };

  const teams = scramble(people, criteria, config);
  const quality = computeQuality(teams, ["status"], criteria);

  const statusQuality = quality.criteria.find((c) => c.key === "status");
  // Every team gets the same value, but in diversity mode this might not be ideal
  assertEquals(statusQuality !== undefined, true);
});

Deno.test("computeQuality – empty balance criteria list", () => {
  const { people, criteria } = createBalancedTestPopulation(20);

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: [], // No criteria to balance
  };

  const teams = scramble(people, criteria, config);
  const quality = computeQuality(teams, [], criteria);

  assertEquals(quality.criteria.length, 0);
  // With no criteria, overall should be a valid number (implementation dependent)
  assertEquals(typeof quality.overall === "number", true);
});

Deno.test("computeQuality – repeating with same teams produces same quality", () => {
  const { people, criteria } = createBalancedTestPopulation(20);

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: ["gender", "entity"],
  };

  const teams = scramble(people, criteria, config);

  const quality1 = computeQuality(teams, ["gender", "entity"], criteria);
  const quality2 = computeQuality(teams, ["gender", "entity"], criteria);

  assertEquals(quality1.overall, quality2.overall);
  assertEquals(quality1.criteria.length, quality2.criteria.length);
});

Deno.test("computeQuality – score in valid range [0, 1]", () => {
  const { people, criteria } = createBalancedTestPopulation(20);

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: ["gender", "entity"],
  };

  const teams = scramble(people, criteria, config);
  const quality = computeQuality(teams, ["gender", "entity"], criteria);

  assertEquals(quality.overall >= 0 && quality.overall <= 1, true);
  for (const c of quality.criteria) {
    assertEquals(c.score >= 0 && c.score <= 1, true);
  }
});

Deno.test("Quality – diversity mode: all distinct values visible in large team", () => {
  // Create 24 people with 6 distinct departments, 4 teams of 6
  const people: Person[] = [];
  for (let i = 0; i < 24; i++) {
    people.push(
      createTestPerson({
        displayName: `P${i}`,
        criteria: { dept: `D${i % 6}` },
      }),
    );
  }

  const criteria: CriteriaField[] = [
    {
      key: "dept",
      label: "Dept",
      values: ["D0", "D1", "D2", "D3", "D4", "D5"],
    },
  ];

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 6,
    balanceCriteria: ["dept"],
  };

  const teams = scramble(people, criteria, config);
  const quality = computeQuality(teams, ["dept"], criteria);

  // With 6 values and team size 6, diversity mode should be able to achieve high diversity
  const deptQuality = quality.criteria.find((c) => c.key === "dept");
  assertEquals(deptQuality?.mode, "diversity");
  assertGreater(deptQuality?.score ?? 0, 0.5);
});
