import { useState } from "react";
import SearchResults from "./SearchResults";

export default function SearchBar({ className }: { className?: string }) {
    const [query, setQuery] = useState("");
    const [focused, setFocused] = useState(false);

    return (
        <div
            className={className}
            onFocus={() => setFocused(true)}
            // only close when focus leaves the whole block, not when it moves to a result
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}
        >
            <div className="relative flex items-center gap-2 bg-[#833434] rounded-3xl px-4 py-2 focus-within:bg-[#983d3d]">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="w-4 h-4 shrink-0 text-zinc-400"
                >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.8-3.8" />
                </svg>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tracks"
                    className="flex-1 min-w-0 bg-transparent text-white text-sm outline-none placeholder:text-zinc-400 focus:placeholder:text-white"
                />
                {focused && query.trim() && <SearchResults query={query} />}
            </div>
        </div>
    );
}
