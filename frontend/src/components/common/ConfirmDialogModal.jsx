import React from "react";
import { AlertTriangle, Trash2, HelpCircle, X } from "lucide-react";

export default function ConfirmDialogModal({ dialog, onConfirm, onCancel }) {
  if (!dialog) return null;

  const isDanger = dialog.variant === "danger";

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-14 px-4 bg-slate-900/45 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-[fadeSlideDown_0.2s_ease-out]"
      >
        <div className="p-5 flex items-start gap-3.5">
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              isDanger
                ? "bg-rose-50 text-rose-600 border-rose-200"
                : "bg-amber-50 text-amber-600 border-amber-200"
            }`}
          >
            {isDanger ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          {/* Nội dung */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              {dialog.title || "Xác nhận thao tác"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              {dialog.message}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nút hành động */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            {dialog.cancelText || "Hủy bỏ"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-[#064e2e] hover:bg-[#043821]"
            }`}
          >
            {dialog.confirmText || "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}