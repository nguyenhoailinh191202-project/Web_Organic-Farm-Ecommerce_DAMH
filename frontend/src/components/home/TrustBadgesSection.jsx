import React from "react";
import { ShieldCheck, Sprout, Truck, RotateCcw } from "lucide-react";

const BADGES = [
  {
    icon: ShieldCheck,
    title: "100% Chuẩn Hữu Cơ",
    desc: "Đạt chứng nhận VietGAP & USDA, không biến đổi gen, không thuốc trừ sâu hóa học.",
  },
  {
    icon: Sprout,
    title: "Thu Hoạch Mỗi Sáng",
    desc: "Nông sản được cắt hái lúc sáng sớm, giữ trọn độ tươi giòn và hàm lượng dinh dưỡng.",
  },
  {
    icon: Truck,
    title: "Giao Hỏa Tốc 2H",
    desc: "Vận chuyển trực tiếp từ nông trại đến tận bếp nhà bạn trong vòng 2 giờ nội thành.",
  },
  {
    icon: RotateCcw,
    title: "Đổi Trả Miễn Phí",
    desc: "Hoàn tiền 100% hoặc giao bù ngay lập tức trong 24h nếu nông sản dập nát, không đạt chuẩn.",
  },
];

export default function TrustBadgesSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {BADGES.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 text-[#064e2e] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {item.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}