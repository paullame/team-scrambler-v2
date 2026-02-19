import { useState } from "react";
import type { CriteriaField, Person } from "../types.ts";

interface Props {
  people: Person[];
  criteria: CriteriaField[];
  onChange: (people: Person[]) => void;
}

type SortDir = "asc" | "desc";

// Blank person shell used when adding a new row.
function blankPerson(criteria: CriteriaField[]): Person {
  return {
    id: crypto.randomUUID(),
    displayName: "",
    criteria: Object.fromEntries(criteria.map((c) => [c.key, ""])),
  };
}

export function PeopleTable({ people, criteria, onChange }: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Person | null>(null);
  const [sortKey, setSortKey] = useState<string>("displayName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [addingRow, setAddingRow] = useState(false);
  const [newDraft, setNewDraft] = useState<Person>(() => blankPerson(criteria));

  // ── Sorting ──────────────────────────────────────────────────────────────

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...people].sort((a, b) => {
    const av = sortKey === "displayName"
      ? a.displayName
      : (a.criteria[sortKey] ?? "");
    const bv = sortKey === "displayName"
      ? b.displayName
      : (b.criteria[sortKey] ?? "");
    const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  function sortIcon(key: string) {
    if (sortKey !== key) return <span className="opacity-20 ml-1">↕</span>;
    return (
      <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  }

  // ── Edit ─────────────────────────────────────────────────────────────────

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
    onChange(people.map((p) => p.id === editDraft.id ? editDraft : p));
    cancelEdit();
  }

  function setDraftField(key: string, value: string) {
    setEditDraft((d) =>
      d
        ? key === "displayName"
          ? { ...d, displayName: value }
          : { ...d, criteria: { ...d.criteria, [key]: value } }
        : d
    );
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  function deletePerson(id: string) {
    if (editId === id) cancelEdit();
    onChange(people.filter((p) => p.id !== id));
  }

  // ── Add ───────────────────────────────────────────────────────────────────

  function startAdd() {
    setNewDraft(blankPerson(criteria));
    setAddingRow(true);
  }

  function cancelAdd() {
    setAddingRow(false);
  }

  function commitAdd() {
    if (!newDraft.displayName.trim()) return; // name is required
    onChange([...people, { ...newDraft, displayName: newDraft.displayName.trim() }]);
    setAddingRow(false);
  }

  function setNewField(key: string, value: string) {
    setNewDraft((d) =>
      key === "displayName"
        ? { ...d, displayName: value }
        : { ...d, criteria: { ...d.criteria, [key]: value } }
    );
  }

  // ── Column definitions ────────────────────────────────────────────────────

  const columns = [
    { key: "displayName", label: "Name" },
    ...criteria.map((c) => ({ key: c.key, label: c.label })),
  ];

  // ── Render helpers ────────────────────────────────────────────────────────

  function cellValue(person: Person, key: string) {
    return key === "displayName" ? person.displayName : person.criteria[key] ?? "";
  }

  function renderInput(
    key: string,
    value: string,
    onChange: (v: string) => void,
    autoFocus = false,
  ) {
    const field = criteria.find((c) => c.key === key);
    // If the criterion has a small known value set, use a datalist.
    const listId = field && field.values.length > 0 ? `dl-${key}` : undefined;
    return (
      <>
        <input
          className="input input-xs input-bordered w-full min-w-20"
          value={value}
          autoFocus={autoFocus}
          list={listId}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancelEdit();
          }}
        />
        {listId && (
          <datalist id={listId}>
            {field!.values.map((v) => <option key={v} value={v} />)}
          </datalist>
        )}
      </>
    );
  }

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-zebra table-sm">
          <thead>
            <tr>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  className="cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort(key)}
                >
                  {label}{sortIcon(key)}
                </th>
              ))}
              {/* actions column */}
              <th />
            </tr>
          </thead>

          <tbody>
            {sorted.map((person) => {
              const isEditing = editId === person.id;
              return (
                <tr key={person.id}>
                  {isEditing && editDraft
                    ? (
                      <>
                        {columns.map(({ key }, i) => (
                          <td key={key}>
                            {renderInput(
                              key,
                              key === "displayName"
                                ? editDraft.displayName
                                : (editDraft.criteria[key] ?? ""),
                              (v) => setDraftField(key, v),
                              i === 0,
                            )}
                          </td>
                        ))}
                        <td className="text-right whitespace-nowrap">
                          <div className="flex gap-1 justify-end">
                            <button
                              className="btn btn-xs btn-success"
                              onClick={commitEdit}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    )
                    : (
                      <>
                        {columns.map(({ key }) => (
                          <td key={key} className={key === "displayName" ? "font-medium" : ""}>
                            {cellValue(person, key)}
                          </td>
                        ))}
                        <td className="text-right whitespace-nowrap">
                          <div className="flex gap-1 justify-end">
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => startEdit(person)}
                              aria-label="Edit row"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-xs btn-ghost text-error"
                              onClick={() => deletePerson(person.id)}
                              aria-label="Delete row"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                </tr>
              );
            })}

            {/* Add new row */}
            {addingRow && (
              <tr className="bg-base-200">
                {columns.map(({ key }, i) => (
                  <td key={key}>
                    {renderInput(
                      key,
                      key === "displayName"
                        ? newDraft.displayName
                        : (newDraft.criteria[key] ?? ""),
                      (v) => setNewField(key, v),
                      i === 0,
                    )}
                  </td>
                ))}
                <td className="text-right whitespace-nowrap">
                  <div className="flex gap-1 justify-end">
                    <button
                      className="btn btn-xs btn-success"
                      onClick={commitAdd}
                      disabled={!newDraft.displayName.trim()}
                    >
                      Add
                    </button>
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={cancelAdd}
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!addingRow && (
        <div>
          <button className="btn btn-sm btn-outline" onClick={startAdd}>
            + Add person
          </button>
        </div>
      )}
    </div>
  );
}
