import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAppState } from "./useAppState.ts";

describe("useAppState result lifecycle", () => {
  it("stores a reproducible result snapshot", () => {
    const { result } = renderHook(() => useAppState());
    act(() => result.current.handleScramble(123));
    expect(result.current.run?.seed).toBe(123);
    expect(result.current.run?.kind).toBe("team-balancing");
    expect(result.current.teams.length).toBeGreaterThan(0);
  });

  it("invalidates results after participant changes", () => {
    const { result } = renderHook(() => useAppState());
    act(() => result.current.handleScramble(123));
    const remaining = result.current.people.slice(1);
    act(() => result.current.setPeople(remaining));
    expect(result.current.teams).toEqual([]);
    expect(result.current.quality).toBeNull();
    expect(result.current.run).toBeNull();
  });

  it("invalidates results after configuration changes", () => {
    const { result } = renderHook(() => useAppState());
    act(() => result.current.handleScramble(123));
    act(() => result.current.setConfig({ ...result.current.config, teamCount: 3 }));
    expect(result.current.run).toBeNull();
  });

  it("recomputes quality after moving a participant", () => {
    const { result } = renderHook(() => useAppState());
    act(() => result.current.handleScramble(123));
    const [source, destination] = result.current.teams;
    act(() => result.current.handleMoveMember(source.members[0].id, source.id, destination.id));
    expect(result.current.quality).not.toBeNull();
    expect(result.current.teams.every((team) => team.metrics.length === result.current.config.balanceCriteria.length)).toBe(true);
  });
});
