import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PeopleTable } from "./PeopleTable.tsx";
import type { Person } from "../types.ts";

const people: Person[] = [
  { id: "2", displayName: "Bob", criteria: { group: "B" } },
  { id: "1", displayName: "Alice", criteria: { group: "A" } },
];
const criteria = [{ key: "group", label: "Group", values: ["A", "B"] }];

describe("PeopleTable", () => {
  it("exposes sortable headers and updates aria-sort", async () => {
    render(<PeopleTable people={people} criteria={criteria} onChange={vi.fn()} />);
    const nameHeader = screen.getByRole("columnheader", { name: /name/i });
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
    await userEvent.click(screen.getByRole("button", { name: /name/i }));
    expect(nameHeader).toHaveAttribute("aria-sort", "descending");
  });

  it("labels inline editing fields", async () => {
    render(<PeopleTable people={people} criteria={criteria} onChange={vi.fn()} />);
    await userEvent.click(screen.getAllByRole("button", { name: "Edit row" })[0]);
    expect(screen.getByRole("textbox", { name: "Name for Alice" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Group for Alice" })).toBeInTheDocument();
  });

  it("confirms destructive deletion", async () => {
    const onChange = vi.fn();
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    render(<PeopleTable people={people} criteria={criteria} onChange={onChange} />);
    await userEvent.click(screen.getAllByRole("button", { name: "Delete row" })[0]);
    expect(confirm).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("renders an actionable empty state", () => {
    render(<PeopleTable people={[]} criteria={criteria} onChange={vi.fn()} />);
    expect(screen.getByText(/No participants yet/i)).toBeInTheDocument();
  });
});
