import { useEffect, useState } from "react";
import clsx from "clsx";
import { getDevices, transferPlayback } from "../userdata/spotifyApi";
import { usePlayerContext } from "../player/PlayerContext";
import type { Device } from "../types";

export default function DeviceView({ onBack }: { onBack: () => void }) {
    const { deviceId } = usePlayerContext(); // this app's own device, to label it
    const [devices, setDevices] = useState<Device[]>([]);

    // fetched once on open rather than polled, the list rarely changes while it's up
    useEffect(() => {
        getDevices().then(setDevices).catch(console.error);
    }, []);

    const pick = (id: string) => {
        transferPlayback(id).then(onBack).catch(console.error);
    };

    return (
        <div className="w-full p-6">
            <button
                onClick={onBack}
                className="cursor-pointer text-[var(--text)] text-sm mb-4 hover:text-[var(--text-faint)]"
            >
                ← Back
            </button>

            <h1 className="text-[var(--text)] text-[28px] leading-tight font-semibold mb-6">Devices</h1>

            <ol className="flex flex-col gap-1">
                {devices.map((d) => (
                    <li key={d.id ?? d.name}>
                        <button
                            onClick={() => d.id && pick(d.id)}
                            // a null id or a restricted device can't be controlled through the API
                            disabled={!d.id || d.is_restricted || d.is_active}
                            className={clsx(
                                "group w-full flex flex-col px-3 py-2 rounded-md text-left cursor-pointer transition-colors duration-150 disabled:cursor-default",
                                d.is_active
                                    ? "bg-[var(--card)]"
                                    : "hover:bg-[var(--card)] disabled:opacity-50 disabled:hover:bg-transparent"
                            )}
                        >
                            <p className={clsx(
                                "text-[18px] truncate transition-colors duration-150",
                                d.is_active
                                    ? "text-[var(--text-on-card)]"
                                    : "text-[var(--text)] group-hover:text-[var(--text-on-card)] group-disabled:text-[var(--text)]"
                            )}>
                                {d.name}
                                {d.id === deviceId && " (this app)"}
                            </p>
                            <p className={clsx(
                                "text-[14px] truncate transition-colors duration-150",
                                d.is_active
                                    ? "text-[var(--text-on-card-muted)]"
                                    : "text-[var(--text-muted)] group-hover:text-[var(--text-on-card-muted)] group-disabled:text-[var(--text-muted)]"
                            )}>
                                {d.is_active ? "Playing now" : d.type}
                            </p>
                        </button>
                    </li>
                ))}
            </ol>
        </div>
    );
}
