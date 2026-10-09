// This file provides TypeScript declarations for CSS imports used in Next.js App Router
// Next.js uses its own types for CSS side-effect imports in layout.tsx

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "canvas-confetti" {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }
  function confetti(options?: ConfettiOptions): void;
  export default confetti;
}
