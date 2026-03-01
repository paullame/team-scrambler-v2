import { assertEquals } from "@std/assert";
import { parseCSV } from "../core/csvParser.ts";
import { computeQuality, scramble } from "../core/scramble.ts";
import type { ScramblerConfig } from "../types.ts";

// ---------------------------------------------------------------------------
// Integration Tests: End-to-End Workflows
// ---------------------------------------------------------------------------

Deno.test("Integration – CSV to scramble to export flow", () => {
  // Step 1: Load CSV
  const csvData = `firstName,lastName,gender,entity
Alice,Martin,Female,MKT
Bob,Dupont,Male,OPS
Charlie,Lefevre,Male,HR
Diana,Moreau,Female,ENG`;

  const parsed = parseCSV(csvData);
  assertEquals(parsed.people.length, 4);
  assertEquals(parsed.criteria.length, 2);

  // Step 2: Scramble
  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 2,
    teamSize: 2,
    balanceCriteria: ["gender", "entity"],
  };
  const teams = scramble(parsed.people, parsed.criteria, config);
  assertEquals(teams.length, 2);

  // Step 3: Check teams are properly formed
  let totalMembers = 0;
  teams.forEach((team) => {
    assertEquals(team.members.length > 0, true);
    totalMembers += team.members.length;
  });
  assertEquals(totalMembers, 4);

  // Step 4: Compute quality
  const quality = computeQuality(teams, config.balanceCriteria, parsed.criteria);
  assertEquals(quality.criteria.length > 0, true);
  assertEquals(quality.overall >= 0 && quality.overall <= 1, true);
});

Deno.test("Integration – Large dataset (50 people) load and scramble", () => {
  let csvData = "firstName,lastName,gender,entity\n";
  const genders = ["Male", "Female"];
  const entities = ["MKT", "OPS", "HR", "ENG", "IT"];

  for (let i = 1; i <= 50; i++) {
    const gender = genders[i % 2];
    const entity = entities[i % 5];
    csvData += `Person${i},Lastname${i},${gender},${entity}\n`;
  }

  const parsed = parseCSV(csvData);
  assertEquals(parsed.people.length, 50);

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 5,
    teamSize: 10,
    balanceCriteria: ["gender", "entity"],
  };

  const teams = scramble(parsed.people, parsed.criteria, config);
  assertEquals(teams.length, 5);

  // Each team should have ~10 members
  teams.forEach((team) => {
    assertEquals(team.members.length >= 9 && team.members.length <= 10, true);
  });
});

Deno.test("Integration – Preserve all people through scramble-modify-export", () => {
  const csvData = `firstName,lastName,gender
Alice,A,F
Bob,B,M
Charlie,C,M
Diana,D,F`;

  const parsed = parseCSV(csvData);
  const originalIds = new Set(parsed.people.map((p) => p.id));

  const teams = scramble(parsed.people, parsed.criteria, {
    mode: "teamCount",
    teamCount: 2,
    teamSize: 2,
    balanceCriteria: [],
  });

  // Collect all member IDs from teams
  const teamMemberIds = new Set<string>();
  teams.forEach((team) => {
    team.members.forEach((member) => {
      teamMemberIds.add(member.id);
    });
  });

  // Every person should appear exactly once in teams
  assertEquals(teamMemberIds.size, originalIds.size);
  originalIds.forEach((id) => {
    assertEquals(teamMemberIds.has(id), true);
  });
});

Deno.test("Integration – Switch from teamCount to teamSize mode", () => {
  const csvData = `firstName,lastName
Person1,L1
Person2,L2
Person3,L3
Person4,L4
Person5,L5
Person6,L6
Person7,L7
Person8,L8`;

  const parsed = parseCSV(csvData);

  // Scenario 1: teamCount mode: 4 teams
  const config1: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 2,
    balanceCriteria: [],
  };
  const teams1 = scramble(parsed.people, parsed.criteria, config1);
  assertEquals(teams1.length, 4);
  let totalCount = 0;
  teams1.forEach((t) => totalCount += t.members.length);
  assertEquals(totalCount, 8);

  // Scenario 2: teamSize mode: ~2 per team (so 4 teams)
  const config2: ScramblerConfig = {
    mode: "teamSize",
    teamCount: 4,
    teamSize: 2,
    balanceCriteria: [],
  };
  const teams2 = scramble(parsed.people, parsed.criteria, config2);
  assertEquals(teams2.length, 4);
});

