interface BorderBeamProps {
  paused?: boolean;
  duration?: number;
}

export function BorderBeam({ paused = false, duration = 8 }: BorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      className={`firecracker pointer-events-none absolute inset-0 z-20 rounded-[inherit] ${paused ? "motion-paused" : ""}`}
      style={{ "--fuse-duration": `${duration}s` } as React.CSSProperties}
    >
      <span className="firecracker-thread" />
      <span className="firecracker-trail-window">
        <span className="firecracker-trail" />
      </span>
      <span className="firecracker-spark">
        <span className="firecracker-core" />
        {[-125, -90, -55].map((angle, index) => (
          <span
            key={index}
            className="firecracker-ray"
            style={
              {
                "--ray-angle": `${angle}deg`,
                animationDelay: `${-index * 0.12}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </span>
    </div>
  );
}
