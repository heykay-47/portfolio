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
    { href: "https://heykay47.hashnode.dev/", icon: NotebookIcon, label: "Blog" },
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
      title: "Intelligent RAG Agent",
      href: "https://github.com/heykay-47",
      dates: "AI Document Analysis Agent",
      active: true,
      description:
        "Built an AI document analysis agent using Python, LangGraph, LangChain, and Google Gemini API. Designed semantic routing and retrieval pipelines to improve summarization quality and document search.",
      technologies: [
        "Python",
        "LangGraph",
        "LangChain",
        "Google Gemini API",
        "RAG",
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
      title: "Hybrid Deep Learning Model for Stock Price Prediction",
      href: "https://github.com/heykay-47",
      dates: "Deep Learning Research Project",
      active: true,
      description:
        "Developed a hybrid deep learning model using Python, PyTorch, BiLSTM, Transformer, and TCN architectures to predict Indian stock market prices across multiple datasets.",
      technologies: [
        "Python",
        "PyTorch",
        "BiLSTM",
        "Transformer",
        "TCN",
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
