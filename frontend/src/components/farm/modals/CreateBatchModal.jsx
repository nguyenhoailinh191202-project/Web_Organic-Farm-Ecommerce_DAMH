/* Modal for creating a harvest batch with harvest and expiry dates. */
import React, { useState, useEffect, useRef } from "react";
import {
  PackageCheck,
  Sprout,
  Clock,
  Sparkles,
  X,
  QrCode,
  Loader2,
  ChevronDown,
  Check,
  Scissors,
} from "lucide-react";
import { farmApi } from "../../../services/farmApi";
import {
  isApiValidationError,
  notifyApiErrorToast,
} from "../../../services/axiosClient";

// Helper tách tên nông sản riêng nếu chưa nằm trùng trong tên lô
function getDistinctCropSubtitle(plotName, cropName) {
  const cleanPlot = (plotName || "").trim();
  const cleanCrop = (cropName || "").trim();
  if (!cleanCrop) return "";
  if (cleanPlot.toLowerCase().includes(cleanCrop.toLowerCase())) {
    return "";
  }
  return cleanCrop;
}

export default function CreateBatchModal({
  isOpen,
  onClose,
  onSuccess,
  initialPlot = null,
  initialHarvestDate = null,
  initialHarvestLog = null,
  plots = [],
}) {
  const [availablePlots, setAvailablePlots] = useState(plots);
  const [loadingPlots, setLoadingPlots] = useState(false);

  // Custom dropdown state (locked strictly to container width - never overflows)
  const [isPlotMenuOpen, setIsPlotMenuOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const plotDropdownRef = useRef(null);

  // Form State
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [harvestQuantity, setHarvestQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [autoQr, setAutoQr] = useState(true);

  // Validation & Submitting
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const getTodayDateLocal = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateLocal();

  // Tính ngày tương lai theo lịch cục bộ (tránh lệch múi giờ UTC)
  const addDays = (baseDateStr, days) => {
    if (!baseDateStr) return "";
    const parts = baseDateStr.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return "";
    const d = new Date(parts[0], parts[1] - 1, parts[2] + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Tải danh sách lô đủ điều kiện nếu chưa có sẵn
  useEffect(() => {
    if (isOpen) {
      if (plots && plots.length > 0) {
        setAvailablePlots(plots);
      } else {
        setLoadingPlots(true);
        farmApi
          .getEligiblePlots()
          .then((res) => {
            const list = res.data?.data ?? res.data ?? res ?? [];
            setAvailablePlots(Array.isArray(list) ? list : []);
          })
          .catch(() => {})
          .finally(() => setLoadingPlots(false));
      }
    }
  }, [isOpen, plots]);

  // Khởi tạo giá trị khi mở Modal hoặc thay đổi prop
  useEffect(() => {
    if (isOpen) {
      const defaultPlot = initialPlot?.id || initialPlot?.Ma_lo_canh_tac || "";
      setSelectedPlotId(defaultPlot ? String(defaultPlot) : "");

      const defaultHarvestDate = initialHarvestDate || todayStr;
      setHarvestDate(defaultHarvestDate);
      setExpiryDate(addDays(defaultHarvestDate, 7)); // Mặc định 7 ngày bảo quản
      setHarvestQuantity("");
      setNotes(initialHarvestLog?.content || initialHarvestLog?.Noi_dung || "");
      setAutoQr(true);
      setFieldErrors({});
      setIsPlotMenuOpen(false);
      setHighlightedIndex(-1);
    }
  }, [isOpen, initialPlot, initialHarvestDate, initialHarvestLog]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!isPlotMenuOpen) return;
    const handleClickOutside = (e) => {
      if (plotDropdownRef.current && !plotDropdownRef.current.contains(e.target)) {
        setIsPlotMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPlotMenuOpen]);

  // Phím Escape: đóng dropdown trước, sau đó mới đóng modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isPlotMenuOpen) {
          e.stopPropagation();
          setIsPlotMenuOpen(false);
        } else if (!submitting) {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPlotMenuOpen, submitting, onClose]);

  if (!isOpen) return null;

  // Lô canh tác đang được chọn
  const activePlot =
    availablePlots.find((p) => String(p.id || p.Ma_lo_canh_tac) === String(selectedPlotId)) ||
    initialPlot;

  const unit = activePlot?.product_unit || activePlot?.Don_vi_tinh || "kg";
  const cropName = activePlot?.product_name || activePlot?.Ten_san_pham || "Nông sản";
  const plotName = activePlot?.plot_name || activePlot?.Ten_lo || `Lô #${selectedPlotId}`;
  const distinctSelectedCrop = getDistinctCropSubtitle(plotName, cropName);

  // Kiểm tra hạn dùng có cận hạn không (<= 2 ngày)
  const isExpiringSoon =
    expiryDate &&
    (new Date(expiryDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24) <= 2;

  const handleSelectPlot = (pid) => {
    setSelectedPlotId(String(pid));
    setIsPlotMenuOpen(false);
    setFieldErrors((prev) => ({ ...prev, plot_id: undefined }));
  };

  const handlePlotTriggerKeyDown = (e) => {
    if (loadingPlots) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isPlotMenuOpen) {
        setIsPlotMenuOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) =>
          availablePlots.length > 0 ? (prev + 1) % availablePlots.length : -1
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isPlotMenuOpen && availablePlots.length > 0) {
        setHighlightedIndex((prev) =>
          prev <= 0 ? availablePlots.length - 1 : prev - 1
        );
      }
    } else if (e.key === "Enter" || e.key === " ") {
      if (isPlotMenuOpen && highlightedIndex >= 0 && availablePlots[highlightedIndex]) {
        e.preventDefault();
        const target = availablePlots[highlightedIndex];
        handleSelectPlot(target.id || target.Ma_lo_canh_tac);
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlotMenuOpen((prev) => !prev);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!selectedPlotId) {
      errors.plot_id = "Vui lòng chọn lô canh tác cần thu hoạch.";
    }
    if (!harvestDate) {
      errors.harvest_date = "Vui lòng chọn ngày thu hoạch thực tế.";
    } else if (harvestDate > todayStr) {
      errors.harvest_date = "Ngày thu hoạch không được lớn hơn ngày hiện tại.";
    }
    if (!expiryDate) {
      errors.expiry_date = "Vui lòng thiết lập hạn sử dụng cho lô hàng.";
    } else if (expiryDate < harvestDate) {
      errors.expiry_date = "Hạn sử dụng phải sau hoặc bằng ngày thu hoạch.";
    }
    const qtyNum = parseFloat(harvestQuantity);
    if (!harvestQuantity || isNaN(qtyNum) || qtyNum <= 0) {
      errors.harvest_quantity = "Sản lượng thu hoạch phải lớn hơn 0.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        Ma_lo_canh_tac: Number(selectedPlotId),
        Ngay_thu_hoach: harvestDate,
        Han_su_dung: expiryDate,
        So_luong_thu_hoach: qtyNum,
        Ghi_chu: notes.trim(),
        auto_generate_qr: autoQr,
      };

      const res = await farmApi.createBatch(payload);
      const newBatch = res.data?.data ?? res.data ?? res;
      if (onSuccess) {
        onSuccess(newBatch);
      }
      onClose();
    } catch (err) {
      if (isApiValidationError(err)) {
        const mapped = {};
        Object.keys(err.fieldErrors).forEach((key) => {
          const value = err.fieldErrors[key];
          mapped[key] = Array.isArray(value) ? value[0] : value;
        });
        setFieldErrors(mapped);
      } else {
        notifyApiErrorToast(err, "Không thể tạo lô hàng thu hoạch. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hsdPresets = [
    { label: "+3 ngày (Rau lá)", days: 3 },
    { label: "+5 ngày", days: 5 },
    { label: "+7 ngày (Khuyên dùng)", days: 7 },
    { label: "+14 ngày (Củ quả)", days: 14 },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tạo Lô Hàng Thu Hoạch"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/80 to-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                Tạo Lô Hàng Thu Hoạch
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Nhập kho nông sản thành phẩm & khởi tạo mã truy xuất nguồn gốc
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Đóng hộp thoại"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="create-batch-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-5 sm:p-6 space-y-4"
        >
          {/* Callout: Nguồn mốc thu hoạch (Trỏ từ mốc Thu hoạch) */}
          {initialHarvestLog && (
            <div className="p-3.5 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold">
                  Từ mốc thu hoạch:{" "}
                  {initialHarvestLog.staff_name
                    ? `KTV ${initialHarvestLog.staff_name}`
                    : "Đồng ruộng"}
                </p>
                <p className="text-emerald-800 mt-0.5 line-clamp-2 break-words">
                  "{initialHarvestLog.content || initialHarvestLog.Noi_dung || "Thu hoạch nông sản"}"
                </p>
              </div>
            </div>
          )}

          {/* Chọn Lô Canh Tác (Custom Dropdown — khóa cứng chiều rộng 100%, không bao giờ tràn viền) */}
          <div>
            <label
              id="create-batch-plot-label"
              className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
            >
              Lô Canh Tác <span className="text-red-500">*</span>
            </label>

            {initialPlot ? (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {plotName}
                      {distinctSelectedCrop ? ` • ${distinctSelectedCrop}` : ""}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      Mùa vụ: {activePlot?.season_name || "Mùa vụ canh tác"}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                  Đã chọn
                </span>
              </div>
            ) : (
              <div ref={plotDropdownRef} className="relative w-full">
                <button
                  type="button"
                  disabled={loadingPlots}
                  aria-labelledby="create-batch-plot-label"
                  aria-haspopup="listbox"
                  aria-expanded={isPlotMenuOpen}
                  onClick={() => {
                    if (!loadingPlots) {
                      setIsPlotMenuOpen((prev) => !prev);
                    }
                  }}
                  onKeyDown={handlePlotTriggerKeyDown}
                  className={`w-full min-w-0 px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isPlotMenuOpen
                      ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20"
                      : fieldErrors.plot_id
                        ? "border-red-300 bg-red-50/30"
                        : "border-slate-200 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {loadingPlots ? (
                      <>
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                        <span className="text-slate-500 truncate">
                          Đang tải danh sách lô canh tác...
                        </span>
                      </>
                    ) : selectedPlotId && activePlot ? (
                      <>
                        <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">
                          {plotName}
                        </span>
                        {(activePlot.has_harvest_log || activePlot.status === "Da_thu_hoach") && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 whitespace-nowrap">
                            <Scissors className="w-3 h-3 shrink-0" />
                            <span>Có mốc thu hoạch</span>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-500 truncate">
                        Chọn lô canh tác cần thu hoạch
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
                      isPlotMenuOpen ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>

                {isPlotMenuOpen && (
                  <div
                    role="listbox"
                    aria-labelledby="create-batch-plot-label"
                    className="absolute left-0 right-0 top-full mt-1.5 z-30 w-full max-w-full bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                  >
                    {availablePlots.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        Chưa có lô canh tác khả dụng. Hãy tạo lô mới ở mục Mùa vụ & Canh tác.
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto overflow-x-hidden p-1.5 space-y-1">
                        {availablePlots.map((plot, idx) => {
                          const pid = String(plot.id || plot.Ma_lo_canh_tac);
                          const pName = (plot.plot_name || plot.Ten_lo || `Lô #${pid}`).trim();
                          const cName = (plot.product_name || plot.Ten_san_pham || "").trim();
                          const sName = (plot.season_name || "").trim();
                          const distinctCrop = getDistinctCropSubtitle(pName, cName);
                          const subtitleParts = [distinctCrop, sName].filter(Boolean);
                          const isHarvestReady =
                            plot.has_harvest_log || plot.status === "Da_thu_hoach";
                          const isSelected = String(selectedPlotId) === pid;
                          const isHighlighted = highlightedIndex === idx;

                          return (
                            <button
                              key={pid}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              onClick={() => handleSelectPlot(pid)}
                              className={`w-full min-w-0 text-left px-3 py-2.5 rounded-xl flex items-start justify-between gap-2.5 transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/80"
                                  : isHighlighted
                                    ? "bg-slate-50 text-slate-900"
                                    : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                    isSelected
                                      ? "bg-emerald-600 text-white"
                                      : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  <Sprout className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-[13px] font-semibold text-slate-800 break-words leading-snug">
                                    {pName}
                                  </div>
                                  {subtitleParts.length > 0 && (
                                    <div className="text-[11px] text-slate-500 break-words leading-snug mt-0.5">
                                      {subtitleParts.join(" · ")}
                                    </div>
                                  )}
                                  {isHarvestReady && (
                                    <div className="mt-1 sm:hidden">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                        <Scissors className="w-2.5 h-2.5 shrink-0" />
                                        <span>Có mốc thu hoạch</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                {isHarvestReady && (
                                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap">
                                    <Scissors className="w-3 h-3 shrink-0" />
                                    <span>Có mốc thu hoạch</span>
                                  </span>
                                )}
                                {isSelected && (
                                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {fieldErrors.plot_id && (
              <p className="text-red-600 text-[11px] mt-1 font-medium">{fieldErrors.plot_id}</p>
            )}
          </div>

          {/* Ngày thu hoạch & Hạn sử dụng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Ngày Thu Hoạch */}
            <div className="min-w-0">
              <label className="text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between gap-2">
                <span>
                  Ngày Thu Hoạch <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal normal-case">
                  Tối đa: Hôm nay
                </span>
              </label>
              <input
                type="date"
                max={todayStr}
                value={harvestDate}
                onChange={(e) => {
                  const d = e.target.value;
                  setHarvestDate(d);
                  if (d) setExpiryDate(addDays(d, 7));
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {fieldErrors.harvest_date && (
                <p className="text-red-600 text-[11px] mt-1 font-medium">
                  {fieldErrors.harvest_date}
                </p>
              )}
            </div>

            {/* Hạn Sử Dụng */}
            <div className="min-w-0">
              <label className="text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between gap-2">
                <span>
                  Hạn Sử Dụng <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold normal-case">
                  Gợi ý bảo quản
                </span>
              </label>
              <input
                type="date"
                min={harvestDate || todayStr}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {fieldErrors.expiry_date && (
                <p className="text-red-600 text-[11px] mt-1 font-medium">
                  {fieldErrors.expiry_date}
                </p>
              )}
            </div>
          </div>

          {/* Phím tắt gợi ý thời hạn bảo quản */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-500 px-1">Gợi ý HSD:</span>
            {hsdPresets.map((btn) => {
              const targetDate = addDays(harvestDate || todayStr, btn.days);
              const isActivePreset = expiryDate === targetDate;
              return (
                <button
                  key={btn.days}
                  type="button"
                  onClick={() => setExpiryDate(targetDate)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                    isActivePreset
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border-slate-200/80"
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {isExpiringSoon && (
            <div className="p-3 bg-amber-50 border border-amber-200/80 text-amber-900 rounded-2xl text-[11.5px] flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Hạn dùng ≤ 2 ngày: Lô hàng này sẽ được hệ thống xếp vào danh sách{" "}
                <strong>Cận hạn</strong> để ưu tiên xuất kho trước.
              </span>
            </div>
          )}

          {/* Sản Lượng Thu Hoạch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Sản Lượng Thu Hoạch <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="Ví dụ: 125.5"
                value={harvestQuantity}
                onChange={(e) => setHarvestQuantity(e.target.value)}
                className="w-full pl-3.5 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                {unit}
              </span>
            </div>
            {fieldErrors.harvest_quantity && (
              <p className="text-red-600 text-[11px] mt-1 font-medium">
                {fieldErrors.harvest_quantity}
              </p>
            )}
          </div>

          {/* Ghi Chú & Tình Trạng Lô */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Ghi Chú Thu Hoạch
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Thu hoạch lứa đầu tiên, lá xanh dày đạt chuẩn VietGAP, đóng sọt bảo quản lạnh..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Tùy chọn sinh mã QR */}
          <label className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <QrCode className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">
                  Tự động sinh mã QR truy xuất
                </p>
                <p className="text-[11px] text-slate-500">
                  Gắn nhãn định danh liên kết trực tiếp dòng thời gian canh tác của lô này
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoQr}
              onChange={(e) => setAutoQr(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
            />
          </label>
        </form>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy Bỏ
          </button>

          <button
            type="submit"
            form="create-batch-form"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang khởi tạo...</span>
              </>
            ) : (
              <>
                <PackageCheck className="w-4 h-4" />
                <span>Nhập Kho Lô Hàng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
