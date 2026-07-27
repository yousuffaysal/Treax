/**
 * Icon set transcribed 1:1 from the inline SVGs in Treax.dc.html.
 * Every path here has a line reference back to the prototype so the port stays
 * auditable. Stroke widths and viewBoxes are unchanged.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Treax wordmark glyph — the house/beam mark (line 177) */
export const BrandMark = (p: IconProps) => (
  <Svg {...p} strokeWidth="2.4">
    <path d="M12 3 4 9v12h5v-7h6v7h5V9z" />
    <path d="M9.5 3.5 12 2l2.5 1.5" />
  </Svg>
);

/** Ideas / home — the lightbulb (line 189) */
export const IdeasIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 18h6M10.5 21h3" />
    <path d="M12 3a6 6 0 0 0-3.8 10.6c.6.5.8 1 .8 1.9v.5h6v-.5c0-.9.2-1.4.8-1.9A6 6 0 0 0 12 3z" />
  </Svg>
);

/** Team / explore — two people (line 193) */
export const TeamIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9.5" cy="7" r="3.5" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.5a3.5 3.5 0 0 1 0 6.8" />
  </Svg>
);

/** Market — the storefront (line 197) */
export const MarketIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 9 5 4h14l1.5 5" />
    <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
    <path d="M3.5 9h17" />
    <path d="M9.5 20v-6h5v6" />
  </Svg>
);

/** Learn — the open book (line 201) */
export const LearnIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6.5C10.5 5.2 8 4.7 4 5.2v13c4-.5 6.5 0 8 1.3 1.5-1.3 4-1.8 8-1.3v-13c-4-.5-6.5 0-8 1.3z" />
    <path d="M12 6.5V19.8" />
  </Svg>
);

/** Experts — the mortarboard (line 205) */
export const ExpertsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M22 10 12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
    <path d="M22 10v5" />
  </Svg>
);

/** AI — the twin sparkles (line 209) */
export const SparkIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15l-1.7-4L6 9.3l4.3-1.7z" />
    <path d="M19 14l.7 1.9L21.5 16.6l-1.8.7L19 19l-.7-1.7-1.8-.7 1.8-.7z" />
  </Svg>
);

/** Notifications bell (line 219) */
export const BellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 2 9 2 9H4s2-2 2-9" />
    <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
  </Svg>
);

/** Language globe (line 225) */
export const GlobeIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Svg>
);

/** Theme — sun (line 228) */
export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
  </Svg>
);

/** Theme — moon (line 229) */
export const MoonIcon = ({ size = 24, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...rest}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

/** Plus — post an update (line 233) */
export const PlusIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth="2.4">
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

/** Messages (line 238) */
export const MessageIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

/** Search (line 183) */
export const SearchIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth="2.2">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);

/** Profile — single person (line 426) */
export const PersonIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

/** AI Studio — sparkle pair for the rail (line 428) */
export const StudioIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15l-1.7-4L6 9.3l4.3-1.7z" />
    <path d="M19 14l.6 1.7 1.7.6-1.7.6L19 19l-.6-1.5-1.7-.6 1.7-.6z" />
  </Svg>
);

/** AI Filter — the star (line 430) */
export const FilterStarIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l1.9 4.9L19 9.8l-4.2 3.1L16 18l-4-2.7L8 18l1.2-5.1L5 9.8l5.1-1.9z" />
  </Svg>
);

/** Signal Rush — the gamepad (line 432) */
export const GameIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="6" width="20" height="12" rx="4" />
    <path d="M6 12h4M8 10v4M15.5 11h.01M18 13.5h.01" />
  </Svg>
);

/** Agent — sparkle with satellite (line 434) */
export const AgentIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 15l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
  </Svg>
);

/** Superadmin — the checked shield (line 437) */
export const ShieldIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6z" />
    <path d="M9.2 12.2l2 2 3.6-3.8" />
  </Svg>
);

/** Setup profile — the cog (line 440) */
export const CogIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.4.98 2 2 0 1 1-3.6-1.3 1.65 1.65 0 0 0-1.4-.9 1.65 1.65 0 0 0-1.4.9 2 2 0 1 1-3.6 1.3 1.65 1.65 0 0 0-.98-2.4 2 2 0 1 1 1.3-3.6 1.65 1.65 0 0 0 .9-1.4 1.65 1.65 0 0 0-.9-1.4 2 2 0 1 1 1.3-3.6" />
  </Svg>
);

/** Solid star used for section headings (line 448) */
export const StarSolidIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...rest}>
    <path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15l-1.7-4L6 9.3l4.3-1.7z" />
  </svg>
);

/** Big solid star for the "Your week, by AI" heading (line 1040) */
export const StarBigSolidIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...rest}>
    <path d="M12 3l1.9 4.9L19 9.8l-4.2 3.1L16 18l-4-2.7L8 18l1.2-5.1L5 9.8l5.1-1.9z" />
  </svg>
);

/** Check (line 283) */
export const CheckIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth="2.6">
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

/** Cross (line 278) */
export const CrossIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth="2.4">
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

/** Arrow right (line 322) */
export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth="2.6">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

/** Image placeholder (line 1005) */
export const ImageIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.6" />
    <path d="m21 15-5-5L5 21" />
  </Svg>
);

/** Simple shield outline for the admin pill (line 997) */
export const ShieldPillIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth="2.2">
    <path d="M12 2 4 6v6c0 5 3.4 8 8 10 4.6-2 8-5 8-10V6z" />
  </Svg>
);
