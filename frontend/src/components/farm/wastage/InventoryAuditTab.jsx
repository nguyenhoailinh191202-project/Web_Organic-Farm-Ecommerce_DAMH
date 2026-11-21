import { useState } from "react";
import { Search, AlertCircle, Trash2, CheckCircle2, Clock } from "lucide-react";

export default function InventoryAuditTab({ batches = [], onOpenWastageModal }) {
  const [filter, setFilter] = useState("all"); // all | expired | expiring | normal
  const [keyword, setKeyword] = useState("");

  const enrichedBatches = batches
    .map((b) => {
      const remaining = Number(b.remaining_quantity ?? 0);
      const harvested = Number(b.harvest_quantity ?? 0);
      const wastage = Number(b.wastage_total ?? 0);
      const daysLeft = Number(b.days_until_expiry ?? 0);

      let health = "normal";
      if (daysLeft < 0) health = "expired";
      else if (daysLeft <= 2) health = "expiring";

      return { ...b, remaining, harvested, wastage, daysLeft, health };
    })
    .filter((b) => b.remaining > 0);

  const filtered = enrichedBatches.filter((b) => {
    if (filter !== "all" && b.health !== filter) return false;
    if (!keyword.trim()) return true;
    const q = keyword.toLowerCase();
    return (
      String(b.batch_code || "").toLowerCase().includes(q) ||
      String(b.product_name || "").toLowerCase().includes(q) ||
      String(b.plot_name || "").toLowerCase().includes(q)
    );
  });

  const counts = {
    all: enrichedBatches.length,
    expired: enrichedBatches.filter((b) => b.health === "expired").length,
    expiring: enrichedBatches.filter((b) => b.health === "expiring").length,
    normal: enrichedBatches.filter((b) => b.health === "normal").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: `Tất cả (${counts.all})` },
            { id: "expired", label: `Đã quá hạn (${counts.expired})`, danger: counts.expired > 0 },
            { id: "expiring", label: `Cận hạn ≤ 2 ngày (${counts.expiring})`, warn: counts.expiring > 0 },
            { id: "normal", label: `Còn hạn tốt (${counts.normal})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filter === tab.id
                  ? "bg-[#00450d] text-white"
                  : tab.danger
                  ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                  : tab.warn
                  ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm mã lô QR, nông sản, lô canh tác..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00450d]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
          Không có lô hàng nào phù hợp điều kiện kiểm kho hiện tại.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 max-h-[calc(100vh-270px)] min-h-[440px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 shadow-2xs">
              <tr className="bg-slate-50/95 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-3.5 sm:px-4">Lô hàng & Nông sản</th>
                <th className="py-2.5 px-3">Hạn sử dụng</th>
                <th className="py-2.5 px-3">Tồn kho sổ sách</th>
                <th className="py-2.5 px-3">Đã hao hụt</th>
                <th className="py-2.5 px-3">Cảnh báo FEFO</th>
                <th className="py-2.5 px-3.5 sm:px-4 text-right">Thao tác kiểm kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((batch) => {
                const unit = batch.product_unit || "kg";
                const percentLeft =
                  batch.harvested > 0
                    ? Math.round((batch.remaining / batch.harvested) * 100)
                    : 0;

                return (
                  <tr key={batch.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{batch.product_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[11px] text-slate-700">
                          {batch.batch_code}
                        </span>
                        <span className="text-[11px] text-slate-500">• {batch.plot_name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{batch.expiry_date}</p>
                      <p className="text-[11px] text-slate-500">
                        {batch.daysLeft < 0
                          ? `Quá hạn ${Math.abs(batch.daysLeft)} ngày`
                          : batch.daysLeft === 0
                          ? "Hết hạn hôm nay"
                          : `Còn ${batch.daysLeft} ngày`}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>
                          {batch.remaining} / {batch.harvested} {unit}
                        </span>
                        <span>{percentLeft}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            batch.health === "expired"
                              ? "bg-rose-600"
                              : batch.health === "expiring"
                              ? "bg-amber-500"
                              : "bg-[#00450d]"
                          }`}
                          style={{ width: `${Math.min(100, percentLeft)}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-amber-800">
                      {batch.wastage > 0 ? `${batch.wastage} ${unit}` : "0"}
                    </td>

                    <td className="py-3.5 px-4">
                      {batch.health === "expired" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" /> Quá hạn – Hủy ngay
                        </span>
                      ) : batch.health === "expiring" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                          <Clock className="w-3.5 h-3.5" /> Cận hạn (Đã báo Sales)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đạt chuẩn
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenWastageModal(batch)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                          batch.health === "expired"
                            ? "bg-rose-700 text-white hover:bg-rose-800"
                            : "border border-slate-300 bg-white text-slate-800 hover:border-[#00450d] hover:text-[#00450d]"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{batch.health === "expired" ? "Xuất hủy lô" : "Ghi nhận hao hụt"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}