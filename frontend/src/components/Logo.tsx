import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Logo({ className = "h-6 w-6", style, ...rest }: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            aria-hidden="true"
            {...rest}
            className={cn("inline-block shrink-0 bg-current", className)}
            style={{ mask: 'url("/icon.svg") center / contain no-repeat', ...style }}
        />
    );
}
