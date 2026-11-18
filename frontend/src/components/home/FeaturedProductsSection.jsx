import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  QrCode,
  Flame,
  ArrowRight,
  Check,
  PackageX,
} from "lucide-react";
import { storefrontApi } from "../../services/storefrontApi";

const DEFAULT_PROD_IMAGE =
  "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&q=80";

export default function FeaturedProductsSection({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    storefrontApi
      .getProducts({ sort: "best_selling", per_page: 4 })
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];
        setProducts(list);
      })
      .catch(() => {
        if (isMounted) setProducts([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickAdd = (product) => {
    if (Number(product.available_stock) <= 0) return;
    if (onAddToCart) {
      onAddToCart(product);
    }
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
            VỤ MÙA HÁI SÁNG NAY
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Nông Sản Nổi Bật Hôm Nay
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Top sản phẩm bán chạy nhất được khách hàng tin chọn, gắn mã QR truy xuất từng lô.
          </p>
        </div>

        <Link
          to="/products?sort=best_selling"
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#064e2e] hover:bg-[#043821] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
        >
          <span>Xem Tất Cả Nông Sản</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse p-4 space-y-3"
            >
              <div className="aspect-[4/3] bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-9 bg-slate-200 rounded-xl w-full mt-2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <PackageX className="w-9 h-9 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-semibold">
            Chưa tải được danh sách sản phẩm nổi bật. Vui lòng kiểm tra kết nối API{" "}
            <code className="font-mono text-emerald-700">/api/products</code>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((item, idx) => {
            const isAdded = addedId === item.id;
            const outOfStock = Number(item.available_stock) <= 0;
            const displayPrice = Number(item.current_price ?? item.base_price ?? 0);
            const basePrice = Number(item.base_price ?? 0);
            const hasDiscount = displayPrice < basePrice;

            return (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <Link to={`/products/${item.id}`}>
                      <img
                        src={item.image || DEFAULT_PROD_IMAGE}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_PROD_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 shadow-xs">
                      <Flame className="w-3 h-3" />
                      Bán chạy #{idx + 1}
                    </span>

                    {item.qr_code ? (
                      <Link
                        to={`/trace/${item.qr_code}`}
                        title="Quét QR truy xuất nguồn gốc lô hàng"
                        className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-white/95 hover:bg-emerald-50 text-[#064e2e] text-[10px] font-bold inline-flex items-center gap-1 shadow-xs border border-slate-200/70"
                      >
                        <QrCode className="w-3 h-3 text-emerald-700" />
                        <span>{item.certification || "VietGAP"}</span>
                      </Link>
                    ) : (
                      <span className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-white/95 text-[#064e2e] text-[10px] font-bold shadow-xs">
                        {item.certification || "VietGAP"}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <Link
                      to={`/products/${item.id}`}
                      className="text-sm font-extrabold text-slate-900 hover:text-emerald-700 line-clamp-1 block"
                    >
                      {item.name}
                    </Link>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      {item.origin || item.category_name}
                      {item.batch_id ? ` • Lô #${item.batch_id}` : ""}
                    </p>

                    <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-base font-black text-[#064e2e]">
                          {displayPrice.toLocaleString("vi-VN")}đ
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">
                          / {item.unit}
                        </span>
                        {hasDiscount && (
                          <span className="block text-[10.5px] text-slate-400 line-through">
                            {basePrice.toLocaleString("vi-VN")}đ
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Đã bán {Number(item.sold_count || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="px-4 pb-4">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(item)}
                    disabled={outOfStock}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      outOfStock
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : isAdded
                        ? "bg-emerald-600 text-white cursor-pointer"
                        : "bg-[#064e2e] hover:bg-[#043821] text-white cursor-pointer"
                    }`}
                  >
                    {outOfStock ? (
                      <span>Tạm Hết Hàng</span>
                    ) : isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã Thêm Vào Giỏ</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Thêm Vào Giỏ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Explore Button */}
      <div className="mt-7 text-center">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-xs transition-colors"
        >
          <span>Khám Phá Toàn Bộ Nông Sản Hữu Cơ</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
        </Link>
      </div>
    </section>
  );
}