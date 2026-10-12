"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="border-t border-rrc-line">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="border-b border-rrc-line">
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between py-4 text-left"
            >
              <span className="text-t-ui uppercase tracking-widest text-rrc-silver">
                {item.title}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-rrc-off transition-transform duration-300",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                isOpen ? "max-h-96 pb-4 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
