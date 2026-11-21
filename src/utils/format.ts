// 215000 -> "3:35". Used for track lengths and the seek bar's time label.
export const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    return `${Math.floor(totalSeconds / 60)}:${String(seconds).padStart(2, "0")}`;
};
