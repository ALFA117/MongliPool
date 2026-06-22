import { useState } from "react";
import { useScrollReveal } from "../lib/useScrollReveal";

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

export default function Reveal({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  if (isMobile) {
    return <div className={className}>{children}</div>;
  }

  const { ref, visible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
