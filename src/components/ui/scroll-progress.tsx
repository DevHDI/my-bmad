"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, useScroll, useSpring, useMotionValueEvent } from "motion/react";

interface ScrollProgressProps {
  className?: string;
}

export function ScrollProgress({ className }: ScrollProgressProps) {
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 50,
    restDelta: 0.001,
  });
  const [visible, setVisible] = useState(false);

  // Reset on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    scaleX.set(0);
    setVisible(false);
  }, [pathname, scaleX]);

  // Only show when user has actually scrolled
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 1;
    setVisible(isScrollable && v > 0.01);
  });

  return (
    <motion.div
      className={cn(
        "absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-gradient-to-r from-gradient-purple via-gradient-pink via-60% to-gradient-peach",
        className,
      )}
      style={{ scaleX, opacity: visible ? 1 : 0 }}
    />
  );
}
