/* Modal for previewing and printing a batch QR label. */
import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  QrCode,
  X,
  Loader2,
  Download,
  ExternalLink,
  Layers,
} from "lucide-react";
import { farmApi } from "../../../services/farmApi";
import { notifyApiErrorToast } from "../../../services/axiosClient";

const A4_LABEL_COUNT = 24;

export default function QrPrintPreviewModal({ isOpen, onClose, batch = null }) {
  const [loading, setLoading] = useState(false);
  const [labelData, setLabelData] = useState(null);
  const [printSize, setPrintSize] = useState("50x50"); // "50x50" | "70x50" | "a4"
  const labelPrintRef = useRef(null);

  useEffect(() => {
    if (isOpen && batch) {
      setLoading(true);
      farmApi
        .getBatchQrPrintTemplate(batch.id, { skipGlobalToast: true })
        .then((res) => {
          const payload = res.data?.data ?? res.data ?? res ?? null;
          setLabelData(payload);
        })
        .catch((err) => {
          // Nếu chưa có QR thì thử sinh mới
          farmApi
            .generateBatchQr(batch.id)
            .then((res2) => {
              const payload2 = res2.data?.data ?? res2.data ?? res2 ?? null;
              setLabelData(payload2);
            })
            .catch((err2) => {
              notifyApiErrorToast(
                err2,
                err?.message ||
                  "Không thể tạo mã QR cho lô này. Vui lòng đảm bảo lô đã có mốc thu hoạch."
              );
            });
        })
        .finally(() => setLoading(false));
    } else {
      setLabelData(null);
    }
  }, [isOpen, batch]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !batch) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSvg = () => {
    if (!labelData?.qr_svg) return;
    const blob = new Blob([labelData.qr_svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `QR-${labelData.qr_code || batch.batch_code || batch.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const productName = labelData?.product_name || batch.product_name;
  const qrCodeText = labelData?.qr_code || batch.qr?.code || batch.batch_code || `LH-${batch.id}`;
  const traceUrl = labelData?.trace_url || `https://xanhfarm.vn/trace/${qrCodeText}`;
  const qrImageSrc =
    labelData?.qr_data_uri ||
    (labelData?.qr_svg ? `data:image/svg+xml;base64,${btoa(labelData.qr_svg)}` : null);
  const isA4Mode = printSize === "a4";

  const renderSingleLabel = (compact = false, key = "single") => (
    <div
      key={key}
      className={
        compact
          ? "qr-a4-cell border border-dashed border-slate-300 rounded-xl p-2 bg-white text-slate-800 flex flex-col justify-between"
          : `border-2 border-dashed border-slate-300 rounded-3xl p-5 bg-white shadow-lg text-slate-800 transition-all ${
              printSize === "70x50" ? "w-[340px]" : "w-[290px]"
            }`
      }
    >
      {/* Top Bar Thương Hiệu */}
      <div
        className={`text-center border-b border-slate-200 ${
          compact ? "pb-1 mb-1" : "pb-2 mb-3"
        }`}
      >
        <div
          className={`font-black uppercase tracking-wider text-[#12372A] truncate ${
            compact ? "text-[8px]" : "text-[10.5px]"
          }`}
        >
          XANH FARM • HỮU CƠ CỦ CHI
        </div>
        {!compact && (
          <div className="text-[9px] text-slate-400 font-medium">
            Hotline: 1900 8888 • TCVN 11041
          </div>
        )}
      </div>

      {/* Nông Sản & Lô */}
      <div className={`text-center ${compact ? "mb-1" : "mb-3"}`}>
        <h4
          className={`font-black text-slate-900 leading-tight ${
            compact ? "text-[9.5px] line-clamp-1" : "text-base sm:text-lg"
          }`}
        >
          {productName}
        </h4>
        {!compact && (
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              {batch.plot_name}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {batch.season_name}
            </span>
          </div>
        )}
      </div>

      {/* QR Code Trung Tâm */}
      <div
        className={`mx-auto bg-white border border-slate-200 flex items-center justify-center ${
          compact
            ? "w-16 h-16 p-1 rounded-lg mb-1"
            : "w-36 h-36 p-2 rounded-2xl shadow-2xs mb-3"
        }`}
      >
        {qrImageSrc ? (
          <img
            src={qrImageSrc}
            alt="Mã QR Truy Xuất"
            className={compact ? "w-14 h-14 object-contain" : "w-32 h-32 object-contain"}
          />
        ) : (
          <QrCode className={compact ? "w-12 h-12 text-slate-800" : "w-28 h-28 text-slate-800"} />
        )}
      </div>

      {/* Chuỗi Mã Định Danh */}
      <div className={`text-center ${compact ? "mb-1" : "mb-3"}`}>
        <span
          className={`font-mono font-bold text-slate-700 bg-slate-100 rounded-md tracking-wider inline-block max-w-full truncate ${
            compact ? "text-[7.5px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-0.5"
          }`}
        >
          {qrCodeText}
        </span>
      </div>

      {/* Ngày Thu Hoạch & HSD */}
      <div
        className={`grid grid-cols-2 gap-1 border-t border-slate-200 tabular-nums ${
          compact ? "pt-1 text-[7.5px]" : "pt-2.5 mb-2 text-[10.5px]"
        }`}
      >
        <div className="min-w-0">
          <span className={`text-slate-400 block ${compact ? "text-[6.5px]" : "text-[9.5px]"}`}>
            Thu hoạch:
          </span>
          <strong className="text-slate-800 block truncate">{batch.harvest_date}</strong>
        </div>
        <div className="text-right min-w-0">
          <span className={`text-slate-400 block ${compact ? "text-[6.5px]" : "text-[9.5px]"}`}>
            Hạn dùng:
          </span>
          <strong className="text-emerald-700 font-extrabold block truncate">
            {batch.expiry_date}
          </strong>
        </div>
      </div>

      {!compact && (
        <div className="text-center text-[9px] text-slate-400 border-t border-dotted border-slate-200 pt-1.5">
          Quét camera để xem trọn vẹn nhật ký canh tác
        </div>
      )}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem trước và In Tem QR Lô Hàng"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @media print {
          @page {
            size: ${isA4Mode ? "A4 portrait" : "auto"};
            margin: ${isA4Mode ? "6mm" : "4mm"};
          }
          body * {
            visibility: hidden !important;
          }
          #printable-thermal-label, #printable-thermal-label * {
            visibility: visible !important;
          }
          #printable-thermal-label {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: ${isA4Mode ? "0" : "4mm"} !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-thermal-label.print-a4-grid {
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 2.5mm !important;
          }
          #printable-thermal-label.print-a4-grid .qr-a4-cell {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            padding: 2mm !important;
            border-radius: 2mm !important;
          }
        }
      `}</style>

      <div
        className={`relative w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 transition-all ${
          isA4Mode ? "max-w-3xl" : "max-w-xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-50/80 to-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#064e2e] text-white flex items-center justify-center shadow-xs shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                In Tem Mã QR Lô Hàng
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Đóng cửa sổ in tem"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Cấu hình khổ in */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Layers className="w-4 h-4 text-[#064e2e]" />
              <span>Khổ in:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "50x50", label: "50x50mm (Tem vuông)" },
                { id: "70x50", label: "70x50mm (Tem chữ nhật)" },
                { id: "a4", label: "A4 (24 tem/trang)" },
              ].map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => setPrintSize(sz.id)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    printSize === sz.id
                      ? "bg-[#064e2e] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#064e2e] animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-medium">
                Đang sinh mã QR định danh và xuất mẫu tem...
              </p>
            </div>
          ) : (
            <>
              {/* Bản xem trước & Vùng in thực tế (#printable-thermal-label) */}
              {isA4Mode ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-bold text-slate-700">
                      Bản xem trước A4 ({A4_LABEL_COUNT} tem)
                    </span>
                  </div>
                  <div
                    id="printable-thermal-label"
                    ref={labelPrintRef}
                    className="print-a4-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 bg-slate-50/70 border border-slate-200 rounded-2xl max-h-[360px] overflow-y-auto"
                  >
                    {Array.from({ length: A4_LABEL_COUNT }, (_, idx) =>
                      renderSingleLabel(true, `a4-label-${idx}`)
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div id="printable-thermal-label" ref={labelPrintRef}>
                    {renderSingleLabel(false, "single-label")}
                  </div>
                </div>
              )}

              {/* Đường link tra cứu truy xuất nguồn gốc */}
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 text-xs flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-bold text-emerald-950 block">
                    Liên kết truy xuất công khai:
                  </span>
                  <a
                    href={traceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-medium hover:underline truncate block"
                  >
                    {traceUrl}
                  </a>
                </div>
                <a
                  href={traceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-white text-emerald-800 border border-emerald-300 font-bold hover:bg-emerald-100 flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>Mở xem</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSvg}
              disabled={!labelData?.qr_svg}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              title="Tải tệp vector SVG mã QR về máy tính"
            >
              <Download className="w-4 h-4" />
              <span>Tải file SVG</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#064e2e] hover:bg-[#043821] text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isA4Mode ? "In 24 Tem (A4)" : "In Tem"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
