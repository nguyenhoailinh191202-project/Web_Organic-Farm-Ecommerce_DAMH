import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  QrCode,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sprout,
} from "lucide-react";

const SLIDES = [
  {
    badge: "CANH TÁC HỮU CƠ 100%",
    subBadge: "Trang trại chuẩn VietGAP & Kiểm định",
    title: "Nông Trại Sinh Thái",
    highlight: "Chuẩn VietGAP & USDA",
    subtitle: "Nguồn Nước Tinh Khiết & Đất Giàu Vi Sinh",
    description:
      "Quy trình chăm sóc khép kín không phân bón hóa học, đất và nguồn nước được kiểm định định kỳ, minh bạch 100% qua mã QR truy xuất từng luống rau.",
    certTitle: "Phiếu Thử Nghiệm Chất Lượng",
    certSubtitle: "Nước & Đất trồng Củ Chi - Đà Lạt",
    certBadge: "Đạt chuẩn 100% không tồn dư hóa chất",
    bgImage:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80",
  },
  {
    badge: "THU HOẠCH MỖI SÁNG",
    subBadge: "Xuất kho ưu tiên hạn dùng (FEFO)",
    title: "Rau Củ Tươi Sạch",
    highlight: "Từ Vườn Tới Bàn Ăn",
    subtitle: "Giao Hỏa Tốc Nội Thành Trong 2 Giờ",
    description:
      "Mỗi lô thu hoạch đều gắn tem QR riêng biệt giúp bạn kiểm tra ngày gieo hạt, bón phân hữu cơ và thời điểm thu hoạch thực tế trước khi đặt mua.",
    certTitle: "Chứng Nhận Lô Thu Hoạch",
    certSubtitle: "Kiểm soát vòng đời tươi ngon theo lô",
    certBadge: "100% xuất kho đúng chuẩn FEFO",
    bgImage:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80",
  },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];

  const prevSlide = () =>
    setCurrent((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  const nextSlide = () =>
    setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      <div className="relative rounded-3xl overflow-hidden bg-[#064e2e] text-white shadow-xl border border-[#0d5932]">
        {/* Background Image + Dark Green Overlay */}
        <img
          src={slide.bgImage}
          alt={slide.title}
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#022c19]/95 via-[#064e2e]/90 to-[#043821]/80" />

        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Slide trước"
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xs items-center justify-center text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Slide tiếp theo"
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xs items-center justify-center text-white transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Main Content */}
        <div className="relative z-10 px-6 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-[#86efac]/40 text-[#86efac] font-bold tracking-wide">
                <Sprout className="w-3.5 h-3.5" />
                {slide.badge}
              </span>
              <span className="text-emerald-200/80 font-medium">
                {slide.subBadge}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.15]">
                {slide.title}
                <span className="block text-[#86efac] mt-1">{slide.highlight}</span>
              </h1>
              <p className="text-base sm:text-lg font-semibold text-emerald-100">
                {slide.subtitle}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl leading-relaxed">
              {slide.description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/products"
                className="px-5 py-3 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 inline-flex items-center gap-2 transition-all active:scale-95"
              >
                <span>Khám Phá Sản Phẩm Tươi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/trace/DEMO-QR-001"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4 text-[#86efac]" />
                <span>Quét QR Nguồn Gốc</span>
              </Link>
            </div>

            {/* Bottom Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-5 border-t border-white/15 max-w-md">
              <div>
                <div className="text-lg sm:text-2xl font-black text-white">100%</div>
                <div className="text-[11px] text-emerald-200/80">Hữu cơ tự nhiên</div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-black text-white">0.00 ppm</div>
                <div className="text-[11px] text-emerald-200/80">Dư lượng thuốc BVTV</div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-black text-white">QR Code</div>
                <div className="text-[11px] text-emerald-200/80">Nhật ký từng lô</div>
              </div>
            </div>
          </div>

          {/* Right Column: Glass Quality Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-[#86efac] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Chứng nhận kiểm định
                </span>
                <span className="font-mono text-emerald-200/70">2026 • XanhFarm</span>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {slide.certTitle}
                </h2>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  {slide.certSubtitle}
                </p>
              </div>

              <div className="px-3.5 py-2.5 rounded-xl bg-[#032e1b]/80 border border-emerald-500/30 flex items-center gap-2 text-xs text-[#86efac] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{slide.certBadge}</span>
              </div>

              <Link
                to="/brand"
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-emerald-50 text-[#064e2e] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Tra cứu hồ sơ chứng nhận</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="relative z-10 pb-4 flex justify-center gap-1.5">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrent(idx)}
              aria-label={`Chuyển đến slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                current === idx ? "w-6 bg-[#86efac]" : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}