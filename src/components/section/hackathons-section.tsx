/* eslint-disable @next/next/no-img-element */
import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DATA } from "@/data/resume";
import {
  Timeline,
  TimelineItem,
  TimelineConnectItem,
} from "@/components/timeline";

type Hackathon = (typeof DATA.hackathons)[number];

const groupedHackathons = DATA.hackathons.reduce<Record<string, Hackathon[]>>(
  (groups, hackathon) => {
    groups[hackathon.dates] = [...(groups[hackathon.dates] ?? []), hackathon];
    return groups;
  },
  {},
);

const sortedHackathonYears = Object.keys(groupedHackathons).sort(
  (a, b) => Number(b) - Number(a),
);

export default function HackathonsSection() {
  return (
    <section id="hackathons" className="overflow-hidden">
      <div className="flex min-h-0 flex-col gap-y-8 w-full">
        <div className="flex flex-col gap-y-4 items-center justify-center">
          <div className="flex items-center w-full">
            <div className="flex-1 h-px bg-linear-to-r from-transparent from-5% via-border via-95% to-transparent" />
            <div className="border bg-primary z-10 rounded-xl px-4 py-1">
              <span className="text-background text-sm font-medium">
                Hackathons & CTFs
              </span>
            </div>
            <div className="flex-1 h-px bg-linear-to-l from-transparent from-5% via-border via-95% to-transparent" />
          </div>
          <div className="flex flex-col gap-y-3 items-center justify-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              I like building things
            </h2>
            <p className="text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed text-balance text-center">
              During my time in university, I attended {DATA.hackathons.length}+
              hackathons. People from around the country would come together and
              build incredible things in 2-3 days. It was eye-opening to see the
              endless possibilities brought to life by a group of motivated and
              passionate individuals.
            </p>
          </div>
        </div>
        <Timeline>
          {sortedHackathonYears.map((year) => (
            <Fragment key={year}>
              <TimelineItem className="w-full flex items-center justify-between gap-10">
                <TimelineConnectItem className="flex items-center justify-center">
                  <div className="size-10 bg-primary text-primary-foreground z-10 shrink-0 overflow-hidden border rounded-full shadow ring-2 ring-border flex items-center justify-center text-xs font-semibold">
                    {year.slice(2)}
                  </div>
                </TimelineConnectItem>
                <div className="flex flex-1 min-w-0 items-center">
                  <h3 className="text-sm font-semibold tracking-wide text-foreground">
                    {year}
                  </h3>
                </div>
              </TimelineItem>
              {groupedHackathons[year].map((hackathon) => (
                <TimelineItem
                  key={hackathon.title + hackathon.dates}
                  className="w-full flex items-start justify-between gap-10"
                >
                  <TimelineConnectItem className="flex items-start justify-center">
                    {hackathon.image ? (
                      <img
                        src={hackathon.image}
                        alt={hackathon.title}
                        className="size-10 bg-card z-10 shrink-0 overflow-hidden p-1 border rounded-full shadow ring-2 ring-border object-contain flex-none"
                      />
                    ) : (
                      <div className="size-10 bg-card z-10 shrink-0 overflow-hidden p-1 border rounded-full shadow ring-2 ring-border flex-none" />
                    )}
                  </TimelineConnectItem>
                  <div className="flex flex-1 flex-col justify-start gap-2 min-w-0">
                    {hackathon.title && (
                      <h3 className="font-semibold leading-none">
                        {hackathon.title}
                      </h3>
                    )}
                    {hackathon.location && (
                      <p className="text-sm text-muted-foreground">
                        {hackathon.location}
                      </p>
                    )}
                    {hackathon.description && (
                      <Badge
                        variant="outline"
                        className="w-fit border-amber-200 bg-amber-100 text-amber-900 shadow-none hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-300/15 dark:text-amber-200"
                      >
                        {hackathon.description}
                      </Badge>
                    )}
                    {hackathon.links && hackathon.links.length > 0 && (
                      <div className="mt-1 flex flex-row flex-wrap items-start gap-2">
                        {hackathon.links.map((link, idx) => (
                          <Link
                            href={link.href}
                            key={idx}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Badge className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground">
                              {link.icon}
                              {link.title}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </TimelineItem>
              ))}
            </Fragment>
          ))}
        </Timeline>
      </div>
    </section>
  );
}
