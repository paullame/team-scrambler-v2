import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

interface Props {
  /** Called with the raw CSV text once a file is successfully read. */
  onLoad: (csvText: string, fileName: string) => void;
  /** Optional error message to surface (e.g. parse errors from the parent). */
  error?: string;
  /** Name of the currently loaded file, if any. */
  fileName?: string;
  /** Render as a compact button row instead of the full drop-zone card. */
  compact?: boolean;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function CsvDropZone({ onLoad, error, fileName, compact }: Props) {
  const [dragging, setDragging] = useState(false);
  const [readError, setReadError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = error ?? readError;

  function readFile(file: File) {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setReadError("Only .csv files are supported.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setReadError("This file is larger than 5 MB. Reduce it to 5 MB or fewer and try again.");
      return;
    }
    setReadError(undefined);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onLoad(text, file.name);
    };
    reader.onerror = () => setReadError("Could not read the file.");
    reader.readAsText(file, "utf-8");
  }

  function handleDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    // Reset so the same file can be re-uploaded if needed.
    e.target.value = "";
  }

  const zoneBase =
    "w-full flex flex-col items-center gap-2 p-8 border-2 border-dashed rounded-box cursor-pointer transition-colors select-none bg-base-100 border-base-300 focus-visible:outline-2 focus-visible:outline-offset-2";
  const zoneOver = "border-primary bg-primary/5";

  if (compact) {
    const miniBase =
      "w-full flex flex-col items-center gap-2 py-5 px-4 border-2 border-dashed rounded-box cursor-pointer transition-colors select-none border-base-300 focus-visible:outline-2 focus-visible:outline-offset-2";
    const miniOver = "border-primary bg-primary/5";
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          name="csv-file"
          aria-label="Choose a CSV file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleInputChange}
          tabIndex={-1}
        />
        <button
          type="button"
          className={`${miniBase} ${dragging ? miniOver : "hover:border-base-content/40 focus-visible:border-base-content/40"}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          aria-label="Upload a CSV file"
          aria-describedby={displayError ? "csv-upload-error" : undefined}
        >
          <UploadCloud className="size-6 shrink-0 opacity-60" aria-hidden />
          <span className="text-sm text-center leading-snug">
            {fileName
              ? (
                <>
                  <strong className="opacity-100">{fileName}</strong>
                  <br />
                  <span className="opacity-50 text-xs">drop or click to replace</span>
                </>
              )
              : (
                <>
                  <strong>Drop a CSV here</strong>
                  <br />
                  <span className="opacity-50 text-xs">or click to browse</span>
                </>
              )}
          </span>
        </button>
        {displayError && <p id="csv-upload-error" className="text-xs text-error mt-1" role="alert" aria-live="polite">{displayError}</p>}
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name="csv-file"
        aria-label="Choose a CSV file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleInputChange}
        tabIndex={-1}
      />
      <button
        type="button"
        className={`${zoneBase} ${dragging ? zoneOver : "hover:border-base-content/40 focus-visible:border-base-content/40"}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-label="Upload a CSV file"
        aria-describedby={displayError ? "csv-upload-error" : undefined}
      >
        <span className="flex items-center gap-3 text-sm opacity-70">
          <UploadCloud className="size-6 shrink-0" aria-hidden="true" />
          {fileName
            ? (
              <span>
                <strong className="opacity-100">{fileName}</strong>&nbsp;loaded — drop or click to replace
              </span>
            )
            : (
              <span>
                <strong>Drop a CSV file here</strong> or click to browse
              </span>
            )}
        </span>
      </button>
      {displayError && (
        <div id="csv-upload-error" className="alert alert-error py-2 px-4 text-sm mt-2" role="alert" aria-live="polite">
          {displayError}
        </div>
      )}
    </div>
  );
}
