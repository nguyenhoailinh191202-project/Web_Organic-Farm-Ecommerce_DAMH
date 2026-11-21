/* Timeline of sowing, fertilizing, watering, and harvest events. */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sprout,
  Droplets,
  FlaskConical,
  Scissors,
  ClipboardList,
  Clock,
  User,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Eye,
  Filter,
  Check,
  ChevronDown,
  PackageCheck,
  ExternalLink,
} from "lucide-react";

export default function FarmingLogTimeline({
  logs = [],
  loading = false,
  onDeleteLog,
  selectedPlot = null,
  onCreateBatch = null,
}) {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);

  const filterOptions = [
    { id: "ALL", label: "Tất cả hoạt động", shortLabel: "Tất cả", icon: ClipboardList, badgeColor: "bg-slate-100 text-slate-700" },
    { id: "Gieo_hat", label: "Gieo hạt & Ươm mầm", shortLabel: "Gieo hạt", icon: Sprout, badgeColor: "bg-emerald-100 text-emerald-700" },
    { id: "Bon_phan", label: "Bón phân hữu cơ", shortLabel: "Bón phân", icon: FlaskConical, badgeColor: "bg-amber-100 text-amber-700" },
    { id: "Tuoi_tieu", label: "Tưới tiêu nước sạch", shortLabel: "Tưới nước", icon: Droplets, badgeColor: "bg-blue-100 text-blue-700" },
    { id: "Thu_hoach", label: "Thu hoạch nông sản", shortLabel: "Thu hoạch", icon: Scissors, badgeColor: "bg-emerald-100 text-emerald-800" },
  ];

  const getActivityConfig = (type) => {
    switch (type) {
      case "Gieo_hat":
        return {
          icon: Sprout,
          color: "bg-emerald-100 text-emerald-700 border-emerald-300",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
          label: "Gieo hạt & Ươm mầm",
        };
      case "Bon_phan":
        return {
          icon: FlaskConical,
          color: "bg-amber-100 text-amber-700 border-amber-300",
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
          label: "Bón phân hữu cơ",
        };
      case "Tuoi_tieu":
        return {
          icon: Droplets,
          color: "bg-blue-100 text-blue-700 border-blue-300",
          badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
          label: "Tưới tiêu nước sạch",
        };
      case "Thu_hoach":
        return {
          icon: Scissors,
          color: "bg-emerald-100 text-emerald-800 border-emerald-300",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
          label: "Thu hoạch nông sản",
        };
      default:
        return {
          icon: ClipboardList,
          color: "bg-slate-100 text-slate-700 border-slate-300",
          badgeColor: "bg-slate-50 text-slate-800 border-slate-200",
          label: "Hoạt động canh tác khác",
        };
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === "ALL") return true;
    return log.activity_type === activeFilter;
  });

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex flex-col max-h-[calc(100vh-220px)] min-h-[480px]">
      {/* Header & Filter - Ghim cố định trên đầu khung nhật ký */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
            <span>Nhật Ký Canh Tác</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs sm:max-w-sm">
            {selectedPlot
              ? `${selectedPlot.plot_name} • ${selectedPlot.product_name || "Nông sản"}`
              : "Chọn lô đất để xem nhật ký"}
          </p>
        </div>

        {/* Phễu lọc theo hoạt động */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              activeFilter !== "ALL"
                ? "bg-emerald-50 text-emerald-950 border-emerald-400 ring-2 ring-emerald-500/20"
                : "bg-slate-50 text-slate-700 border-slate-200/90 hover:bg-slate-100"
            }`}
            title="Bấm để lọc theo loại hoạt động canh tác"
          >
            <Filter className={`w-3.5 h-3.5 ${activeFilter !== "ALL" ? "text-emerald-700" : "text-slate-500"}`} />
            <span>
              {activeFilter === "ALL"
                ? "Lọc hoạt động"
                : filterOptions.find((o) => o.id === activeFilter)?.shortLabel || "Lọc"}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                isFilterOpen ? "rotate-180" : ""
              }`}
            />
            {activeFilter !== "ALL" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            )}
          </button>

          {isFilterOpen && (
            <>
              {/* Lớp nền bắt sự kiện đóng khi bấm ra ngoài */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsFilterOpen(false)}
              />

              {/* Menu danh sách các hoạt động để chọn */}
              <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                  <span>Lọc loại hoạt động</span>
                  {activeFilter !== "ALL" && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter("ALL");
                        setIsFilterOpen(false);
                      }}
                      className="text-[10.5px] text-emerald-600 hover:underline font-semibold cursor-pointer"
                    >
                      Tất cả
                    </button>
                  )}
                </div>

                <div className="py-1 space-y-0.5">
                  {filterOptions.map((item) => {
                    const isSelected = activeFilter === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveFilter(item.id);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-colors text-left cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-950 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${item.badgeColor}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content - Bo tròn và có thanh cuộn riêng biệt */}
      <div className="mt-3 flex-1 overflow-y-auto pr-1.5 scrollbar-thin">
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-10 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
              <Sprout className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">Chưa có nhật ký nào</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {selectedPlot
                ? `Lô "${selectedPlot.plot_name}" chưa có bản ghi nhật ký nào. Hãy bấm nút "+ Ghi nhật ký cho lô này" để thêm mốc hoạt động đầu tiên (gieo hạt, bón phân, tưới nước) kèm ảnh chụp thực địa.`
                : `Hãy bấm nút "Ghi nhật ký canh tác" để thêm mốc hoạt động đầu tiên (gieo hạt, bón phân, tưới nước) kèm ảnh chụp thực tế.`}
            </p>
          </div>
        ) : (
          <div className="relative pl-5 sm:pl-7 border-l-2 border-emerald-100 space-y-3.5 ml-2.5 sm:ml-3 py-1">
            {filteredLogs.map((log) => {
              const cfg = getActivityConfig(log.activity_type);
              const Icon = cfg.icon;

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-[29px] sm:-left-[37px] top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 ${cfg.color} flex items-center justify-center shadow-2xs bg-white`}
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>

                  {/* Card Content */}
                  <div className="bg-slate-50 hover:bg-slate-50/90 rounded-xl p-3 sm:p-3.5 border border-slate-200/70 transition-all">
                    {/* Header: Activity + Time + Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeColor}`}
                        >
                          {cfg.label}
                        </span>
                        {log.plot_name && (
                          <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 truncate max-w-[130px]">
                            {log.plot_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 tabular-nums">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {log.action_time}
                        </span>
                        {onDeleteLog && (
                          <button
                            type="button"
                            onClick={() => onDeleteLog(log.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                            title="Xóa nhật ký này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Staff signature */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Phụ trách: <strong className="text-slate-700">{log.staff_name || "Kỹ thuật nông trại"}</strong></span>
                    </div>

                    {/* Log Note / Description */}
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white/90 p-2.5 rounded-lg border border-slate-200/50">
                      {log.content}
                    </p>

                    {/* Mốc thu hoạch: Trỏ tạo lô hàng thu hoạch */}
                    {log.activity_type === "Thu_hoach" && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-950 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Scissors className="w-3 h-3" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold block truncate text-xs">Mốc Thu Hoạch Nông Sản</span>
                            <span className="text-[10.5px] text-emerald-700 block truncate">
                              Sẵn sàng tạo lô hàng và nhập kho thành phẩm
                            </span>
                          </div>
                        </div>

                        {log.has_batch ? (
                          <Link
                            to={`/farm/batches?search=${log.batch_id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
                            title="Xem lô hàng này trong kho thành phẩm"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Lô hàng #{log.batch_id}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 text-emerald-700" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onCreateBatch && onCreateBatch(log)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#064e2e] hover:bg-[#043821] text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
                            title="Tạo lô hàng từ mốc thu hoạch này"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Tạo Lô Hàng</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Media Attachments */}
                    {log.media && log.media.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200/60">
                        <h5 className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Minh chứng ({log.media.length})</span>
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
                          {log.media.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => setPreviewMedia(item)}
                              className="relative group/media rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video cursor-pointer"
                            >
                              {item.type === "Video" ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white p-2 text-center">
                                  <VideoIcon className="w-6 h-6 text-emerald-400 mb-1" />
                                  <span className="text-[10px] text-slate-300 truncate max-w-full">
                                    {item.note || "Video nhật ký"}
                                  </span>
                                </div>
                              ) : (
                                <img
                                  src={item.url}
                                  alt={item.note || "Ảnh nhật ký"}
                                  className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80";
                                  }}
                                />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-5 h-5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Media Modal Lightbox Preview */}
      {previewMedia && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 sm:p-4 text-white border-b border-slate-800 shrink-0">
              <span className="text-xs sm:text-sm font-semibold truncate max-w-[80%]">
                {previewMedia.note || "Tệp minh chứng nhật ký canh tác"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="text-slate-400 hover:text-white text-xs sm:text-sm px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕ Đóng
              </button>
            </div>
            <div className="p-3 sm:p-4 flex-1 overflow-y-auto flex items-center justify-center min-h-0 bg-black/50">
              {previewMedia.type === "Video" ? (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  className="max-h-[65vh] w-full rounded-xl"
                />
              ) : (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.note || "Minh chứng"}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
