import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export default function Toast({ message, type = "info", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const typeConfig = {
    success: {
      bg: "bg-[#F3F7EE] border-[#87A96B]",
      text: "text-[#2F4A1F]",
      icon: <CheckCircle2 className="w-5 h-5 text-[#87A96B] shrink-0" />,
    },
    error: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    },
    warning: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-2 duration-200">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${config.bg} ${config.text}`}
      >
        {config.icon}
        <div className="flex-1 text-sm font-medium leading-5">{message}</div>
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="text-stone-400 hover:text-stone-600 transition-colors p-0.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
