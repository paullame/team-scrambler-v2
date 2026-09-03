import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TeamCard } from "./TeamCard.tsx";
import type { Team } from "../scenarios/team-balancing/types.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ALICE = { id: "p-alice", displayName: "Alice", criteria: {} };
const BOB = { id: "p-bob", displayName: "Bob", criteria: {} };

function makeTeam(overrides: Partial<Team> = {}): Team {
  return { id: "team-1", name: "Team Alpha", emoji: "🦁", members: [ALICE, BOB], metrics: [], ...overrides };
}

function makeProps(overrides: Partial<React.ComponentProps<typeof TeamCard>> = {}) {
  return {
    team: makeTeam(),
    index: 0,
    onRename: vi.fn(),
    onMoveMember: vi.fn(),
    onCycleEmoji: vi.fn(),
    availableTeams: [{ id: "team-1", name: "Team Alpha" }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TeamCard", () => {
  // ── Basic rendering ───────────────────────────────────────────────────────

  it("renders the team name", () => {
    render(<TeamCard {...makeProps()} />);
    expect(screen.getByText("Team Alpha")).toBeInTheDocument();
  });

  it("renders the team emoji", () => {
    render(<TeamCard {...makeProps()} />);
    expect(screen.getByRole("button", { name: "Change team emoji" })).toHaveTextContent("🦁");
  });

  it("renders all member names", () => {
    render(<TeamCard {...makeProps()} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders member count as '2 members'", () => {
    render(<TeamCard {...makeProps()} />);
    expect(screen.getByText("2 members")).toBeInTheDocument();
  });

  it("renders '1 member' (singular) for a single-member team", () => {
    render(<TeamCard {...makeProps({ team: makeTeam({ members: [ALICE] }) })} />);
    expect(screen.getByText("1 member")).toBeInTheDocument();
  });

  it("renders metric badges when metrics are present", () => {
    const metrics = [{ key: "gender", label: "Gender", counts: { female: 1 }, ratios: { female: 1 } }];
    render(<TeamCard {...makeProps({ team: makeTeam({ metrics }) })} />);
    expect(screen.getByText(/female/i)).toBeInTheDocument();
  });

  it("renders no metric section when metrics are empty", () => {
    render(<TeamCard {...makeProps({ team: makeTeam({ metrics: [] }) })} />);
    expect(screen.queryByText(/gender/i)).toBeNull();
  });

  // ── Emoji button ──────────────────────────────────────────────────────────

  it("clicking the emoji calls onCycleEmoji with the team id", async () => {
    const onCycleEmoji = vi.fn();
    render(<TeamCard {...makeProps({ onCycleEmoji })} />);
    await userEvent.click(screen.getByRole("button", { name: "Change team emoji" }));
    expect(onCycleEmoji).toHaveBeenCalledWith("team-1");
    expect(onCycleEmoji).toHaveBeenCalledTimes(1);
  });

  // ── Inline name editing ───────────────────────────────────────────────────

  it("clicking the team name enters edit mode (replaces heading with input)", async () => {
    render(<TeamCard {...makeProps()} />);
    await userEvent.click(screen.getByText("Team Alpha"));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByText("Team Alpha")).toBeNull();
  });

  it("pressing Enter commits the new name and calls onRename", async () => {
    const onRename = vi.fn();
    render(<TeamCard {...makeProps({ onRename })} />);
    await userEvent.click(screen.getByText("Team Alpha"));
    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "Delta Squad{Enter}");
    expect(onRename).toHaveBeenCalledWith("team-1", "Delta Squad");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("pressing Escape cancels editing without calling onRename", async () => {
    const onRename = vi.fn();
    render(<TeamCard {...makeProps({ onRename })} />);
    await userEvent.click(screen.getByText("Team Alpha"));
    await userEvent.keyboard("{Escape}");
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("committing a whitespace-only name does not call onRename", async () => {
    const onRename = vi.fn();
    render(<TeamCard {...makeProps({ onRename })} />);
    await userEvent.click(screen.getByText("Team Alpha"));
    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "   {Enter}");
    expect(onRename).not.toHaveBeenCalled();
  });

  it("blurring the name input commits the name via onRename", async () => {
    const onRename = vi.fn();
    render(
      <div>
        <TeamCard {...makeProps({ onRename })} />
        <button type="button">Other</button>
      </div>,
    );
    await userEvent.click(screen.getByText("Team Alpha"));
    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "Bravo");
    await userEvent.click(screen.getByRole("button", { name: "Other" }));
    expect(onRename).toHaveBeenCalledWith("team-1", "Bravo");
  });

  // ── Drag-and-drop ─────────────────────────────────────────────────────────

  it("dragStart on a member serialises memberId and fromTeamId", () => {
    render(<TeamCard {...makeProps()} />);
    const captured: Record<string, string> = {};
    fireEvent.dragStart(screen.getByText("Alice"), {
      dataTransfer: {
        setData: (k: string, v: string) => {
          captured[k] = v;
        },
        effectAllowed: "move",
      },
    });
    const payload = JSON.parse(captured["text/plain"]);
    expect(payload.memberId).toBe("p-alice");
    expect(payload.fromTeamId).toBe("team-1");
  });

  it("drop from a different team calls onMoveMember", () => {
    const onMoveMember = vi.fn();
    const { container } = render(<TeamCard {...makeProps({ onMoveMember })} />);
    fireEvent.drop(container.firstChild as HTMLElement, {
      dataTransfer: { getData: () => JSON.stringify({ memberId: "p-alice", fromTeamId: "team-other" }) },
    });
    expect(onMoveMember).toHaveBeenCalledWith("p-alice", "team-other", "team-1");
  });

  it("drop from same team is a no-op: onMoveMember not called", () => {
    const onMoveMember = vi.fn();
    const { container } = render(<TeamCard {...makeProps({ onMoveMember })} />);
    fireEvent.drop(container.firstChild as HTMLElement, {
      dataTransfer: { getData: () => JSON.stringify({ memberId: "p-alice", fromTeamId: "team-1" }) },
    });
    expect(onMoveMember).not.toHaveBeenCalled();
  });

  it("drop with malformed JSON does not throw and does not call onMoveMember", () => {
    const onMoveMember = vi.fn();
    const { container } = render(<TeamCard {...makeProps({ onMoveMember })} />);
    expect(() =>
      fireEvent.drop(container.firstChild as HTMLElement, {
        dataTransfer: { getData: () => "{{invalid" },
      })
    ).not.toThrow();
    expect(onMoveMember).not.toHaveBeenCalled();
  });

  it("offers a keyboard and touch friendly move control", async () => {
    const onMoveMember = vi.fn();
    render(
      <TeamCard
        {...makeProps({
          onMoveMember,
          availableTeams: [
            { id: "team-1", name: "Team Alpha" },
            { id: "team-2", name: "Team Beta" },
          ],
        })}
      />,
    );
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Move Alice to another team" }), "team-2");
    expect(onMoveMember).toHaveBeenCalledWith("p-alice", "team-1", "team-2");
  });
});
