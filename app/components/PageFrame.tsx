import type { ReactNode } from "react";
import Background from "./Background";
import SiteNav from "./SiteNav";

type PageFrameProps = {
    children: ReactNode;
};

export default function PageFrame({ children }: PageFrameProps) {
    return (
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
            <Background />
            <SiteNav />
            {children}
        </main>
    );
}
