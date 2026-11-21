import { useEffect, useState } from "react";
import clsx from "clsx";
import { getDevices, transferPlayback } from "../userdata/spotifyApi";
import { usePlayerContext } from "../player/PlayerContext";
import type { Device } from "../types";

export default function DeviceView({ onBack }: { onBack: () => void }) {
    const { deviceId, refreshRemote } = usePlayerContext(); // deviceId is this app's own, to label it
    const [devices, setDevices] = useState<Device[]>([]);

    // fetched once on open rather than polled, the list rarely changes while it's up
    useEffect(() => {
        getDevices().then(setDevices).catch(console.error);
    }, []);

    const pick = (id: string) => {
        transferPlayback(id)
            .then(() => {
                // re-check now instead of on the next 2.5s poll, so the bar catches up sooner
                refreshRemote();
                onBack();
            })
            .catch(console.error);
    };

    return (
        <div className="w-full p-6">
            <button onClick={onBack} className="cursor-pointer text-on-panel text-sm mb-4 hover:text-on-panel-faint">
                ← Back
            </button>

            <h1 className="text-on-panel text-[28px] leading-tight font-semibold mb-6">Devices</h1>

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
                                    ? "bg-card"
                                    : "hover:bg-card disabled:opacity-50 disabled:hover:bg-transparent",
                            )}
                        >
                            <p
                                className={clsx(
                                    "text-[18px] truncate transition-colors duration-150",
                                    d.is_active
                                        ? "text-on-card"
                                        : "text-on-panel group-hover:text-on-card group-disabled:text-on-panel",
                                )}
                            >
                                {d.name}
                                {d.id === deviceId && " (this app)"}
                            </p>
                            <p
                                className={clsx(
                                    "text-[14px] truncate transition-colors duration-150",
                                    d.is_active
                                        ? "text-on-card-muted"
                                        : "text-on-panel-muted group-hover:text-on-card-muted group-disabled:text-on-panel-muted",
                                )}
                            >
                                {d.is_active ? "Playing now" : d.type}
                            </p>
                        </button>
                    </li>
                ))}
            </ol>
        </div>
    );
}
