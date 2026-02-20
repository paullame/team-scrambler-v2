import { Pencil, Plus, Trash2 } from "lucide-react";
import type { CriteriaField, Person } from "../types.ts";
import { useTableSort } from "../hooks/useTableSort.ts";
import { useTableEdit } from "../hooks/useTableEdit.ts";

interface Props {
  people: Person[];
  criteria: CriteriaField[];
  onChange: (people: Person[]) => void;
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
    if (sortKey !== key) return <span className="opacity-20 ml-1">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
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
                  {label}
                  {sortIcon(key)}
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
                          <td key={key} className={key === "displayName" ? "font-medium" : ""}>
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
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost text-error"
                              onClick={() => deletePerson(person.id)}
                              aria-label="Delete row"
                            >
                              <Trash2 className="size-3.5" />
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
          </tbody>
        </table>
      </div>

      {!addingRow && (
        <div>
          <button type="button" className="btn btn-sm btn-outline" onClick={startAdd}>
            <Plus className="size-4" /> Add person
          </button>
        </div>
      )}
    </div>
  );
}
