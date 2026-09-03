import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QualityBanner } from "./QualityBanner.tsx";
import type { ScrambleQuality } from "../scenarios/team-balancing/types.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ratioCriterion = { key: "gender", label: "Gender", mode: "ratio" as const, score: 0.9, limited: false };
const diversityCriterion = { key: "dept", label: "Dept", mode: "diversity" as const, score: 0.6, limited: false };

function makeQuality(overrides: Partial<ScrambleQuality> = {}): ScrambleQuality {
  return { criteria: [ratioCriterion], overall: 0.9, ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("QualityBanner", () => {
  // ── Null rendering ────────────────────────────────────────────────────────

  it("renders nothing when criteria is empty", () => {
    const { container } = render(<QualityBanner quality={{ criteria: [], overall: 1 }} />);
    expect(container.firstChild).toBeNull();
  });

  // ── Overall score ─────────────────────────────────────────────────────────

  it("renders the overall score as a rounded percentage", () => {
    render(<QualityBanner quality={makeQuality({ overall: 0.8 })} />);
    // Overall badge + any criterion that also rounds to 80%
    const pcts = screen.getAllByText("80%");
    expect(pcts.length).toBeGreaterThan(0);
  });

  it("renders 0% when overall score is 0", () => {
    render(<QualityBanner quality={makeQuality({ overall: 0, criteria: [{ ...ratioCriterion, score: 0 }] })} />);
    const zeros = screen.getAllByText("0%");
    expect(zeros.length).toBeGreaterThan(0);
  });

  // ── Criterion rows ────────────────────────────────────────────────────────

  it("renders criterion labels", () => {
    render(<QualityBanner quality={makeQuality({ criteria: [ratioCriterion, diversityCriterion] })} />);
    expect(screen.getByTitle("Gender")).toBeInTheDocument();
    expect(screen.getByTitle("Dept")).toBeInTheDocument();
  });

  it("renders per-criterion score percentage", () => {
    render(<QualityBanner quality={makeQuality({ criteria: [{ ...ratioCriterion, score: 0.75 }] })} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders a progress bar per criterion with accessible label", () => {
    render(<QualityBanner quality={makeQuality({ criteria: [{ ...ratioCriterion, score: 0.9 }] })} />);
    const bar = screen.getByRole("progressbar", { name: /gender balance/i });
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute("max", "1");
  });

  it("renders one progress bar per criterion", () => {
    render(<QualityBanner quality={makeQuality({ criteria: [ratioCriterion, diversityCriterion], overall: 0.75 })} />);
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
  });

  // ── Limited ⚠️ indicator ──────────────────────────────────────────────────

  it("shows ⚠️ indicator when a criterion is limited", () => {
    render(<QualityBanner quality={makeQuality({ criteria: [{ ...ratioCriterion, limited: true }] })} />);
    expect(screen.getByLabelText("Balance limited by data constraints")).toBeInTheDocument();
  });

  it("does NOT show ⚠️ indicator when criterion is not limited", () => {
    render(<QualityBanner quality={makeQuality()} />);
    expect(screen.queryByLabelText("Balance limited by data constraints")).toBeNull();
  });

  it("shows ratio footer note when a ratio criterion is limited", () => {
    render(<QualityBanner quality={makeQuality({ criteria: [{ ...ratioCriterion, limited: true }] })} />);
    expect(screen.getByText(/perfect ratio balance is not achievable/i)).toBeInTheDocument();
  });

  it("does NOT show ratio footer when no criterion is limited", () => {
    render(<QualityBanner quality={makeQuality()} />);
    expect(screen.queryByText(/perfect ratio balance is not achievable/i)).toBeNull();
  });

  it("shows diversity footer note when a diversity criterion is limited", () => {
    render(<QualityBanner quality={makeQuality({ criteria: [{ ...diversityCriterion, limited: true }] })} />);
    expect(screen.getByText(/more distinct values than people per team/i)).toBeInTheDocument();
  });

  it("does NOT show diversity footer when diversity criterion is not limited", () => {
    render(<QualityBanner quality={makeQuality({ criteria: [diversityCriterion] })} />);
    expect(screen.queryByText(/more distinct values than people per team/i)).toBeNull();
  });

  // ── Colour thresholds ─────────────────────────────────────────────────────

  it("score >= 0.8 applies success colour class", () => {
    const { container } = render(
      <QualityBanner quality={makeQuality({ overall: 0.85, criteria: [{ ...ratioCriterion, score: 0.85 }] })} />,
    );
    expect(container.querySelector(".text-success")).not.toBeNull();
  });

  it("score exactly 0.8 applies success colour class (inclusive boundary)", () => {
    const { container } = render(
      <QualityBanner quality={makeQuality({ overall: 0.8, criteria: [{ ...ratioCriterion, score: 0.8 }] })} />,
    );
    expect(container.querySelector(".text-success")).not.toBeNull();
  });

  it("score 0.55–0.79 applies warning colour class", () => {
    const { container } = render(
      <QualityBanner quality={makeQuality({ overall: 0.7, criteria: [{ ...ratioCriterion, score: 0.7 }] })} />,
    );
    expect(container.querySelector(".text-warning")).not.toBeNull();
  });

  it("score exactly 0.55 applies warning colour class (inclusive boundary)", () => {
    const { container } = render(
      <QualityBanner quality={makeQuality({ overall: 0.55, criteria: [{ ...ratioCriterion, score: 0.55 }] })} />,
    );
    expect(container.querySelector(".text-warning")).not.toBeNull();
  });

  it("score < 0.55 applies error colour class", () => {
    const { container } = render(
      <QualityBanner quality={makeQuality({ overall: 0.3, criteria: [{ ...ratioCriterion, score: 0.3 }] })} />,
    );
    expect(container.querySelector(".text-error")).not.toBeNull();
  });

  it("score exactly 0.54 applies error colour class (just below warning boundary)", () => {
    const { container } = render(
      <QualityBanner quality={makeQuality({ overall: 0.54, criteria: [{ ...ratioCriterion, score: 0.54 }] })} />,
    );
    expect(container.querySelector(".text-error")).not.toBeNull();
  });

  it("progress bar uses success class at score >= 0.8", () => {
    const { container } = render(
      <QualityBanner quality={makeQuality({ criteria: [{ ...ratioCriterion, score: 0.9 }] })} />,
    );
    expect(container.querySelector(".progress-success")).not.toBeNull();
  });

  it("progress bar uses warning class at score in [0.55, 0.8)", () => {
    const { container } = render(
      <QualityBanner quality={makeQuality({ criteria: [{ ...ratioCriterion, score: 0.65 }] })} />,
    );
    expect(container.querySelector(".progress-warning")).not.toBeNull();
  });

  it("progress bar uses error class at score < 0.55", () => {
    const { container } = render(
      <QualityBanner quality={makeQuality({ criteria: [{ ...ratioCriterion, score: 0.4 }] })} />,
    );
    expect(container.querySelector(".progress-error")).not.toBeNull();
  });
});
