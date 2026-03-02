import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScramblerSettings } from "./ScramblerSettings.tsx";
import type { CriteriaField, ScramblerConfig } from "../types.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CRITERIA: CriteriaField[] = [
  { key: "gender", label: "Gender", values: ["female", "male"] },
  { key: "entity", label: "Entity", values: ["HR", "IT"] },
];

function makeConfig(overrides: Partial<ScramblerConfig> = {}): ScramblerConfig {
  return { mode: "teamCount", teamCount: 4, teamSize: 5, balanceCriteria: [], ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ScramblerSettings", () => {
  // ── Preview text ──────────────────────────────────────────────────────────

  it("shows '≈ N people / team' preview in teamCount mode", () => {
    render(<ScramblerSettings config={makeConfig({ teamCount: 4 })} criteria={[]} peopleCount={20} onChange={vi.fn()} />);
    expect(screen.getByText("≈ 5 people / team")).toBeInTheDocument();
  });

  it("shows '≈ N teams' preview in teamSize mode", () => {
    render(<ScramblerSettings config={makeConfig({ mode: "teamSize", teamSize: 5 })} criteria={[]} peopleCount={20} onChange={vi.fn()} />);
    expect(screen.getByText("≈ 4 teams")).toBeInTheDocument();
  });

  it("shows no preview when peopleCount is 0", () => {
    render(<ScramblerSettings config={makeConfig()} criteria={[]} peopleCount={0} onChange={vi.fn()} />);
    expect(screen.queryByText(/≈/)).toBeNull();
  });

  it("preview people/team rounds up for non-even split", () => {
    // 10 / 3 = ceil → 4
    render(<ScramblerSettings config={makeConfig({ teamCount: 3 })} criteria={[]} peopleCount={10} onChange={vi.fn()} />);
    expect(screen.getByText("≈ 4 people / team")).toBeInTheDocument();
  });

  it("preview team count rounds up for non-even split", () => {
    // ceil(10 / 3) = 4
    render(<ScramblerSettings config={makeConfig({ mode: "teamSize", teamSize: 3 })} criteria={[]} peopleCount={10} onChange={vi.fn()} />);
    expect(screen.getByText("≈ 4 teams")).toBeInTheDocument();
  });

  // ── Mode radio buttons ────────────────────────────────────────────────────

  it("teamCount radio is checked when mode is teamCount", () => {
    render(<ScramblerSettings config={makeConfig({ mode: "teamCount" })} criteria={[]} peopleCount={10} onChange={vi.fn()} />);
    const [countRadio, sizeRadio] = screen.getAllByRole("radio");
    expect(countRadio).toBeChecked();
    expect(sizeRadio).not.toBeChecked();
  });

  it("teamSize radio is checked when mode is teamSize", () => {
    render(<ScramblerSettings config={makeConfig({ mode: "teamSize" })} criteria={[]} peopleCount={10} onChange={vi.fn()} />);
    const [countRadio, sizeRadio] = screen.getAllByRole("radio");
    expect(sizeRadio).toBeChecked();
    expect(countRadio).not.toBeChecked();
  });

  it("clicking teamSize radio calls onChange with mode: teamSize", async () => {
    const onChange = vi.fn();
    render(<ScramblerSettings config={makeConfig({ mode: "teamCount" })} criteria={[]} peopleCount={10} onChange={onChange} />);
    await userEvent.click(screen.getAllByRole("radio")[1]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mode: "teamSize" }));
  });

  it("clicking teamCount radio calls onChange with mode: teamCount", async () => {
    const onChange = vi.fn();
    render(<ScramblerSettings config={makeConfig({ mode: "teamSize" })} criteria={[]} peopleCount={10} onChange={onChange} />);
    await userEvent.click(screen.getAllByRole("radio")[0]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mode: "teamCount" }));
  });

  // ── Number inputs ─────────────────────────────────────────────────────────

  it("shows Teams label and input in teamCount mode", () => {
    render(<ScramblerSettings config={makeConfig({ mode: "teamCount" })} criteria={[]} peopleCount={20} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Teams")).toBeInTheDocument();
  });

  it("shows 'People / team' label and input in teamSize mode", () => {
    render(<ScramblerSettings config={makeConfig({ mode: "teamSize" })} criteria={[]} peopleCount={20} onChange={vi.fn()} />);
    expect(screen.getByLabelText("People / team")).toBeInTheDocument();
  });

  it("changing teamCount input calls onChange with updated teamCount", () => {
    const onChange = vi.fn();
    render(<ScramblerSettings config={makeConfig({ teamCount: 4 })} criteria={[]} peopleCount={20} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Teams"), { target: { value: "6" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ teamCount: 6 }));
  });

  it("changing teamSize input calls onChange with updated teamSize", () => {
    const onChange = vi.fn();
    render(<ScramblerSettings config={makeConfig({ mode: "teamSize", teamSize: 5 })} criteria={[]} peopleCount={20} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("People / team"), { target: { value: "3" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ teamSize: 3 }));
  });

  it("teamCount input floor-clamps at 1: value 0 produces teamCount: 1", () => {
    const onChange = vi.fn();
    render(<ScramblerSettings config={makeConfig({ teamCount: 4 })} criteria={[]} peopleCount={20} onChange={onChange} />);
    // Math.max(1, 0) = 1
    fireEvent.change(screen.getByLabelText("Teams"), { target: { value: "0" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ teamCount: 1 }));
  });

  // ── Criteria checkboxes ───────────────────────────────────────────────────

  it("renders a checkbox per criterion", () => {
    render(<ScramblerSettings config={makeConfig()} criteria={CRITERIA} peopleCount={10} onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: "Gender" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Entity" })).toBeInTheDocument();
  });

  it("criterion checkbox is checked when key is in balanceCriteria", () => {
    render(<ScramblerSettings config={makeConfig({ balanceCriteria: ["gender"] })} criteria={CRITERIA} peopleCount={10} onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: "Gender" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Entity" })).not.toBeChecked();
  });

  it("clicking unchecked criterion adds it to balanceCriteria", async () => {
    const onChange = vi.fn();
    render(<ScramblerSettings config={makeConfig({ balanceCriteria: [] })} criteria={CRITERIA} peopleCount={10} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Gender" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ balanceCriteria: ["gender"] }));
  });

  it("clicking checked criterion removes it from balanceCriteria", async () => {
    const onChange = vi.fn();
    render(<ScramblerSettings config={makeConfig({ balanceCriteria: ["gender", "entity"] })} criteria={CRITERIA} peopleCount={10} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Gender" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ balanceCriteria: ["entity"] }));
  });

  it("renders no checkboxes when criteria list is empty", () => {
    render(<ScramblerSettings config={makeConfig()} criteria={[]} peopleCount={10} onChange={vi.fn()} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("all criteria unchecked when balanceCriteria is empty", () => {
    render(<ScramblerSettings config={makeConfig({ balanceCriteria: [] })} criteria={CRITERIA} peopleCount={10} onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: "Gender" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Entity" })).not.toBeChecked();
  });
});
