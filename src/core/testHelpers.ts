import { crypto } from "@std/crypto";
import type { CriteriaField, Person, Team } from "../types.ts";

/**
 * Generate a UUID-like string for testing.
 */
export function generateTestId(): string {
  return crypto.randomUUID();
}

/**
 * Create a test Person with sensible defaults.
 */
export function createTestPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: generateTestId(),
    displayName: "Test Person",
    criteria: {},
    ...overrides,
  };
}

/**
 * Create a test Team with sensible defaults.
 */
export function createTestTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: generateTestId(),
    name: "Test Team",
    emoji: "🚀",
    members: [],
    metrics: [],
    ...overrides,
  };
}

/**
 * Create a test CriteriaField with sensible defaults.
 */
export function createTestCriteriaField(
  overrides: Partial<CriteriaField> = {},
): CriteriaField {
  return {
    key: "test_criteria",
    label: "Test Criteria",
    values: [],
    ...overrides,
  };
}

/**
 * Create a balanced test population for scramble testing.
 * Default: 20 people (10F/10M, 4 entities: MKT, OPS, HR, ENG).
 */
export function createBalancedTestPopulation(
  count: number = 20,
): { people: Person[]; criteria: CriteriaField[] } {
  const genders = ["Female", "Male"];
  const entities = ["MKT", "OPS", "HR", "ENG"];

  const people: Person[] = [];
  for (let i = 0; i < count; i++) {
    people.push(
      createTestPerson({
        id: generateTestId(),
        displayName: `Person ${i + 1}`,
        criteria: {
          gender: genders[i % genders.length],
          entity: entities[i % entities.length],
        },
      }),
    );
  }

  const criteria: CriteriaField[] = [
    createTestCriteriaField({
      key: "gender",
      label: "Gender",
      values: genders,
    }),
    createTestCriteriaField({
      key: "entity",
      label: "Entity",
      values: entities,
    }),
  ];

  return { people, criteria };
}
