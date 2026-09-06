import { Icons } from "@/components/icons";
import { HomeIcon, NotebookIcon } from "lucide-react";
import { makeSimpleIcon } from "@/components/ui/simple-icon";
import type { ReactNode } from "react";
import {
  siCss,
  siDocker,
  siExpress,
  siGit,
  siGooglegemini,
  siGooglecloud,
  siHtml5,
  siJavascript,
  siLangchain,
  siLanggraph,
  siLinux,
  siMongodb,
  siMysql,
  siNodedotjs,
  siPostgresql,
  siPython,
  siPytorch,
  siReact,
  siSqlite,
  siSupabase,
  siTailwindcss,
} from "simple-icons";

type HackathonLink = {
  title: string;
  icon: ReactNode;
  href: string;
};

const skillIcons = {
  react: makeSimpleIcon(siReact),
  node: makeSimpleIcon(siNodedotjs),
  express: makeSimpleIcon(siExpress),
  tailwind: makeSimpleIcon(siTailwindcss),
  html: makeSimpleIcon(siHtml5),
  css: makeSimpleIcon(siCss),
  javascript: makeSimpleIcon(siJavascript),
  python: makeSimpleIcon(siPython),
  sql: makeSimpleIcon(siSqlite),
  langchain: makeSimpleIcon(siLangchain),
  langgraph: makeSimpleIcon(siLanggraph),
  gemini: makeSimpleIcon(siGooglegemini),
  pytorch: makeSimpleIcon(siPytorch),
  postgresql: makeSimpleIcon(siPostgresql),
  mysql: makeSimpleIcon(siMysql),
  mongodb: makeSimpleIcon(siMongodb),
  supabase: makeSimpleIcon(siSupabase),
  googleCloud: makeSimpleIcon(siGooglecloud),
  docker: makeSimpleIcon(siDocker),
  git: makeSimpleIcon(siGit),
  linux: makeSimpleIcon(siLinux),
};

