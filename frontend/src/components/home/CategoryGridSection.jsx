import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Leaf,
  Carrot,
  Apple,
  Sprout,
} from "lucide-react";
import { storefrontApi } from "../../services/storefrontApi";

const CATEGORY_STYLES = [
  {
    icon: Leaf,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    hoverBorder: "hover:border-emerald-500",
  },
  {
    icon: Carrot,
    badge: "bg-amber-50 text-amber-700 border-amber-200/70",
    hoverBorder: "hover:border-amber-500",
  },
  {
    icon: Apple,
    badge: "bg-rose-50 text-rose-700 border-rose-200/70",
    hoverBorder: "hover:border-rose-500",
  },
  {
    icon: Sprout,
    badge: "bg-teal-50 text-teal-700 border-teal-200/70",
    hoverBorder: "hover:border-teal-500",
  },
];

export default function CategoryGridSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    storefrontApi
      .getCategories()
      .then((data) => {
        if (isMounted) setCategories(data);
      })
      .catch(() => {
        if (isMounted) setCategories([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
            KHÁM PHÁ MÙA VỤ
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Danh Mục Nông Sản Hữu Cơ XanhFarm
          </h2>
        </div>
        <p className="text-xs text-slate-500 max-w-md md:text-right leading-relaxed">
          Chọn nhanh nhóm nông sản tươi sạch thu hoạch trong ngày theo tiêu chuẩn VietGAP & Hữu cơ.
        </p>
      </div>

      {/* Grid 4 cột cân đối */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="w-16 h-5 rounded-full bg-slate-100" />
              </div>
              <div className="h-5 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
          Chưa tải được danh mục nông sản từ cơ sở dữ liệu. Vui lòng kiểm tra kết nối API <code className="font-mono text-emerald-700">/api/categories</code>.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, index) => {
            const style = CATEGORY_STYLES[index % CATEGORY_STYLES.length];
            const Icon = style.icon;

            return (
              <Link
                key={cat.id}
                to={`/products?category_id=${cat.id}`}
                className={`group relative bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md ${style.hoverBorder} transition-all flex flex-col justify-between`}
              >
                <div>
                  {/* Top Row: Icon + Product Count */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${style.badge}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-slate-100 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-800 text-[11px] font-bold transition-colors">
                      {cat.products_count ?? 0} sản phẩm
                    </span>
                  </div>

                  {/* Category Name */}
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#064e2e] transition-colors flex items-center justify-between gap-2">
                    <span className="line-clamp-1">{cat.name}</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                  </h3>

                  {/* Short Description */}
                  {cat.description && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>

                {/* Subtle Bottom Accent Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                  <span>Lọc sản phẩm theo danh mục</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}