import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, History, RefreshCw } from "lucide-react";
import { farmApi } from "../../services/farmApi";
import { showGlobalToast } from "../../components/GlobalToast";
import WastageStatCards from "../../components/farm/wastage/WastageStatCards";
import InventoryAuditTab from "../../components/farm/wastage/InventoryAuditTab";
import WastageHistoryTab from "../../components/farm/wastage/WastageHistoryTab";
import RecordWastageModal from "../../components/farm/wastage/RecordWastageModal";

export default function InventoryWastagePage() {
  const [activeTab, setActiveTab] = useState("audit"); // audit | history
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(true);

  const [rawHistory, setRawHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyType, setHistoryType] = useState("");
  const [historySearch, setHistorySearch] = useState("");

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const res = await farmApi.getBatches();
      const payload = res.data?.data ?? res.data ?? {};
      setBatches(Array.isArray(payload) ? payload : payload.batches ?? []);
    } catch {
      showGlobalToast("Không thể tải danh sách lô hàng trong kho.", "error");
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await farmApi.getDisposals();
      const list = res.data?.data ?? res.data ?? [];
      setRawHistory(Array.isArray(list) ? list : []);
    } catch {
      showGlobalToast("Không thể tải lịch sử xuất hủy kho.", "error");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const filteredHistory = rawHistory.filter((item) => {
    if (historyType && item.type !== historyType) return false;
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      String(item.batch_code || "").toLowerCase().includes(q) ||
      String(item.product_name || "").toLowerCase().includes(q)
    );
  });

  const handleRecordWastage = async (payload) => {
    if (!selectedBatch || submitting) return;
    setSubmitting(true);
    try {
      await farmApi.recordBatchWastage(selectedBatch.id, payload);
      showGlobalToast("Đã cập nhật tồn kho thực tế và lưu phiếu biến động.", "success");
      setSelectedBatch(null);
      await loadBatches();
      if (activeTab === "history") {
        await loadHistory();
      }
    } catch (err) {
      showGlobalToast(err?.message || "Ghi nhận hao hụt thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Tiêu Chuẩn Phân Hệ Nông Trại */}
      <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-emerald-900/10 bg-gradient-to-br from-white via-[#fcfdfa] to-emerald-50/30 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-100/80 text-emerald-900 border border-emerald-300/60">
                Phân Hệ Nông Trại
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-emerald-800">
                Quản lý tồn kho theo lô
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Kiểm Kho & Xuất Hủy
            </h1>
          </div>

          <button
            type="button"
            onClick={() => (activeTab === "audit" ? loadBatches() : loadHistory())}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors shadow-2xs w-fit cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      <WastageStatCards batches={batches} />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-[#00450d] text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Kiểm Kho Thực Tế & Cận Hạn</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-[#00450d] text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Sổ Lịch Sử Xuất Hủy</span>
          </button>
        </div>

        {activeTab === "audit" ? (
          batchesLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Đang tải dữ liệu tồn kho theo lô...
            </div>
          ) : (
            <InventoryAuditTab
              batches={batches}
              onOpenWastageModal={(batch) => setSelectedBatch(batch)}
            />
          )
        ) : (
          <WastageHistoryTab
            history={filteredHistory}
            loading={historyLoading}
            typeFilter={historyType}
            onTypeFilterChange={setHistoryType}
            search={historySearch}
            onSearchChange={setHistorySearch}
          />
        )}
      </div>

      {selectedBatch && (
        <RecordWastageModal
          batch={selectedBatch}
          submitting={submitting}
          onClose={() => setSelectedBatch(null)}
          onSubmit={handleRecordWastage}
        />
      )}
    </div>
  );
}