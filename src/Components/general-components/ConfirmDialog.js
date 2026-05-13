import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "../../Styles/general-styles/ConfirmDialog.css";

// Reusable yes/no confirmation popup.
//
// Why a portal: many module pages wrap their content in surfaces that use
// `backdrop-filter`, which creates a new containing block and traps any
// `position: fixed` descendant inside that surface (we hit this with the
// per-module delete-history modals). Rendering through document.body via
// createPortal bypasses the entire ancestor chain so the overlay always
// covers the real viewport.
//
// Props:
//   open          — boolean, render only when true
//   title         — main question line (defaults to "Are you sure?")
//   message       — optional secondary line below the title
//   confirmLabel  — text for the confirm button (default "Yes")
//   cancelLabel   — text for the cancel button (default "No")
//   confirmTone   — "primary" (purple) | "danger" (red)
//   busy          — disable the confirm button & show "..." while a
//                   handler runs (callers set this around an async op)
//   onConfirm     — invoked when user clicks the confirm button
//   onCancel      — invoked when user clicks cancel, the backdrop, or Esc

const ConfirmDialog = ({
    open,
    title = "Are you sure?",
    message,
    confirmLabel = "Yes",
    cancelLabel = "No",
    confirmTone = "primary",
    busy = false,
    onConfirm,
    onCancel,
}) => {
    // Close on Esc; mirror the implicit behaviour of window.confirm being
    // dismissible from the keyboard.
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape" && !busy && onCancel) onCancel();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, busy, onCancel]);

    if (!open) return null;

    return createPortal(
        <div
            className="cd-overlay"
            role="presentation"
            onClick={() => {
                if (!busy && onCancel) onCancel();
            }}
        >
            <div
                className="cd-modal"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="cd-title">{title}</div>
                {message && <div className="cd-message">{message}</div>}

                <div className="cd-actions">
                    <button
                        type="button"
                        className="cd-cancel"
                        onClick={onCancel}
                        disabled={busy}
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        className={`cd-confirm ${
                            confirmTone === "danger" ? "cd-confirm-danger" : ""
                        }`}
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy ? "..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmDialog;
