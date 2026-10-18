export type Stage = "builds" | "proof" | "availability" | "contact";

export interface BankQuestion {
  id: string;
  question: string;
  stage: Stage;
  subject: string | null;
  sources: string[];
  answerMustContain: string[];
  starter?: boolean;
}

export const QUESTION_BANK: BankQuestion[] = [
  { id: "starter-builds", question: "What does Nathan build?", stage: "builds", subject: "Nathan Espejo", sources: ["about.md"], answerMustContain: ["LLM agents", "retrieval systems"], starter: true },
  { id: "starter-internship", question: "What did Nathan do at his internship?", stage: "builds", subject: "TeraGo", sources: ["experience/terago.md"], answerMustContain: ["outage-email parser", "Channel Finder"], starter: true },
  { id: "starter-proudest", question: "What's Nathan's proudest project?", stage: "builds", subject: "Campus", sources: ["projects/campus.md"], answerMustContain: ["20-tool agent", "hybrid retrieval"], starter: true },
  { id: "starter-internship-search", question: "Is Nathan looking for a Summer 2027 internship?", stage: "availability", subject: "Nathan Espejo", sources: ["about.md"], answerMustContain: ["Summer 2027 software engineering or applied AI internship", "Summer 2027"], starter: true },

  { id: "campus-builds", question: "How does Nathan's Campus store and retrieve?", stage: "proof", subject: "Campus", sources: ["projects/campus.md"], answerMustContain: ["SQLite", "hybrid retrieval"] },
  { id: "campus-proof", question: "How does Nathan's Campus retrieve answers?", stage: "proof", subject: "Campus", sources: ["projects/campus.md"], answerMustContain: ["lexical prefilter", "cross-encoder reranker", "20-tool agent"] },
  { id: "campus-avail", question: "Is Nathan's Campus available on GitHub?", stage: "availability", subject: "Campus", sources: ["projects/campus.md"], answerMustContain: ["github.com/HasNate618/Campus", "GitHub"] },

  { id: "homelab-builds", question: "How does Nathan's homelab roll back changes?", stage: "proof", subject: "NixOS homelab", sources: ["projects/homelab.md"], answerMustContain: ["rolls back", "I approve"] },
  { id: "homelab-proof", question: "How does Nathan's homelab apply changes?", stage: "proof", subject: "NixOS homelab", sources: ["projects/homelab.md"], answerMustContain: ["nixos-safe-rebuild", "I approve", "rolls back"] },
  { id: "homelab-avail", question: "Is Nathan's homelab config public?", stage: "availability", subject: "NixOS homelab", sources: ["projects/homelab.md"], answerMustContain: ["github.com/HasNate618/nixos-config-public", "GitHub"] },

  { id: "aware-builds", question: "How does Nathan's AWARE run inference?", stage: "proof", subject: "AWARE", sources: ["projects/aware.md"], answerMustContain: ["no cloud inference", "YOLOv8n"] },
  { id: "aware-proof", question: "How does Nathan's AWARE check rules?", stage: "proof", subject: "AWARE", sources: ["projects/aware.md"], answerMustContain: ["500 ms", "YOLOv8n", "no cloud inference"] },
  { id: "aware-avail", question: "Is Nathan's AWARE available on GitHub?", stage: "availability", subject: "AWARE", sources: ["projects/aware.md"], answerMustContain: ["github.com/HasNate618/AWARE", "GitHub"] },

  { id: "carebridge-builds", question: "What stack does Nathan's CareBridge use?", stage: "proof", subject: "CareBridge", sources: ["projects/carebridge.md"], answerMustContain: ["React 19", "FastAPI"] },
  { id: "carebridge-proof", question: "How does Nathan's CareBridge flag risks?", stage: "proof", subject: "CareBridge", sources: ["projects/carebridge.md"], answerMustContain: ["risk signals", "Cohere", "Supabase"] },
  { id: "carebridge-avail", question: "Where is Nathan's CareBridge code hosted?", stage: "proof", subject: "CareBridge", sources: ["projects/carebridge.md"], answerMustContain: ["liamma06/Spark", "Team project"] },

  { id: "ferret-builds", question: "How does Nathan's ferret search files?", stage: "proof", subject: "ferret", sources: ["projects/ferret.md"], answerMustContain: ["reciprocal rank fusion", "OpenAI-compatible embedding server"] },
  { id: "glyph-builds", question: "How does Nathan's Glyph trigger commands?", stage: "proof", subject: "Glyph", sources: ["projects/glyph.md"], answerMustContain: ["Leader-key", "WinGet"] },
  { id: "agenticarmy-builds", question: "How does Nathan's AgenticArmy run agents?", stage: "proof", subject: "AgenticArmy", sources: ["projects/agenticarmy.md"], answerMustContain: ["FastAPI backend", "coding agents in parallel"] },
  { id: "gaming-builds", question: "How does Nathan's gaming analyzer predict risk?", stage: "proof", subject: "Gaming and Mental Health Analyzer", sources: ["projects/gaming-mental-health-analyzer.md"], answerMustContain: ["scikit-learn models", "five wellbeing risks"] },
  { id: "whack-builds", question: "How does Nathan's Whack-A-ML train?", stage: "proof", subject: "Whack-A-ML", sources: ["projects/whack-a-ml.md"], answerMustContain: ["PPO agent", "curriculum learning"] },
  { id: "animarker-builds", question: "How does Nathan's Animarker track wildlife?", stage: "proof", subject: "Animarker", sources: ["projects/animarker.md"], answerMustContain: ["TensorFlow CNN", "species"] },
  { id: "auralis-builds", question: "How does Nathan's Auralis detect emotion?", stage: "proof", subject: "Auralis", sources: ["projects/auralis.md"], answerMustContain: ["emotion detection", "3D virtual doctor"] },
  { id: "vitalsign-builds", question: "How does Nathan's VitalSign read gestures?", stage: "proof", subject: "VitalSign", sources: ["projects/vitalsign.md"], answerMustContain: ["ASL gestures", "facial expressions"] },
  { id: "nowandthen-builds", question: "How does Nathan's NowAndThen summarize places?", stage: "proof", subject: "NowAndThen", sources: ["projects/nowandthen.md"], answerMustContain: ["geotagged posts", "AI summaries"] },
  { id: "eyecandy-builds", question: "How does Nathan's Eyecandy try on glasses?", stage: "proof", subject: "Eyecandy", sources: ["projects/eyecandy.md"], answerMustContain: ["AR try-on", "Snap Spectacles"] },
  { id: "lumen-builds", question: "How does Nathan's Lumen check mood?", stage: "proof", subject: "Lumen", sources: ["projects/lumen.md"], answerMustContain: ["mood check-in", "mini-game"] },
  { id: "careerly-builds", question: "What does Nathan's Careerly simulate?", stage: "proof", subject: "Careerly", sources: ["projects/careerly.md"], answerMustContain: ["Unity virtual job fair", "AI mentors"] },
  { id: "flexfire-builds", question: "How does Nathan's FLEXFIRE-X launch?", stage: "proof", subject: "FLEXFIRE-X", sources: ["projects/flexfire-x.md"], answerMustContain: ["EMG sensor", "3D-printed parts"] },
  { id: "portfoliov2-builds", question: "What did Nathan's Portfolio v2 include?", stage: "proof", subject: "Portfolio v2", sources: ["projects/portfolio-v2.md"], answerMustContain: ["WebGL ASCII ocean", "RAG chatbot"] },
  { id: "saferoute-builds", question: "How does Nathan's SafeRoute route hazards?", stage: "proof", subject: "SafeRoute", sources: ["projects/saferoute.md"], answerMustContain: ["reporting hazards", "routing around them"] },
  { id: "omnireality-builds", question: "How does Nathan's Omni-Reality assist?", stage: "proof", subject: "Omni-Reality", sources: ["projects/omni-reality.md"], answerMustContain: ["mixed-reality assistant", "Quest 3S"] },

  { id: "terago-builds", question: "How does Nathan's TeraGo parser work?", stage: "proof", subject: "TeraGo", sources: ["experience/terago.md"], answerMustContain: ["Microsoft Graph", "Ollama"] },
  { id: "terago-avail", question: "Did Nathan's TeraGo parser ship?", stage: "proof", subject: "TeraGo", sources: ["experience/terago.md"], answerMustContain: ["works end to end", "hasn't deployed"] },
  { id: "terago-proof", question: "How many test cases validated Nathan's TeraGo Channel Finder?", stage: "proof", subject: "TeraGo", sources: ["experience/terago.md"], answerMustContain: ["760", "test cases"] },

  { id: "threed-builds", question: "What did Nathan co-lead at 3D Western?", stage: "builds", subject: "3D Western", sources: ["experience/3d-western.md"], answerMustContain: ["co-led two data developers", "2,559 clean"] },
  { id: "threed-team", question: "What team structure did Nathan work in at 3D Western?", stage: "builds", subject: "3D Western", sources: ["experience/3d-western.md"], answerMustContain: ["two VPs and two developers", "Jira"] },
  { id: "threed-proof", question: "What model agreement did Nathan's 3D Western benchmark reach?", stage: "proof", subject: "3D Western", sources: ["experience/3d-western.md"], answerMustContain: ["84.2%", "matched the labels"] },

  { id: "wemars-builds", question: "What did Nathan build for WEMars?", stage: "builds", subject: "WEMars", sources: ["experience/wemars.md"], answerMustContain: ["ESP32-CAM", "wireless camera"] },
  { id: "wefirst-builds", question: "What did Nathan program at WEFirst Robotics?", stage: "builds", subject: "WEFirst Robotics", sources: ["experience/wefirst.md"], answerMustContain: ["swerve", "CAN bus"] },
  { id: "mcc-builds", question: "What did Nathan do at Microcomputer Consulting?", stage: "builds", subject: "Microcomputer Consulting Inc.", sources: ["experience/mcc.md"], answerMustContain: ["Windows workstations", "IT intern"] },

  { id: "skills-languages", question: "What languages does Nathan know?", stage: "builds", subject: "Skills", sources: ["skills.md"], answerMustContain: ["Python", "TypeScript", "Rust"] },
  { id: "skills-ml", question: "What ML frameworks has Nathan used?", stage: "builds", subject: "Skills", sources: ["skills.md"], answerMustContain: ["PyTorch", "TensorFlow", "scikit-learn"] },
  { id: "skills-infra", question: "What infrastructure tools does Nathan use?", stage: "builds", subject: "Skills", sources: ["skills.md"], answerMustContain: ["NixOS", "Docker", "Tailscale"] },
  { id: "skills-web", question: "What web frameworks has Nathan used?", stage: "builds", subject: "Skills", sources: ["skills.md"], answerMustContain: ["React", "Next.js", "FastAPI"] },
  { id: "skills-ai", question: "What AI and ML tools has Nathan used?", stage: "builds", subject: "Skills", sources: ["skills.md"], answerMustContain: ["LLM agents", "RAG", "Embeddings and reranking"] },
  { id: "skills-hardware", question: "What hardware has Nathan used?", stage: "builds", subject: "Skills", sources: ["skills.md"], answerMustContain: ["Arduino", "ESP32", "Raspberry Pi"] },

  { id: "hackathons-count", question: "How many hackathon awards has Nathan won?", stage: "proof", subject: "Hackathons", sources: ["awards.md"], answerMustContain: ["8 awards across 22 hackathons", "hackathons"] },
  { id: "hackathons-htn", question: "What did Nathan win at Hack the North 2025?", stage: "builds", subject: "Eyecandy", sources: ["awards.md"], answerMustContain: ["Eyecandy", "Snap Spectacles AR Runner Up"] },
  { id: "hackathons-auralis", question: "What prize did Nathan's Auralis win?", stage: "builds", subject: "Auralis", sources: ["awards.md"], answerMustContain: ["Best AI Application Built with Cloudflare", "Auralis"] },
  { id: "hackathons-role", question: "What was Nathan's role on hackathon projects?", stage: "builds", subject: "Hackathons", sources: ["awards.md"], answerMustContain: ["Team project", "hackathon"] },

  { id: "meta-graduate", question: "When does Nathan graduate?", stage: "availability", subject: "Nathan Espejo", sources: ["about.md"], answerMustContain: ["May 2028", "Western University"] },
  { id: "meta-contact", question: "How can I contact Nathan?", stage: "contact", subject: "Nathan Espejo", sources: ["about.md"], answerMustContain: ["nate.e.espejo@gmail.com", "linkedin.com/in/nathan-espejo"] },
  { id: "meta-resume", question: "Where is Nathan's resume PDF?", stage: "contact", subject: "Nathan Espejo", sources: ["about.md"], answerMustContain: ["https://nathanespejo.com/Nathan_Espejo_Resume.pdf", "Résumé"] },
  { id: "meta-chat", question: "How does Nathan's chat work?", stage: "contact", subject: "Nathan Espejo", sources: ["chat.md"], answerMustContain: ["public notes", "Ask about me"] },
  { id: "meta-now", question: "What is Nathan working on now?", stage: "builds", subject: "Nathan Espejo", sources: ["now.md"], answerMustContain: ["Campus", "Homelab"] },
  { id: "meta-email", question: "What is Nathan's email address?", stage: "contact", subject: "Nathan Espejo", sources: ["about.md"], answerMustContain: ["nate.e.espejo@gmail.com", "linkedin.com/in/nathan-espejo"] },
  { id: "meta-available", question: "Is Nathan available in May 2028?", stage: "proof", subject: "Nathan Espejo", sources: ["about.md"], answerMustContain: ["May 2028", "Western University"] },
  { id: "meta-study", question: "What does Nathan study?", stage: "builds", subject: "Nathan Espejo", sources: ["about.md"], answerMustContain: ["Software Engineering", "Western University"] },
  { id: "meta-location", question: "Where is Nathan located?", stage: "builds", subject: "Nathan Espejo", sources: ["about.md"], answerMustContain: ["Brampton and London, ON", "Location"] },
];
