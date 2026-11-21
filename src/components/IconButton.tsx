import type { ReactNode } from "react";

type Props = {
    label: string; // read by screen readers and shown as a tooltip, since the button has no text
    onClick: () => void;
    disabled?: boolean;
    children: ReactNode;
};

// A bare icon on the control bar: muted until hovered.
export default function IconButton({ label, onClick, disabled, children }: Props) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className="cursor-pointer text-on-card-muted transition duration-150 hover:text-on-card disabled:cursor-default disabled:opacity-40 disabled:hover:text-on-card-muted"
        >
            {children}
        </button>
    );
}
