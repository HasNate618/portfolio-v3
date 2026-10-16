/** Structured summary of nathanespejo.com for bots and LLMs. Generated from the knowledge base. */

export type Rank = "flagship" | "featured" | "other";

export type KnowledgebaseEntry = {
  path: string;
  url: `/knowledgebase/${string}.md`;
  title: string;
  kind: "profile" | "hub" | "project" | "experience";
  priority: "start-here" | "reference";
  rank?: Rank;
  dates: string;
  role: string;
  description: string;
};

export type SiteContent = {
  identity: { name: string; headline: string; positioning: string; seeking: string; location: string; year: string;
    education: { school: string; degree: string; honors: string; start: string; end: string; location: string } };
  contact: { email: string; links: { label: string; href: string }[] };
  experience: { org: string; role: string; location: string; terms: { start: string; end: string | null }[]; dates: string; onResume: boolean; file: string }[];
  projects: { id: string; name: string; tier: Rank; dates: string; role: string; event?: string; covers: string; file: string; links: { label: string; href: string }[] }[];
  hackathons: { entered: number; awards: number };
  awards: { event: string; year: string; project: string; prize: string; role: string }[];
  skills: { group: string; items: string[] }[];
  alsoUsed: string[];
};

export const site: SiteContent = {
  identity: {
    name: "Nathan Espejo",
    headline: "Applied AI engineer (3rd-year Software Engineering, Western) focused on cost-efficient models, with local and self-hosted options",
    positioning: "Builds LLM agents and retrieval systems wired into his own workflows. Campus is the flagship, alongside a NixOS homelab run through Hermes Agent profiles and the on-device AWARE build.",
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
    { org: "3D Western", role: "VP of Data/ML (promoted from Software Developer)", location: "London, ON", terms: [{ start: "2025-09", end: "2026-08" }], dates: "Sep 2025 to Aug 2026", onResume: true, file: "/knowledgebase/experience/3d-western.md" },
    { org: "WEMars", role: "Software team member", location: "London, ON", terms: [{ start: "2024-09", end: "2025-04" }, { start: "2026-09", end: null }], dates: "Sep 2024 to Apr 2025, rejoined Sep 2026", onResume: false, file: "/knowledgebase/experience/wemars.md" },
    { org: "WEFirst Robotics", role: "Software Developer", location: "London, ON", terms: [{ start: "2026-01", end: "2026-04" }], dates: "Jan 2026 to Apr 2026", onResume: false, file: "/knowledgebase/experience/wefirst.md" },
    { org: "Microcomputer Consulting Inc.", role: "IT Intern (part-time)", location: "Mississauga, ON", terms: [{ start: "2025-05", end: "2025-08" }], dates: "May 2025 to Aug 2025", onResume: false, file: "/knowledgebase/experience/mcc.md" },
  ],
  projects: [
    {
      id: "campus", name: "Campus", tier: "flagship", dates: "Aug 2026 to present", role: "owner",
      covers: "What Campus is, how its LMS sync, hybrid retrieval and audited 20-tool agent work, and its test and usage numbers.",
      file: "/knowledgebase/projects/campus.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/Campus" }],
    },
    {
      id: "homelab", name: "Homelab and NixOS", tier: "featured", dates: "May 2026 to present", role: "owner",
      covers: "How his two NixOS hosts are defined, what the self-hosted AI stack runs, how Hermes Agent profiles change the config behind approval, and llama.cpp on flow.",
      file: "/knowledgebase/projects/homelab.md",
      links: [{ label: "GitHub (public NixOS config)", href: "https://github.com/HasNate618/nixos-config-public" }, { label: "GitHub (llama.cpp setup)", href: "https://github.com/HasNate618/local-llama-setup" }],
    },
    {
      id: "aware", name: "AWARE", tier: "featured", dates: "Jul 2026", role: "repo owner", event: "Hack the 6ix 2026",
      covers: "How AWARE runs vision, audio and a small LLM on one Arduino UNO Q, and how plain-English commands become deterministic rules.",
      file: "/knowledgebase/projects/aware.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/AWARE" }, { label: "Devpost", href: "https://devpost.com/software/a-w-a-r-e-autonomous-witness-and-response-engine" }],
    },
    {
      id: "agntos", name: "AgntOS", tier: "featured", dates: "May 2026 (approx.)", role: "owner",
      covers: "Design of an agent-native NixOS concept: the Rust daemon and CLI, the propose/apply/rollback pipeline, and agent memory.",
      file: "/knowledgebase/projects/agntos.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/AgntOS" }],
    },
    {
      id: "agenticarmy", name: "AgenticArmy", tier: "featured", dates: "Mar 2026", role: "repo owner", event: "GenAI Genesis 2026",
      covers: "How the multi-agent coding workflow plans, splits and merges work with a human approving each step.",
      file: "/knowledgebase/projects/agenticarmy.md",
      links: [{ label: "Devpost", href: "https://devpost.com/software/agenticarmy" }, { label: "GitHub", href: "https://github.com/HasNate618/genai-genesis-2026" }],
    },
    {
      id: "glyph", name: "Glyph", tier: "featured", dates: "Jan 2026 (approx.)", role: "owner",
      covers: "What Glyph does for Windows keyboard workflows, its config model, and how it ships through WinGet.",
      file: "/knowledgebase/projects/glyph.md",
      links: [{ label: "GitHub", href: "https://github.com/HasNate618/Glyph" }],
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

/** Public knowledge base files, recruiter path first. Served under /knowledgebase/. */
export const knowledgebase: readonly KnowledgebaseEntry[] = [
  { path: "about.md", url: "/knowledgebase/about.md", title: "About Nathan", kind: "profile", priority: "start-here", dates: "Aug 2024 to present", role: "self", description: "Who he is, what he is looking for (Summer 2027 applied AI internship), education, location and links." },
  { path: "projects/campus.md", url: "/knowledgebase/projects/campus.md", title: "Campus", kind: "project", priority: "start-here", rank: "flagship", dates: "Aug 2026 to present", role: "owner", description: "What Campus is, how its LMS sync, hybrid retrieval and audited 20-tool agent work, and its test and usage numbers." },
  { path: "projects/homelab.md", url: "/knowledgebase/projects/homelab.md", title: "Homelab and NixOS", kind: "project", priority: "start-here", rank: "featured", dates: "May 2026 to present", role: "owner", description: "How his two NixOS hosts are defined, what the self-hosted AI stack runs, how Hermes Agent profiles change the config behind approval, and llama.cpp on flow." },
  { path: "local-ai.md", url: "/knowledgebase/local-ai.md", title: "Local and cost-aware AI", kind: "hub", priority: "start-here", dates: "Apr 2026 (approx.) to present", role: "self", description: "Which models run where: hosted vs local, AWARE on-device, llama.cpp on flow, endpoint-agnostic Campus and the TeraGo Ollama prototype." },
  { path: "experience/terago.md", url: "/knowledgebase/experience/terago.md", title: "TeraGo", kind: "experience", priority: "start-here", dates: "May 2026 to Aug 2026", role: "Software Engineering Intern", description: "What he built at TeraGo: the local LLM outage-ticket prototype, Channel Finder, a Copilot Studio agent and the self-hosted LLM proposal." },
  { path: "now.md", url: "/knowledgebase/now.md", title: "Now", kind: "profile", priority: "reference", dates: "Oct 2026", role: "self", description: "What he is doing as of Oct 2026: 3rd year at Western, Campus, the homelab and the WEMars rover." },
  { path: "index.md", url: "/knowledgebase/index.md", title: "Knowledge base map", kind: "hub", priority: "reference", dates: "2023 to present", role: "self", description: "Minimal entry point listing the recruiter path and the indexes; site.ts has the full map." },
  { path: "experience/index.md", url: "/knowledgebase/experience/index.md", title: "Experience", kind: "hub", priority: "reference", dates: "Sep 2024 to present", role: "self", description: "All work and student team roles with dates, one line each." },
  { path: "projects/index.md", url: "/knowledgebase/projects/index.md", title: "Projects", kind: "hub", priority: "reference", dates: "2023 to present", role: "self", description: "All projects grouped by tier, with dates, role and event." },
  { path: "projects/other.md", url: "/knowledgebase/projects/other.md", title: "Other projects", kind: "hub", priority: "reference", dates: "2023 to 2026", role: "mixed", description: "Short entries for minor games, builds and joke hackathon projects." },
  { path: "awards.md", url: "/knowledgebase/awards.md", title: "Hackathon awards", kind: "hub", priority: "reference", dates: "2023 to 2026", role: "mixed", description: "All 8 awards from 22 hackathons, with event, year, prize and his role." },
  { path: "skills.md", url: "/knowledgebase/skills.md", title: "Skills", kind: "hub", priority: "reference", dates: "2023 to present", role: "self", description: "Skills by area, each linked to the files where he actually used it." },
  { path: "experience/3d-western.md", url: "/knowledgebase/experience/3d-western.md", title: "3D Western", kind: "experience", priority: "reference", dates: "Sep 2025 to Aug 2026", role: "VP of Data/ML (promoted from Software Developer)", description: "His 3D Western roles: the print pipeline as developer, then as VP (alongside TeraGo) leading two developers on the VLM-checked dataset and vision model benchmark." },
  { path: "experience/wemars.md", url: "/knowledgebase/experience/wemars.md", title: "WEMars", kind: "experience", priority: "reference", dates: "Sep 2024 to Apr 2025, rejoined Sep 2026", role: "Software team member", description: "His WEMars rover work: camera and comms in 2024-25, and the AI and autonomy focus since rejoining in Sep 2026." },
  { path: "experience/wefirst.md", url: "/knowledgebase/experience/wefirst.md", title: "WEFirst Robotics", kind: "experience", priority: "reference", dates: "Jan 2026 to Apr 2026", role: "Software Developer", description: "His WEFirst swerve drive code, wiring and control work." },
  { path: "experience/mcc.md", url: "/knowledgebase/experience/mcc.md", title: "Microcomputer Consulting Inc.", kind: "experience", priority: "reference", dates: "May 2025 to Aug 2025", role: "IT Intern (part-time)", description: "His part-time IT internship setting up Windows workstations." },
  { path: "projects/aware.md", url: "/knowledgebase/projects/aware.md", title: "AWARE", kind: "project", priority: "reference", rank: "featured", dates: "Jul 2026", role: "repo owner", description: "How AWARE runs vision, audio and a small LLM on one Arduino UNO Q, and how plain-English commands become deterministic rules." },
  { path: "projects/agntos.md", url: "/knowledgebase/projects/agntos.md", title: "AgntOS", kind: "project", priority: "reference", rank: "featured", dates: "May 2026 (approx.)", role: "owner", description: "Design of an agent-native NixOS concept: the Rust daemon and CLI, the propose/apply/rollback pipeline, and agent memory." },
  { path: "projects/agenticarmy.md", url: "/knowledgebase/projects/agenticarmy.md", title: "AgenticArmy", kind: "project", priority: "reference", rank: "featured", dates: "Mar 2026", role: "repo owner", description: "How the multi-agent coding workflow plans, splits and merges work with a human approving each step." },
  { path: "projects/glyph.md", url: "/knowledgebase/projects/glyph.md", title: "Glyph", kind: "project", priority: "reference", rank: "featured", dates: "Jan 2026 (approx.)", role: "owner", description: "What Glyph does for Windows keyboard workflows, its config model, and how it ships through WinGet." },
  { path: "projects/auralis.md", url: "/knowledgebase/projects/auralis.md", title: "Auralis", kind: "project", priority: "reference", rank: "other", dates: "Nov 2025", role: "team", description: "What the Auralis virtual doctor does and the stack his team used." },
  { path: "projects/carebridge.md", url: "/knowledgebase/projects/carebridge.md", title: "CareBridge", kind: "project", priority: "reference", rank: "other", dates: "Feb 2026", role: "team contributor", description: "What the CareBridge rural care prototype does; Nathan contributed on a teammate-owned repo." },
  { path: "projects/careerly.md", url: "/knowledgebase/projects/careerly.md", title: "Careerly", kind: "project", priority: "reference", rank: "other", dates: "Feb 2024", role: "team", description: "What the Careerly Unity job fair does and its AI mentor setup." },
  { path: "projects/lumen.md", url: "/knowledgebase/projects/lumen.md", title: "Lumen", kind: "project", priority: "reference", rank: "other", dates: "Aug 2025", role: "team (built the Unity mini-games)", description: "What the Lumen wellness companion does and which part Nathan built." },
  { path: "projects/eyecandy.md", url: "/knowledgebase/projects/eyecandy.md", title: "Eyecandy", kind: "project", priority: "reference", rank: "other", dates: "Sep 2025", role: "team", description: "What the Eyecandy AR try-on app does on Snap Spectacles." },
  { path: "projects/vitalsign.md", url: "/knowledgebase/projects/vitalsign.md", title: "VitalSign", kind: "project", priority: "reference", rank: "other", dates: "Jan 2026", role: "team", description: "What the VitalSign ASL-to-speech app does and how it reads gestures and expressions." },
  { path: "projects/nowandthen.md", url: "/knowledgebase/projects/nowandthen.md", title: "NowAndThen", kind: "project", priority: "reference", rank: "other", dates: "Jan 2026", role: "team", description: "What the NowAndThen geotagged memory map does." },
  { path: "projects/gaming-mental-health-analyzer.md", url: "/knowledgebase/projects/gaming-mental-health-analyzer.md", title: "Gaming and Mental Health Analyzer", kind: "project", priority: "reference", rank: "other", dates: "Mar 2026 (approx.)", role: "owner", description: "How the scikit-learn pipeline predicts wellbeing risks from gaming habits." },
  { path: "projects/whack-a-ml.md", url: "/knowledgebase/projects/whack-a-ml.md", title: "Whack-A-ML", kind: "project", priority: "reference", rank: "other", dates: "Jan 2026 (approx.)", role: "owner", description: "How a PPO reinforcement learning agent learns to strike targets with a simulated arm in Unity." },
  { path: "projects/animarker.md", url: "/knowledgebase/projects/animarker.md", title: "Animarker", kind: "project", priority: "reference", rank: "other", dates: "May 2023", role: "owner", description: "What the Animarker wildlife tracker does with computer vision on Android." },
  { path: "projects/saferoute.md", url: "/knowledgebase/projects/saferoute.md", title: "SafeRoute", kind: "project", priority: "reference", rank: "other", dates: "2025 (approx.)", role: "owner", description: "What the SafeRoute hazard reporting and routing app does." },
  { path: "projects/flexfire-x.md", url: "/knowledgebase/projects/flexfire-x.md", title: "FLEXFIRE-X", kind: "project", priority: "reference", rank: "other", dates: "2025 (approx.)", role: "owner", description: "How the EMG-controlled wearable arm attachment is built and triggered." },
  { path: "projects/cyberdeck.md", url: "/knowledgebase/projects/cyberdeck.md", title: "Cyberdeck", kind: "project", priority: "reference", rank: "other", dates: "2026 (approx.)", role: "owner", description: "How the Raspberry Pi cyberdeck is built and boots into a terminal-first setup." },
  { path: "projects/portfolio-v2.md", url: "/knowledgebase/projects/portfolio-v2.md", title: "Portfolio v2", kind: "project", priority: "reference", rank: "other", dates: "Jun 2026 (approx.) to present", role: "owner", description: "How nathanespejo.com renders its 3D ASCII ocean and where its chatbot gets answers." },
];

export default site;
