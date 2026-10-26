"use client";

import { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
        <Input
        name="query"
        maxLength={200}
        placeholder="2 bed in Marina under 120k"
        aria-label="Search listings"
        className="h-9 min-w-0 flex-1"
        disabled={disabled}
      />
      <Button type="submit" size="lg" disabled={disabled}>
        Search
      </Button>
    </form>
  )
}

export default SearchBar