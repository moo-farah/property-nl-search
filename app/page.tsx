import { Suspense } from "react";
import PageFrame from "./components/PageFrame";
import SearchExperience from "./components/SearchExperience";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
    return (
        <PageFrame>
            <Suspense fallback={<Skeleton className="h-9 w-full rounded-full bg-white/30" />}>
                <SearchExperience />
            </Suspense>
        </PageFrame>
    );
}
