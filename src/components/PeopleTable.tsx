import { Pencil, Plus, Trash2 } from "lucide-react";
import type { CriteriaField, Participant } from "../types.ts";
import { useTableSort } from "../hooks/useTableSort.ts";
import { useTableEdit } from "../hooks/useTableEdit.ts";

interface Props {
  people: Participant[];
  criteria: CriteriaField[];
  onChange: (people: Participant[]) => void;
}

export function PeopleTable({ people, criteria, onChange }: Props) {
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(people, criteria);
  const {
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
  } = useTableEdit(people, criteria, onChange);

  function sortIcon(key: string) {
    if (sortKey !== key) return <span className="opacity-40 ml-1" aria-hidden="true">↕</span>;
    return <span className="ml-1" aria-hidden="true">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  // ── Column definitions ────────────────────────────────────────────────────

  const columns = [
    { key: "displayName", label: "Name" },
    ...criteria.map((c) => ({ key: c.key, label: c.label })),
  ];

  // ── Render helpers ────────────────────────────────────────────────────────

  function cellValue(person: Participant, key: string) {
    return key === "displayName" ? person.displayName : person.criteria[key] ?? "";
  }

  function renderInput(
    key: string,
    label: string,
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
          aria-label={label}
          name={key}
          autoComplete="off"
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
          <caption className="sr-only">Participants and balancing criteria</caption>
          <thead>
            <tr>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  className="whitespace-nowrap"
                  aria-sort={sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                >
                  <button
                    type="button"
                    className="flex items-center font-semibold hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    {sortIcon(key)}
                  </button>
                </th>
              ))}
              {/* actions column */}
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((person) => {
              const isEditing = editId === person.id;
              return (
                <tr key={person.id} className="content-auto">
                  {isEditing && editDraft
                    ? (
                      <>
                        {columns.map(({ key, label }, i) => (
                          <td key={key}>
                            {renderInput(
                              key,
                              `${label} for ${person.displayName}`,
                              key === "displayName" ? editDraft.displayName : (editDraft.criteria[key] ?? ""),
                              (v) => setDraftField(key, v),
                              i === 0,
                            )}
                          </td>
                        ))}
                        <td className="text-right whitespace-nowrap">
                          <div className="flex gap-1 justify-end">
                            <button
                              type="button"
                              className="btn btn-xs btn-success"
                              onClick={commitEdit}
                            >
                              Save
                            </button>
                            <button
                              type="button"
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
                          <td key={key} className={`${key === "displayName" ? "font-medium" : ""} break-words max-w-64`}>
                            {cellValue(person, key)}
                          </td>
                        ))}
                        <td className="text-right whitespace-nowrap">
                          <div className="flex gap-1 justify-end">
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              onClick={() => startEdit(person)}
                              aria-label="Edit row"
                            >
                              <Pencil className="size-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost text-error"
                              onClick={() => {
                                if (globalThis.confirm(`Delete ${person.displayName}?`)) deletePerson(person.id);
                              }}
                              aria-label="Delete row"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
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
                {columns.map(({ key, label }, i) => (
                  <td key={key}>
                    {renderInput(
                      key,
                      `${label} for new participant`,
                      key === "displayName" ? newDraft.displayName : (newDraft.criteria[key] ?? ""),
                      (v) => setNewField(key, v),
                      i === 0,
                    )}
                  </td>
                ))}
                <td className="text-right whitespace-nowrap">
                  <div className="flex gap-1 justify-end">
                    <button
                      type="button"
                      className="btn btn-xs btn-success"
                      onClick={commitAdd}
                      disabled={!newDraft.displayName.trim()}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={cancelAdd}
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {people.length === 0 && !addingRow && (
              <tr>
                <td colSpan={columns.length + 1} className="text-center opacity-60 py-8">
                  No participants yet. Add someone or upload a CSV file.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!addingRow && (
        <div>
          <button type="button" className="btn btn-sm btn-outline" onClick={startAdd}>
            <Plus className="size-4" aria-hidden="true" /> Add Person
          </button>
        </div>
      )}
    </div>
  );
}
