import { useState } from "react";
import type { CriteriaField, Person } from "../types.ts";

function blankPerson(criteria: CriteriaField[]): Person {
  return {
    id: crypto.randomUUID(),
    displayName: "",
    criteria: Object.fromEntries(criteria.map((c) => [c.key, ""])),
  };
}

/**
 * Manages inline edit state and add-row state for the people table.
 * Calls `onChange` with the updated full list whenever a commit or delete
 * operation succeeds.
 */
export function useTableEdit(
  people: Person[],
  criteria: CriteriaField[],
  onChange: (people: Person[]) => void,
) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Person | null>(null);
  const [addingRow, setAddingRow] = useState(false);
  const [newDraft, setNewDraft] = useState<Person>(() => blankPerson(criteria));

  // ── Edit ──────────────────────────────────────────────────────────────

  function startEdit(person: Person) {
    setEditId(person.id);
    setEditDraft(structuredClone(person));
  }

  function cancelEdit() {
    setEditId(null);
    setEditDraft(null);
  }

  function commitEdit() {
    if (!editDraft) return;
    onChange(people.map((p) => (p.id === editDraft.id ? editDraft : p)));
    cancelEdit();
  }

  function setDraftField(key: string, value: string) {
    setEditDraft((d) => d ? key === "displayName" ? { ...d, displayName: value } : { ...d, criteria: { ...d.criteria, [key]: value } } : d);
  }

  // ── Delete ────────────────────────────────────────────────────────────

  function deletePerson(id: string) {
    if (editId === id) cancelEdit();
    onChange(people.filter((p) => p.id !== id));
  }

  // ── Add ───────────────────────────────────────────────────────────────

  function startAdd() {
    setNewDraft(blankPerson(criteria));
    setAddingRow(true);
  }

  function cancelAdd() {
    setAddingRow(false);
  }

  function commitAdd() {
    if (!newDraft.displayName.trim()) return;
    onChange([
      ...people,
      { ...newDraft, displayName: newDraft.displayName.trim() },
    ]);
    setAddingRow(false);
  }

  function setNewField(key: string, value: string) {
    setNewDraft((d) => key === "displayName" ? { ...d, displayName: value } : { ...d, criteria: { ...d.criteria, [key]: value } });
  }

  return {
    editId,
    editDraft,
    addingRow,
    newDraft,
    startEdit,
    cancelEdit,
    commitEdit,
    setDraftField,
    deletePerson,
    startAdd,
    cancelAdd,
    commitAdd,
    setNewField,
  };
}
