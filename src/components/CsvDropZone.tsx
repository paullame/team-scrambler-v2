import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

interface Props {
  /** Called with the raw CSV text once a file is successfully read. */
  onLoad: (csvText: string, fileName: string) => void;
  /** Optional error message to surface (e.g. parse errors from the parent). */
  error?: string;
  /** Name of the currently loaded file, if any. */
  fileName?: string;
}

export function CsvDropZone({ onLoad, error, fileName }: Props) {
  const [dragging, setDragging] = useState(false);
  const [readError, setReadError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = error ?? readError;

  function readFile(file: File) {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setReadError("Only .csv files are supported.");
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

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
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
    "flex flex-col items-center gap-2 p-8 border-2 border-dashed rounded-box cursor-pointer transition-colors outline-none select-none bg-base-100 border-base-300";
  const zoneOver = "border-primary bg-primary/5";

  return (
    <div
      className={`${zoneBase} ${dragging ? zoneOver : "hover:border-base-content/40 focus-visible:border-base-content/40"}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload a CSV file"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="flex items-center gap-3 text-sm opacity-70">
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
      </div>

      {displayError && (
        <div className="alert alert-error py-2 px-4 text-sm" role="alert">
          {displayError}
        </div>
      )}
    </div>
  );
}
