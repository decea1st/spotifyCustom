type Props = {
    paused: boolean;
    disabled: boolean;
    onTogglePlay: () => void;
    onPrev: () => void;
    onNext: () => void;
};

export default function Controls({ paused, disabled, onTogglePlay, onNext, onPrev }: Props) {
    return (
        <div className="fixed bottom-0 left-0 w-full h-[70px] bg-zinc-900 border-t border-zinc-700 flex items-center justify-center gap-6">
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
