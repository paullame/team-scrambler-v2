import { assertEquals, assertMatch, assertThrows } from "@std/assert";
import { parseCSV } from "./csvParser.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FULL_NAME_CSV = `firstName,lastName,gender,entity,mancom
Alice,MARTIN,female,MKT,false
Benjamin,DUPONT,male,OPS,true
Claire,DURAND,female,HR,false`;

const DISPLAY_NAME_CSV = `firstName,lastName,displayName,gender,entity
Alice,MARTIN,Alice MARTIN,female,MKT
Benjamin,DUPONT,Ben D,male,OPS`;

const EMAIL_ONLY_CSV = `email,displayName,gender,entity,mancom
alice@example.com,Alice M,female,MKT,false
bob@example.com,Bob D,male,OPS,true`;

const EMAIL_NO_DISPLAYNAME_CSV = `email,gender,entity
alice@example.com,female,MKT
bob@example.com,male,OPS`;

const WHITESPACE_CSV = `firstName,lastName,gender
  Alice ,  MARTIN  ,  female  
  Bob ,  DUPONT  ,  male  `;

const NO_NAME_CSV = `gender,entity,mancom
female,MKT,false
male,OPS,true`;

const EMPTY_ROWS_CSV = `firstName,lastName,gender`;

// ---------------------------------------------------------------------------
// People count
// ---------------------------------------------------------------------------

Deno.test("parseCSV – correct person count", () => {
  const { people } = parseCSV(FULL_NAME_CSV);
  assertEquals(people.length, 3);
});

Deno.test("parseCSV – empty body returns empty lists", () => {
  const result = parseCSV(EMPTY_ROWS_CSV);
  assertEquals(result.people, []);
  assertEquals(result.criteria, []);
});

// ---------------------------------------------------------------------------
// displayName resolution
// ---------------------------------------------------------------------------

Deno.test("displayName – prefers explicit displayName column", () => {
  const { people } = parseCSV(DISPLAY_NAME_CSV);
  assertEquals(people[0].displayName, "Alice MARTIN");
  assertEquals(people[1].displayName, "Ben D");
});

Deno.test("displayName – builds from firstName + lastName", () => {
  const { people } = parseCSV(FULL_NAME_CSV);
  assertEquals(people[0].displayName, "Alice MARTIN");
  assertEquals(people[1].displayName, "Benjamin DUPONT");
});

Deno.test("displayName – uses displayName from email-style CSV", () => {
  const { people } = parseCSV(EMAIL_ONLY_CSV);
  assertEquals(people[0].displayName, "Alice M");
  assertEquals(people[1].displayName, "Bob D");
});

Deno.test("displayName – falls back to email when no other name column", () => {
  const { people } = parseCSV(EMAIL_NO_DISPLAYNAME_CSV);
  assertEquals(people[0].displayName, "alice@example.com");
});

Deno.test("displayName – fallback label when no name can be derived", () => {
  // Construct a CSV that has a name column but empty values for all rows.
  const csv = `firstName,gender\n,female\n,male`;
  const { people } = parseCSV(csv);
  assertMatch(people[0].displayName, /^Person \d+$/);
});

// ---------------------------------------------------------------------------
// Criteria extraction
// ---------------------------------------------------------------------------

Deno.test("criteria – name columns are excluded from criteria", () => {
  const { criteria } = parseCSV(FULL_NAME_CSV);
  const keys = criteria.map((c) => c.key);
  assertEquals(keys.includes("firstName"), false);
  assertEquals(keys.includes("lastName"), false);
});

Deno.test("criteria – correct criterion keys", () => {
  const { criteria } = parseCSV(FULL_NAME_CSV);
  const keys = criteria.map((c) => c.key);
  assertEquals(keys, ["gender", "entity", "mancom"]);
});

Deno.test("criteria – labels are title-cased", () => {
  const { criteria } = parseCSV(FULL_NAME_CSV);
  const labels = criteria.map((c) => c.label);
  assertEquals(labels, ["Gender", "Entity", "Mancom"]);
});

Deno.test("criteria – unique values are sorted and deduplicated", () => {
  const { criteria } = parseCSV(FULL_NAME_CSV);
  const gender = criteria.find((c) => c.key === "gender")!;
  assertEquals(gender.values, ["female", "male"]);

  const entity = criteria.find((c) => c.key === "entity")!;
  assertEquals(entity.values, ["HR", "MKT", "OPS"]);
});

Deno.test("criteria – boolean-like strings are kept as strings", () => {
  const { criteria } = parseCSV(FULL_NAME_CSV);
  const mancom = criteria.find((c) => c.key === "mancom")!;
  assertEquals(mancom.values, ["false", "true"]);
});

// ---------------------------------------------------------------------------
// Person criteria values
// ---------------------------------------------------------------------------

Deno.test("person – criteria values are correctly assigned", () => {
  const { people } = parseCSV(FULL_NAME_CSV);
  assertEquals(people[0].criteria["gender"], "female");
  assertEquals(people[0].criteria["entity"], "MKT");
  assertEquals(people[0].criteria["mancom"], "false");
  assertEquals(people[1].criteria["gender"], "male");
  assertEquals(people[1].criteria["mancom"], "true");
});

Deno.test("person – each person gets a unique UUID", () => {
  const { people } = parseCSV(FULL_NAME_CSV);
  const ids = new Set(people.map((p) => p.id));
  assertEquals(ids.size, people.length);
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

Deno.test("parseCSV – throws when no name column present", () => {
  assertThrows(
    () => parseCSV(NO_NAME_CSV),
    Error,
    "CSV must contain at least one name column",
  );
});

// ---------------------------------------------------------------------------
// Whitespace handling
// ---------------------------------------------------------------------------

Deno.test("parseCSV – strips surrounding whitespace from values", () => {
  const { people, criteria } = parseCSV(WHITESPACE_CSV);
  assertEquals(people[0].criteria["gender"], "female");
  assertEquals(people[1].criteria["gender"], "male");
  // Unique values should also be trimmed
  const gender = criteria.find((c) => c.key === "gender")!;
  assertEquals(gender.values, ["female", "male"]);
});
