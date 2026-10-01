"use client";

import Image from "next/image";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function HeroAvatar({
  src,
  alt,
  initials,
}: {
  src: string;
  alt: string;
  initials: string;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <Avatar className="size-24 md:size-32 border rounded-full shadow-lg ring-4 ring-muted">
      {status !== "loaded" && <AvatarFallback>{initials}</AvatarFallback>}
      {status !== "error" && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 128px, 96px"
          loading="eager"
          fetchPriority="high"
          className="aspect-square"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
    </Avatar>
  );
}
