"use client";

import { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type SearchBarprops = {
    onSearch: (query: string) => void;
    disabled?: boolean;
    defaultQuery?: string;
};

const SearchBar = ({ onSearch, disabled = false, defaultQuery = "" }: SearchBarprops) => {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const query = String(new FormData(event.currentTarget).get("query") ?? "").trim();
        if (query.length === 0) return;
        onSearch(query);
    }
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative min-w-0 flex-1">
      <Search 
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
      />
        <Input
        name="query"
        defaultValue={defaultQuery}
        maxLength={200}
        placeholder="2 bed in Marina under 120k"
        aria-label="Search listings"
        className="h-9 border-white/20 bg-white/95 pl-9 text-slate-900 placeholder:text-slate-500"
        disabled={disabled}
      />
      </div>
      <Button
        type="submit" 
        size="lg"
        disabled={disabled}
        className="rounded-full bg-rose-500 px-5 font-semibold text-slate-50 hover:bg-rose-300">
        Search
      </Button>
    </form>
  )
}

export default SearchBar