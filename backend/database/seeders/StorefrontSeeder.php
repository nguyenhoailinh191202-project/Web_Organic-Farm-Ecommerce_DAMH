<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StorefrontSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('vai_tro')->upsert([
            ['Ma_vai_tro' => 3, 'Ten_vai_tro' => 'Farm_Staff', 'Mo_ta' => 'Nhân viên nông trại'],
            ['Ma_vai_tro' => 4, 'Ten_vai_tro' => 'Customer', 'Mo_ta' => 'Khách hàng'],
        ], ['Ma_vai_tro'], ['Ten_vai_tro', 'Mo_ta']);

        DB::table('nguoi_dung')->upsert([
            [
                'Ma_nguoi_dung' => 3,
                'Ma_vai_tro' => 3,
                'Ho_ten' => 'Lê Văn Nông',
                'Email' => 'farm.nong@nongsansach.vn',
                'So_dien_thoai' => '0901000003',
                'Mat_khau_ma_hoa' => Hash::make('password'),
                'Trang_thai' => 'Hoat_dong',
            ],
            [
                'Ma_nguoi_dung' => 5,
                'Ma_vai_tro' => 4,
                'Ho_ten' => 'Đặng Ngọc Anh',
                'Email' => 'ngocanh.khach@gmail.com',
                'So_dien_thoai' => '0912345678',
                'Mat_khau_ma_hoa' => Hash::make('password'),
                'Trang_thai' => 'Hoat_dong',
            ],
        ], ['Ma_nguoi_dung'], [
            'Ma_vai_tro', 'Ho_ten', 'Email', 'So_dien_thoai', 'Mat_khau_ma_hoa', 'Trang_thai',
        ]);

        DB::table('dia_chi_giao_hang')->upsert([
            [
                'Ma_dia_chi' => 1,
                'Ma_nguoi_dung' => 5,
                'Ten_nguoi_nhan' => 'Đặng Ngọc Anh',
                'So_dien_thoai_nguoi_nhan' => '0912345678',
                'Dia_chi_chi_tiet' => '120 Nguyễn Đình Chiểu',
                'Phuong_xa' => 'Phường Võ Thị Sáu',
                'Quan_huyen' => 'Quận 3',
                'Tinh_thanh' => 'TP. Hồ Chí Minh',
                'Vi_do' => 10.7825400,
                'Kinh_do' => 106.6934200,
                'La_mac_dinh' => true,
            ],
        ], ['Ma_dia_chi'], [
            'Ma_nguoi_dung', 'Ten_nguoi_nhan', 'So_dien_thoai_nguoi_nhan',
            'Dia_chi_chi_tiet', 'Phuong_xa', 'Quan_huyen', 'Tinh_thanh',
            'Vi_do', 'Kinh_do', 'La_mac_dinh',
        ]);

        DB::table('nong_trai')->upsert([
            [
                'Ma_nong_trai' => 1,
                'Ten_nong_trai' => 'Nông Trại Xanh Củ Chi',
                'Dia_chi' => 'Ấp 3, Xã Nhuận Đức, TP. Hồ Chí Minh',
                'Vi_do' => 10.9985000,
                'Kinh_do' => 106.5123000,
                'Cau_chuyen_thuong_hieu' => 'Nông sản sạch, thu hoạch tươi mỗi ngày.',
                'Triet_ly_canh_tac' => 'Canh tác an toàn, hạn chế hóa chất.',
                'Ho_so_nang_luc' => 'Nông trại sản xuất rau củ đạt chuẩn VietGAP.',
            ],
        ], ['Ma_nong_trai'], [
            'Ten_nong_trai', 'Dia_chi', 'Vi_do', 'Kinh_do',
            'Cau_chuyen_thuong_hieu', 'Triet_ly_canh_tac', 'Ho_so_nang_luc',
        ]);

        $categories = [
            ['Ma_danh_muc' => 1, 'Ten_danh_muc' => 'Rau ăn lá hữu cơ', 'Mo_ta' => 'Rau xanh tươi, thu hoạch trong ngày.'],
            ['Ma_danh_muc' => 2, 'Ten_danh_muc' => 'Củ quả sạch', 'Mo_ta' => 'Củ quả trồng theo quy trình an toàn.'],
            ['Ma_danh_muc' => 3, 'Ten_danh_muc' => 'Trái cây nhà màng', 'Mo_ta' => 'Trái cây chín tự nhiên từ nhà màng.'],
            ['Ma_danh_muc' => 4, 'Ten_danh_muc' => 'Rau gia vị & Thảo mộc', 'Mo_ta' => 'Rau thơm và thảo mộc sạch.'],
        ];

        DB::table('danh_muc')->upsert($categories, ['Ma_danh_muc'], ['Ten_danh_muc', 'Mo_ta']);

        $products = [
            [1, 1, 'Xà lách Romaine hữu cơ', 'Xà lách giòn ngọt trồng trong nhà màng.', 'kg', 35000, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=600&q=80'],
            [2, 2, 'Cà chua Beef hữu cơ', 'Cà chua thịt dày, giàu dinh dưỡng.', 'kg', 45000, 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&q=80'],
            [3, 1, 'Cải bó xôi Baby', 'Rau non mềm, giàu sắt và vitamin.', 'kg', 40000, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80'],
            [4, 3, 'Dưa lưới Taki nhà màng', 'Dưa lưới ruột cam giòn ngọt.', 'quả ~1.5kg', 120000, 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=600&q=80'],
            [5, 2, 'Cà rốt Baby hữu cơ', 'Cà rốt nhỏ, vị ngọt tự nhiên.', 'kg', 38000, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80'],
            [6, 4, 'Húng quế hữu cơ', 'Húng quế thơm, thu hoạch buổi sáng.', 'bó 200g', 15000, 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?auto=format&fit=crop&w=600&q=80'],
        ];

        DB::table('san_pham')->upsert(
            array_map(fn (array $product) => [
                'Ma_san_pham' => $product[0],
                'Ma_danh_muc' => $product[1],
                'Ma_nong_trai' => 1,
                'Ten_san_pham' => $product[2],
                'Mo_ta' => $product[3],
                'Don_vi_tinh' => $product[4],
                'Gia_ban' => $product[5],
                'Hinh_anh_dai_dien' => $product[6],
                'Ty_le_tich_diem' => 1,
                'Trang_thai' => 'Dang_ban',
            ], $products),
            ['Ma_san_pham'],
            ['Ma_danh_muc', 'Ma_nong_trai', 'Ten_san_pham', 'Mo_ta', 'Don_vi_tinh', 'Gia_ban', 'Hinh_anh_dai_dien', 'Ty_le_tich_diem', 'Trang_thai']
        );

        $today = now()->startOfDay();
        DB::table('mua_vu')->upsert([
            [
                'Ma_mua_vu' => 1,
                'Ma_nong_trai' => 1,
                'Ten_mua_vu' => 'Vụ kiểm thử storefront',
                'Ngay_bat_dau' => $today->copy()->subDays(30)->toDateString(),
                'Ngay_ket_thuc' => $today->copy()->addDays(60)->toDateString(),
                'Trang_thai' => 'Dang_dien_ra',
            ],
        ], ['Ma_mua_vu'], ['Ma_nong_trai', 'Ten_mua_vu', 'Ngay_bat_dau', 'Ngay_ket_thuc', 'Trang_thai']);

        $plots = [];
        $batches = [];
        $qrCodes = [];
        $certificates = [];

        foreach ($products as $index => $product) {
            $id = $index + 1;
            $expiry = $today->copy()->addDays(5 + $index);

            $plots[] = [
                'Ma_lo_canh_tac' => $id,
                'Ma_mua_vu' => 1,
                'Ma_san_pham' => $product[0],
                'Ten_lo' => "Lô kiểm thử {$id} - {$product[2]}",
                'Dien_tich' => 500 + ($index * 50),
                'Ngay_gieo_trong' => $today->copy()->subDays(25)->toDateString(),
                'Trang_thai' => 'Da_thu_hoach',
            ];

            $batches[] = [
                'Ma_lo_hang' => $id,
                'Ma_lo_canh_tac' => $id,
                'Ma_nhan_vien_phu_trach' => 3,
                'Ngay_thu_hoach' => $today->copy()->subDay()->toDateString(),
                'Han_su_dung' => $expiry->toDateString(),
                'So_luong_thu_hoach' => 100,
                'So_luong_con_lai' => 80 + $id,
                'Trang_thai' => 'Con_hang',
            ];

            $qrCodes[] = [
                'Ma_qr' => $id,
                'Ma_lo_hang' => $id,
                'Ma_nhan_vien_tao' => 3,
                'Chuoi_ma_qr' => "QR-STOREFRONT-{$id}",
                'Duong_dan_anh_qr' => "/uploads/qr/storefront-{$id}.png",
                'So_luot_quet' => 10 + $id,
            ];

            $certificates[] = [
                'Ma_chung_nhan' => $id,
                'Ma_lo_hang' => $id,
                'Ma_san_pham' => $product[0],
                'Ten_chung_nhan' => $id === 4 ? 'Chứng nhận GlobalGAP' : 'Chứng nhận VietGAP',
                'To_chuc_cap' => 'Trung tâm Chứng nhận Nông sản sạch',
                'Ngay_cap' => $today->copy()->subYear()->toDateString(),
                'Ngay_het_han' => $today->copy()->addYear()->toDateString(),
                'Duong_dan_tep' => "/uploads/certs/storefront-{$id}.pdf",
            ];
        }

        DB::table('lo_canh_tac')->upsert($plots, ['Ma_lo_canh_tac'], [
            'Ma_mua_vu', 'Ma_san_pham', 'Ten_lo', 'Dien_tich', 'Ngay_gieo_trong', 'Trang_thai',
        ]);
        DB::table('lo_hang')->upsert($batches, ['Ma_lo_hang'], [
            'Ma_lo_canh_tac', 'Ma_nhan_vien_phu_trach', 'Ngay_thu_hoach', 'Han_su_dung',
            'So_luong_thu_hoach', 'So_luong_con_lai', 'Trang_thai',
        ]);
        DB::table('ma_qr_truy_xuat')->upsert($qrCodes, ['Ma_qr'], [
            'Ma_lo_hang', 'Ma_nhan_vien_tao', 'Chuoi_ma_qr', 'Duong_dan_anh_qr', 'So_luot_quet',
        ]);
        DB::table('chung_nhan')->upsert($certificates, ['Ma_chung_nhan'], [
            'Ma_lo_hang', 'Ma_san_pham', 'Ten_chung_nhan', 'To_chuc_cap', 'Ngay_cap', 'Ngay_het_han', 'Duong_dan_tep',
        ]);

        DB::table('don_hang')->upsert([
            [
                'Ma_don_hang' => 100,
                'Ma_nguoi_dung' => 5,
                'Ma_dia_chi' => 1,
                'Ma_nhan_vien_xac_nhan' => null,
                'Ma_dang_ky_goi' => null,
                'Ma_don_goc' => null,
                'Ma_khieu_nai' => null,
                'Loai_don' => 'Mua_le',
                'Ngay_dat' => $today->copy()->subDay()->toDateTimeString(),
                'Tien_hang' => 1005000,
                'Khoang_cach_km' => 0,
                'Phi_giao_hang' => 0,
                'So_diem_su_dung' => 0,
                'Tien_giam_tu_diem' => 0,
                'Tong_tien' => 1005000,
                'Trang_thai' => 'Hoan_thanh',
                'Ghi_chu' => 'Đơn mẫu dùng kiểm thử danh sách sản phẩm bán chạy.',
            ],
        ], ['Ma_don_hang'], [
            'Ma_nguoi_dung', 'Ma_dia_chi', 'Ma_nhan_vien_xac_nhan', 'Ma_dang_ky_goi',
            'Ma_don_goc', 'Ma_khieu_nai', 'Loai_don', 'Ngay_dat', 'Tien_hang',
            'Khoang_cach_km', 'Phi_giao_hang', 'So_diem_su_dung', 'Tien_giam_tu_diem',
            'Tong_tien', 'Trang_thai', 'Ghi_chu',
        ]);

        $orderDetails = [];
        foreach ($products as $index => $product) {
            $quantity = $index + 1;
            $orderDetails[] = [
                'Ma_ct_don_hang' => 1001 + $index,
                'Ma_don_hang' => 100,
                'Ma_san_pham' => $product[0],
                'Ma_ct_flash_sale' => null,
                'So_luong' => $quantity,
                'Don_gia' => $product[5],
                'Thanh_tien' => $quantity * $product[5],
            ];
        }

        DB::table('chi_tiet_don_hang')->upsert($orderDetails, ['Ma_ct_don_hang'], [
            'Ma_don_hang', 'Ma_san_pham', 'Ma_ct_flash_sale', 'So_luong', 'Don_gia', 'Thanh_tien',
        ]);
    }
}
