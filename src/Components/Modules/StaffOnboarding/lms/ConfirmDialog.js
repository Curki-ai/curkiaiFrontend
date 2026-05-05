import React from "react";

// Shared confirmation dialog for the LMS — replaces window.confirm so the
// look matches the Smart Onboarding HRAdminView delete dialog. Render
// unconditionally; the component returns null when `open` is false.
//
// `danger` switches the confirm button to red and uses a trash icon. When
// false, the button is the LMS purple and the icon is a warning triangle.
const TrashIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18"></path>
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
    <path d="M10 11v6"></path>
    <path d="M14 11v6"></path>
  </svg>
);

const WarnIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const ConfirmDialog = ({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  busyLabel,
  error = "",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const handleOverlayClick = () => {
    if (busy) return;
    onCancel && onCancel();
  };

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ulms-confirm-dialog-title"
        aria-describedby={children ? "ulms-confirm-dialog-desc" : undefined}
      >
        <div
          className={`confirm-dialog-icon ${danger ? "" : "warn"}`}
          aria-hidden="true"
        >
          {danger ? <TrashIcon /> : <WarnIcon />}
        </div>

        <h3 id="ulms-confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </h3>

        {children && (
          <p id="ulms-confirm-dialog-desc" className="confirm-dialog-desc">
            {children}
          </p>
        )}

        {error && (
          <div className="confirm-dialog-error" role="alert">
            {error}
          </div>
        )}

        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-btn confirm-dialog-btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-dialog-btn ${
              danger ? "confirm-dialog-btn-danger" : "confirm-dialog-btn-primary"
            }`}
            onClick={onConfirm}
            disabled={busy}
            autoFocus
          >
            {busy && busyLabel ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
