import type { ComponentType, SVGProps } from "react";

export type SimpleIconData = {
  title: string;
  path: string;
  hex: string;
};

export function makeSimpleIcon(
  icon: SimpleIconData,
): ComponentType<SVGProps<SVGSVGElement>> {
  function SimpleIcon({ style, ...props }: SVGProps<SVGSVGElement>) {
    return (
      <svg
        role="img"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: `#${icon.hex}`, ...style }}
        {...props}
      >
        <path d={icon.path} />
      </svg>
    );
  }

  SimpleIcon.displayName = `${icon.title.replace(/[^a-zA-Z0-9]/g, "")}Icon`;

  return SimpleIcon;
}
