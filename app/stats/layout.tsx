import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Search stats",
    description: "How recent searches on this server turned out.",
};

export default function StatsLayout({ children }: LayoutProps<"/stats">) {
    return children;
}
