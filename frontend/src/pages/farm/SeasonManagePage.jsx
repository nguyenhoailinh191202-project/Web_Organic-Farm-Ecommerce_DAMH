/* Farm season and cultivation-log management page. */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Calendar,
  Sprout,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Loader2,
  FileText,
  Trash2,
  Pencil,
  MapPin,
  ClipboardList,
  Layers,
} from "lucide-react";
import { farmApi } from "../../services/farmApi";
import { showGlobalToast, confirmGlobalDialog } from "../../components/GlobalToast";
import {
  getApiValidationMessage,
  isApiValidationError,
  notifyApiErrorToast,
} from "../../services/axiosClient";
import FarmingLogTimeline from "../../components/farm/FarmingLogTimeline";
import AddFarmingLogModal from "../../components/farm/modals/AddFarmingLogModal";
import CreateBatchModal from "../../components/farm/modals/CreateBatchModal";

function ProductSelectDropdown({
  products = [],
  value,
  onChange,
  placeholder = "Chọn loại rau / củ / quả",
  labelId,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const selectedProduct = products.find((p) => String(p.id) === String(value));
  const filtered = query.trim()
    ? products.filter((p) =>
        (p.name || "").toLowerCase().includes(query.trim().toLowerCase())
      )
    : products;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((prev) => !prev);
          setQuery("");
        }}
        className={`w-full min-w-0 px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-left flex items-center justify-between gap-2 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          isOpen
            ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20"
            : "border-slate-300 hover:border-slate-400 hover:bg-white"
        }`}
      >
        <span
          className={`truncate flex-1 min-w-0 ${
            selectedProduct ? "font-semibold text-slate-800" : "text-slate-500"
          }`}
        >
          {selectedProduct ? `${selectedProduct.name} (${selectedProduct.unit})` : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={labelId}
          className="absolute left-0 right-0 top-full mt-1.5 z-30 w-full max-w-full bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {products.length > 6 && (
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm nhanh nông sản..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto overflow-x-hidden p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                Không tìm thấy nông sản phù hợp.
              </div>
            ) : (
              filtered.map((p) => {
                const isSelected = String(value) === String(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(String(p.id));
                      setIsOpen(false);
                    }}
                    className={`w-full min-w-0 text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-950 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs sm:text-[13px] break-words min-w-0 flex-1 leading-snug">
                      {p.name}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10.5px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.unit}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SeasonManagePage() {
  const [seasons, setSeasons] = useState(() => {
    return farmApi.getCachedSeasons() || [];
  });
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(() => {
    const cached = farmApi.getCachedSeasons();
    return !cached || cached.length === 0;
  });
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [mobileTab, setMobileTab] = useState("plots"); // "plots" | "timeline"

  // Modals state
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [isAddSeasonOpen, setIsAddSeasonOpen] = useState(false);
  const [isAddPlotOpen, setIsAddPlotOpen] = useState(false);
  const [activeSeasonForPlot, setActiveSeasonForPlot] = useState(null);

  // Batch Harvest Modal state
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
  const [batchInitialPlot, setBatchInitialPlot] = useState(null);
  const [batchInitialDate, setBatchInitialDate] = useState(null);
  const [batchInitialLog, setBatchInitialLog] = useState(null);

  const handleOpenCreateBatchFromLog = (log) => {
    const plotObj = allPlots.find((p) => String(p.id) === String(log.plot_id)) || {
      id: log.plot_id,
      plot_name: log.plot_name,
      product_name: log.product_name,
      product_unit: log.product_unit,
      season_name: log.season_name,
    };
    setBatchInitialPlot(plotObj);
    setBatchInitialDate(log.action_time ? log.action_time.slice(0, 10) : null);
    setBatchInitialLog(log);
    setIsCreateBatchOpen(true);
  };

  // Form state thêm mùa vụ mới
  const [seasonForm, setSeasonForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });
  const [seasonSubmitting, setSeasonSubmitting] = useState(false);
  const [seasonError, setSeasonError] = useState("");

  // Form state thêm lô canh tác mới
  const [plotForm, setPlotForm] = useState({
    product_id: "",
    plot_name: "",
    area_m2: "",
    planting_date: "",
  });
  const [plotSubmitting, setPlotSubmitting] = useState(false);
  const [plotError, setPlotError] = useState("");

  // Form state chỉnh sửa thông tin & diện tích lô canh tác
  const [isEditPlotOpen, setIsEditPlotOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState(null);
  const [editPlotForm, setEditPlotForm] = useState({
    product_id: "",
    plot_name: "",
    area_m2: "",
    planting_date: "",
    status: "Dang_canh_tac",
  });
  const [editPlotSubmitting, setEditPlotSubmitting] = useState(false);
  const [editPlotError, setEditPlotError] = useState("");

  // Quản lý tên & địa chỉ cơ sở nông trại
  const [farmInfo, setFarmInfo] = useState({
    name: "Nông Trại Xanh Củ Chi",
    address: "Ấp 3, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh",
  });
  const [isEditFarmModalOpen, setIsEditFarmModalOpen] = useState(false);
  const [farmForm, setFarmForm] = useState({
    name: "Nông Trại Xanh Củ Chi",
    address: "Ấp 3, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh",
  });
  const [farmSubmitting, setFarmSubmitting] = useState(false);
  const [farmError, setFarmError] = useState("");

  // Thông báo nổi dùng chung toàn hệ thống (top-center)
  const showToast = (msg, type = "success") => {
    showGlobalToast(msg, type);
  };

  // Avoid duplicate API error toasts when the response interceptor already notified.
  const showApiErrorToast = (fallbackPrefix, err) => {
    notifyApiErrorToast(err, `${fallbackPrefix}: Đã xảy ra lỗi. Vui lòng thử lại.`);
  };

  // Tải thông tin cơ sở nông trại
  const fetchFarmInfo = useCallback(async () => {
    try {
      const res = await farmApi.getFarmInfo();
      const data = res.data?.data;
      if (data) {
        setFarmInfo({
          name: data.name || "Nông Trại Xanh Củ Chi",
          address: data.address || "Ấp 3, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh",
        });
      }
    } catch (err) {
      notifyApiErrorToast(err, "Không thể tải thông tin cơ sở nông trại.");
    }
  }, []);

  // Tải danh sách mùa vụ
  const fetchSeasons = useCallback(async (force = true, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await farmApi.getSeasons(null, force);
      const seasonData = res.data?.data || res.data || [];
      setSeasons(Array.isArray(seasonData) ? seasonData : []);
    } catch (err) {
      notifyApiErrorToast(err, "Không thể tải danh sách mùa vụ.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Tải danh sách nhật ký canh tác (chỉ khi có lô cụ thể)
  const fetchLogs = useCallback(async (plotId = null) => {
    if (!plotId) {
      setLogs([]);
      return;
    }
    try {
      setLogsLoading(true);
      const res = await farmApi.getFarmingLogs({ plot_id: plotId });
      const logData = res.data?.data || res.data || [];
      setLogs(Array.isArray(logData) ? logData : []);
    } catch (err) {
      notifyApiErrorToast(err, "Không thể tải nhật ký canh tác.");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // Tải danh mục sản phẩm nông sản
  const fetchProducts = useCallback(async () => {
    try {
      const res = await farmApi.getFarmProducts();
      const prodData = res.data?.data || res.data || [];
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (err) {
      notifyApiErrorToast(err, "Không thể tải danh sách nông sản.");
    }
  }, []);

  // Khởi tạo: Chỉ tải danh sách mùa vụ, sản phẩm và thông tin cơ sở. Không tải nhật ký toàn cục khi chưa chọn lô.
  useEffect(() => {
    fetchSeasons();
    fetchProducts();
    fetchFarmInfo();
  }, [fetchSeasons, fetchProducts, fetchFarmInfo]);

  // Lọc mùa vụ theo từ khóa tìm kiếm
  const filteredSeasons = seasons.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tổng hợp tất cả các lô từ các mùa vụ cho modal chọn
  const allPlots = seasons.flatMap((season) =>
    (season.plots || []).map((plot) => ({
      ...plot,
      season_name: season.name,
    }))
  );

  // Tự động đồng bộ selectedPlot khi allPlots cập nhật (ví dụ sau khi tạo lô thu hoạch, trạng thái đổi sang Da_thu_hoach)
  useEffect(() => {
    if (selectedPlot) {
      const freshPlot = allPlots.find((p) => String(p.id) === String(selectedPlot.id));
      if (freshPlot && freshPlot.status !== selectedPlot.status) {
        setSelectedPlot(freshPlot);
      }
    }
  }, [allPlots, selectedPlot]);

  // Xử lý tạo Mùa vụ mới
  const handleCreateSeason = async (e) => {
    e.preventDefault();
    if (!seasonForm.name.trim() || !seasonForm.start_date) {
      setSeasonError("Vui lòng điền đầy đủ tên mùa vụ và ngày bắt đầu.");
      return;
    }
    setSeasonSubmitting(true);
    setSeasonError("");
    try {
      const res = await farmApi.createSeason({
        name: seasonForm.name.trim(),
        start_date: seasonForm.start_date,
        end_date: seasonForm.end_date || null,
        status: "Dang_dien_ra",
      });
      const createdSeason = res?.data?.data ?? res?.data;
      if (createdSeason?.id != null) {
        setSeasons((prev) => [
          {
            ...createdSeason,
            plots: Array.isArray(createdSeason.plots) ? createdSeason.plots : [],
          },
          ...prev.filter((season) => String(season.id) !== String(createdSeason.id)),
        ]);
      }
      showToast("Khởi tạo mùa vụ mới thành công!");
      setIsAddSeasonOpen(false);
      setSeasonForm({ name: "", start_date: "", end_date: "" });
      fetchSeasons(true, true);
    } catch (err) {
      if (isApiValidationError(err)) {
        setSeasonError(getApiValidationMessage(err));
      } else {
        notifyApiErrorToast(err, "Không thể tạo mùa vụ. Vui lòng thử lại.");
      }
    } finally {
      setSeasonSubmitting(false);
    }
  };

  // Xử lý tạo Lô canh tác mới
  const handleCreatePlot = async (e) => {
    e.preventDefault();
    if (!plotForm.product_id || !plotForm.plot_name.trim() || !plotForm.planting_date) {
      setPlotError("Vui lòng nhập đầy đủ loại nông sản, tên lô và ngày gieo.");
      return;
    }
    setPlotSubmitting(true);
    setPlotError("");
    try {
      const res = await farmApi.createPlot(activeSeasonForPlot.id, {
        product_id: plotForm.product_id,
        plot_name: plotForm.plot_name.trim(),
        area_m2: plotForm.area_m2 ? parseFloat(plotForm.area_m2) : null,
        planting_date: plotForm.planting_date,
      });
      const createdPlot = res?.data?.data ?? res?.data;
      if (createdPlot?.id != null) {
        setSeasons((prev) =>
          prev.map((season) => {
            if (String(season.id) !== String(activeSeasonForPlot.id)) return season;

            const plots = Array.isArray(season.plots) ? season.plots : [];
            const exists = plots.some((plot) => String(plot.id) === String(createdPlot.id));
            const nextPlots = exists
              ? plots.map((plot) =>
                  String(plot.id) === String(createdPlot.id) ? createdPlot : plot
                )
              : [createdPlot, ...plots];
            const status = createdPlot.status || "Dang_canh_tac";
            const activeCount = Number.isFinite(Number(season.active_plots_count))
              ? Number(season.active_plots_count)
              : plots.filter((plot) => plot.status === "Dang_canh_tac").length;
            const harvestedCount = Number.isFinite(Number(season.harvested_plots_count))
              ? Number(season.harvested_plots_count)
              : plots.filter((plot) => plot.status === "Da_thu_hoach").length;
            const totalArea = Number.isFinite(Number(season.total_area_m2))
              ? Number(season.total_area_m2)
              : plots.reduce((sum, plot) => sum + (Number(plot.area_m2) || 0), 0);

            return {
              ...season,
              plots: nextPlots,
              total_plots:
                (Number.isFinite(Number(season.total_plots))
                  ? Number(season.total_plots)
                  : plots.length) + (exists ? 0 : 1),
              active_plots_count: activeCount + (!exists && status === "Dang_canh_tac" ? 1 : 0),
              harvested_plots_count:
                harvestedCount + (!exists && status === "Da_thu_hoach" ? 1 : 0),
              total_area_m2: totalArea + (!exists ? Number(createdPlot.area_m2) || 0 : 0),
            };
          })
        );
      }
      showToast(`Đã thêm lô "${plotForm.plot_name}" vào ${activeSeasonForPlot.name}!`);
      setIsAddPlotOpen(false);
      setPlotForm({ product_id: "", plot_name: "", area_m2: "", planting_date: "" });
      fetchSeasons(true, true);
    } catch (err) {
      if (isApiValidationError(err)) {
        setPlotError(getApiValidationMessage(err));
      } else {
        notifyApiErrorToast(err, "Không thể thêm lô canh tác. Vui lòng kiểm tra lại.");
      }
    } finally {
      setPlotSubmitting(false);
    }
  };

  // Xử lý khi chọn xem nhật ký 1 lô cụ thể
  const handleSelectPlot = (plot) => {
    if (selectedPlot?.id === plot.id) {
      setSelectedPlot(null);
      setLogs([]);
    } else {
      setSelectedPlot(plot);
      fetchLogs(plot.id);
      setMobileTab("timeline"); // Chuyển sang xem timeline tức thì trên di động/tablet
    }
  };

  // Cập nhật thông tin cơ sở nông trại
  const handleUpdateFarmInfo = async (e) => {
    e.preventDefault();
    if (!farmForm.address.trim()) {
      setFarmError("Vui lòng nhập địa chỉ cơ sở nông trại.");
      return;
    }
    setFarmSubmitting(true);
    setFarmError("");
    try {
      const res = await farmApi.updateFarmInfo({
        name: farmForm.name.trim(),
        address: farmForm.address.trim(),
      });
      const updated = res.data?.data || farmForm;
      setFarmInfo(updated);
      showToast("Đã cập nhật địa chỉ cơ sở nông trại thành công!");
      setIsEditFarmModalOpen(false);
      window.dispatchEvent(new CustomEvent("farm-info-updated", { detail: updated }));
    } catch (err) {
      if (isApiValidationError(err)) {
        setFarmError(getApiValidationMessage(err));
      } else {
        notifyApiErrorToast(err, "Không thể cập nhật địa chỉ cơ sở.");
      }
    } finally {
      setFarmSubmitting(false);
    }
  };

  // Xóa nhật ký canh tác
  const handleDeleteLog = async (id) => {
    const confirmed = await confirmGlobalDialog({
      title: "Xóa bản ghi nhật ký?",
      message: "Bạn có chắc chắn muốn xóa bản ghi nhật ký canh tác này? Thao tác này không thể hoàn tác.",
      confirmLabel: "Xóa Nhật Ký",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await farmApi.deleteFarmingLog(id);
      showToast("Đã xóa nhật ký canh tác.");
      if (selectedPlot?.id) {
        fetchLogs(selectedPlot.id);
      }
    } catch (err) {
      showApiErrorToast("Không thể xóa nhật ký", err);
    }
  };

  // Xóa mùa vụ
  const handleDeleteSeason = async (season) => {
    const confirmText =
      season.plots && season.plots.length > 0
        ? `Mùa vụ "${season.name}" hiện đang có ${season.plots.length} lô canh tác. Bạn có chắc chắn muốn xóa toàn bộ không?`
        : `Bạn có chắc chắn muốn xóa mùa vụ "${season.name}" không?`;

    const confirmed = await confirmGlobalDialog({
      title: "Xóa mùa vụ canh tác?",
      message: confirmText,
      confirmLabel: "Xóa Mùa Vụ",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await farmApi.deleteSeason(season.id);
      showToast(`Đã xóa mùa vụ "${season.name}" thành công.`);
      setSeasons((prev) =>
        prev.filter((item) => String(item.id) !== String(season.id))
      );
      if (selectedPlot?.season_id === season.id) {
        setSelectedPlot(null);
        setLogs([]);
      }
    } catch (err) {
      showApiErrorToast("Không thể xóa mùa vụ", err);
    }
  };

  // Đổi trạng thái mùa vụ (Đang diễn ra <-> Đã kết thúc)
  const handleToggleSeasonStatus = async (season) => {
    const nextStatus = season.status === "Dang_dien_ra" ? "Da_ket_thuc" : "Dang_dien_ra";
    const label = nextStatus === "Da_ket_thuc" ? "kết thúc mùa vụ" : "kích hoạt lại mùa vụ";

    const confirmed = await confirmGlobalDialog({
      title: nextStatus === "Da_ket_thuc" ? "Kết thúc mùa vụ?" : "Kích hoạt lại mùa vụ?",
      message: `Bạn có chắc chắn muốn ${label} "${season.name}"?`,
      confirmLabel: nextStatus === "Da_ket_thuc" ? "Kết Thúc Vụ" : "Kích Hoạt Lại",
      variant: nextStatus === "Da_ket_thuc" ? "warning" : "primary",
    });
    if (!confirmed) return;

    try {
      await farmApi.updateSeason(season.id, { status: nextStatus });
      showToast(`Đã ${label} thành công!`);
      setSeasons((prev) =>
        prev.map((item) =>
          String(item.id) === String(season.id)
            ? { ...item, status: nextStatus }
            : item
        )
      );
    } catch (err) {
      showApiErrorToast("Không thể cập nhật trạng thái mùa vụ", err);
    }
  };

  // Xóa lô canh tác trong mùa vụ
  const handleDeletePlot = async (seasonId, plot) => {
    const confirmed = await confirmGlobalDialog({
      title: "Xóa lô canh tác?",
      message: `Bạn có chắc chắn muốn xóa lô "${plot.plot_name}"? Dữ liệu nhật ký và lô liên quan sẽ bị gỡ bỏ.`,
      confirmLabel: "Xóa Lô Đất",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await farmApi.deletePlot(seasonId, plot.id);
      showToast(`Đã xóa lô "${plot.plot_name}".`);
      setSeasons((prev) =>
        prev.map((season) => {
          if (String(season.id) !== String(seasonId)) return season;

          const plots = Array.isArray(season.plots) ? season.plots : [];
          const removedPlot = plots.find((item) => String(item.id) === String(plot.id));
          if (!removedPlot) return season;

          const nextPlots = plots.filter((item) => String(item.id) !== String(plot.id));
          const activeCount = Number.isFinite(Number(season.active_plots_count))
            ? Number(season.active_plots_count)
            : plots.filter((item) => item.status === "Dang_canh_tac").length;
          const harvestedCount = Number.isFinite(Number(season.harvested_plots_count))
            ? Number(season.harvested_plots_count)
            : plots.filter((item) => item.status === "Da_thu_hoach").length;
          const totalArea = Number.isFinite(Number(season.total_area_m2))
            ? Number(season.total_area_m2)
            : plots.reduce((sum, item) => sum + (Number(item.area_m2) || 0), 0);

          return {
            ...season,
            plots: nextPlots,
            total_plots: Math.max(
              0,
              (Number.isFinite(Number(season.total_plots))
                ? Number(season.total_plots)
                : plots.length) - 1
            ),
            active_plots_count: Math.max(
              0,
              activeCount - (removedPlot.status === "Dang_canh_tac" ? 1 : 0)
            ),
            harvested_plots_count: Math.max(
              0,
              harvestedCount - (removedPlot.status === "Da_thu_hoach" ? 1 : 0)
            ),
            total_area_m2: Math.max(
              0,
              totalArea - (Number(removedPlot.area_m2) || 0)
            ),
          };
        })
      );
      if (selectedPlot?.id === plot.id) {
        setSelectedPlot(null);
        setLogs([]);
      }
    } catch (err) {
      showApiErrorToast("Không thể xóa lô canh tác", err);
    }
  };

  // Mở modal điều chỉnh thông tin & diện tích lô
  const handleOpenEditPlot = (season, plot) => {
    setActiveSeasonForPlot(season);
    setEditingPlot(plot);
    setEditPlotForm({
      product_id: plot.product_id ? String(plot.product_id) : "",
      plot_name: plot.plot_name || "",
      area_m2: plot.area_m2 !== undefined && plot.area_m2 !== null ? String(plot.area_m2) : "",
      planting_date: plot.planting_date || "",
      status: plot.status || "Dang_canh_tac",
    });
    setEditPlotError("");
    setIsEditPlotOpen(true);
  };

  // Lưu cập nhật thông tin & diện tích lô
  const handleUpdatePlot = async (e) => {
    e.preventDefault();
    if (!editPlotForm.plot_name.trim() || !editPlotForm.area_m2) {
      setEditPlotError("Vui lòng nhập tên lô và diện tích canh tác.");
      return;
    }
    const areaNum = parseFloat(editPlotForm.area_m2);
    if (isNaN(areaNum) || areaNum <= 0) {
      setEditPlotError("Diện tích canh tác phải lớn hơn 0 m².");
      return;
    }

    setEditPlotSubmitting(true);
    setEditPlotError("");
    try {
      const res = await farmApi.updatePlot(activeSeasonForPlot.id, editingPlot.id, {
        product_id: editPlotForm.product_id ? parseInt(editPlotForm.product_id, 10) : undefined,
        plot_name: editPlotForm.plot_name.trim(),
        area_m2: areaNum,
        planting_date: editPlotForm.planting_date,
        status: editPlotForm.status,
      });
      const updatedPlot = res?.data?.data ?? res?.data;
      if (updatedPlot?.id != null) {
        setSeasons((prev) =>
          prev.map((season) => {
            if (String(season.id) !== String(activeSeasonForPlot.id)) return season;

            const plots = Array.isArray(season.plots) ? season.plots : [];
            const oldPlot = plots.find((plot) => String(plot.id) === String(updatedPlot.id));
            if (!oldPlot) return season;

            const activeCount = Number.isFinite(Number(season.active_plots_count))
              ? Number(season.active_plots_count)
              : plots.filter((plot) => plot.status === "Dang_canh_tac").length;
            const harvestedCount = Number.isFinite(Number(season.harvested_plots_count))
              ? Number(season.harvested_plots_count)
              : plots.filter((plot) => plot.status === "Da_thu_hoach").length;
            const totalArea = Number.isFinite(Number(season.total_area_m2))
              ? Number(season.total_area_m2)
              : plots.reduce((sum, plot) => sum + (Number(plot.area_m2) || 0), 0);

            return {
              ...season,
              plots: plots.map((plot) =>
                String(plot.id) === String(updatedPlot.id) ? updatedPlot : plot
              ),
              active_plots_count:
                activeCount -
                (oldPlot.status === "Dang_canh_tac" ? 1 : 0) +
                (updatedPlot.status === "Dang_canh_tac" ? 1 : 0),
              harvested_plots_count:
                harvestedCount -
                (oldPlot.status === "Da_thu_hoach" ? 1 : 0) +
                (updatedPlot.status === "Da_thu_hoach" ? 1 : 0),
              total_area_m2:
                totalArea -
                (Number(oldPlot.area_m2) || 0) +
                (Number(updatedPlot.area_m2) || 0),
            };
          })
        );
      }
      showToast(`Đã điều chỉnh diện tích (${areaNum} m²) cho lô "${editPlotForm.plot_name}"!`);
      setIsEditPlotOpen(false);
      fetchSeasons(true, true);
    } catch (err) {
      if (isApiValidationError(err)) {
        setEditPlotError(getApiValidationMessage(err));
      } else {
        notifyApiErrorToast(err, "Không thể cập nhật lô canh tác. Vui lòng thử lại.");
      }
    } finally {
      setEditPlotSubmitting(false);
    }
  };

  // Thống kê nhanh
  const totalActivePlots = seasons.reduce((acc, s) => acc + (s.active_plots_count || 0), 0);
  const totalArea = seasons.reduce((acc, s) => acc + (s.total_area_m2 || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-5 pb-10">
      {/* Top Banner & Quick Stats - Đồng bộ giao diện Staff Farm */}
      <div className="bg-gradient-to-br from-white via-[#fcfdfa] to-emerald-50/30 rounded-2xl p-4 sm:p-5 shadow-xs border border-emerald-900/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <button
              type="button"
              onClick={() => {
                setFarmForm({
                  name: farmInfo.name || "Nông Trại Xanh Củ Chi",
                  address: farmInfo.address || "Ấp 3, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh",
                });
                setIsEditFarmModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-full text-[10.5px] font-bold text-emerald-800 transition-colors group cursor-pointer"
              title="Nhấp để cập nhật tên & địa chỉ cơ sở nông trại"
            >
              <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
              <span className="truncate max-w-[240px]">
                {farmInfo.address || "Cơ sở #1 • Củ Chi, TP.HCM"}
              </span>
              <Pencil className="w-2.5 h-2.5 text-emerald-500 opacity-70 group-hover:opacity-100 ml-0.5 shrink-0" />
            </button>

            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50/70 rounded-full text-[10.5px] font-bold text-emerald-700 border border-emerald-200/60">
              <Sprout className="w-3 h-3 text-emerald-600" />
              <span>Phân Hệ Nông Trại</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Mùa Vụ & Canh Tác
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddSeasonOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs hover:shadow active:scale-[0.98] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Thêm Mùa Vụ</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddLogOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Ghi Nhật Ký</span>
          </button>
        </div>
      </div>

      {/* Quick Stat Cards - Gọn gàng đồng bộ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Mùa vụ đang chạy */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Mùa Vụ Đang Chạy</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums">
            {seasons.filter((s) => s.status === "Dang_dien_ra").length}{" "}
            <span className="text-xs font-semibold text-slate-500">vụ</span>
          </div>
        </div>

        {/* Lô đang canh tác */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-emerald-800">Lô Đang Canh Tác</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <Sprout className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight tabular-nums">
            {totalActivePlots}{" "}
            <span className="text-xs font-semibold text-slate-500">lô</span>
          </div>
        </div>

        {/* Tổng diện tích */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Tổng Diện Tích</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums">
            {totalArea.toLocaleString()}{" "}
            <span className="text-xs font-semibold text-slate-500">m²</span>
          </div>
        </div>

        {/* Lô đang chọn */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              {selectedPlot ? "Lô Đang Chọn" : "Tổng Số Lô"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-800 tracking-tight truncate">
            {selectedPlot ? `${selectedPlot.plot_name}` : `${allPlots.length} lô`}
          </div>
        </div>
      </div>

      {/* Mobile Segmented Switcher (Visible only below lg) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-200/80 rounded-2xl border border-slate-300/60 shadow-inner">
        <button
          type="button"
          onClick={() => setMobileTab("plots")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "plots"
              ? "bg-white text-emerald-950 shadow-xs ring-1 ring-black/5"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Lô & Mùa Vụ</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
            {allPlots.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("timeline")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "timeline"
              ? "bg-white text-emerald-950 shadow-xs ring-1 ring-black/5"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Nhật Ký Mốc</span>
          {selectedPlot && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          )}
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Season & Plot Cards (7 cols) */}
        <div className={`lg:col-span-7 space-y-3.5 ${mobileTab === "timeline" ? "hidden lg:block" : "block"}`}>
          {/* Controls Bar */}
          <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm mùa vụ, nông sản..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all placeholder:text-slate-400 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100"
                  aria-label="Xóa từ khóa"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Season Cards List - Khung bo lại và có thanh cuộn mượt */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 animate-pulse space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div className="h-16 bg-slate-100 rounded-xl" />
                    <div className="h-16 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSeasons.length === 0 ? (
            <div className="bg-white p-10 text-center rounded-2xl border border-slate-200/80 shadow-xs">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Chưa có mùa vụ nào</h3>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[calc(100vh-270px)] min-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredSeasons.map((season) => (
                <div
                  key={season.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all hover:border-emerald-300/80"
                >
                  {/* Season Card Header */}
                  <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            season.status === "Dang_dien_ra"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-slate-200 text-slate-700 border-slate-300"
                          }`}
                        >
                          {season.status === "Dang_dien_ra" ? "Đang diễn ra" : "Đã kết thúc"}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Bắt đầu: {season.start_date} {season.end_date ? `— Đến: ${season.end_date}` : ""}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900">{season.name}</h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSeasonStatus(season)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                          season.status === "Dang_dien_ra"
                            ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                        }`}
                        title={season.status === "Dang_dien_ra" ? "Đóng / Kết thúc mùa vụ này" : "Mở lại mùa vụ"}
                      >
                        {season.status === "Dang_dien_ra" ? "Kết thúc vụ" : "Mở lại vụ"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSeasonForPlot(season);
                          setIsAddPlotOpen(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Thêm Lô</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSeason(season)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa mùa vụ này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Plots Grid - Bo lại và có thanh cuộn mượt cho từng mùa vụ */}
                  <div className="p-3 sm:p-3.5">
                    <h4 className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>Lô canh tác ({season.plots?.length || 0})</span>
                      <span className="text-[10.5px] text-slate-400 normal-case">
                        Tổng: <strong className="text-slate-700">{(season.total_area_m2 || 0).toLocaleString()} m²</strong>
                      </span>
                    </h4>

                    {!season.plots || season.plots.length === 0 ? (
                      <div className="text-center py-5 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500">Mùa vụ này chưa có lô canh tác nào.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSeasonForPlot(season);
                            setIsAddPlotOpen(true);
                          }}
                          className="text-xs font-bold text-emerald-700 hover:underline mt-1 inline-block cursor-pointer"
                        >
                          + Thêm lô
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                        {season.plots.map((plot) => {
                          const isSelected = selectedPlot?.id === plot.id;

                          return (
                            <div
                              key={plot.id}
                              onClick={() => handleSelectPlot(plot)}
                              className={`p-3 rounded-xl border transition-all text-left relative flex flex-col justify-between cursor-pointer group ${
                                isSelected
                                  ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                                  : "bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-2xs"
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1.5 mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                        isSelected
                                          ? "bg-emerald-700 text-white shadow-2xs"
                                          : "bg-emerald-50 text-emerald-800 group-hover:bg-emerald-100"
                                      }`}
                                    >
                                      <Sprout className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <h5 className="text-xs font-extrabold text-slate-900 truncate">
                                        {plot.plot_name}
                                      </h5>
                                      <span className="text-[11px] text-emerald-800 font-bold truncate block">
                                        {plot.product_name || "Nông sản"}
                                      </span>
                                    </div>
                                  </div>
                                  <span
                                    className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${
                                      plot.status === "Dang_canh_tac"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                    }`}
                                  >
                                    {plot.status === "Dang_canh_tac" ? "Đang trồng" : "Đã thu hoạch"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 text-[10.5px] text-slate-600 my-2 pt-2 border-t border-slate-100">
                                  <div className="flex items-center gap-1 truncate">
                                    <span className="text-slate-400">Diện tích:</span>
                                    <strong className="text-slate-800 font-bold">{plot.area_m2} m²</strong>
                                  </div>
                                  <div className="flex items-center gap-1 truncate">
                                    <span className="text-slate-400">Gieo:</span>
                                    <strong className="text-slate-800 font-bold">{plot.planting_date}</strong>
                                  </div>
                                </div>

                                {plot.latest_activity && (
                                  <div className="text-[10px] text-slate-600 bg-slate-50/90 p-1.5 rounded-lg border border-slate-100 line-clamp-2">
                                    <span className="font-semibold text-emerald-800">Mốc gần nhất:</span>{" "}
                                    <strong>{plot.latest_activity.date}</strong> — {plot.latest_activity.note}
                                  </div>
                                )}
                              </div>

                              {/* Actions on Plot */}
                              <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                                <span
                                  className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 shrink-0 ${
                                    isSelected
                                      ? "bg-emerald-700 text-white shadow-2xs"
                                      : "text-slate-600 group-hover:text-emerald-800"
                                  }`}
                                >
                                  {isSelected ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      Đang xem
                                    </>
                                  ) : (
                                    <>
                                      Xem nhật ký
                                      <ChevronRight className="w-3 h-3" />
                                    </>
                                  )}
                                </span>

                                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPlot(plot);
                                      fetchLogs(plot.id);
                                      setIsAddLogOpen(true);
                                    }}
                                    className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-900 px-1.5 py-0.5 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                    title="Thêm nhật ký canh tác cho lô này"
                                  >
                                    Ghi nhật ký
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPlot(season, plot)}
                                    className="text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                                    title="Điều chỉnh diện tích & thông tin lô"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePlot(season.id, plot)}
                                    className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Xóa lô này"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Farming Log Timeline (5 cols) - Sticky giữ cố định trong tầm mắt */}
        <div className={`lg:col-span-5 lg:sticky lg:top-5 space-y-4 ${mobileTab === "plots" ? "hidden lg:block" : "block"}`}>
          {/* Mobile Back Button to return to Plots list */}
          <div className="lg:hidden flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setMobileTab("plots")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-800 shadow-xs hover:bg-slate-50 transition-colors"
            >
              ← Quay lại danh sách mùa vụ & lô
            </button>
            {selectedPlot && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 truncate max-w-[160px]">
                {selectedPlot.plot_name}
              </span>
            )}
          </div>
          {!selectedPlot ? (
            /* Quieter, calm empty guide state enforcing plot selection */
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100/80 shadow-inner">
                <Sprout className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">
                Nhật Ký Canh Tác Theo Mốc
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                Vui lòng nhấp chọn một <strong>lô canh tác</strong> từ danh sách mùa vụ bên trái để xem toàn bộ dòng thời gian nhật ký chăm sóc, bón phân, tưới tiêu và hình ảnh thực địa theo từng mốc.
              </p>

              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 max-w-xs text-left space-y-2">
                <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Quy tắc nhật ký theo lô:
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Mỗi lô đất được cấp mã nhật ký riêng biệt để liên kết mã QR truy xuất nguồn gốc nông sản VietGAP & Hữu cơ khi sản phẩm xuất xưởng.
                </p>
                <div className="pt-2 border-t border-slate-200/50 text-[11px] text-slate-400">
                  Tổng số lô sẵn sàng: <strong>{allPlots.length} lô</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Plot Header Summary */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {selectedPlot.status === "Dang_canh_tac" ? "Đang trồng" : "Đã thu hoạch"}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {selectedPlot.season_name}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Sprout className="w-5 h-5 text-emerald-600" />
                      {selectedPlot.plot_name}
                    </h3>
                    <p className="text-xs text-emerald-700 font-bold mt-0.5">
                      {selectedPlot.product_name || "Nông sản"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlot(null);
                      setLogs([]);
                    }}
                    className="px-2.5 py-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    title="Đóng xem nhật ký lô này"
                  >
                    <X className="w-4 h-4" />
                    <span>Bỏ chọn</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div>
                    Diện tích lô: <strong className="text-slate-900 font-bold">{selectedPlot.area_m2} m²</strong>
                  </div>
                  <div>
                    Ngày gieo: <strong className="text-slate-900 font-bold">{selectedPlot.planting_date}</strong>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    Đã ghi nhận <strong>{logs.length}</strong> mốc nhật ký
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddLogOpen(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Ghi nhật ký cho lô này
                  </button>
                </div>
              </div>

              {/* Timeline Component */}
              <FarmingLogTimeline
                logs={logs}
                loading={logsLoading}
                onDeleteLog={handleDeleteLog}
                selectedPlot={selectedPlot}
                onCreateBatch={handleOpenCreateBatchFromLog}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal: Ghi nhật ký canh tác (AddFarmingLogModal) */}
      <AddFarmingLogModal
        isOpen={isAddLogOpen}
        onClose={() => setIsAddLogOpen(false)}
        onSuccess={() => {
          showToast("Đã lưu nhật ký canh tác thành công!");
          fetchLogs(selectedPlot?.id || null);
          fetchSeasons(true, true);
        }}
        plots={allPlots}
        defaultPlotId={selectedPlot?.id || null}
      />

      {/* Modal: Tạo Lô Hàng Thu Hoạch (CreateBatchModal - Trỏ từ mốc Thu hoạch ) */}
      <CreateBatchModal
        isOpen={isCreateBatchOpen}
        onClose={() => setIsCreateBatchOpen(false)}
        onSuccess={(newBatch) => {
          showToast(`Đã tạo lô hàng thu hoạch #${newBatch?.batch_code || newBatch?.id} thành công!`);
          fetchLogs(selectedPlot?.id || null);
          fetchSeasons(true, true);
        }}
        initialPlot={batchInitialPlot}
        initialHarvestDate={batchInitialDate}
        initialHarvestLog={batchInitialLog}
        plots={allPlots}
      />

      {/* Modal: Thêm Mùa Vụ Mới */}
      {isAddSeasonOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-[#064e2e] text-white flex items-center justify-between shrink-0">
              <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2 truncate text-white">
                <Calendar className="w-5 h-5 text-[#86efac] shrink-0" />
                <span>Thêm Mùa Vụ Canh Tác Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSeasonOpen(false)}
                className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-emerald-700/50 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="add-season-form" onSubmit={handleCreateSeason} className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4 text-left">
              {seasonError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{seasonError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên Mùa Vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Vụ Đông Xuân 2027 - Khu Nhà Kính C"
                  value={seasonForm.name}
                  onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày Bắt Đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={seasonForm.start_date}
                    onChange={(e) => setSeasonForm({ ...seasonForm, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày Kết Thúc (Dự kiến)
                  </label>
                  <input
                    type="date"
                    value={seasonForm.end_date}
                    onChange={(e) => setSeasonForm({ ...seasonForm, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </form>

            <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-slate-50/95 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddSeasonOpen(false)}
                disabled={seasonSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-all disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="add-season-form"
                disabled={seasonSubmitting}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
              >
                {seasonSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Lưu Mùa Vụ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thêm Lô Canh Tác vào Mùa Vụ */}
      {isAddPlotOpen && activeSeasonForPlot && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-[#064e2e] text-white flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2 truncate text-white">
                  <Sprout className="w-5 h-5 text-[#86efac] shrink-0" />
                  <span>Thêm Lô Canh Tác Mới</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-emerald-200 truncate">Mùa vụ: {activeSeasonForPlot.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPlotOpen(false)}
                className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-emerald-700/50 transition-colors shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="add-plot-form" onSubmit={handleCreatePlot} className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4 text-left">
              {plotError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{plotError}</span>
                </div>
              )}

              <div>
                <label
                  id="add-plot-product-label"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Chọn Loại Nông Sản Gieo Trồng <span className="text-red-500">*</span>
                </label>
                <ProductSelectDropdown
                  products={products}
                  value={plotForm.product_id}
                  onChange={(val) => setPlotForm({ ...plotForm, product_id: val })}
                  placeholder="Chọn loại rau / củ / quả"
                  labelId="add-plot-product-label"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên Lô Canh Tác <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lô B01 - Cải Xoăn Kale"
                  value={plotForm.plot_name}
                  onChange={(e) => setPlotForm({ ...plotForm, plot_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Diện Tích (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="VD: 1200"
                    value={plotForm.area_m2}
                    onChange={(e) => setPlotForm({ ...plotForm, area_m2: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày Gieo Trồng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={plotForm.planting_date}
                    onChange={(e) => setPlotForm({ ...plotForm, planting_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
            </form>

            <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-slate-50/95 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddPlotOpen(false)}
                disabled={plotSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-all disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="add-plot-form"
                disabled={plotSubmitting}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
              >
                {plotSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Thêm Lô Canh Tác</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Điều Chỉnh Diện Tích & Thông Tin Lô Canh Tác */}
      {isEditPlotOpen && editingPlot && activeSeasonForPlot && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-[#064e2e] text-white flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2 truncate text-white">
                  <Pencil className="w-4 h-4 text-[#86efac] shrink-0" />
                  <span>Điều Chỉnh Diện Tích & Lô</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-emerald-200 truncate">Mùa vụ: {activeSeasonForPlot.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditPlotOpen(false)}
                className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-emerald-700/50 transition-colors shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="edit-plot-form" onSubmit={handleUpdatePlot} className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4 text-left">
              {editPlotError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{editPlotError}</span>
                </div>
              )}

              {/* Ô nhập Diện Tích (Nổi bật) */}
              <div className="p-3 sm:p-3.5 bg-emerald-50/70 border-2 border-emerald-500/40 rounded-2xl">
                <label className="block text-xs font-extrabold text-emerald-900 uppercase tracking-wider mb-1">
                  Diện Tích Canh Tác (m²) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    placeholder="VD: 1500"
                    value={editPlotForm.area_m2}
                    onChange={(e) => setEditPlotForm({ ...editPlotForm, area_m2: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                    m²
                  </span>
                </div>
                <p className="text-[10.5px] sm:text-[11px] text-emerald-800 mt-1.5">
                  Thay đổi diện tích lô sẽ tự động đồng bộ lại tổng diện tích toàn mùa vụ.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên Lô Canh Tác <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPlotForm.plot_name}
                  onChange={(e) => setEditPlotForm({ ...editPlotForm, plot_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label
                  id="edit-plot-product-label"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Loại Nông Sản Giống Trồng
                </label>
                <ProductSelectDropdown
                  products={products}
                  value={editPlotForm.product_id}
                  onChange={(val) => setEditPlotForm({ ...editPlotForm, product_id: val })}
                  placeholder="Giữ nguyên hoặc chọn loại khác"
                  labelId="edit-plot-product-label"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ngày Gieo Trồng
                  </label>
                  <input
                    type="date"
                    value={editPlotForm.planting_date}
                    onChange={(e) => setEditPlotForm({ ...editPlotForm, planting_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Trạng Thái Lô
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                    {[
                      { value: "Dang_canh_tac", label: "Đang canh tác" },
                      { value: "Da_thu_hoach", label: "Đã thu hoạch" },
                    ].map((opt) => {
                      const active = editPlotForm.status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditPlotForm({ ...editPlotForm, status: opt.value })}
                          className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                            active
                              ? "bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-200"
                              : "text-slate-600 hover:text-slate-800"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </form>

            <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-slate-50/95 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditPlotOpen(false)}
                disabled={editPlotSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-all disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="edit-plot-form"
                disabled={editPlotSubmitting}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
              >
                {editPlotSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Lưu Điều Chỉnh</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cập Nhật Thông Tin & Địa Chỉ Cơ Sở Nông Trại */}
      {isEditFarmModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-[#064e2e] text-white flex items-center justify-between shrink-0">
              <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2 truncate text-white">
                <MapPin className="w-5 h-5 text-[#86efac] shrink-0" />
                <span>Cập Nhật Cơ Sở & Địa Chỉ Nông Trại</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditFarmModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-emerald-700/50 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="edit-farm-form" onSubmit={handleUpdateFarmInfo} className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4 text-left">
              {farmError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{farmError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên Cơ Sở / Nông Trại
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nông Trại Xanh Củ Chi"
                  value={farmForm.name}
                  onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Địa Chỉ Cơ Sở Nông Trại <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Ấp 3, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh"
                  value={farmForm.address}
                  onChange={(e) => setFarmForm({ ...farmForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all leading-relaxed"
                  required
                />
                <p className="text-[10.5px] sm:text-[11px] text-slate-500 mt-1">
                  Địa chỉ này sẽ hiển thị trên thanh điều hướng nội bộ và xuất hiện trên hồ sơ nguồn gốc nông sản.
                </p>
              </div>
            </form>

            <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-slate-50/95 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditFarmModalOpen(false)}
                disabled={farmSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-all disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="edit-farm-form"
                disabled={farmSubmitting}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
              >
                {farmSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
