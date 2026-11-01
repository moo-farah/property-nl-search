import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Saved listings",
    description: "Listings you saved in this browser.",
};

export default function SavedLayout({ children }: LayoutProps<"/saved">) {
    return children;
}
