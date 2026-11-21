/* Modal for recording a farm log and attaching media. */
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Calendar,
  ClipboardList,
  Sprout,
  FlaskConical,
  Droplets,
  Scissors,
  AlertCircle,
  Loader2,
  Trash2,
  ChevronDown,
  Check,
  Film,
} from "lucide-react";
import { farmApi } from "../../../services/farmApi";
import {
  getApiValidationMessage,
  isApiValidationError,
  notifyApiErrorToast,
} from "../../../services/axiosClient";

async function compressImageClient(file) {
  if (!file || !file.type.startsWith("image/") || file.size <= 300 * 1024) {
    return file;
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const maxW = 1200;
    let { width, height } = bitmap;

    if (width > maxW) {
      height = Math.round((height * maxW) / width);
      width = maxW;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.8)
    );

    if (!blob || blob.size >= file.size) return file;

    const webpName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    return new File([blob], webpName, { type: "image/webp" });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

function getDistinctCropName(plotName, prodName) {
  const cleanPlot = (plotName || "").trim();
  const cleanProd = (prodName || "").trim();
  if (!cleanProd) return "";
  if (cleanPlot.toLowerCase().includes(cleanProd.toLowerCase())) return "";
  return cleanProd;
}

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const getMaxDateTimeLocal = () => {
  const now = new Date(Date.now() + 15 * 60 * 1000);
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export default function AddFarmingLogModal({
  isOpen = false,
  onClose = () => {},
  onSuccess = () => {},
  plots = [],
  defaultPlotId = null,
}) {
  const [plotId, setPlotId] = useState("");
  const [activityType, setActivityType] = useState("Gieo_hat");
  const [actionTime, setActionTime] = useState(getCurrentDateTimeLocal);
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPlotMenuOpen, setIsPlotMenuOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const plotDropdownRef = useRef(null);

  // Cập nhật giá trị khi mở modal hoặc thay đổi defaultPlotId
  useEffect(() => {
    if (isOpen) {
      setPlotId(defaultPlotId ? String(defaultPlotId) : "");
      setActionTime(getCurrentDateTimeLocal());
      setErrorMsg("");
      setContent("");
      setSelectedFiles([]);
      setFilePreviews([]);
      setActivityType("Gieo_hat");
      setIsPlotMenuOpen(false);
      setHighlightedIndex(-1);
    }
  }, [isOpen, defaultPlotId]);

  useEffect(() => {
    if (!isPlotMenuOpen) return;
    const handleOutside = (e) => {
      if (plotDropdownRef.current && !plotDropdownRef.current.contains(e.target)) {
        setIsPlotMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isPlotMenuOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (isPlotMenuOpen) {
          e.stopPropagation();
          setIsPlotMenuOpen(false);
        } else if (!loading) {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, isPlotMenuOpen, loading, onClose]);

  if (!isOpen) return null;

  const selectedPlotInfo = plots.find((p) => String(p.id) === String(plotId));

  const handlePlotKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isPlotMenuOpen) {
        setIsPlotMenuOpen(true);
        setHighlightedIndex(0);
      } else if (plots.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % plots.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isPlotMenuOpen && plots.length > 0) {
        setHighlightedIndex((prev) => (prev <= 0 ? plots.length - 1 : prev - 1));
      }
    } else if (e.key === "Enter" || e.key === " ") {
      if (isPlotMenuOpen && highlightedIndex >= 0 && plots[highlightedIndex]) {
        e.preventDefault();
        setPlotId(String(plots[highlightedIndex].id));
        setIsPlotMenuOpen(false);
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlotMenuOpen((prev) => !prev);
      }
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSelectedFiles((prev) => [...prev, ...files]);

    // Tạo preview URL
    const newPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video/"),
    }));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plotId) {
      setErrorMsg("Vui lòng chọn lô canh tác cần ghi nhật ký.");
      return;
    }
    // Cho phép dung sai 10 phút để tránh việc lệch giây/phút giữa đồng hồ máy tính và trình duyệt
    if (new Date(actionTime).getTime() > Date.now() + 10 * 60 * 1000) {
      setErrorMsg("Mốc thời gian thực hiện không được lớn hơn thời điểm hiện tại.");
      return;
    }
    //  Thiếu thông tin bắt buộc khi bón phân (loại phân bón, liều lượng)
    if (activityType === "Bon_phan" && content.trim().length < 10) {
      setErrorMsg("Hoạt động bón phân bắt buộc ghi rõ thông tin loại phân bón hữu cơ và liều lượng sử dụng.");
      return;
    }
    if (!content.trim()) {
      setErrorMsg("Vui lòng nhập nội dung chi tiết công việc thực hiện.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("Ma_lo_canh_tac", plotId);
      formData.append("Loai_hoat_dong", activityType);
      formData.append("Thoi_gian_thuc_hien", actionTime);
      formData.append("Noi_dung", content.trim());

      const uploadFiles = await Promise.all(selectedFiles.map(compressImageClient));
      uploadFiles.forEach((file) => {
        formData.append("media[]", file);
      });

      await farmApi.createFarmingLog(formData);
      onSuccess();
      onClose();
    } catch (err) {
      if (isApiValidationError(err)) {
        setErrorMsg(getApiValidationMessage(err));
      } else {
        notifyApiErrorToast(err, "Không thể lưu nhật ký. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const activityOptions = [
    { id: "Gieo_hat", label: "Gieo hạt", icon: Sprout, color: "text-emerald-600" },
    { id: "Bon_phan", label: "Bón phân", icon: FlaskConical, color: "text-amber-600" },
    { id: "Tuoi_tieu", label: "Tưới nước", icon: Droplets, color: "text-blue-600" },
    { id: "Thu_hoach", label: "Thu hoạch", icon: Scissors, color: "text-[#064e2e]" },
    { id: "Khac", label: "Khác", icon: ClipboardList, color: "text-slate-600" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-log-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="relative w-full max-w-xl md:max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Fixed Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-[#064e2e] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-[#043821] rounded-xl shrink-0">
              <ClipboardList className="w-5 h-5 text-[#86efac]" />
            </div>
            <div className="min-w-0">
              <h3 id="add-log-title" className="text-sm sm:text-base font-extrabold truncate text-white">
                Ghi Nhật Ký Canh Tác Mới
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 truncate">
                Lưu trữ mốc chăm sóc thực tế đính kèm hình ảnh/video
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-emerald-700/50 transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="add-farming-log-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4 sm:p-6 space-y-4 text-left"
        >
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span className="break-words min-w-0">{errorMsg}</span>
            </div>
          )}

          {/* Chọn Lô canh tác (Custom Dropdown khóa chiều rộng 100%) */}
          <div>
            <label
              id="add-log-plot-label"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Chọn Lô Canh Tác <span className="text-red-500">*</span>
            </label>
            <div ref={plotDropdownRef} className="relative w-full">
              <button
                type="button"
                aria-labelledby="add-log-plot-label"
                aria-haspopup="listbox"
                aria-expanded={isPlotMenuOpen}
                onClick={() => setIsPlotMenuOpen((prev) => !prev)}
                onKeyDown={handlePlotKeyDown}
                className={`w-full min-w-0 px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isPlotMenuOpen
                    ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-slate-300 hover:border-slate-400 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {selectedPlotInfo ? (
                    <>
                      <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {selectedPlotInfo.plot_name}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500 truncate">Chọn lô canh tác</span>
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
                  aria-labelledby="add-log-plot-label"
                  className="absolute left-0 right-0 top-full mt-1.5 z-30 w-full max-w-full bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                >
                  {plots.length === 0 ? (
                    <div className="px-4 py-5 text-center text-xs text-slate-500">
                      Chưa có lô canh tác nào. Hãy tạo lô đất mới trước khi ghi nhật ký.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto overflow-x-hidden p-1.5 space-y-1">
                      {plots.map((plot, idx) => {
                        const pid = String(plot.id);
                        const plotName = (plot.plot_name || "Lô canh tác").trim();
                        const distinctProd = getDistinctCropName(plotName, plot.product_name);
                        const subtitleParts = [
                          distinctProd,
                          plot.season_name ? plot.season_name.trim() : "",
                          plot.area_m2 ? `${plot.area_m2} m²` : "",
                        ].filter(Boolean);
                        const isSelected = String(plotId) === pid;
                        const isHighlighted = highlightedIndex === idx;

                        return (
                          <button
                            key={pid}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onClick={() => {
                              setPlotId(pid);
                              setIsPlotMenuOpen(false);
                              setErrorMsg("");
                            }}
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
                                  {plotName}
                                </div>
                                {subtitleParts.length > 0 && (
                                  <div className="text-[11px] text-slate-500 break-words leading-snug mt-0.5">
                                    {subtitleParts.join(" · ")}
                                  </div>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thông tin nhanh về lô đang chọn */}
            {selectedPlotInfo && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 bg-emerald-50/70 p-2 sm:px-3 sm:py-2 rounded-xl border border-emerald-200/60">
                <span className="font-bold text-emerald-900">Mùa vụ:</span>
                <span className="text-emerald-800 font-medium truncate max-w-[180px]">
                  {selectedPlotInfo.season_name || "Hiện tại"}
                </span>
                <span className="text-emerald-300">•</span>
                <span className="font-bold text-emerald-900">Diện tích:</span>
                <span className="text-emerald-800 font-medium">{selectedPlotInfo.area_m2} m²</span>
                {selectedPlotInfo.planting_date && (
                  <>
                    <span className="text-emerald-300">•</span>
                    <span className="font-bold text-emerald-900">Ngày gieo:</span>
                    <span className="text-emerald-800 font-medium">{selectedPlotInfo.planting_date}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Chọn loại hoạt động */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Loại Hoạt Động <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2">
              {activityOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = activityType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setActivityType(opt.id)}
                    className={`flex sm:flex-col items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs ring-1 ring-emerald-600"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${opt.color}`} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thời gian thực hiện */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Thời Gian Thực Hiện <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={actionTime}
                onChange={(e) => setActionTime(e.target.value)}
                max={getMaxDateTimeLocal()}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all pl-10"
                required
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            <p className="mt-1 text-[10.5px] text-slate-400">
              * Quy tắc hệ thống: Mốc thời gian thực hiện không được lớn hơn thời điểm hiện tại.
            </p>
          </div>

          {/* Lưu ý bón phân hữu cơ */}
          {activityType === "Bon_phan" && (
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <FlaskConical className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Quy chuẩn kỹ thuật bón phân hữu cơ:</span> Bắt buộc ghi rõ tên/loại phân bón hữu cơ vi sinh và liều lượng sử dụng thực tế cho diện tích lô.
              </div>
            </div>
          )}

          {/* Nội dung công việc */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nội Dung Chi Tiết Hoạt Động <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ví dụ: Bón 20kg phân trùn quế vi sinh cho toàn bộ 1200m2 lô xà lách. Tình trạng cây phát triển khỏe, không có sâu bệnh..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all leading-relaxed"
              required
            />
          </div>

          {/* Upload ảnh & video minh chứng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Hình Ảnh / Video Minh Chứng Thực Tế
            </label>
            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all text-center">
              <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-emerald-700">
                Bấm để chọn ảnh/video từ thiết bị
              </span>
              <span className="text-[10.5px] text-slate-500 mt-0.5">
                Hỗ trợ ảnh JPG, PNG, WEBP hoặc video MP4 (tối đa 20MB/tệp)
              </span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Danh sách tệp đã chọn */}
            {filePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                {filePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-900"
                  >
                    {preview.isVideo ? (
                      <div className="w-full h-full flex items-center justify-center gap-1.5 text-xs text-white bg-slate-800 p-1 text-center">
                        <Film className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                        <span>Video</span>
                      </div>
                    ) : (
                      <img
                        src={preview.url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-700 transition-colors"
                      title="Xóa tệp này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Fixed Footer: Always visible, never clipped or pushed out of view */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-slate-50/95 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-all disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="add-farming-log-form"
            disabled={loading}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Đang lưu..." : "Lưu Nhật Ký Canh Tác"}
          </button>
        </div>
      </div>
    </div>
  );
}
