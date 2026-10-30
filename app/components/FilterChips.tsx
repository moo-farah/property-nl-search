"use client";

import { ChevronDown, X } from "lucide-react";
import { useRef, useState } from "react";
import {
    chipsFromFilters,
    removeChip,
    updateChip,
    type FilterChip,
} from "@/lib/editFilters";
import {
    AmenitySchema,
    AreaSchema,
    FurnishedSchema,
    ListingTypeSchema,
    PropertyTypeSchema,
    type Filters,
} from "@/lib/schema";

type FilterChipsProps = {
    filters: Filters;
    onChange: (update: (filters: Filters) => Filters) => void;
};

type Choice = {
    value: string;
    label: string;
};

const BEDROOMS = [0, 1, 2, 3, 4, 5] as const;

function label(value: string): string {
    const text = value.replace(/_/g, " ");
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function bedroomLabel(value: number): string {
    if (value === 0) return "Studio";
    return value === 1 ? "1 bed" : `${value} beds`;
}

function chipKey(chip: FilterChip): string {
    return chip.kind === "amenity" ? `amenity:${chip.value}` : chip.kind;
}

function fieldLabel(kind: FilterChip["kind"]): string {
    switch (kind) {
        case "area":
            return "Area";
        case "type":
            return "Property type";
        case "listingType":
            return "Listing type";
        case "bedrooms":
            return "Bedrooms";
        case "furnished":
            return "Furnishing";
        case "amenity":
            return "Amenity";
        case "minPriceAed":
            return "Minimum price";
        case "maxPriceAed":
            return "Maximum price";
    }
}

function removeLabel(chip: FilterChip): string {
    switch (chip.kind) {
        case "area":
            return `Remove ${chip.value} filter`;
        case "type":
        case "listingType":
        case "furnished":
        case "amenity":
            return `Remove ${label(chip.value)} filter`;
        case "bedrooms":
            return `Remove ${bedroomLabel(chip.value)} filter`;
        case "minPriceAed":
            return "Remove minimum price filter";
        case "maxPriceAed":
            return "Remove maximum price filter";
    }
}

function choicesFor(chip: FilterChip, filters: Filters): Choice[] {
    switch (chip.kind) {
        case "area":
            return AreaSchema.options.map((value) => ({ value, label: value }));
        case "type":
            return PropertyTypeSchema.options.map((value) => ({ value, label: label(value) }));
        case "listingType":
            return ListingTypeSchema.options.map((value) => ({ value, label: label(value) }));
        case "furnished":
            return FurnishedSchema.options.map((value) => ({ value, label: label(value) }));
        case "bedrooms":
            return BEDROOMS.map((value) => ({
                value: String(value),
                label: bedroomLabel(value),
            }));
        case "amenity": {
            const used = new Set(filters.amenities ?? []);
            return AmenitySchema.options
                .filter((value) => value === chip.value || !used.has(value))
                .map((value) => ({ value, label: label(value) }));
        }
        case "minPriceAed":
        case "maxPriceAed":
            return [];
    }
}

function selectedLabel(chip: FilterChip, options: Choice[]): string {
    if (chip.kind === "bedrooms") return bedroomLabel(chip.value);
    const selected = options.find((option) => option.value === String(chip.value));
    return selected?.label ?? String(chip.value);
}

export default function FilterChips({ filters, onChange }: FilterChipsProps) {
    const chips = chipsFromFilters(filters);

    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm text-white/85 drop-shadow-sm">
                {chips.length === 0 ? "Showing every listing" : "Searching for"}
            </p>
            {chips.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    <p className="sr-only">Change a filter or remove it. Listings update immediately.</p>
                    {chips.map((chip) => (
                        <ChipControl
                            key={chipKey(chip)}
                            chip={chip}
                            filters={filters}
                            onValue={(value) => onChange((current) => updateChip(current, chip, value))}
                            onRemove={() => onChange((current) => removeChip(current, chip))}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function ChipControl({
    chip,
    filters,
    onValue,
    onRemove,
}: {
    chip: FilterChip;
    filters: Filters;
    onValue: (value: string | number) => void;
    onRemove: () => void;
}) {
    const options = choicesFor(chip, filters);

    return (
        <span className="inline-flex h-9 items-center rounded-full bg-sky-100 text-sm text-sky-950 shadow-sm">
            {chip.kind === "minPriceAed" || chip.kind === "maxPriceAed" ? (
                <PriceField
                    prefix={chip.kind === "minPriceAed" ? "From" : "Up to"}
                    value={chip.value}
                    onValue={onValue}
                />
            ) : (
                <EnumField
                    ariaLabel={fieldLabel(chip.kind)}
                    value={String(chip.value)}
                    selected={selectedLabel(chip, options)}
                    options={options}
                    onValue={onValue}
                />
            )}
            <button
                type="button"
                aria-label={removeLabel(chip)}
                onClick={onRemove}
                className="mr-1 inline-flex size-7 items-center justify-center rounded-full text-sky-800 hover:bg-sky-200 hover:text-sky-950 focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:outline-none"
            >
                <X className="size-3.5" aria-hidden="true" />
            </button>
        </span>
    );
}

function EnumField({
    ariaLabel,
    value,
    selected,
    options,
    onValue,
}: {
    ariaLabel: string;
    value: string;
    selected: string;
    options: Choice[];
    onValue: (value: string) => void;
}) {
    return (
        <span className="relative grid items-center">
            <span
                aria-hidden="true"
                className="invisible col-start-1 row-start-1 pr-7 pl-3 font-medium whitespace-nowrap"
            >
                {selected}
            </span>
            <select
                aria-label={ariaLabel}
                value={value}
                onChange={(event) => onValue(event.target.value)}
                className="col-start-1 row-start-1 h-9 w-full cursor-pointer appearance-none bg-transparent pr-7 pl-3 font-medium text-sky-950 outline-none focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-amber-400/70"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-1 size-3.5 -translate-y-1/2 text-sky-700"
            />
        </span>
    );
}

function PriceField({
    prefix,
    value,
    onValue,
}: {
    prefix: string;
    value: number;
    onValue: (value: number) => void;
}) {
    const [draft, setDraft] = useState(String(value));
    const [editing, setEditing] = useState(false);
    const skipCommit = useRef(false);
    const shown = editing ? draft : value.toLocaleString("en-AE");

    function commit(raw: string) {
        if (skipCommit.current) {
            skipCommit.current = false;
            setEditing(false);
            return;
        }

        setEditing(false);
        const digits = raw.replace(/[\s,]/g, "");
        if (!/^\d+$/.test(digits)) return;
        const next = Number(digits);
        if (next !== value) onValue(next);
    }

    return (
        <span className="inline-flex items-center gap-1 pr-1 pl-3">
            <span className="text-sky-800">{prefix}</span>
            <input
                aria-label={`${prefix} price in AED`}
                inputMode="numeric"
                size={Math.max(shown.length, 1)}
                value={shown}
                onFocus={() => {
                    setDraft(String(value));
                    setEditing(true);
                }}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={(event) => commit(event.currentTarget.value)}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        event.currentTarget.blur();
                    }
                    if (event.key === "Escape") {
                        event.preventDefault();
                        skipCommit.current = true;
                        event.currentTarget.blur();
                    }
                }}
                className="bg-transparent font-medium text-sky-950 outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-amber-400/70"
            />
            <span className="text-sky-800">AED</span>
        </span>
    );
}
