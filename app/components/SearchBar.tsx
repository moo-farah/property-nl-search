"use client";

import { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type SearchBarprops = {
    onSearch: (query: string) => void;
    disabled?: boolean;
};

const SearchBar = ({ onSearch, disabled = false }: SearchBarprops) => {
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
      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
      size={16}
      />
        <Input
        name="query"
        maxLength={200}
        placeholder="2 bed in Marina under 120k"
        aria-label="Search listings"
        className="h-9 pl-9"
        disabled={disabled}
      />
      </div>
      <Button
        type="submit" 
        size="lg"
        disabled={disabled}
        className="rounded-full">
        Search
      </Button>
    </form>
  )
}

export default SearchBar