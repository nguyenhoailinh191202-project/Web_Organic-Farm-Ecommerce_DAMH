import React from "react";
import { Sprout, ShieldCheck, PackageCheck, Truck } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: Sprout,
    title: "Canh Tác Tự Nhiên",
    desc: "Gieo trồng trên đất sạch giàu vi sinh, sử dụng phân bón hữu cơ và ghi nhật ký từng mốc chăm sóc.",
    tag: "HỮU CƠ & KHÔNG HÓA CHẤT",
  },
  {
    num: "02",
    icon: ShieldCheck,
    title: "Kiểm Định Độc Lập",
    desc: "Mẫu đất, nguồn nước và nông sản trước thu hoạch được kiểm nghiệm nghiêm ngặt theo tiêu chuẩn VietGAP.",
    tag: "CHỨNG NHẬN AN TOÀN",
  },
  {
    num: "03",
    icon: PackageCheck,
    title: "Đóng Gói & FEFO",
    desc: "Phân loại theo từng lô thu hoạch, gắn tem QR truy xuất nguồn gốc và ưu tiên xuất kho hàng cận hạn trước.",
    tag: "TRUY XUẤT MÃ QR TỪNG LÔ",
  },
  {
    num: "04",
    icon: Truck,
    title: "Giao Nhanh 2 Giờ",
    desc: "Điều phối giao hỏa tốc trực tiếp từ nông trại đến bàn ăn, giữ trọn độ tươi ngon nguyên bản.",
    tag: "GIAO HỎA TỐC TRONG NGÀY",
  },
];

export default function FarmJourneySection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
          <Sprout className="w-3.5 h-3.5" />
          QUY TRÌNH KHÉP KÍN 100%
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
          Hành Trình Từ Vườn Tới Bàn Ăn Tinh Khiết
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Chúng tôi không chỉ bán rau, mà mang lại sự minh bạch trọn vẹn từ lúc gieo hạt
          cho đến khi nông sản tươi đặt lên bàn ăn gia đình bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-slate-800 font-mono">
                    {step.num}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-extrabold tracking-wide">
                  {step.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}