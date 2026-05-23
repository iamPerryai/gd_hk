"use client";

import { type ReactNode } from "react";
import AnimatedOrbs from "./AnimatedOrbs";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AnimatedOrbs count={5} />
      {children}
    </>
  );
}
