# Team Scrambler - Architecture Documentation (C4 Model)

This document describes the architecture of Team Scrambler using the **C4 Model**.

---

## C1: System Context Diagram

```mermaid
flowchart TB
    subgraph Users["Users"]
        U1["Team Organizer\n(Primary)"]
        U2["Team Member\n(Secondary)"]
    end

    subgraph System["Team Scrambler"]
        S[("Web Application\n(SPA)")]
    end

    subgraph External["External Systems"]
        B["Web Browser\nChrome/Firefox/Safari"]
        CSV[("CSV Files")]
        PNG[("PNG Export")]
    end

    U1 -->|uploads| CSV
    U1 -->|uses| B
    U2 -->|views results| B
    B -->|renders| S
    S -->|imports| CSV
    S -->|exports| PNG

    style Users fill:#f9f,stroke:#333
    style System fill:#bbf,stroke:#333
    style External fill:#9f9,stroke:#333
```

**Stakeholders:**

- **Primary**: Team organizers who upload CSV files and configure team distribution
- **Secondary**: Team members who view the results

**Scope:** Single-page web application running entirely in the browser. No server-side processing.

---

## C2: Container Diagram

```mermaid
flowchart TB
    subgraph Containers["Containers"]
        direction TB
        
        subgraph SPA["Single-Page Application"]
            direction TB
            UI["React UI\nTypeScript + Tailwind"]
            Core["Core Logic\nTypeScript"]
            State["React State\nuseState/useReducer"]
        end
        
        Server["Deno Server\nStatic File Server"]
        
        Storage[("Browser Storage\nlocalStorage")]
    end

    subgraph External["External"]
        CSV[("CSV Files")]
        PNG[("PNG Images")]
        Browser["Web Browser"]
    end

    Browser -->|serves| Server
    Server -->|static files| SPA
    SPA -->|reads| CSV
    SPA -->|writes| PNG
    SPA -->|persists preferences| Storage
    
    UI -->|uses| State
    UI -->|calls| Core
    
    style Containers fill:#bbf,stroke:#333
    style External fill:#9f9,stroke:#333
```

| Container           | Technology                                  | Responsibility                                         | Persistence      |
| ------------------- | ------------------------------------------- | ------------------------------------------------------ | ---------------- |
| **SPA (Client)**    | React 19, TypeScript, Tailwind CSS, daisyui | User interface, CSV parsing, team scrambling algorithm | None (in-memory) |
| **Deno Server**     | Deno 2.x, @std/http                         | Serves static files from `/dist`                       | None             |
| **Browser Storage** | localStorage                                | Theme preference                                       | Persistent       |

---

## C3: Component Diagram (SPA)

```mermaid
flowchart TB
    subgraph UI["UI Components"]
        direction TB
        App["App.tsx\nMain Container"]
        
        Sidebar["Sidebar\nCsvDropZone + ScramblerSettings"]
        Main["Main Area\nPeopleTable + TeamCards"]
        
        CsvDropZone["CsvDropZone\nCSV Import"]
        PeopleTable["PeopleTable\nIndividuals CRUD"]
        ScramblerSettings["ScramblerSettings\nConfiguration"]
        TeamCards["TeamCards\nResults Display"]
        QualityBanner["QualityBanner\nBalance Metrics"]
    end
    
    subgraph Core["Core Logic"]
        direction TB
        CsvParser["csvParser.ts\nCSV → Individuals"]
        Scramble["scramble.ts\nTeam Assignment"]
        Quality["quality.ts\nBalance Scoring"]
    end
    
    subgraph Types["Data Types"]
        T["types.ts\nIndividual, Team, Settings"]
    end

    App --> Sidebar
    App --> Main
    App --> QualityBanner
    
    Sidebar --> CsvDropZone
    Sidebar --> ScramblerSettings
    
    Main --> PeopleTable
    Main --> TeamCards
    
    CsvDropZone --> CsvParser
    PeopleTable --> T
    ScramblerSettings --> T
    
    Scramble --> T
    Scramble --> Quality
    Quality --> T
    
    TeamCards --> T
    QualityBanner --> Quality

    style UI fill:#bbf,stroke:#333
    style Core fill:#bfb,stroke:#333
    style Types fill:#ffb,stroke:#333
```

### Component Responsibilities

