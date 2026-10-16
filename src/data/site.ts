/** Structured summary of nathanespejo.com. One source for every fact the pages render. */

/** A figure the pages render. Content files reference these by key, never by value. */
export type ProjectStat = { key: string; label: string; value: string };

/** One row of the AWARE on-device model table. */
export type ModelRow = { name: string; job: string; runtime: string };

export type ProjectGroup =
  | "featured"
  | "also-building"
  | "ai-ml"
  | "team"
  | "hardware"
  | "web-mobile"
  | "games";

/**
 * Home-page prominence. Distinct from `group`, which is how /projects files them.
 * This was previously implicit as `p.id !== "campus"` in HomeView, which meant the
 * corpus projection had no way to say that Campus is the flagship — and so the
 * chat could not retrieve Campus for "what is his flagship project?".
 */
export type ProjectRank = "flagship" | "featured";

export type Project = {
  id: string;
  name: string;
  group: ProjectGroup;
  order: number;
  dates: string;
  displayRole: string;
  displayStatus?: string;
  event?: string;
  covers: string;
  /** Content doc describing this project. Absent for rows covered by projects/other.md. */
  file?: string;
  links: { label: string; href: string }[];
  stats: ProjectStat[];
  stack: string[];
  models?: ModelRow[];
  /** Shown on /resume. Mirrors Experience.onResume. */
  onResume?: boolean;
  /** Home-page prominence, carried into the chat corpus so the flagship is retrievable. */
  rank?: ProjectRank;
};

export type Experience = {
  org: string;
  role: string;
  location: string;
  terms: { start: string; end: string | null }[];
  dates: string;
  onResume: boolean;
  file: string;
  stats?: ProjectStat[];
};

export type SiteContent = {
  identity: { name: string; headline: string; positioning?: string; seeking: string; location: string; year: string;
    education: { school: string; degree: string; honors: string; start: string; end: string; location: string } };
  contact: { email: string; links: { label: string; href: string }[] };
  experience: Experience[];
  projects: Project[];
  hackathons: { entered: number; awards: number };
  awards: { event: string; year: string; project: string; prize: string; role: string }[];
  skills: { group: string; items: string[] }[];
  alsoUsed: string[];
};