export const DATA = {
  name: "Krithik Jagajeevan",
  initials: "",
  url: "https://portfolio.adguardian.me",
  location: "Tamil Nadu, India",
  locationLink: "https://www.google.com/maps/place/Tamil+Nadu,+India",
  description: "Third Year Computer Science and Engineering student from India",
  summary:
    "I’m Krithik, a CSE student who likes building things that work, fixing things that don’t, and learning something new along the way. Most of my time goes into coding, exploring tech, participating in hackathons/CTFs, and working on projects that start with “this should be simple” and somehow turn into something genuinely fun.",
  avatarUrl: "/me/krithik.png",
  skills: [
    { name: "React.js", icon: skillIcons.react },
    { name: "Node.js", icon: skillIcons.node },
    { name: "Express.js", icon: skillIcons.express },
    { name: "Tailwind CSS", icon: skillIcons.tailwind },
    { name: "HTML", icon: skillIcons.html },
    { name: "CSS", icon: skillIcons.css },
    { name: "JavaScript", icon: skillIcons.javascript },
    { name: "Python", icon: skillIcons.python },
    { name: "SQL", icon: skillIcons.sql },
    { name: "LangChain", icon: skillIcons.langchain },
    { name: "LangGraph", icon: skillIcons.langgraph },
    { name: "Google Gemini API", icon: skillIcons.gemini },
    { name: "PyTorch", icon: skillIcons.pytorch },
    { name: "PostgreSQL", icon: skillIcons.postgresql },
    { name: "MySQL", icon: skillIcons.mysql },
    { name: "MongoDB", icon: skillIcons.mongodb },
    { name: "Supabase", icon: skillIcons.supabase },
    { name: "Google Cloud Platform", icon: skillIcons.googleCloud },
    { name: "Docker", icon: skillIcons.docker },
    { name: "Git", icon: skillIcons.git },
    { name: "Linux/Unix", icon: skillIcons.linux },
  ],
  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/blog", icon: NotebookIcon, label: "Blog" },
  ],
  contact: {
    email: "krithick008@proton.me",
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://github.com/heykay-47",
        icon: Icons.github,
        navbar: true,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/krithik-j/",
        icon: Icons.linkedin,
        navbar: true,
      },
      email: {
        name: "Send Email",
        url: "mailto:krithick008@proton.me",
        icon: Icons.email,
        navbar: false,
      },
    },
  },
  work: [
    {
      company: "Archimedis Digital",
      href: "",
      badges: [],
      location: "Chennai",
      title: "Full Stack Intern",
      logoUrl:
        "https://media.licdn.com/dms/image/v2/D560BAQHVaEpS6X7g-A/company-logo_200_200/B56ZjSYaHmIAAM-/0/1755876271029/archimedis_digital_logo?e=2147483647&v=beta&t=iiVNxr5NpRacZDa4JRntkF916vs1HLVx8Wc-yTF_qoA",
      start: "June 2026",
      end: "",
      description: (
        <ul className="list-disc space-y-1 pl-4">
          <li>
            Learned web performance optimization techniques including React
            component optimization, lazy loading, code splitting, and asset
            compression to improve website load performance.
          </li>
          <li>
            Gained practical understanding of backend performance optimization
            using Node.js, Express.js, and MongoDB, including query
            optimization, REST API structuring, efficient data retrieval, and
            error handling.
          </li>
        </ul>
      ),
    },
    {
      company: "Developer Community SASTRA & Google Developer Groups",
      href: "",
      badges: [],
      location: "SASTRA Deemed University",
      title: "Core Team Member",
      logoUrl: "/logos/gdg.jpg",
      start: "Jan. 2024",
      end: "Present",
      description:
        "Helped 60+ junior developers learn Git and web development, supported university tech communities, and contributed to organizing technical summits with strong participant retention.",
    },
  ],
  education: [
    {
      school: "SASTRA Deemed University",
      href: "https://www.sastra.edu/",
      degree:
        "B.Tech, Computer Science & Engineering - Cybersecurity and Blockchain Technology",
      logoUrl: "/logos/sastra.png",
      start: "Aug 2023",
      end: "May 2027",
    },
  ],
  projects: [
    {
      title: "VouchIt",
      href: "https://github.com/heykay-47",
      dates: "Voucher Marketplace",
      active: true,
      description:
        "Built a voucher marketplace using React, PostgreSQL, Supabase, Google OAuth, and Tailwind CSS. Improved backend performance, strengthened per-user data isolation, and built reusable frontend components.",
      technologies: [
        "React",
        "PostgreSQL",
        "Supabase",
        "Google OAuth",
        "Tailwind CSS",
      ],
      links: [
        {
          type: "Source",
          href: "https://github.com/heykay-47",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "",
    },
    {
      title: "ApartCheck",
      href: "https://github.com/heykay-47/ApartCheck",
      dates: "Asset & Ticket Accountability Ledger",
      active: true,
      description:
        "Built a full-stack accountability ledger for residential societies to track shared assets, ownership, QR lookups, and maintenance tickets with role-based workflows, session security, and MongoDB-backed transactions.",
      technologies: [
        "React",
        "TypeScript",
        "Node.js",
        "Express.js",
        "MongoDB",
        "Tailwind CSS",
      ],
      links: [
        {
          type: "Source",
          href: "https://github.com/heykay-47/ApartCheck",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "",
    },
    {
      title: "wpdbot",
      href: "https://github.com/heykay-47/wpdbot",
      dates: "WhatsApp Group Media Relay Bot",
      active: true,
      description:
        "Built a WhatsApp group media relay bot that detects Instagram reels/posts and YouTube Shorts, downloads them with yt-dlp, reposts them with attribution, and skips duplicate links within a configurable window.",
      technologies: [
        "Node.js",
        "TypeScript",
        "whatsapp-web.js",
        "yt-dlp",
        "FFmpeg",
        "Docker",
        "SQLite",
      ],
      links: [
        {
          type: "Source",
          href: "https://github.com/heykay-47/wpdbot",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "",
    },
    {
      title: "Google Classroom Auto File Downloader",
      href: "https://github.com/heykay-47/google-classroom-downloader",
      dates: "Bulk Course Attachment Downloader",
      active: true,
      description:
        "Built a web app and CLI that bulk-download Google Classroom attachments through the official Classroom and Drive APIs, with Google OAuth, ZIP exports, retries, and document conversion.",
      technologies: [
        "Python",
        "FastAPI",
        "Google Classroom API",
        "Google Drive API",
        "Docker",
        "Gotenberg",
      ],
      links: [
        {
          type: "Source",
          href: "https://github.com/heykay-47/google-classroom-downloader",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "",
      video: "",
    },
  ],
  hackathons: [
    {
      title: "R3D4CT CTF 2026",
      dates: "2026",
      location: "Capture The Flag",
      description: "2nd Place",
      image: "/logos/r3d4ct_steam.png",
      links: [] as HackathonLink[],
    },
    {
      title: "HackQuest CTF 2025",
      dates: "2025",
      location: "Capture The Flag",
      description: "Top 5",
      image: "/logos/hackquest.png",
      links: [] as HackathonLink[],
    },
    {
      title: "Breachpoint CTF 2026",
      dates: "2026",
      location: "Capture The Flag",
      description: "Top 10",
      image: "/logos/breachpoint.png",
      links: [] as HackathonLink[],
    },
    {
      title: "TCS x Amazon AI Hackathon 2026",
      dates: "2026",
      location: "AI Hackathon",
      description: "Finalist",
      image: "/logos/tcsxamz_hackathon.png",
      links: [] as HackathonLink[],
    },
    {
      title: "STEAM Hackathon 2025",
      dates: "2025",
      location: "Hackathon",
      description: "Finalist",
      image: "/logos/r3d4ct_steam.png",
      links: [] as HackathonLink[],
    },
  ],
} as const;
