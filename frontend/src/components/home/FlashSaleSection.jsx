import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  Clock,
  QrCode,
  ShoppingCart,
  Check,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import { storefrontApi } from "../../services/storefrontApi";

const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=600&q=80";

function formatDateVN(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export default function FlashSaleSection({ onAddToCart }) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00" });

  useEffect(() => {
    let isMounted = true;
    storefrontApi
      .getActiveFlashSales()
      .then((data) => {
        if (isMounted) setCampaign(data);
      })
      .catch(() => {
        if (isMounted) setCampaign(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Đồng hồ đếm ngược đến thời điểm kết thúc (hoặc cuối ngày nếu dữ liệu mẫu đã qua mốc)
  useEffect(() => {
    if (!campaign?.end_time) return;

    const updateTimer = () => {
      const now = new Date();
      let target = new Date(campaign.end_time.replace(" ", "T"));

      if (Number.isNaN(target.getTime()) || target <= now) {
        target = new Date();
        target.setHours(23, 59, 59, 999);
      }

      const diff = Math.max(0, target.getTime() - now.getTime());
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [campaign]);

  if (loading || !campaign || !Array.isArray(campaign.items) || campaign.items.length === 0) {
    return null;
  }

  const handleQuickAdd = (item) => {
    if (onAddToCart) {
      onAddToCart({
        ...item,
        current_price: item.sale_price,
      });
    }
    setAddedId(item.flash_sale_item_id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50/70 to-emerald-50/60 border border-amber-200/90 p-5 sm:p-7 shadow-xs">
        {/* Top Bar: Title + Countdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-amber-200/70">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-[10.5px] font-extrabold uppercase tracking-wider shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Ưu Đãi FEFO Trong Ngày</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 pt-1">
              {campaign.title}
            </h2>
            <p className="text-xs text-slate-600">
              Nông sản thu hoạch đạt độ chín ngon nhất cần xuất kho ưu tiên trong ngày — giảm giá trực tiếp để chống lãng phí thực phẩm.
            </p>
          </div>

          {/* Countdown Box */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto bg-white px-4 py-2.5 rounded-2xl border border-amber-200 shadow-xs shrink-0">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-bold text-slate-600">Kết thúc sau:</span>
            <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black">
              <span className="px-2 py-1 rounded-lg bg-slate-900 text-amber-400">
                {timeLeft.hours}
              </span>
              <span className="text-slate-900">:</span>
              <span className="px-2 py-1 rounded-lg bg-slate-900 text-amber-400">
                {timeLeft.minutes}
              </span>
              <span className="text-slate-900">:</span>
              <span className="px-2 py-1 rounded-lg bg-slate-900 text-amber-400">
                {timeLeft.seconds}
              </span>
            </div>
          </div>
        </div>

        {/* Flash Sale Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {campaign.items.map((item) => {
            const limit = Number(item.limit_qty || 1);
            const sold = Number(item.sold_qty || 0);
            const remainingPromo = Math.max(0, limit - sold);
            const soldPercent = Math.min(100, Math.round((sold / limit) * 100));
            const isSoldOut = remainingPromo <= 0 || Number(item.available_stock) <= 0;
            const isAdded = addedId === item.flash_sale_item_id;

            return (
              <div
                key={item.flash_sale_item_id}
                className="group bg-white rounded-2xl border border-amber-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <Link to={`/products/${item.id}`}>
                      <img
                        src={item.image || DEFAULT_IMG}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_IMG;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Discount Tag */}
                    {item.discount_percent > 0 && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black shadow-xs">
                        -{item.discount_percent}%
                      </span>
                    )}

                    {/* QR Batch Badge */}
                    {item.qr_code && (
                      <Link
                        to={`/trace/${item.qr_code}`}
                        title="Quét QR kiểm tra ngày thu hoạch lô này"
                        className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-white/95 hover:bg-emerald-50 text-[#064e2e] text-[10px] font-bold inline-flex items-center gap-1 shadow-xs"
                      >
                        <QrCode className="w-3 h-3 text-emerald-700" />
                        <span>Lô #{item.batch_id}</span>
                      </Link>
                    )}

                    {/* Harvest & Expiry Strip */}
                    <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10.5px] font-medium flex items-center justify-between">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Hái: {formatDateVN(item.harvest_date)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                        <CalendarClock className="w-3 h-3" />
                        HSD: {formatDateVN(item.expiry_date)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <Link
                      to={`/products/${item.id}`}
                      className="text-sm font-extrabold text-slate-900 hover:text-emerald-700 line-clamp-1 block"
                    >
                      {item.name}
                    </Link>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {item.plot_name}
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mt-2.5">
                      <span className="text-base font-black text-rose-600">
                        {Number(item.sale_price).toLocaleString("vi-VN")}đ
                      </span>
                      <span className="text-[11px] text-slate-400">
                        / {item.unit}
                      </span>
                      <span className="text-xs text-slate-400 line-through ml-auto">
                        {Number(item.base_price).toLocaleString("vi-VN")}đ
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[10.5px] font-bold">
                        <span className="text-amber-700">
                          Đã giải cứu {sold}/{limit} {item.unit}
                        </span>
                        <span className="text-slate-500">
                          Còn {remainingPromo} {item.unit}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-amber-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                          style={{ width: `${Math.max(12, soldPercent)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Button */}
                <div className="px-4 pb-4">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(item)}
                    disabled={isSoldOut}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isSoldOut
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : isAdded
                        ? "bg-emerald-600 text-white cursor-pointer"
                        : "bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                    }`}
                  >
                    {isSoldOut ? (
                      <span>Đã Hết Suất Ưu Đãi</span>
                    ) : isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã Thêm Vào Giỏ</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Mua Giá Ưu Đãi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}