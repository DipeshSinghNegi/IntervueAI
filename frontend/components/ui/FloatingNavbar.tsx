"use client";
import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: JSX.Element;
  }[];
  className?: string;
}) => {
  return (
    <div
      className={cn(
        // Sticky instead of fixed; sits at the top where it starts
        "sticky top-0 z-[5000] w-full",
        className
      )}
    >
      <div
        className={cn(
          // same visual styles you had, just not floating anymore
          "mx-auto mt-14 flex max-w-3xl md:min-w-[70vw] lg:min-w-fit",
          "px-8 py-5 rounded-lg items-center justify-center space-x-4",
          "border border-black/10 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
        )}
        style={{
          backdropFilter: "blur(16px) saturate(180%)",
          backgroundColor: "rgba(17, 25, 40, 0.75)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.125)",
        }}
      >
        {navItems.map((navItem, idx) => (
          <Link
            key={`link-${idx}`}
            href={navItem.link}
            className={cn(
              "relative items-center flex space-x-1",
              "text-neutral-600 dark:text-neutral-50",
              "hover:text-neutral-500 dark:hover:text-neutral-300"
            )}
          >
            {navItem.icon && <span className="block">{navItem.icon}</span>}
            <span className="text-sm md:!text-xl !cursor-pointer">
              {navItem.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