| Component             | File                               | Responsibility                                      |
| --------------------- | ---------------------------------- | --------------------------------------------------- |
| **App**               | `App.tsx`                          | Root component, state management                    |
| **CsvDropZone**       | `components/CsvDropZone.tsx`       | Drag-and-drop CSV upload, parse errors              |
| **PeopleTable**       | `components/PeopleTable.tsx`       | Display, edit, add, delete individuals              |
| **ScramblerSettings** | `components/ScramblerSettings.tsx` | Team size/count config, balance criteria selection  |
| **TeamCards**         | `components/TeamCard.tsx`          | Visual team display, drag-and-drop reassign         |
| **QualityBanner**     | `components/QualityBanner.tsx`     | Balance quality metrics and scoring                 |
| **csvParser**         | `core/csvParser.ts`                | Parse CSV → Individual objects, auto-detect columns |
| **scramble**          | `core/scramble.ts`                 | Greedy team assignment algorithm                    |
| **quality**           | `core/quality.ts`                  | Calculate balance quality scores                    |
| **types**             | `types.ts`                         | TypeScript interfaces and types                     |

---

## C4: Code Diagram (Not Applicable)

The C4 model's Code level (class diagrams) is omitted for this project as the component structure is straightforward and the code is well-organized by feature.
The TypeScript type system provides sufficient structural documentation.

---

## Deployment View

```mermaid
flowchart TB
    subgraph Dev["Development"]
        L["Local Machine"]
        Vite["Vite Dev Server\n:5173"]
    end
    
    subgraph Prod["Production"]
        Deno["Deno Runtime\n:8000"]
        Dist[("/dist\nStatic Files")]
    end
    
    subgraph Deploy["Deployment Options"]
        GH["GitHub Pages\nStatic Hosting"]
        Netlify["Netlify\nStatic Hosting"]
        DenoDeploy["Deno Deploy\nServerless"]
    end

    L -->|deno run dev| Vite
    Vite -->|Hot Reload| L
    
    Deno -->|serveDir| Dist
    
    Dist -->|deploy| GH
    Dist -->|deploy| Netlify
    Dist -->|deploy| DenoDeploy

    style Dev fill:#9f9,stroke:#333
    style Prod fill:#bbf,stroke:#333
    style Deploy fill:#ff9,stroke:#333
```

### Deployment Options

| Environment            | Command          | Hosting                            |
| ---------------------- | ---------------- | ---------------------------------- |
| **Development**        | `deno run dev`   | Local Vite server on port 5173     |
| **Production Build**   | `deno run build` | Generates static files in `/dist`  |
| **Local Preview**      | `deno run serve` | Deno server on port 8000           |
| **Production Hosting** | Any static host  | GitHub Pages, Netlify, Deno Deploy |

---

## Data Flow

```mermaid
flowchart LR
    CSV -->|upload| CsvDropZone
    CsvDropZone -->|parse| CsvParser
    CsvParser -->|Individual[]| PeopleTable
    PeopleTable -->|display| UI
    
    ScramblerSettings -->|config| Scramble
    PeopleTable -->|data| Scramble
    Scramble -->|Team[]| TeamCards
    Scramble -->|metrics| Quality
    Quality -->|scores| QualityBanner
    
    TeamCards -->|export| PNG
    TeamCards -->|export| CSV
```

---

## Technology Stack

| Layer          | Technology    | Version  | Purpose                       |
| -------------- | ------------- | -------- | ----------------------------- |
| **Runtime**    | Deno          | 2.x      | JavaScript/TypeScript runtime |
| **Framework**  | React         | 19.2.x   | UI component library          |
| **Language**   | TypeScript    | 5.x      | Type-safe JavaScript          |
| **Styling**    | Tailwind CSS  | 4.3.x    | Utility-first CSS             |
| **UI Library** | daisyUI       | 5.5.x    | Tailwind component library    |
| **Build Tool** | Vite          | 8.0.x    | Frontend tooling              |
| **Testing**    | Vitest        | 4.1.x    | Component testing             |
| **Testing**    | Deno Test     | built-in | Core logic testing            |
| **Icons**      | Lucide React  | 1.18.x   | Icon library                  |
| **Export**     | html-to-image | 1.11.x   | PNG export                    |

---

## Architecture Characteristics

| Characteristic         | Description                             |
| ---------------------- | --------------------------------------- |
| **Architecture Style** | Single-Page Application (SPA)           |
| **Deployment Model**   | Static site (can run anywhere)          |
| **State Management**   | React local state (useState/useReducer) |
| **Data Storage**       | In-memory (no server persistence)       |
| **Routing**            | react-router-dom (client-side)          |
| **Offline Support**    | Yes (once loaded)                       |
| **Responsiveness**     | Yes (mobile-first design)               |
| **Theming**            | Light/Dark mode via Tailwind            |

---

## Related Documents

- [Algorithm Specification](ALGORITHM.md) - Technical details of the scrambling algorithm
- [ADRs](./adr/) - Architecture Decision Records
- [README](../README.md) - Project overview and usage
