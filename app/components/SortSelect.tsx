import { ChevronDown } from "lucide-react";
import { isSortKey, SORT_OPTIONS, type SortKey } from "@/lib/sortListings";

type SortSelectProps = {
    value: SortKey;
    onChange: (sort: SortKey) => void;
};

export default function SortSelect({ value, onChange }: SortSelectProps) {
    return (
        <label className="flex items-center gap-2 text-sm text-white/85">
            Sort by
            <div className="relative">
                <select
                    value={value}
                    onChange={(event) => {
                        if (isSortKey(event.target.value)) onChange(event.target.value);
                    }}
                    className="h-9 appearance-none rounded-full bg-white/95 pl-4 pr-10 text-sm text-slate-900 shadow-md outline-none focus-visible:ring-3 focus-visible:ring-amber-400/60"
                >
                    {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
                />
            </div>
        </label>
    );
}
