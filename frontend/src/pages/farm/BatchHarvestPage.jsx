/* Harvest batch management, QR-label traceability, and wastage recording page. */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Award,
  PackageCheck,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  Sprout,
  Calendar,
  Printer,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Layers,
  RefreshCw,
  ClipboardList,
  ExternalLink,
  ChevronRight,
  User,
} from "lucide-react";
import { farmApi } from "../../services/farmApi";
import { showGlobalToast } from "../../components/GlobalToast";
import {
  getApiValidationMessage,
  isApiValidationError,
  notifyApiErrorToast,
} from "../../services/axiosClient";
import CreateBatchModal from "../../components/farm/modals/CreateBatchModal";
import QrPrintPreviewModal from "../../components/farm/modals/QrPrintPreviewModal";

export default function BatchHarvestPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation Tabs: "batches" (Danh sách Lô hàng) | "disposals" (Kiểm kho & Hao hụt )
  const [activeMainTab, setActiveMainTab] = useState("batches");

  // Data State
  const [batches, setBatches] = useState([]);
  const [disposals, setDisposals] = useState([]);
  const [stats, setStats] = useState({
    total_batches: 0,
    active_batches: 0,
    expiring_soon_batches: 0,
    depleted_batches: 0,
    total_initial_qty: 0,
    total_available_qty: 0,
  });
  const [eligiblePlots, setEligiblePlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDisposals, setLoadingDisposals] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [disposalTypeFilter, setDisposalTypeFilter] = useState("ALL");

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialPlot, setCreateInitialPlot] = useState(null);
  const [createInitialDate, setCreateInitialDate] = useState(null);

  // QR Modal
  const [activeQrBatch, setActiveQrBatch] = useState(null);

  // Selected Batch Info & Control Panel (Master-Detail)
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [detailBatch, setDetailBatch] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailSubTab, setDetailSubTab] = useState("certificates"); // "certificates" | "timeline" | "disposals"

  // Record Wastage Modal
  const [wastageBatch, setWastageBatch] = useState(null);
  const [wastageForm, setWastageForm] = useState({
    quantity: "",
    type: "Hao_hut",
    reason: "",
  });
  const [wastageSubmitting, setWastageSubmitting] = useState(false);
  const [wastageError, setWastageError] = useState("");

  // Thông báo nổi dùng chung toàn hệ thống (top-center)
  const showToast = useCallback((msg, type = "success") => {
    showGlobalToast(msg, type);
  }, []);

  // Tải danh sách lô hàng thu hoạch
  const fetchBatches = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await farmApi.getBatches();
      const payload = res.data?.data ?? res.data ?? res ?? {};
      setBatches(payload.batches || []);
      if (payload.stats) {
        setStats(payload.stats);
      }
    } catch (err) {
      notifyApiErrorToast(err, "Không thể tải danh sách lô thu hoạch.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Tải danh sách lô canh tác đủ điều kiện thu hoạch
  const fetchEligiblePlots = useCallback(async () => {
    try {
      const res = await farmApi.getEligiblePlots();
      const payload = res.data?.data ?? res.data ?? res ?? [];
      setEligiblePlots(Array.isArray(payload) ? payload : []);
    } catch (err) {
      notifyApiErrorToast(err, "Không thể tải danh sách lô canh tác đủ điều kiện.");
    }
  }, []);

  // Tải sổ kho lịch sử biến động / hao hụt
  const fetchDisposals = useCallback(async () => {
    setLoadingDisposals(true);
    try {
      const res = await farmApi.getDisposals();
      const payload = res.data?.data ?? res.data ?? res ?? [];
      setDisposals(Array.isArray(payload) ? payload : []);
    } catch (err) {
      notifyApiErrorToast(err, "Không thể tải lịch sử kiểm kho.");
    } finally {
      setLoadingDisposals(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
    fetchEligiblePlots();
  }, [fetchBatches, fetchEligiblePlots]);

  useEffect(() => {
    if (activeMainTab === "disposals") {
      fetchDisposals();
    }
  }, [activeMainTab, fetchDisposals]);

  // Tự động mở CreateBatchModal hoặc điền bộ lọc tìm kiếm nếu có query params
  useEffect(() => {
    const shouldCreate = searchParams.get("create");
    const plotId = searchParams.get("plot_id");
    const harvestDate = searchParams.get("harvest_date");
    const searchQ = searchParams.get("search") || searchParams.get("batch_id");

    if (searchQ) {
      setSearchTerm(searchQ);
    }

    if (shouldCreate === "1" || plotId) {
      if (plotId && eligiblePlots.length > 0) {
        const found = eligiblePlots.find((p) => String(p.id) === String(plotId));
        if (found) setCreateInitialPlot(found);
      }
      if (harvestDate) {
        setCreateInitialDate(harvestDate);
      }
      setIsCreateOpen(true);
    }
  }, [searchParams, eligiblePlots]);

  // Lọc danh sách lô
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const kw = searchTerm.toLowerCase();
        const matchId = String(b.id) === kw || `#${b.id}` === kw || `lh-${b.id}` === kw;
        const matchCode = b.batch_code?.toLowerCase().includes(kw);
        const matchPlot = b.plot_name?.toLowerCase().includes(kw);
        const matchProduct = b.product_name?.toLowerCase().includes(kw);
        const matchSeason = b.season_name?.toLowerCase().includes(kw);
        return matchId || matchCode || matchPlot || matchProduct || matchSeason;
      }
      return true;
    });
  }, [batches, statusFilter, searchTerm]);

  // Lọc lịch sử hao hụt kho
  const filteredDisposals = useMemo(() => {
    return disposals.filter((d) => {
      if (disposalTypeFilter !== "ALL" && d.type !== disposalTypeFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const kw = searchTerm.toLowerCase();
        const matchCode = d.batch_code?.toLowerCase().includes(kw);
        const matchProduct = d.product_name?.toLowerCase().includes(kw);
        const matchReason = d.reason?.toLowerCase().includes(kw);
        return matchCode || matchProduct || matchReason;
      }
      return true;
    });
  }, [disposals, disposalTypeFilter, searchTerm]);

  // Chọn lô hàng -> mở bảng thông tin & thao tác điều khiển ngay lập tức
  const handleSelectBatch = useCallback(async (batch, forceReload = false) => {
    if (!batch) {
      setSelectedBatch(null);
      setDetailBatch(null);
      return;
    }

    if (!forceReload && selectedBatch?.id === batch.id) {
      setSelectedBatch(null);
      setDetailBatch(null);
      return;
    }

    setSelectedBatch(batch);
    setDetailBatch(null);
    setLoadingDetail(true);

    // Tự động cuộn đến bảng chi tiết trên màn hình nhỏ/vừa
    setTimeout(() => {
      document.getElementById("batch-detail-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);

    try {
      const res = await farmApi.getBatchDetail(batch.id);
      const payload = res.data?.data ?? res.data ?? null;
      if (payload) {
        setDetailBatch(payload);
        setSelectedBatch(payload);
      }
    } catch (err) {
      notifyApiErrorToast(err, "Không thể tải chi tiết truy xuất nguồn gốc lô hàng.");
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedBatch?.id]);

  // Tự mở bảng thông tin & điều khiển nếu chuyển trang kèm ?search={id} hoặc ?batch_id={id}
  useEffect(() => {
    const targetQ = searchParams.get("batch_id") || searchParams.get("search");
    if (targetQ && batches.length > 0 && !selectedBatch) {
      const matched = batches.find(
        (b) =>
          String(b.id) === String(targetQ) ||
          b.batch_code?.toLowerCase() === String(targetQ).toLowerCase()
      );
      if (matched) {
        handleSelectBatch(matched, true);
      }
    }
  }, [searchParams, batches, selectedBatch, handleSelectBatch]);

  // Mở modal xuất hủy / hao hụt
  const handleOpenWastage = (batch) => {
    setWastageBatch(batch);
    setWastageForm({
      quantity: "",
      type: "Hao_hut",
      reason: "",
    });
    setWastageError("");
  };

  // Gửi lệnh ghi nhận hao hụt
  const handleSubmitWastage = async (e) => {
    e.preventDefault();
    if (!wastageBatch) return;

    const qty = parseFloat(wastageForm.quantity);
    if (!wastageForm.quantity || isNaN(qty) || qty <= 0) {
      setWastageError("Số lượng hao hụt phải lớn hơn 0.");
      return;
    }
    if (qty > wastageBatch.remaining_quantity) {
      setWastageError(
        `Số lượng xuất hủy (${qty} ${wastageBatch.product_unit}) vượt quá tồn kho thực tế (${wastageBatch.remaining_quantity} ${wastageBatch.product_unit}).`
      );
      return;
    }
    if (!wastageForm.reason.trim()) {
      setWastageError("Vui lòng ghi rõ lý do xuất hủy hoặc hao hụt.");
      return;
    }

    setWastageSubmitting(true);
    setWastageError("");

    const affectedBatch = wastageBatch;
    try {
      const res = await farmApi.recordBatchWastage(affectedBatch.id, {
        quantity: qty,
        type: wastageForm.type,
        reason: wastageForm.reason.trim(),
      });
      const updatedBatch = res.data?.data ?? res.data;

      if (updatedBatch?.id) {
        setBatches((prev) =>
          prev.map((batch) =>
            String(batch.id) === String(updatedBatch.id) ? updatedBatch : batch
          )
        );
        setStats((prev) => {
          const availableStatuses = ["Con_hang", "Sap_het_han"];
          const wasAvailable = availableStatuses.includes(affectedBatch.status);
          const isAvailable = availableStatuses.includes(updatedBatch.status);

          return {
            ...prev,
            total_available_qty: Math.max(
              0,
              (Number(prev.total_available_qty) || 0) +
                (isAvailable ? Number(updatedBatch.remaining_quantity) || 0 : 0) -
                (wasAvailable ? Number(affectedBatch.remaining_quantity) || 0 : 0)
            ),
            active_batches: Math.max(
              0,
              (Number(prev.active_batches) || 0) -
                (affectedBatch.status === "Con_hang" ? 1 : 0) +
                (updatedBatch.status === "Con_hang" ? 1 : 0)
            ),
            expiring_soon_batches: Math.max(
              0,
              (Number(prev.expiring_soon_batches) || 0) -
                (affectedBatch.status === "Sap_het_han" ? 1 : 0) +
                (updatedBatch.status === "Sap_het_han" ? 1 : 0)
            ),
            depleted_batches: Math.max(
              0,
              (Number(prev.depleted_batches) || 0) -
                (affectedBatch.status === "Het_hang" ? 1 : 0) +
                (updatedBatch.status === "Het_hang" ? 1 : 0)
            ),
          };
        });
      }

      showToast(`Đã ghi nhận trừ kho ${qty} ${affectedBatch.product_unit} thành công!`);
      setWastageBatch(null);
      if (String(selectedBatch?.id) === String(affectedBatch.id)) {
        handleSelectBatch(updatedBatch || affectedBatch, true);
      }
      if (activeMainTab === "disposals") {
        fetchDisposals();
      }
    } catch (err) {
      if (isApiValidationError(err)) {
        setWastageError(getApiValidationMessage(err));
      } else {
        notifyApiErrorToast(err, "Không thể ghi nhận hao hụt. Vui lòng thử lại.");
      }
    } finally {
      setWastageSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-10">
      {/* Page Header - Tinh gọn & Đồng bộ */}
      <div className="bg-gradient-to-br from-white via-[#fcfdfa] to-emerald-50/30 rounded-2xl p-4 sm:p-5 shadow-xs border border-emerald-900/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 mb-1.5">
            <PackageCheck className="w-3 h-3 text-emerald-700" />
            <span>Phân Hệ Nông Trại</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Lô Hàng Thu Hoạch
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (activeMainTab === "batches") fetchBatches(true);
              else fetchDisposals();
            }}
            disabled={refreshing || loadingDisposals}
            className="p-2 rounded-xl border border-slate-200/80 bg-white shadow-2xs text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition-all cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loadingDisposals ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setCreateInitialPlot(null);
              setCreateInitialDate(null);
              setIsCreateOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs hover:shadow active:scale-[0.98] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Lô Hàng</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards - Gọn gàng đồng bộ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Tổng lô */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Tổng Lô Thu Hoạch</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums">
            {stats.total_batches}
          </div>
        </div>

        {/* Khả dụng */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-emerald-800">Tồn Kho Khả Dụng</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight tabular-nums">
            {Number(stats.total_available_qty || 0).toLocaleString("vi-VN")}{" "}
            <span className="text-xs font-semibold text-slate-500">kg</span>
          </div>
        </div>

        {/* Cận hạn */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-amber-800">Lô Cận Hạn</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight tabular-nums">
            {stats.expiring_soon_batches}
          </div>
        </div>

        {/* Hết hàng */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Đã Xuất Kho</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-700 tracking-tight tabular-nums">
            {stats.depleted_batches}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation - Segmented Switcher */}
      <div className="p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 inline-flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveMainTab("batches")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeMainTab === "batches"
              ? "bg-white text-emerald-950 shadow-xs ring-1 ring-black/5 font-extrabold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Danh Sách Lô Hàng</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
              activeMainTab === "batches"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {batches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("disposals")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeMainTab === "disposals"
              ? "bg-white text-emerald-950 shadow-xs ring-1 ring-black/5 font-extrabold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-emerald-700" />
          <span>Kiểm Kho & Hao Hụt</span>
          {disposals.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                activeMainTab === "disposals"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {disposals.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Danh sách Lô hàng Thu hoạch (Chọn lô -> Hiện thông tin & bảng điều khiển) */}
      {activeMainTab === "batches" && (
        <div
          className={
            selectedBatch
              ? "grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start"
              : "block"
          }
        >
          {/* Danh sách Lô hàng */}
          <div
            className={`bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden ${
              selectedBatch ? "lg:col-span-7" : "w-full"
            }`}
          >
            {/* Toolbar: Search & Status Filters */}
            <div className="p-3 sm:p-3.5 border-b border-slate-200/70 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 bg-gradient-to-b from-slate-50/80 to-white">
              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: "ALL", label: "Tất cả", count: batches.length },
                  { id: "Con_hang", label: "Còn hàng", count: stats.active_batches, dot: "bg-emerald-500 animate-pulse" },
                  { id: "Sap_het_han", label: "Cận hạn", count: stats.expiring_soon_batches, dot: "bg-amber-500" },
                  { id: "Het_hang", label: "Hết hàng", count: stats.depleted_batches, dot: "bg-slate-400" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                      statusFilter === tab.id
                        ? "bg-[#064e2e] text-white shadow-xs ring-1 ring-emerald-800"
                        : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-2xs"
                    }`}
                  >
                    {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-extrabold ${
                        statusFilter === tab.id
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm mã lô, nông sản, lô đất..."
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

            {/* Table Content - Bo lại và có thanh cuộn mượt mà */}
            {loading ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mb-2.5" />
                <p className="text-xs text-slate-500 font-semibold">Đang tải danh sách lô thu hoạch...</p>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800">
                  Không tìm thấy lô hàng thu hoạch nào
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Không có lô nào khớp với điều kiện lọc. Hãy thử tìm từ khóa khác."
                    : "Chưa có lô hàng nào được thu hoạch. Hãy bấm nút 'Tạo Lô Hàng Thu Hoạch' để nhập kho đợt nông sản đầu tiên."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[460px] overflow-y-auto scrollbar-thin">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 shadow-2xs">
                    <tr className="border-b border-slate-200/80 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-3.5 sm:px-4">Lô Hàng & Nông Sản</th>
                      {!selectedBatch && <th className="py-2.5 px-3.5">Lô Canh Tác</th>}
                      <th className="py-2.5 px-3.5">Thu Hoạch & HSD</th>
                      <th className="py-2.5 px-3.5">Tồn Kho</th>
                      <th className="py-2.5 px-3.5 sm:px-4 text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredBatches.map((batch) => {
                      const percentLeft = Math.min(
                        100,
                        Math.round((batch.remaining_quantity / (batch.harvest_quantity || 1)) * 100)
                      );
                      const isSelected = selectedBatch?.id === batch.id;

                      return (
                        <tr
                          key={batch.id}
                          role="button"
                          tabIndex={0}
                          aria-selected={isSelected}
                          onClick={() => handleSelectBatch(batch)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelectBatch(batch);
                            }
                          }}
                          className={`transition-all duration-150 cursor-pointer group focus:outline-none ${
                            isSelected
                              ? "bg-gradient-to-r from-emerald-50/95 via-emerald-50/60 to-white border-l-4 border-l-emerald-600 ring-1 ring-inset ring-emerald-200/80"
                              : "hover:bg-slate-50/80 hover:border-slate-200"
                          }`}
                        >
                          {/* Lô Hàng & Nông Sản */}
                          <td className="py-2.5 px-3.5 sm:px-4">
                            <div className="min-w-0">
                              <div className="font-extrabold text-slate-900 group-hover:text-emerald-950 transition-colors truncate">
                                {batch.product_name}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="font-mono font-bold text-[10.5px] text-emerald-900 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shadow-2xs">
                                  {batch.batch_code}
                                </span>
                                {batch.certificates_count > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-white px-1.5 py-0.2 rounded border border-emerald-200 shadow-2xs">
                                    <Award className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                    <span className="tabular-nums">{batch.certificates_count} CN</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Lô Canh Tác (hiện khi bảng toàn chiều rộng) */}
                          {!selectedBatch && (
                            <td className="py-2.5 px-3.5">
                              <div className="font-bold text-slate-800 truncate max-w-[170px]">
                                {batch.plot_name}
                              </div>
                              <div className="text-[10.5px] text-slate-500 font-medium truncate max-w-[170px]">
                                {batch.season_name}
                              </div>
                            </td>
                          )}

                          {/* Thu Hoạch & HSD */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap tabular-nums">
                            <div className="text-xs font-medium text-slate-700 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{batch.harvest_date}</span>
                            </div>
                            <div className="text-[10.5px] font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>HSD: {batch.expiry_date}</span>
                            </div>
                          </td>

                          {/* Tồn Kho */}
                          <td className="py-2.5 px-3.5 tabular-nums">
                            <div className="flex items-center justify-between gap-2 text-xs mb-1">
                              <span className="font-extrabold text-slate-900">
                                {batch.remaining_quantity} / {batch.harvest_quantity} {batch.product_unit}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">{percentLeft}%</span>
                            </div>
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden ring-1 ring-slate-200/70">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  percentLeft > 40
                                    ? "bg-emerald-600"
                                    : percentLeft > 15
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${percentLeft}%` }}
                              />
                            </div>
                          </td>

                          {/* Trạng Thái & Nút Chi Tiết */}
                          <td className="py-2.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 sm:gap-2">
                              <span
                                className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs inline-flex items-center gap-1 ${
                                  batch.status === "Con_hang"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/90"
                                    : batch.status === "Sap_het_han"
                                    ? "bg-amber-50 text-amber-800 border-amber-200/90"
                                    : batch.status === "Het_hang"
                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-red-50 text-red-800 border-red-200"
                                }`}
                              >
                                {batch.status === "Con_hang" && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                                {batch.status === "Sap_het_han" && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                )}
                                <span>{batch.status_label}</span>
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectBatch(batch);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 ${
                                  isSelected
                                    ? "bg-[#064e2e] text-white ring-1 ring-emerald-800"
                                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80"
                                }`}
                                title="Xem chi tiết lô hàng"
                              >
                                <span>{isSelected ? "Đang xem" : "Chi tiết"}</span>
                                <ChevronRight
                                  className={`w-3 h-3 transition-transform ${
                                    isSelected ? "rotate-90 text-white" : "text-emerald-700"
                                  }`}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cột Phải: Bảng Thông Tin & Thao Tác Điều Khiển của Lô Đang Chọn */}
          {selectedBatch && (() => {
            const activeBatch = detailBatch || selectedBatch;
            const percentLeft = Math.min(
              100,
              Math.round((activeBatch.remaining_quantity / (activeBatch.harvest_quantity || 1)) * 100)
            );
            const certCount =
              detailBatch?.certificates?.length ?? activeBatch.certificates_count ?? 0;

            return (
              <div id="batch-detail-panel" className="lg:col-span-5 lg:sticky lg:top-5 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-right-3 duration-200">
                {/* Panel Header */}
                <div className="p-3.5 sm:p-4 bg-gradient-to-br from-[#064e2e] via-[#043821] to-[#022415] text-white flex items-start justify-between gap-3 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="min-w-0 relative z-10">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded-md backdrop-blur-md bg-white/15 text-emerald-100 border border-white/20 shadow-2xs">
                        {activeBatch.batch_code}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                        {activeBatch.status_label}
                      </span>
                    </div>
                    <h3 className="font-black text-base sm:text-lg text-white mt-1.5 leading-snug break-words tracking-tight">
                      {activeBatch.product_name}
                    </h3>
                    <p className="text-[11px] text-emerald-200/90 mt-0.5 truncate flex items-center gap-1.5 font-medium">
                      <span>{activeBatch.plot_name}</span>
                      <span className="text-emerald-400/60">•</span>
                      <span>{activeBatch.season_name}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectBatch(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer shrink-0 relative z-10 active:scale-95"
                    title="Đóng bảng chi tiết"
                    aria-label="Đóng bảng chi tiết lô hàng"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bảng Thao Tác Điều Khiển */}
                <div className="p-3 sm:p-3.5 border-b border-slate-200/70 bg-gradient-to-b from-slate-50/90 to-white">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveQrBatch(activeBatch)}
                      className="min-h-[36px] sm:min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#064e2e] hover:bg-[#043821] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <Printer className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
                      <span>In Tem QR</span>
                    </button>

                    <Link
                      to={
                        certCount > 0
                          ? `/farm/certificates?batch_id=${activeBatch.id}`
                          : `/farm/certificates?batch_id=${activeBatch.id}&upload=1`
                      }
                      className="min-h-[36px] sm:min-h-[38px] px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
                    >
                      <Award className="w-3.5 h-3.5 shrink-0 text-emerald-100" />
                      <span>{certCount > 0 ? `Chứng Nhận (${certCount})` : "Gắn Chứng Nhận"}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenWastage(activeBatch)}
                      disabled={activeBatch.remaining_quantity <= 0}
                      className="min-h-[36px] sm:min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50/80 text-amber-900 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs active:scale-[0.98]"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        {activeBatch.remaining_quantity > 0 ? "Ghi Hao Hụt" : "Đã Xuất Hết"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Thông Tin Chi Tiết Lô Hàng - Bo lại và có thanh cuộn mượt */}
                <div className="p-3 sm:p-3.5 space-y-3 max-h-[calc(100vh-230px)] overflow-y-auto scrollbar-thin">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Ngày Thu Hoạch
                      </span>
                      <strong className="text-slate-900 font-extrabold tabular-nums mt-0.5 text-xs block">
                        {activeBatch.harvest_date}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Hạn Sử Dụng
                      </span>
                      <strong className="text-emerald-800 font-extrabold tabular-nums mt-0.5 text-xs block">
                        {activeBatch.expiry_date}
                      </strong>
                      <span
                        className={`text-[10px] font-bold mt-0.5 inline-flex items-center gap-1 ${
                          activeBatch.days_until_expiry < 0
                            ? "text-red-600"
                            : activeBatch.days_until_expiry <= 2
                              ? "text-amber-700"
                              : "text-slate-500"
                        }`}
                      >
                        {activeBatch.days_until_expiry < 0
                          ? "• Đã quá hạn"
                          : `• Còn ${activeBatch.days_until_expiry} ngày`}
                      </span>
                    </div>
                  </div>

                  {/* Tồn kho & Người phụ trách */}
                  <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold text-xs">Tồn kho khả dụng</span>
                      <strong className="text-slate-900 font-extrabold tabular-nums text-xs">
                        {activeBatch.remaining_quantity} / {activeBatch.harvest_quantity}{" "}
                        {activeBatch.product_unit} ({percentLeft}%)
                      </strong>
                    </div>
                    <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden ring-1 ring-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentLeft > 40
                            ? "bg-emerald-600"
                            : percentLeft > 15
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${percentLeft}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-0.5 text-[10.5px] text-slate-500">
                      <span className="inline-flex items-center gap-1 min-w-0 truncate font-medium">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{activeBatch.staff_name}</span>
                      </span>
                      <span className="tabular-nums shrink-0">
                        Hao hụt:{" "}
                        <strong className="text-slate-800 font-bold">
                          {activeBatch.wastage_total || 0} {activeBatch.product_unit}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Sub-tabs: Chứng nhận | Nhật ký canh tác | Hao hụt kho */}
                  <div>
                    <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/80 mb-2.5">
                      {[
                        {
                          id: "certificates",
                          label: `Chứng nhận (${detailBatch?.certificates?.length ?? certCount})`,
                        },
                        {
                          id: "timeline",
                          label: `Nhật ký (${detailBatch?.timeline?.length ?? 0})`,
                        },
                        {
                          id: "disposals",
                          label: `Hao hụt (${detailBatch?.disposals?.length ?? 0})`,
                        },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setDetailSubTab(tab.id)}
                          className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer truncate ${
                            detailSubTab === tab.id
                              ? "bg-white text-emerald-900 shadow-2xs border border-slate-200/80 font-extrabold"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {loadingDetail ? (
                      <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Đang tải hồ sơ chi tiết...</span>
                      </div>
                    ) : detailSubTab === "certificates" ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                        {detailBatch?.certificates && detailBatch.certificates.length > 0 ? (
                          detailBatch.certificates.map((cert) => (
                            <div
                              key={cert.id}
                              className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/70 flex items-center justify-between gap-2.5 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 break-words leading-snug">
                                  {cert.name}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 break-words">
                                  {cert.issuer} · Cấp {cert.issued_date}
                                </p>
                              </div>
                              {cert.file_available ? (
                                <a
                                  href={cert.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 text-[11px] font-bold shrink-0 transition-colors"
                                >
                                  <span>Xem</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <Link
                                  to={`/farm/certificates?batch_id=${activeBatch.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold shrink-0"
                                >
                                  <span>Chi tiết</span>
                                </Link>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 space-y-2">
                            <p>Chưa có chứng nhận cho lô này.</p>
                            <Link
                              to={`/farm/certificates?batch_id=${activeBatch.id}&upload=1`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Gắn Chứng Nhận</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : detailSubTab === "timeline" ? (
                      <div className="max-h-64 overflow-y-auto pr-0.5">
                        {detailBatch?.timeline && detailBatch.timeline.length > 0 ? (
                          <div className="relative pl-5 border-l-2 border-emerald-200 space-y-3 ml-1.5">
                            {detailBatch.timeline.map((item) => (
                              <div key={item.id} className="relative">
                                <div className="absolute -left-[25px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs">
                                  <div className="flex items-center justify-between gap-2 text-[10px] mb-1">
                                    <span className="font-bold uppercase text-emerald-800">
                                      {item.activity_type}
                                    </span>
                                    <span className="text-slate-400 tabular-nums">
                                      {item.action_time}
                                    </span>
                                  </div>
                                  <p className="text-slate-700 leading-relaxed break-words">
                                    {item.content}
                                  </p>
                                  <div className="text-[10px] text-slate-400 mt-1">
                                    Người ghi nhận: {item.staff_name}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="py-5 text-center text-xs text-slate-400 italic">
                            Chưa có nhật ký canh tác chi tiết cho lô đất này.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                        {detailBatch?.disposals && detailBatch.disposals.length > 0 ? (
                          detailBatch.disposals.map((d) => (
                            <div
                              key={d.id}
                              className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/70 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-red-700 tabular-nums">
                                  - {d.quantity} {activeBatch.product_unit}
                                </span>
                                <span className="text-[10.5px] text-slate-400 tabular-nums">
                                  {d.recorded_at}
                                </span>
                              </div>
                              <p className="text-slate-700 break-words">{d.reason}</p>
                              <p className="text-[10.5px] text-slate-500">
                                Ghi nhận bởi: {d.staff_name}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="py-5 text-center text-xs text-slate-400 italic">
                            Lô hàng này chưa ghi nhận hao hụt hay xuất hủy nào.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: Kiểm Kho & Sổ Hao Hụt / Xuất Hủy */}
      {activeMainTab === "disposals" && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
            {/* Filter Loại biến động */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: "ALL", label: "Tất cả biến động" },
                { id: "Hao_hut", label: "Hao hụt tự nhiên" },
                { id: "Xuat_huy", label: "Xuất hủy hư hỏng" },
                { id: "Dieu_chinh", label: "Điều chỉnh kiểm kê" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDisposalTypeFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    disposalTypeFilter === tab.id
                      ? "bg-[#064e2e] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm mã lô, nông sản, lý do..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Table Content */}
          {loadingDisposals ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#064e2e] animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-medium">Đang tải sổ theo dõi hao hụt kho...</p>
            </div>
          ) : filteredDisposals.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-7 h-7" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-700">
                Chưa có bản ghi hao hụt nào
              </h4>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[460px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 shadow-2xs">
                  <tr className="border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3.5 sm:px-4">Mã Phiếu & Thời Gian</th>
                    <th className="py-2.5 px-3">Lô Hàng</th>
                    <th className="py-2.5 px-3">Nông Sản</th>
                    <th className="py-2.5 px-3">Loại Biến Động</th>
                    <th className="py-2.5 px-3">Số Lượng Hao Hụt</th>
                    <th className="py-2.5 px-3">Lý Do</th>
                    <th className="py-2.5 px-3.5 sm:px-4">Kỹ Thuật Viên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredDisposals.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3.5 sm:px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 block text-xs">
                          #BDK-{item.id}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {item.recorded_at}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 text-xs">
                          {item.batch_code}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {item.plot_name}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {item.product_name}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            item.type === "Hao_hut"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : item.type === "Xuat_huy"
                              ? "bg-red-50 text-red-800 border-red-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {item.type_label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-extrabold text-red-600 whitespace-nowrap">
                        - {item.quantity} {item.product_unit}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 max-w-xs leading-relaxed text-xs">
                        {item.reason}
                      </td>

                      <td className="py-2.5 px-3.5 sm:px-4 text-slate-500 whitespace-nowrap text-xs">
                        {item.staff_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Tạo Lô Hàng Thu Hoạch */}
      <CreateBatchModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setSearchParams({});
        }}
        onSuccess={(newBatch) => {
          showToast(`Đã tạo lô hàng thu hoạch #${newBatch?.batch_code || newBatch?.id} thành công!`);
          if (newBatch?.id) {
            const isAvailable = ["Con_hang", "Sap_het_han"].includes(newBatch.status);
            setBatches((prev) => [
              newBatch,
              ...prev.filter((batch) => String(batch.id) !== String(newBatch.id)),
            ]);
            setStats((prev) => ({
              ...prev,
              total_batches: (Number(prev.total_batches) || 0) + 1,
              active_batches:
                newBatch.status === "Con_hang"
                  ? (Number(prev.active_batches) || 0) + 1
                  : Number(prev.active_batches) || 0,
              expiring_soon_batches:
                newBatch.status === "Sap_het_han"
                  ? (Number(prev.expiring_soon_batches) || 0) + 1
                  : Number(prev.expiring_soon_batches) || 0,
              depleted_batches:
                newBatch.status === "Het_hang"
                  ? (Number(prev.depleted_batches) || 0) + 1
                  : Number(prev.depleted_batches) || 0,
              total_initial_qty:
                (Number(prev.total_initial_qty) || 0) +
                Number(newBatch.harvest_quantity || 0),
              total_available_qty:
                (Number(prev.total_available_qty) || 0) +
                (isAvailable ? Number(newBatch.remaining_quantity || 0) : 0),
            }));
            handleSelectBatch(newBatch, true);
          }
          fetchEligiblePlots();
        }}
        initialPlot={createInitialPlot}
        initialHarvestDate={createInitialDate}
        plots={eligiblePlots}
      />

      {/* Modal: Xem & In Tem QR Code Đầy Đủ */}
      <QrPrintPreviewModal
        isOpen={!!activeQrBatch}
        onClose={() => setActiveQrBatch(null)}
        batch={activeQrBatch}
      />

      {/* Modal: Ghi nhận hao hụt / Xuất hủy */}
      {wastageBatch && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setWastageBatch(null)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                <AlertTriangle className="w-5 h-5 text-red-200" />
                <span>Kiểm Kho & Ghi Nhận Hao Hụt</span>
              </div>
              <button
                type="button"
                onClick={() => setWastageBatch(null)}
                className="text-red-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWastage} className="p-6 space-y-4">
              {wastageError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{wastageError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                <span className="text-slate-400 block mb-0.5">Lô hàng:</span>
                <strong className="text-slate-800">
                  {wastageBatch.product_name} • {wastageBatch.batch_code}
                </strong>
                <div className="mt-1 text-slate-500">
                  Tồn kho hiện tại:{" "}
                  <strong className="text-emerald-700">
                    {wastageBatch.remaining_quantity} {wastageBatch.product_unit}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Loại Biến Động Kho <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1.5" role="radiogroup" aria-label="Loại biến động kho">
                  {[
                    {
                      value: "Hao_hut",
                      label: "Hao hụt tự nhiên",
                      desc: "Héo, bay hơi nước trong quá trình bảo quản",
                    },
                    {
                      value: "Xuat_huy",
                      label: "Xuất hủy",
                      desc: "Dập nát, hư hỏng không đủ tiêu chuẩn bán",
                    },
                    {
                      value: "Dieu_chinh",
                      label: "Điều chỉnh kiểm kê thực tế",
                      desc: "Cân đối lại số lượng tồn thực tế trong kho",
                    },
                  ].map((opt) => {
                    const isSelected = wastageForm.type === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setWastageForm({ ...wastageForm, type: opt.value })}
                        className={`w-full text-left px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-amber-50/80 border-amber-500 ring-1 ring-amber-500/30"
                            : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300"
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? "border-amber-600 bg-amber-600" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-slate-800 leading-snug">
                            {opt.label}
                          </span>
                          <span className="block text-[11px] text-slate-500 leading-snug mt-0.5">
                            {opt.desc}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số Lượng Hao Hụt ({wastageBatch.product_unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={wastageBatch.remaining_quantity}
                  placeholder={`Tối đa: ${wastageBatch.remaining_quantity}`}
                  value={wastageForm.quantity}
                  onChange={(e) => setWastageForm({ ...wastageForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý Do Ghi Nhận *
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Rau bị dập trong quá trình sơ chế, hỏng bao bì..."
                  value={wastageForm.reason}
                  onChange={(e) => setWastageForm({ ...wastageForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWastageBatch(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={wastageSubmitting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {wastageSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang trừ kho...</span>
                    </>
                  ) : (
                    <span>Xác Nhận Trừ Kho</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
