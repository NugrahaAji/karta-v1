"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { clsx } from "clsx";

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * Custom Select component — Shadcn-style, uses global design system tokens.
 */
export function Select({
    options,
    value,
    onChange,
    placeholder = "Select...",
    disabled = false,
    className,
}: SelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.value === value);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    return (
        <div ref={ref} className={clsx("relative", className)}>
            {/* Trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(o => !o)}
                className={clsx(
                    "input flex items-center justify-between w-full text-left",
                    disabled && "opacity-40 cursor-not-allowed",
                    open && "border-accent",
                )}
                style={{ color: selected ? "var(--text-primary)" : "var(--text-muted)" }}
            >
                <span>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    className={clsx(
                        "w-4 h-4 shrink-0 transition-transform duration-200",
                        open && "rotate-180"
                    )}
                    style={{ color: "var(--text-muted)" }}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden animate-in card"
                    style={{ border: "1px solid var(--border)" }}
                >
                    <div className="max-h-56 overflow-y-auto">
                        {options.length === 0 ? (
                            <div className="px-3 py-2.5 text-sm t-muted">No options</div>
                        ) : (
                            options.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    className={clsx(
                                        "w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors",
                                        opt.value === value
                                            ? "bg-accent-muted"
                                            : "t-primary"
                                    )}
                                    onMouseEnter={e => {
                                        if (opt.value !== value)
                                            (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-3)";
                                    }}
                                    onMouseLeave={e => {
                                        if (opt.value !== value)
                                            (e.currentTarget as HTMLElement).style.backgroundColor = "";
                                    }}
                                >
                                    {opt.label}
                                    {opt.value === value && <Check className="w-3.5 h-3.5 accent-spinner shrink-0" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