export const site: SiteContent = {
  identity: {
    name: "Nathan Espejo",
    headline: "Applied AI engineer (3rd-year Software Engineering, Western) focused on cost-efficient models, with local and self-hosted options",
    seeking: "Summer 2027 applied AI engineering internship",
    location: "Brampton and London, ON",
    year: "3rd year (2026-27)",
    education: { school: "Western University", degree: "Bachelor of Engineering Science in Software Engineering", honors: "Dean's Honour List (2024, 2025)", start: "2024-08", end: "2028-05", location: "London, ON" },
  },
  contact: {
    email: "nate.e.espejo@gmail.com",
    links: [
      { label: "Portfolio", href: "https://nathanespejo.com" },
      { label: "GitHub", href: "https://github.com/HasNate618" },
      { label: "LinkedIn", href: "https://linkedin.com/in/nathan-espejo" },
      { label: "Devpost", href: "https://devpost.com/nate-e-espejo" },
      { label: "Resume PDF", href: "https://nathanespejo.com/Nathan_Espejo_Resume.pdf" },
    ],
  },
  experience: [
    { org: "TeraGo", role: "Software Engineering Intern", location: "Markham, ON", terms: [{ start: "2026-05", end: "2026-08" }], dates: "May 2026 to Aug 2026", onResume: true, file: "/knowledgebase/experience/terago.md" },
    { org: "3D Western", role: "VP of Data/ML (promoted from Software Developer)", location: "London, ON", terms: [{ start: "2025-09", end: "2026-08" }], dates: "Sep 2025 to Aug 2026", onResume: true, file: "/knowledgebase/experience/3d-western.md",
      stats: [{ key: "dataset", label: "labelled frames", value: "4,127" }] },
    { org: "WEMars", role: "Software team member", location: "London, ON", terms: [{ start: "2024-09", end: "2025-04" }, { start: "2026-09", end: null }], dates: "Sep 2024 to Apr 2025, rejoined Sep 2026", onResume: false, file: "/knowledgebase/experience/wemars.md" },
    { org: "WEFirst Robotics", role: "Software Developer", location: "London, ON", terms: [{ start: "2026-01", end: "2026-04" }], dates: "Jan 2026 to Apr 2026", onResume: false, file: "/knowledgebase/experience/wefirst.md" },
    { org: "Microcomputer Consulting Inc.", role: "IT Intern (part-time)", location: "Mississauga, ON", terms: [{ start: "2025-05", end: "2025-08" }], dates: "May 2025 to Aug 2025", onResume: false, file: "/knowledgebase/experience/mcc.md" },
  ],
  projects: [
    // ── featured ──────────────────────────────────────────────────────────
    {
      id: "campus", name: "Campus", group: "featured", order: 1,
      dates: "Aug 2026 to present", displayRole: "solo",
      covers: "Self-hosted study assistant for my courses. Hybrid retrieval over 4,687 chunks and a 20-tool agent that logs every write.",
      file: "/knowledgebase/projects/campus.md",
      onResume: true,
      rank: "flagship",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/Campus" }],
      stats: [
        { key: "chunks", label: "chunks", value: "4,687" },
        { key: "files", label: "course files", value: "215" },
        { key: "tests", label: "tests", value: "308" },
        { key: "courses", label: "courses", value: "6" },
        { key: "tools", label: "agent tools", value: "20" },
      ],
      stack: ["Python", "FastAPI", "SQLite", "Playwright", "embeddings", "cross-encoder reranking", "React", "TypeScript", "Vite (PWA)", "Docker", "NixOS", "GitHub Actions"],
    },
    {
      id: "homelab", name: "Homelab and Hermes Agent", group: "featured", order: 2,
      dates: "May 2026 to present", displayRole: "solo",
      covers: "Two NixOS machines, 27 hardened containers, and AI agents that change the config only after I approve.",
      file: "/knowledgebase/projects/homelab.md",
      onResume: true,
      rank: "featured",
      links: [{ label: "GitHub (public NixOS config)", href: "https://github.com/HasNate618/nixos-config-public" }, { label: "GitHub (llama.cpp setup)", href: "https://github.com/HasNate618/local-llama-setup" }],
      stats: [
        { key: "sessions", label: "agent sessions", value: "472" },
        { key: "toolCalls", label: "tool calls", value: "58,000" },
        { key: "skills", label: "agent skills", value: "191" },
        { key: "containers", label: "containers", value: "27" },
      ],
      stack: ["NixOS", "Nix flakes", "Hermes Agent", "Docker", "Tailscale", "Caddy", "sops-nix", "Open WebUI", "Bifrost", "llama.cpp", "Whisper", "MCP", "Python", "Playwright", "Uptime Kuma", "Netdata", "ntfy"],
    },
    {
      id: "aware", name: "AWARE", group: "featured", order: 3,
      dates: "Jul 2026", displayRole: "solo", event: "Hack the 6ix 2026",
      covers: "My first solo hack. Vision, audio and a small LLM running offline on one $80 Arduino UNO Q.",
      file: "/knowledgebase/projects/aware.md",
      onResume: true,
      rank: "featured",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/AWARE" }, { label: "Devpost", href: "https://devpost.com/software/a-w-a-r-e-autonomous-witness-and-response-engine" }],
      stats: [
        { key: "boardCost", label: "board cost", value: "$80" },
        { key: "models", label: "models on device", value: "5" },
      ],
      stack: ["Python 3.12", "FastAPI", "asyncio", "WebSockets", "YOLOv8n", "YAMNet", "Whisper-tiny", "Piper TTS", "MiniCPM5-1B (GGUF)", "ONNX Runtime QNN", "OpenCL", "Arduino UNO Q", "msgpack-rpc", "SQLite", "Docker", "systemd", "ruff", "mypy", "pytest"],
      models: [
        { name: "YOLOv8n", job: "object detection", runtime: "ONNX on the Adreno 702 GPU, via QNN" },
        { name: "YAMNet", job: "sound events, 521 classes", runtime: "ONNX" },
        { name: "Whisper-tiny", job: "speech to text", runtime: "on-device" },
        { name: "Piper TTS", job: "text to speech", runtime: "on-device" },
        { name: "MiniCPM5-1B (GGUF Q4_K_M)", job: "commands to rules, memory", runtime: "on-device" },
      ],
    },
    {
      id: "terago", name: "TeraGo internship", group: "featured", order: 4,
      dates: "May 2026 to Aug 2026", displayRole: "intern",
      covers: "Local LLM outage-ticket prototype, an RF channel tool, a Copilot Studio agent, and a self-hosted LLM proposal.",
      links: [],
      stats: [{ key: "testCases", label: "test cases", value: "760" }],
      stack: ["Python", "Ollama", "Microsoft Graph", "Jira", "Copilot Studio", "SharePoint", "MapInfo data"],
      rank: "featured",
    },

    // ── also building ─────────────────────────────────────────────────────
    {
      id: "agntos", name: "AgntOS", group: "also-building", order: 5,
      dates: "2026", displayRole: "solo", displayStatus: "work in progress",
      covers: "A concept for a NixOS system run by an LLM agent. Every change is proposed, approved, applied with nixos-rebuild, logged, and reversible. Mostly Rust.",
      file: "/knowledgebase/projects/agntos.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/AgntOS" }],
      stats: [],
      stack: ["Rust", "NixOS"],
    },
    {
      id: "glyph", name: "Glyph", group: "also-building", order: 6,
      dates: "2026", displayRole: "solo",
      covers: "Leader-key command overlay for Windows, so you don't have to memorize shortcuts. Per-app bindings, YAML config, ships on WinGet.",
      file: "/knowledgebase/projects/glyph.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/Glyph" }],
      stats: [],
      stack: ["C#", "WPF", "YAML", "WinGet"],
    },
    {
      id: "agenticarmy", name: "AgenticArmy", group: "also-building", order: 7,
      dates: "Mar 2026", displayRole: "repo on my GitHub", event: "GenAI Genesis 2026",
      covers: "VS Code extension and FastAPI backend for running several coding agents in parallel, with a human approving the plan.",
      file: "/knowledgebase/projects/agenticarmy.md",
      links: [{ label: "Devpost", href: "https://devpost.com/software/agenticarmy" }, { label: "GitHub", href: "https://github.com/HasNate618/genai-genesis-2026" }],
      stats: [],
      stack: ["TypeScript", "VS Code API", "FastAPI", "Python"],
    },

    // ── ai and ml ─────────────────────────────────────────────────────────
    {
      id: "gaming-mental-health-analyzer", name: "Gaming and Mental Health Analyzer", group: "ai-ml", order: 8,
      dates: "2026", displayRole: "solo", event: "Dataquest",
      covers: "scikit-learn models that predict five wellbeing risks from gaming habits, trained on a 1,000-row Kaggle dataset.",
      file: "/knowledgebase/projects/gaming-mental-health-analyzer.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/Gaming-and-Mental-Health-Analyzer" }],
      stats: [],
      stack: ["Python", "scikit-learn", "pandas"],
    },
    {
      id: "whack-a-ml", name: "Whack-A-ML", group: "ai-ml", order: 9,
      dates: "2026", displayRole: "solo",
      covers: "A PPO agent learns to hit targets with a simulated arm in Unity, with curriculum learning.",
      file: "/knowledgebase/projects/whack-a-ml.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/Whack-A-ML" }],
      stats: [],
      stack: ["Unity", "ML-Agents", "PPO", "C#"],
    },
    {
      id: "animarker", name: "Animarker", group: "ai-ml", order: 10,
      dates: "May 2023", displayRole: "solo", event: "Washington Justice Encode",
      covers: "Android wildlife tracker. A TensorFlow CNN identifies the species and the sighting goes on a map.",
      file: "/knowledgebase/projects/animarker.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/Animarker" }, { label: "Devpost", href: "https://devpost.com/software/animarker" }],
      stats: [],
      stack: ["Kotlin", "Android", "TensorFlow"],
    },

    // ── hackathon team projects ───────────────────────────────────────────
    {
      id: "auralis", name: "Auralis", group: "team", order: 11,
      dates: "Nov 2025", displayRole: "team project", event: "Hack Western 12",
      covers: "3D virtual doctor with emotion detection and voice.",
      file: "/knowledgebase/projects/auralis.md",
      links: [{ label: "Live", href: "https://auralis.vercel.app" }, { label: "GitHub", href: "https://github.com/rickytang666/auralis" }],
      stats: [],
      stack: ["React", "Three.js", "Cloudflare", "Python"],
    },
    {
      id: "carebridge", name: "CareBridge", group: "team", order: 12,
      dates: "Feb 2026", displayRole: "team contributor", event: "Spark 2026",
      covers: "Check-ins and risk tracking for rural patients and providers.",
      file: "/knowledgebase/projects/carebridge.md",
      links: [{ label: "GitHub", href: "https://github.com/liamma06/Spark" }],
      stats: [],
      stack: ["React", "TypeScript", "Node.js"],
    },
    {
      id: "vitalsign", name: "VitalSign", group: "team", order: 13,
      dates: "Jan 2026", displayRole: "team project", event: "DeltaHacks 2026",
      covers: "Turns ASL gestures and facial expressions into speech that carries the emotion.",
      file: "/knowledgebase/projects/vitalsign.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/VitalSign" }],
      stats: [],
      stack: ["MediaPipe", "face-api.js", "Python", "React"],
    },
    {
      id: "nowandthen", name: "NowAndThen", group: "team", order: 14,
      dates: "Jan 2026", displayRole: "team project", event: "UofTHacks 13",
      covers: "Map app for leaving geotagged posts, with AI summaries of places.",
      file: "/knowledgebase/projects/nowandthen.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/NowAndThen" }],
      stats: [],
      stack: ["React Native", "Node.js", "MongoDB"],
    },
    {
      id: "eyecandy", name: "Eyecandy", group: "team", order: 15,
      dates: "Sep 2025", displayRole: "team project", event: "Hack the North 2025",
      covers: "AR try-on of Shopify products on Snap Spectacles.",
      file: "/knowledgebase/projects/eyecandy.md",
      links: [{ label: "GitHub", href: "https://github.com/Duck-luv-pie/eyecandy" }],
      stats: [],
      stack: ["Lens Studio", "TypeScript", "Snap Spectacles"],
    },
    {
      id: "lumen", name: "Lumen", group: "team", order: 16,
      dates: "Aug 2025", displayRole: "team; I built the Unity mini-games", event: "TerraHacks 2025",
      covers: "Wellness companion that picks a mini-game from a mood check-in.",
      file: "/knowledgebase/projects/lumen.md",
      links: [{ label: "Live", href: "https://lumen-beryl.vercel.app" }, { label: "GitHub", href: "https://github.com/Dawgsrlife/lumen" }],
      stats: [],
      stack: ["Unity", "C#", "MongoDB Atlas", "Next.js"],
    },
    {
      id: "careerly", name: "Careerly", group: "team", order: 17,
      dates: "Feb 2024", displayRole: "team project", event: "NSBEHacks 2024",
      covers: "Unity virtual job fair with AI mentors.",
      file: "/knowledgebase/projects/careerly.md",
      links: [{ label: "GitHub", href: "https://github.com/she11fish/careerly" }],
      stats: [],
      stack: ["Unity", "C#", "Cohere"],
    },

    // ── hardware ──────────────────────────────────────────────────────────
    {
      id: "cyberdeck", name: "Cyberdeck", group: "hardware", order: 18,
      dates: "2026", displayRole: "solo", displayStatus: "in progress",
      covers: "Handheld Raspberry Pi 3B that boots straight into a terminal. No desktop, just the terminal.",
      file: "/knowledgebase/projects/cyberdeck.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/Cyberdeck" }],
      stats: [],
      stack: ["Raspberry Pi", "Linux", "3D printing"],
    },
    {
      id: "flexfire-x", name: "FLEXFIRE-X", group: "hardware", order: 19,
      dates: "2025", displayRole: "solo",
      covers: "Forearm launcher inspired by Cyberpunk 2077. Flex your forearm and an EMG sensor fires it. Nine 3D-printed parts.",
      file: "/knowledgebase/projects/flexfire-x.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/FLEXFIRE-X" }, { label: "Video", href: "https://youtube.com/shorts/8Y7lV0Z1Z1Y" }],
      stats: [],
      stack: ["Arduino", "EMG sensors", "3D printing", "C++"],
    },
    {
      id: "rubber-band-turret", name: "Rubber Band Turret", group: "hardware", order: 20,
      dates: "2023", displayRole: "solo",
      covers: "Bluetooth turret I control from an Android app.",
      links: [],
      stats: [],
      stack: ["Arduino", "Bluetooth", "Kotlin"],
    },

    // ── web and mobile ────────────────────────────────────────────────────
    {
      id: "portfolio-v2", name: "Portfolio v2", group: "web-mobile", order: 21,
      dates: "2026", displayRole: "solo",
      covers: "The last version of this site: a WebGL ASCII ocean with a RAG chatbot. This version is plain text on purpose.",
      file: "/knowledgebase/projects/portfolio-v2.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/portfolio-v2" }],
      stats: [],
      stack: ["Next.js", "React Three Fiber", "GLSL", "Cohere"],
    },
    {
      id: "saferoute", name: "SafeRoute", group: "web-mobile", order: 22,
      dates: "2025", displayRole: "solo",
      covers: "Android app for reporting hazards and routing around them.",
      file: "/knowledgebase/projects/saferoute.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/SafeRoute" }],
      stats: [],
      stack: ["Kotlin", "Android", "Google Maps API"],
    },
    {
      id: "uwo-mealplan-calc", name: "UWO Mealplan Calc", group: "web-mobile", order: 23,
      dates: "2024", displayRole: "solo",
      covers: "Chrome extension that tracks meal plan spending.",
      links: [{ label: "Chrome Web Store", href: "https://chromewebstore.google.com/" }],
      stats: [],
      stack: ["JavaScript", "Chrome Extensions API"],
    },

    // ── games and smaller builds ──────────────────────────────────────────
    {
      id: "wasteland", name: "Wasteland", group: "games", order: 24,
      dates: "Feb 2025", displayRole: "solo", event: "MakeUofT 2025",
      covers: "Horror game you play with a sensor glove.",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/Wasteland" }],
      stats: [], stack: ["Unity", "Arduino", "C#"],
    },
    {
      id: "vr-odm-gear-sim", name: "VR ODM Gear Sim", group: "games", order: 25,
      dates: "Sep 2023", displayRole: "solo", event: "Hack the North 2023",
      covers: "Cardboard VR sim with an Arduino glove controller.",
      links: [{ label: "Devpost", href: "https://devpost.com/software/vr-odm-gear-sim" }],
      stats: [], stack: ["Unity", "Arduino", "C#"],
    },
    {
      id: "street-cleaner", name: "Street Cleaner", group: "games", order: 26,
      dates: "May 2023", displayRole: "my repo", event: "GameHACKS 1.0",
      covers: "Mobile recycling game on Google Play.",
      links: [{ label: "Google Play", href: "https://play.google.com/store" }],
      stats: [], stack: ["Unity", "C#"],
    },
    {
      id: "object-love-interface", name: "Object-Love-Interface", group: "games", order: 27,
      dates: "Feb 2026", displayRole: "my repo", event: "CTRL+HACK+DEL 2.0",
      covers: "IoT objects with voices and personalities.",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/Object-Love-Interface" }],
      stats: [], stack: ["ESP32", "Arduino", "Python"],
    },
    {
      id: "stupid-spotify", name: "Stupid Spotify", group: "games", order: 28,
      dates: "Nov 2025", displayRole: "my repo", event: "Stupid Hackathon @ Western",
      covers: "A deliberately bad Spotify clone. Its chatbot gaslights you about your music choices.",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/Stupid-Spotify" }],
      stats: [], stack: ["Next.js", "TypeScript"],
    },
    {
      id: "motaru", name: "Mōtaru", group: "games", order: 29,
      dates: "2024", displayRole: "solo",
      covers: "Unity mobile game on Google Play.",
      links: [{ label: "Google Play", href: "https://play.google.com/store" }],
      stats: [], stack: ["Unity", "C#"],
    },
    {
      id: "zenith-tower", name: "Zenith Tower", group: "games", order: 30,
      dates: "2024", displayRole: "solo",
      covers: "Unity mobile game on Google Play.",
      links: [{ label: "Google Play", href: "https://play.google.com/store" }],
      stats: [], stack: ["Unity", "C#"],
    },
    {
      id: "tic-tac-toe-ultimate", name: "Tic Tac Toe Ultimate", group: "games", order: 31,
      dates: "2024", displayRole: "solo",
      covers: "Unity mobile game on Google Play.",
      links: [{ label: "Google Play", href: "https://play.google.com/store" }],
      stats: [], stack: ["Unity", "C#"],
    },
  ],
  hackathons: { entered: 22, awards: 8 },
  awards: [
    { event: "NSBEHacks", year: "2024", project: "Careerly", prize: "3rd overall; Cohere's Challenge 1st place", role: "Team member (repo: she11fish/careerly)" },
    { event: "Hack Western 12", year: "2025", project: "Auralis", prize: "Best AI Application Built with Cloudflare", role: "Team member (repo: rickytang666/auralis)" },
    { event: "TerraHacks", year: "2025", project: "Lumen", prize: "Best Use of MongoDB Atlas", role: "Team member, built the Unity mini-games (repo: Dawgsrlife/lumen)" },
    { event: "Hack the North", year: "2025", project: "Eyecandy", prize: "Snap Spectacles AR Runner Up", role: "Team member (repo: Duck-luv-pie/eyecandy)" },
    { event: "Spark", year: "2026", project: "CareBridge", prize: "Overall 3rd place", role: "Team contributor (repo: liamma06/Spark)" },
    { event: "GameHACKS 1.0", year: "2023", project: "Street Cleaner", prize: "Second Award", role: "Repo owner" },
    { event: "CTRL+HACK+DEL 2.0", year: "2026", project: "Object-Love-Interface", prize: "Best Useless Hack", role: "Repo owner" },
    { event: "Stupid Hackathon @ Western", year: "2025", project: "Stupid Spotify", prize: "Worst UX", role: "Repo owner" },
  ],
  skills: [
    { group: "AI and ML", items: ["LLM agents", "Tool calling", "RAG", "Embeddings and reranking", "MCP", "VLMs", "Model evaluation", "Ollama", "llama.cpp", "GGUF on-device LLMs", "YOLOv8", "ONNX", "MediaPipe", "face-api.js", "PyTorch", "Reinforcement learning (PPO)", "TensorFlow", "scikit-learn"] },
    { group: "Languages", items: ["Python", "TypeScript", "Rust", "C#", "Kotlin", "SQL"] },
    { group: "Web and backend", items: ["React", "Next.js", "Three.js", "FastAPI", "SQLite", "MongoDB", "Supabase"] },
    { group: "Infrastructure", items: ["NixOS", "Docker", "Tailscale", "Caddy", "sops-nix", "GitHub Actions", "Playwright"] },
    { group: "Tools", items: ["Hermes Agent", "Microsoft Graph", "Copilot Studio", "Jira", "SharePoint", "Blender"] },
    { group: "Hardware and embedded", items: ["Arduino", "ESP32", "Raspberry Pi", "EMG sensors", "CAN bus and closed-loop control"] },
    { group: "Games and XR", items: ["Unity", "Snap Spectacles"] },
  ],
  alsoUsed: ["Cursor", "Claude Code", "C++", "Bash", "Java", "PostgreSQL", "OpenCV", "OnShape"],
};

/** Featured and also-building rows, in display order. The bot surface uses this so it cannot disagree with /projects. */
export function highlightProjects(): Project[] {
  return site.projects
    .filter((p) => p.group === "featured" || p.group === "also-building")
    .slice()
    .sort((a, b) => a.order - b.order);
}

/** The one project the home page leads with. */
export function flagshipProject(): Project | undefined {
  return site.projects.find((p) => p.rank === "flagship");
}

/** The home page's featured cards, in display order. */
export function featuredProjects(): Project[] {
  return site.projects
    .filter((p) => p.rank === "featured")
    .sort((a, b) => a.order - b.order);
}

export function getProject(id: string): Project | undefined {
  return site.projects.find((p) => p.id === id);
}

export function getExperience(org: string): Experience | undefined {
  return site.experience.find((e) => e.org === org);
}

export default site;
