"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Heart, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useFavorites } from "@/lib/favorites";

export default function SiteNav() {
    const pathname = usePathname();
    const { ids } = useFavorites();
    const savedCount = ids.length;

    return (
        <nav aria-label="Primary" className="flex flex-wrap items-center justify-end gap-2">
            <NavLink href="/" current={pathname === "/"}>
                <Search className="size-4" aria-hidden="true" />
                Search
            </NavLink>
            <NavLink href="/stats" current={pathname === "/stats"}>
                <BarChart3 className="size-4" aria-hidden="true" />
                Stats
            </NavLink>
            <NavLink href="/saved" current={pathname === "/saved"}>
                <Heart className="size-4" aria-hidden="true" />
                Saved
                <span className="rounded-full bg-white/20 px-1.5 text-xs tabular-nums">
                    {savedCount}
                </span>
            </NavLink>
        </nav>
    );
}

function NavLink({
    href,
    current,
    children,
}: {
    href: string;
    current: boolean;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            aria-current={current ? "page" : undefined}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium backdrop-blur-md transition-colors ${
                current
                    ? "bg-white text-slate-900"
                    : "border border-white/30 bg-white/10 text-white hover:bg-white/20"
            }`}
        >
            {children}
        </Link>
    );
}
