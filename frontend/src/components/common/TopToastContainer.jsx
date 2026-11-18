import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

const VARIANT_STYLES = {
  success: {
    icon: CheckCircle2,
    container: "bg-white border-emerald-200 shadow-emerald-950/10",
    iconWrap: "bg-emerald-50 text-[#064e2e] border-emerald-200/80",
    title: "text-[#064e2e]",
    bar: "bg-emerald-600",
  },
  error: {
    icon: XCircle,
    container: "bg-white border-rose-200 shadow-rose-950/10",
    iconWrap: "bg-rose-50 text-rose-600 border-rose-200/80",
    title: "text-rose-800",
    bar: "bg-rose-600",
  },
  warning: {
    icon: AlertTriangle,
    container: "bg-white border-amber-200 shadow-amber-950/10",
    iconWrap: "bg-amber-50 text-amber-600 border-amber-200/80",
    title: "text-amber-900",
    bar: "bg-amber-500",
  },
  info: {
    icon: Info,
    container: "bg-white border-sky-200 shadow-sky-950/10",
    iconWrap: "bg-sky-50 text-sky-600 border-sky-200/80",
    title: "text-slate-900",
    bar: "bg-sky-600",
  },
};

export default function TopToastContainer({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-[5px] left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((item) => {
        const style = VARIANT_STYLES[item.type] || VARIANT_STYLES.info;
        const Icon = style.icon;

        return (
          <div
            key={item.id}
            role="alert"
            className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${style.container} shadow-xl backdrop-blur-md transition-all duration-300 animate-[fadeSlideDown_0.25s_ease-out]`}
          >
            <div className="p-3.5 sm:p-4 flex items-start gap-3">
              {/* Icon */}
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${style.iconWrap}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                {item.title && (
                  <h4 className={`text-xs sm:text-sm font-extrabold leading-snug ${style.title}`}>
                    {item.title}
                  </h4>
                )}
                {item.message && (
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
                    {item.message}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => onClose(item.id)}
                aria-label="Đóng thông báo"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Progress Bar */}
            {item.duration > 0 && (
              <div className="h-1 w-full bg-slate-100">
                <div
                  className={`h-full ${style.bar} origin-left`}
                  style={{
                    animation: `shrinkWidth ${item.duration}ms linear forwards`,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}