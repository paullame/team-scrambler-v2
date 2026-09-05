import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App.tsx";

describe("App workflow", () => {
  it("supports arrow-key navigation between tabs", async () => {
    render(<App />);
    const participants = screen.getByRole("tab", { name: /Participants/i });
    participants.focus();

    await userEvent.keyboard("{ArrowRight}");
    const results = screen.getByRole("tab", { name: /^Results$/i });
    expect(results).toHaveFocus();
    expect(screen.getByText(/No results yet/i)).toBeInTheDocument();
  });

  it("generates results and invalidates them after a participant edit", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Scramble!" }));
    expect(screen.getByRole("heading", { name: "Scramble Results" })).toHaveFocus();
    expect(screen.getByText(/teams generated/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /Participants/i }));
    await userEvent.click(screen.getAllByRole("button", { name: "Edit row" })[0]);
    const name = screen.getByRole("textbox", { name: /Name for/i });
    await userEvent.clear(name);
    await userEvent.type(name, "Updated Participant");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await userEvent.click(screen.getByRole("tab", { name: /^Results$/i }));
    expect(screen.getByText(/No results yet/i)).toBeInTheDocument();
  });
});
