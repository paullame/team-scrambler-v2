import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CsvDropZone } from "./CsvDropZone.tsx";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function csvFile(name = "data.csv", type = "text/csv", content = "name\nAlice"): File {
  return new File([content], name, { type });
}

function nonCsvFile(): File {
  return new File(["data"], "report.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/** Replace the global FileReader with a controllable mock. */
function mockFileReader(mode: "success" | "error", content = "csv,content") {
  vi.stubGlobal(
    "FileReader",
    class MockFileReader {
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
      onerror: ((e: ProgressEvent<FileReader>) => void) | null = null;
      readAsText = vi.fn(() => {
        setTimeout(() => {
          if (mode === "success") {
            this.onload?.({ target: { result: content } } as unknown as ProgressEvent<FileReader>);
          } else {
            this.onerror?.({} as ProgressEvent<FileReader>);
          }
        }, 0);
      });
    },
  );
}

// ---------------------------------------------------------------------------
// Tests – full layout
// ---------------------------------------------------------------------------

describe("CsvDropZone (full layout)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("renders the upload button", () => {
    render(<CsvDropZone onLoad={vi.fn()} />);
    expect(screen.getByRole("button", { name: /upload a csv file/i })).toBeInTheDocument();
  });

  it("renders the default browse prompt when no file is loaded", () => {
    render(<CsvDropZone onLoad={vi.fn()} />);
    expect(screen.getByText(/drop a csv file here/i)).toBeInTheDocument();
  });

  it("shows the loaded fileName when provided", () => {
    render(<CsvDropZone onLoad={vi.fn()} fileName="employees.csv" />);
    expect(screen.getByText("employees.csv")).toBeInTheDocument();
  });

  it("shows the external error prop as an alert", () => {
    render(<CsvDropZone onLoad={vi.fn()} error="Parse failed" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Parse failed");
  });

  it("calls onLoad with csv text and filename after valid file is selected", async () => {
    mockFileReader("success", "name\nAlice");
    const onLoad = vi.fn();
    render(<CsvDropZone onLoad={onLoad} />);
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [csvFile("my.csv")] },
    });
    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("name\nAlice", "my.csv"));
  });

  it("shows an error and does NOT call onLoad for a non-CSV file", () => {
    const onLoad = vi.fn();
    render(<CsvDropZone onLoad={onLoad} />);
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [nonCsvFile()] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/only .csv files/i);
    expect(onLoad).not.toHaveBeenCalled();
  });

  it("shows a read-error alert when FileReader fails", async () => {
    mockFileReader("error");
    render(<CsvDropZone onLoad={vi.fn()} />);
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [csvFile()] },
    });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/could not read the file/i));
  });

  it("external error takes precedence over internal readError", () => {
    // Even if we set readError internally, the `error` prop overrides the display.
    render(<CsvDropZone onLoad={vi.fn()} error="External error" />);
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [nonCsvFile()] },
    });
    // The displayError should show the external error, not the internal one,
    // because external `error` prop shadows `readError` (because it's `error ?? readError`).
    // After selecting a non-CSV, readError is set, but `error` prop exists → it should show external.
    // Wait — actually `displayError = error ?? readError`, so if `error` prop is defined it always wins.
    expect(screen.getByRole("alert")).toHaveTextContent("External error");
  });

  it("a .csv file validated by name (not type) is accepted", async () => {
    mockFileReader("success", "name\nBob");
    const onLoad = vi.fn();
    render(<CsvDropZone onLoad={onLoad} />);
    // file.name ends with .csv but type is empty — should still be accepted
    const file = new File(["name\nBob"], "upload.csv", { type: "" });
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [file] },
    });
    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("name\nBob", "upload.csv"));
  });
});

// ---------------------------------------------------------------------------
// Tests – compact layout
// ---------------------------------------------------------------------------

describe("CsvDropZone (compact layout)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("renders the upload button in compact mode", () => {
    render(<CsvDropZone onLoad={vi.fn()} compact />);
    expect(screen.getByRole("button", { name: /upload a csv file/i })).toBeInTheDocument();
  });

  it("compact: shows the loaded fileName", () => {
    render(<CsvDropZone onLoad={vi.fn()} compact fileName="team.csv" />);
    expect(screen.getByText("team.csv")).toBeInTheDocument();
  });

  it("compact: shows the external error prop", () => {
    render(<CsvDropZone onLoad={vi.fn()} compact error="Bad file" />);
    expect(screen.getByText("Bad file")).toBeInTheDocument();
  });

  it("compact: shows the default prompt when no file is loaded", () => {
    render(<CsvDropZone onLoad={vi.fn()} compact />);
    expect(screen.getByText(/drop a csv here/i)).toBeInTheDocument();
  });

  it("compact: calls onLoad after a valid file is selected", async () => {
    mockFileReader("success", "name\nAlice");
    const onLoad = vi.fn();
    render(<CsvDropZone onLoad={onLoad} compact />);
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [csvFile("compact.csv")] },
    });
    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("name\nAlice", "compact.csv"));
  });

  it("compact: shows an error for a non-CSV file", () => {
    render(<CsvDropZone onLoad={vi.fn()} compact />);
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [nonCsvFile()] },
    });
    expect(screen.getByText(/only .csv files/i)).toBeInTheDocument();
  });
});
