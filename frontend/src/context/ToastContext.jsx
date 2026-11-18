import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import TopToastContainer from "../components/common/TopToastContainer";
import ConfirmDialogModal from "../components/common/ConfirmDialogModal";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const timersRef = useRef({});
  const confirmResolveRef = useRef(null);

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message, duration = 3500 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setToasts((prev) => {
        const next = prev.length >= 3 ? prev.slice(1) : prev;
        return [...next, { id, type, title, message, duration }];
      });

      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  // Hiển thị hộp xác nhận tùy chỉnh và trả về Promise<boolean>
  const confirm = useCallback((options) => {
    const config =
      typeof options === "string" ? { message: options } : options;

    setConfirmState({
      title: config.title || "Xác nhận thao tác",
      message: config.message || "Bạn có chắc chắn muốn thực hiện thao tác này?",
      confirmText: config.confirmText || "Đồng ý",
      cancelText: config.cancelText || "Hủy",
      variant: config.variant || "danger",
    });

    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setConfirmState(null);
    if (confirmResolveRef.current) {
      confirmResolveRef.current(true);
      confirmResolveRef.current = null;
    }
  };

  const handleCancel = () => {
    setConfirmState(null);
    if (confirmResolveRef.current) {
      confirmResolveRef.current(false);
      confirmResolveRef.current = null;
    }
  };

  const toast = {
    success: (message, title = "Thành công", duration = 3000) =>
      showToast({ type: "success", title, message, duration }),
    error: (message, title = "Có lỗi xảy ra", duration = 4500) =>
      showToast({ type: "error", title, message, duration }),
    warning: (message, title = "Cảnh báo", duration = 4000) =>
      showToast({ type: "warning", title, message, duration }),
    info: (message, title = "Thông báo", duration = 3500) =>
      showToast({ type: "info", title, message, duration }),
    dismiss: removeToast,
    confirm,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <TopToastContainer toasts={toasts} onClose={removeToast} />
      <ConfirmDialogModal
        dialog={confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast phải được sử dụng bên trong ToastProvider");
  }
  return context;
}