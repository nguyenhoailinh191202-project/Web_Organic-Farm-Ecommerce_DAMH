import { PackageCheck, AlertTriangle, Trash2, TrendingDown } from "lucide-react";

export default function WastageStatCards({ batches = [] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeBatches = batches.filter((b) => Number(b.remaining_quantity ?? b.so_luong_con_lai ?? 0) > 0);

  const alertBatches = activeBatches.filter((b) => {
    const expiry = new Date(b.expiry_date ?? b.han_su_dung);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  });

  const totalImported = batches.reduce((sum, b) => sum + Number(b.initial_quantity ?? b.so_luong_nhap ?? 0), 0);
  const totalWastage = batches.reduce((sum, b) => sum + Number(b.wastage_quantity ?? b.so_luong_hao_hut ?? 0), 0);
  const wastageRate = totalImported > 0 ? ((totalWastage / totalImported) * 100).toFixed(1) : "0.0";

  const cards = [
    {
      label: "LÔ ĐANG LƯU KHO",
      value: activeBatches.length,
      unit: "lô",
      icon: PackageCheck,
      tone: "text-[#00450d] bg-emerald-50",
    },
    {
      label: "CẬN HẠN / HẾT HẠN",
      value: alertBatches.length,
      unit: "lô",
      sub: alertBatches.length > 0 ? "Cần kiểm tra HSD" : "",
      icon: AlertTriangle,
      tone: alertBatches.length > 0 ? "text-rose-700 bg-rose-50" : "text-slate-600 bg-slate-100",
      highlight: alertBatches.length > 0,
    },
    {
      label: "TỔNG XUẤT HỦY",
      value: totalWastage.toLocaleString("vi-VN"),
      unit: "đơn vị",
      icon: Trash2,
      tone: "text-amber-800 bg-amber-50",
    },
    {
      label: "TỶ LỆ HAO HỤT",
      value: `${wastageRate}%`,
      unit: "",
      sub: Number(wastageRate) <= 5 ? "Chuẩn an toàn (< 5%)" : "Cảnh báo (> 5%)",
      icon: TrendingDown,
      tone: Number(wastageRate) <= 5 ? "text-emerald-800 bg-emerald-50" : "text-rose-700 bg-rose-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
              card.highlight
                ? "border-rose-300 bg-rose-50/40"
                : "border-slate-200/80 bg-white"
            } shadow-2xs`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 uppercase truncate">
                {card.label}
              </span>
              <span className={`p-1.5 rounded-lg shrink-0 ${card.tone}`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className={`text-xl sm:text-2xl font-black ${card.highlight ? "text-rose-700" : "text-slate-900"}`}>
                {card.value}
              </span>
              {card.unit && <span className="text-[11px] font-semibold text-slate-500">{card.unit}</span>}
            </div>
            {card.sub ? <p className="mt-0.5 text-[11px] text-slate-500 truncate">{card.sub}</p> : null}
          </div>
        );
      })}
    </div>
  );
}   