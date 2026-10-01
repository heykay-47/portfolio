import { Badge } from "@/components/ui/badge";
import ProjectImage from "@/components/project-image";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";

interface Props {
  title: string;
  href?: string;
  description: string;
  dates: string;
  tags: readonly string[];
  image?: string;
  video?: string;
  links?: readonly {
    icon: React.ReactNode;
    type: string;
    href: string;
  }[];
  className?: string;
}

export function ProjectCard({
  title,
  href,
  description,
  dates,
  tags,
  image,
  video,
  links,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border transition-shadow duration-200 hover:ring-2 hover:ring-muted",
        className
      )}
    >
      {(video || image) && (
        <div className="shrink-0">
          {href ? (
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${title} in a new tab`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              {video ? (
                <video
                  src={video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-48 w-full object-cover"
                />
              ) : image ? (
                <ProjectImage src={image} alt={title} />
              ) : null}
            </Link>
          ) : video ? (
            <video
              src={video}
              autoPlay
              loop
              muted
              playsInline
              className="h-48 w-full object-cover"
            />
          ) : image ? (
            <ProjectImage src={image} alt={title} />
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              {href ? (
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${title} in a new tab`}
                  className="group inline-flex items-center gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <h3 className="font-semibold">{title}</h3>
                  <ArrowUpRight
                    className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <h3 className="font-semibold">{title}</h3>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{dates}</span>
          </div>
        </div>

        <div className="text-xs prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
          <Markdown>{description}</Markdown>
        </div>

        {links && links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                href={link.href}
                key={`${link.type}-${link.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Badge
                  className="flex items-center gap-1.5 bg-black text-xs text-white hover:bg-black/90"
                  variant="default"
                >
                  {link.icon}
                  {link.type}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="h-6 w-fit border border-border px-2 text-[11px] font-medium"
                variant="outline"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