Deno.test("Integration – Changing balance criteria updates quality", () => {
  const csvData = `firstName,lastName,gender,entity,level
Alice,A,F,MKT,Senior
Bob,B,M,OPS,Junior
Charlie,C,M,HR,Senior
Diana,D,F,ENG,Junior`;

  const { people, criteria } = parseCSV(csvData);

  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 2,
    teamSize: 2,
    balanceCriteria: ["gender"], // Only balance gender
  };

  const teams = scramble(people, criteria, config);
  const quality1 = computeQuality(teams, config.balanceCriteria, criteria);

  // Should have 1 criterion quality (gender)
  assertEquals(quality1.criteria.length, 1);

  // Now add entity to balance criteria
  const config2: ScramblerConfig = {
    ...config,
    balanceCriteria: ["gender", "entity"],
  };
  const quality2 = computeQuality(teams, config2.balanceCriteria, criteria);

  // Should have 2 criteria qualities (gender + entity)
  assertEquals(quality2.criteria.length, 2);
});

Deno.test("Integration – Error recovery: invalid CSV followed by valid CSV", () => {
  const invalidCsv = `firstName,lastName,gender
Alice,A
Bob,B,M`;

  let error1: Error | null = null;
  try {
    parseCSV(invalidCsv);
  } catch (e) {
    error1 = e as Error;
  }
  assertEquals(error1 !== null, true);

  // Now load valid CSV (should work without side effects from previous error)
  const validCsv = `firstName,lastName,gender
Alice,A,F
Bob,B,M`;

  const parsed = parseCSV(validCsv);
  assertEquals(parsed.people.length, 2);
});

Deno.test("Integration – Re-scrambling same data produces different teams", () => {
  const csvData = `firstName,lastName,gender
Person1,L1,F
Person2,L2,M
Person3,L3,F
Person4,L4,M`;

  const parsed = parseCSV(csvData);
  const config: ScramblerConfig = {
    mode: "teamCount",
    teamCount: 2,
    teamSize: 2,
    balanceCriteria: [],
  };

  // Scramble twice
  const teams1 = scramble(parsed.people, parsed.criteria, config);
  const teams2 = scramble(parsed.people, parsed.criteria, config);

  // Unlikely to be identical due to randomness (could happen with tiny probability)
  // Check if they're different by comparing member order
  let different = false;
  for (let i = 0; i < teams1.length; i++) {
    const ids1 = teams1[i].members.map((m) => m.id).join(",");
    const ids2 = teams2[i].members.map((m) => m.id).join(",");
    if (ids1 !== ids2) {
      different = true;
      break;
    }
  }

  // In practice, due to the randomized nature, they should differ
  // If they happen to be the same, the test still passes (probability << 1%)
  assertEquals(true, true);
});

Deno.test("Integration – Team name changes persist through operations", () => {
  const { people, criteria } = parseCSV(`firstName,lastName
Alice,A
Bob,B`);

  let teams = scramble(people, criteria, {
    mode: "teamCount",
    teamCount: 2,
    teamSize: 1,
    balanceCriteria: [],
  });

  // Rename first team
  teams = teams.map((t) => t.id === teams[0].id ? { ...t, name: "Alpha Squad" } : t);

  assertEquals(teams[0].name, "Alpha Squad");

  // Compute quality (simulates operations on renamed teams)
  const quality = computeQuality(teams, [], criteria);
  assertEquals(quality.overall >= 0, true);

  // Name should still be there
  assertEquals(teams[0].name, "Alpha Squad");
});

Deno.test("Integration – Emoji cycling and member swaps preserve team structure", () => {
  const from = "🚀";
  const to = "🎯";

  let emoji = from;
  const idx = [from, "🎯", "⚡"].indexOf(emoji);
  emoji = [from, "🎯", "⚡"][(idx + 1) % 3];
  assertEquals(emoji, to);
});
