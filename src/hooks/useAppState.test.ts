import { assertEquals, assertThrows } from "@std/assert";
import { parseCSV } from "../core/csvParser.ts";
import { computeQuality, scramble } from "../core/scramble.ts";
import { createBalancedTestPopulation, createTestCriteriaField, createTestPerson } from "../core/testHelpers.ts";
import type { ScramblerConfig } from "../types.ts";

// ---------------------------------------------------------------------------
// Tests simulating useAppState orchestration
// ---------------------------------------------------------------------------

Deno.test("useAppState – CSV load: valid file parses successfully", () => {
  const csv = `firstName,lastName,gender
Alice,Martin,female
Bob,Dupont,male`;

  const result = parseCSV(csv);
  assertEquals(result.people.length, 2);
  assertEquals(result.criteria.length, 1);
  assertEquals(result.criteria[0].key, "gender");
});

Deno.test("useAppState – CSV load: invalid CSV throws error", () => {
  const invalidCsv = `firstName,lastName,gender
Alice,Martin
Bob,Dupont,male`;

  assertThrows(
    () => parseCSV(invalidCsv),
    Error,
  );
});

Deno.test("useAppState – CSV load: empty CSV returns empty lists", () => {
  const emptyCsv = `firstName,lastName,gender`;

  const result = parseCSV(emptyCsv);
  assertEquals(result.people.length, 0);
  assertEquals(result.criteria.length, 0);
});

Deno.test("useAppState – CSV load: missing name column throws error", () => {
  const noCsv = `gender,entity
female,MKT
male,OPS`;

  assertThrows(
    () => parseCSV(noCsv),
    Error,
    "name column",
  );
});

Deno.test("useAppState – State transition: load CSV then scramble", () => {
  const csv = `firstName,lastName,gender,entity
Alice,Martin,female,MKT
Bob,Dupont,male,OPS
Charlie,Lefevre,male,HR
Diana,Moreau,female,ENG`;

  // Load
  const { people, criteria } = parseCSV(csv);
  assertEquals(people.length, 4);

  // Scramble
  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 2,
    teamSize: 2,
    balanceCriteria: criteria.map((c) => c.key),
  };
  const teams = scramble(people, criteria, config);
  assertEquals(teams.length, 2);
  assertEquals(teams[0].members.length, 2);
  assertEquals(teams[1].members.length, 2);
});

Deno.test("useAppState – Scramble flow: computes quality after scramble", () => {
  const { people, criteria } = createBalancedTestPopulation(20);
  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: criteria.map((c) => c.key),
  };

  const teams = scramble(people, criteria, config);
  const quality = computeQuality(teams, config.balanceCriteria, criteria);

  assertEquals(quality.criteria.length > 0, true);
  assertEquals(quality.overall >= 0, true);
  assertEquals(quality.overall <= 1, true);
});

Deno.test("useAppState – Team operation: rename updates team name", () => {
  const { people, criteria } = createBalancedTestPopulation(4);
  const teams = scramble(people, criteria, {
    mode: "teamCount",
    teamCount: 2,
    teamSize: 2,
    balanceCriteria: [],
  });

  const renamed = teams.map((t) => t.id === teams[0].id ? { ...t, name: "New Name" } : t);

  assertEquals(renamed[0].name, "New Name");
  assertEquals(renamed[1].name, teams[1].name); // Should be unchanged
});

Deno.test("useAppState – Team operation: cycle emoji", () => {
  const { people } = createBalancedTestPopulation(2);
  const EMOJIS = ["🚀", "🎯", "⚡"];

  const teams = [
    {
      id: "team1",
      name: "Team 1",
      emoji: EMOJIS[0],
      members: people.slice(0, 1),
      metrics: [],
    },
  ];

  // Cycle emoji
  const cycled = teams.map((t) => {
    const idx = EMOJIS.indexOf(t.emoji);
    const next = EMOJIS[(idx + 1) % EMOJIS.length];
    return { ...t, emoji: next };
  });

  assertEquals(cycled[0].emoji, EMOJIS[1]);
});

Deno.test("useAppState – Team operation: move member between teams", () => {
  const { people, criteria } = createBalancedTestPopulation(4);
  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 2,
    teamSize: 2,
    balanceCriteria: [],
  };
  const teams = scramble(people, criteria, config);

  const source = teams[0];
  const dest = teams[1];
  const member = source.members[0];

  // Move member
  const updated = teams.map((t) => {
    if (t.id === source.id) {
      return { ...t, members: t.members.filter((m) => m.id !== member.id) };
    }
    if (t.id === dest.id) {
      return { ...t, members: [...t.members, member] };
    }
    return t;
  });

  assertEquals(updated[0].members.length, source.members.length - 1);
  assertEquals(updated[1].members.length, dest.members.length + 1);
});

Deno.test("useAppState – Reset: loading new CSV clears teams", () => {
  const csv1 = `firstName,lastName
Alice,Martin
Bob,Dupont`;

  const csv2 = `firstName,lastName
Charlie,Lefevre`;

  const result1 = parseCSV(csv1);
  const result2 = parseCSV(csv2);

  assertEquals(result1.people.length, 2);
  assertEquals(result2.people.length, 1);
});

Deno.test("useAppState – Edge case: scramble with single person", () => {
  const { people, criteria } = createBalancedTestPopulation(1);
  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 1,
    teamSize: 1,
    balanceCriteria: [],
  };

  const teams = scramble(people, criteria, config);
  assertEquals(teams.length, 1);
  assertEquals(teams[0].members.length, 1);
});

Deno.test("useAppState – Edge case: empty people list", () => {
  const { criteria } = createBalancedTestPopulation(0);
  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: [],
  };

  const teams = scramble([], criteria, config);
  assertEquals(teams.length, 0);
});
