type Props = {
    image?: string | null;
    name?: string | null;
    artists?: Spotify.Entity[] | null;
    paused: boolean;
    disabled: boolean;
    onTogglePlay: () => void;
    onPrev: () => void;
    onNext: () => void;
};

export default function Controls({ image, name, artists, paused, disabled, onTogglePlay, onNext, onPrev }: Props) {
    return (
        <div className="fixed bottom-0 left-0 w-full h-[70px] bg-zinc-900 border-t border-zinc-700 flex items-center justify-center gap-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 max-w-[30%]">
                {image && (
                    <img
                        src={image}
                        alt=""
                        className="w-14 h-14 rounded object-cover shrink-0"
                    />
                )}
                <div className="flex flex-col min-w-0">
                    {name && <p className="text-white text-[13.5px] font-medium truncate">{name}</p>}
                    {artists && artists.length > 0 && (
                        <p className="text-zinc-400 text-[13px] truncate">
                            {artists.map((a) => a.name).join(", ")}
                        </p>
                    )}
                </div>
            </div>

            <button
                onClick={onPrev}
                disabled={disabled}
                className="cursor-pointer text-white disabled:cursor-default disabled:opacity-40"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M6 5h2v14H6zM20 5v14L9 12z" />
                </svg>
            </button>

            <button
                onClick={onTogglePlay}
                disabled={disabled}
                className="cursor-pointer w-12 h-12 rounded-full bg-zinc-700 text-white flex items-center justify-center hover:bg-zinc-600 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-zinc-700"
            >
                {paused ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-0.5">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M8 5h3v14H8zM13 5h3v14h-3z" />
                    </svg>
                )}
            </button>

            <button
                onClick={onNext}
                disabled={disabled}
                className="cursor-pointer text-white disabled:cursor-default disabled:opacity-40"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
                </svg>
            </button>
        </div>
    );
}
