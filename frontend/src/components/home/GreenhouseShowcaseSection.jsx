import React from "react";
import { Link } from "react-router-dom";
import { QrCode, Sprout } from "lucide-react";

export default function GreenhouseShowcaseSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 mb-16">
      <div className="bg-[#064e2e] rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-xl border border-[#0d5932] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Text */}
        <div className="lg:col-span-6 space-y-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#86efac] uppercase tracking-wider">
            <Sprout className="w-3.5 h-3.5" />
            Canh tác nông nghiệp vùng cao nguyên sạch
          </span>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Mục Sở Thị Nhà Kính
            <span className="block text-[#86efac]">Công Nghệ Cao Đà Lạt</span>
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
            Hệ thống nhà kính khép kín điều tiết vi khí hậu tự động, tưới nhỏ giọt nước
            nguồn tinh khiết. Toàn bộ nhật ký chăm sóc của từng luống rau đều được ghi
            nhận theo thời gian thực để khách hàng kiểm chứng ngay trên bao bì.
          </p>

          <div className="pt-2">
            <Link
              to="/trace/DEMO-QR-001"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-[#064e2e] font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>Trải Nghiệm Quét Mã QR Nông Sản</span>
            </Link>
          </div>
        </div>

        {/* Right Image Card */}
        <div className="lg:col-span-6">
          <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl aspect-[16/10]">
            <img
              src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80"
              alt="Nhà kính nông nghiệp công nghệ cao Đà Lạt"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="text-xs sm:text-sm font-extrabold">
                Khu Nhà Màng Lạc Dương - Đà Lạt
              </div>
              <div className="text-[11px] text-emerald-200 mt-0.5">
                Quy mô 5 hecta • Nhiệt độ trung bình 21°C
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}