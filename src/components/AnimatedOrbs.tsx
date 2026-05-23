"use client";

import { useEffect, useState } from "react";

interface Orb {
  id: number;
  size: number;
  x: number;
  y: number;
  color: string;
  speedX: number;
  speedY: number;
}

/** Generate deterministic orbs from a seed so they're stable across re-renders */
function generateOrbs(seed: number, count: number): Orb[] {
  const colors = [
    "rgba(74,124,89,0.12)",   // green
    "rgba(212,168,83,0.10)",  // gold
    "rgba(139,160,200,0.10)", // blue
    "rgba(180,140,200,0.08)", // purple
  ];

  const orbs: Orb[] = [];
  for (let i = 0; i < count; i++) {
    const phi = (seed * (i + 1) * 0.618033988749895) % 1;
    const theta = (seed * (i + 1) * 0.3819660112501051) % 1;
    orbs.push({
      id: i,
      size: 120 + (phi * 280),
      x: theta * 100,
      y: phi * 100,
      color: colors[i % colors.length],
      speedX: (phi - 0.5) * 0.3,
      speedY: (theta - 0.5) * 0.3,
    });
  }
  return orbs;
}

interface AnimatedOrbsProps {
  count?: number;
  className?: string;
}

export default function AnimatedOrbs({ count = 5, className = "" }: AnimatedOrbsProps) {
  const [orbs, setOrbs] = useState<Orb[]>([]);

  useEffect(() => {
    // Use a fixed seed so orbs are stable
    setOrbs(generateOrbs(42, count));
  }, [count]);

  if (orbs.length === 0) return null;

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}
      aria-hidden="true"
    >
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full blur-3xl"
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            backgroundColor: orb.color,
            animation: `orb-float-${orb.id} ${18 + orb.id * 3}s ease-in-out infinite`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Inject keyframes once */}
      <style jsx>{`
        ${orbs
          .map(
            (orb) => `
          @keyframes orb-float-${orb.id} {
            0%, 100% {
              transform: translate(-50%, -50%) translate(0px, 0px) scale(1);
            }
            25% {
              transform: translate(-50%, -50%) translate(${orb.speedX * 40}px, ${orb.speedY * 40}px) scale(1.08);
            }
            50% {
              transform: translate(-50%, -50%) translate(${-orb.speedX * 30}px, ${-orb.speedY * 20}px) scale(0.95);
            }
            75% {
              transform: translate(-50%, -50%) translate(${orb.speedY * 30}px, ${-orb.speedX * 35}px) scale(1.04);
            }
          }
        `,
          )
          .join("\n")}
      `}</style>
    </div>
  );
}
