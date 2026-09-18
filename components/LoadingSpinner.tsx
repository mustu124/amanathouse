"use client";

import { motion } from "framer-motion";

export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 text-amanat-brown" role="status" aria-live="polite">
      <svg aria-hidden="true" width="36" height="36" viewBox="0 0 48 48" className="shrink-0">
        {[12, 24, 36].map((cx, index) => (
          <motion.circle
            key={cx}
            cx={cx}
            cy="24"
            r="8"
            fill="none"
            stroke={index === 1 ? "#A23E2C" : "#7A6E66"}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0.25, rotate: 0 }}
            animate={{ pathLength: [0.25, 0.9, 0.25], rotate: 360 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.12 }}
            style={{ originX: "50%", originY: "50%" }}
          />
        ))}
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
