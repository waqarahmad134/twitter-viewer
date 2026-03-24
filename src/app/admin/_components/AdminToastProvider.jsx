"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function ToastItem({ toast, onClose }) {
  const toneClass =
    toast.type === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div className={`rounded-lg border px-4 py-3 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm">{toast.message}</div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="text-xs opacity-70 hover:opacity-100"
          aria-label="Close toast"
        >
          x
        </button>
      </div>
    </div>
  );
}

export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (msg) => push(msg, "success"),
      error: (msg) => push(msg, "error"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] w-[360px] max-w-[90vw] space-y-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  return useContext(ToastContext) || {
    success: () => {},
    error: () => {},
  };
}

