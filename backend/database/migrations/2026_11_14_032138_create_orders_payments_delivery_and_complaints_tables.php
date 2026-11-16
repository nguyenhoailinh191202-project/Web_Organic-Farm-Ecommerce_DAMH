<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('Don_hang', function (Blueprint $table) {
            $table->id('Ma_don_hang');
            $table->unsignedBigInteger('Ma_nguoi_dung');
            $table->unsignedBigInteger('Ma_dia_chi');
            $table->unsignedBigInteger('Ma_nhan_vien_xac_nhan')->nullable();
            $table->unsignedBigInteger('Ma_dang_ky_goi')->nullable();
            $table->unsignedBigInteger('Ma_don_goc')->nullable();
            $table->unsignedBigInteger('Ma_khieu_nai')->nullable();
            $table->enum('Loai_don', ['Mua_le', 'Dinh_ky', 'Giao_bu'])->default('Mua_le');
            $table->dateTime('Ngay_dat')->useCurrent();
            $table->decimal('Tien_hang', 12, 2)->default(0.00);
            $table->decimal('Khoang_cach_km', 8, 2)->default(0.00);
            $table->decimal('Phi_giao_hang', 12, 2)->default(0.00);
            $table->unsignedInteger('So_diem_su_dung')->default(0);
            $table->decimal('Tien_giam_tu_diem', 12, 2)->default(0.00);
            $table->decimal('Tong_tien', 12, 2)->default(0.00);
            $table->enum('Trang_thai', ['Cho_thanh_toan', 'Cho_xac_nhan', 'Da_xac_nhan', 'Dang_giao', 'Hoan_thanh', 'Da_huy'])
                  ->default('Cho_thanh_toan');
            $table->text('Ghi_chu')->nullable();
            $table->timestamps();

            $table->index(['Ngay_dat', 'Trang_thai'], 'idx_dh_ngay_trang_thai');
            $table->foreign('Ma_nguoi_dung', 'fk_dh_nguoi_dung')->references('Ma_nguoi_dung')->on('Nguoi_dung');
            $table->foreign('Ma_dia_chi', 'fk_dh_dia_chi')->references('Ma_dia_chi')->on('Dia_chi_giao_hang');
            $table->foreign('Ma_nhan_vien_xac_nhan', 'fk_dh_nhan_vien')->references('Ma_nguoi_dung')->on('Nguoi_dung');
            $table->foreign('Ma_dang_ky_goi', 'fk_dh_dang_ky_goi')->references('Ma_dang_ky')->on('Dang_ky_goi');
            $table->foreign('Ma_don_goc', 'fk_dh_don_goc')->references('Ma_don_hang')->on('Don_hang');
        });

        Schema::create('Chi_tiet_don_hang', function (Blueprint $table) {
            $table->id('Ma_ct_don_hang');
            $table->unsignedBigInteger('Ma_don_hang');
            $table->unsignedBigInteger('Ma_san_pham');
            $table->unsignedBigInteger('Ma_ct_flash_sale')->nullable();
            $table->decimal('So_luong', 10, 2);
            $table->decimal('Don_gia', 12, 2);
            $table->decimal('Thanh_tien', 12, 2);
            $table->timestamps();

            $table->foreign('Ma_don_hang', 'fk_ctdh_don_hang')->references('Ma_don_hang')->on('Don_hang')->onDelete('cascade');
            $table->foreign('Ma_san_pham', 'fk_ctdh_san_pham')->references('Ma_san_pham')->on('San_pham');
            $table->foreign('Ma_ct_flash_sale', 'fk_ctdh_flash_sale')->references('Ma_ct_flash_sale')->on('Chi_tiet_flash_sale');
        });

        Schema::create('Phan_bo_lo_hang', function (Blueprint $table) {
            $table->id('Ma_phan_bo');
            $table->unsignedBigInteger('Ma_ct_don_hang');
            $table->unsignedBigInteger('Ma_lo_hang');
            $table->decimal('So_luong_xuat', 10, 2);
            $table->dateTime('Ngay_xuat_kho')->useCurrent();
            $table->timestamps();

            $table->foreign('Ma_ct_don_hang', 'fk_pblh_ct_don_hang')
                  ->references('Ma_ct_don_hang')->on('Chi_tiet_don_hang')->onDelete('cascade');
            $table->foreign('Ma_lo_hang', 'fk_pblh_lo_hang')
                  ->references('Ma_lo_hang')->on('Lo_hang');
        });

        Schema::create('Thanh_toan', function (Blueprint $table) {
            $table->id('Ma_thanh_toan');
            $table->unsignedBigInteger('Ma_don_hang')->nullable();
            $table->unsignedBigInteger('Ma_dang_ky_goi')->nullable();
            $table->enum('Phuong_thuc', ['MoMo', 'Mien_phi_goi', 'Giao_bu'])->default('MoMo');
            $table->string('Ma_giao_dich_momo', 100)->nullable()->unique();
            $table->decimal('So_tien', 12, 2);
            $table->enum('Trang_thai', ['Khoi_tao', 'Thanh_cong', 'That_bai', 'Da_hoan_tien'])->default('Khoi_tao');
            $table->dateTime('Thoi_gian_thanh_toan')->nullable();
            $table->timestamps();

            $table->foreign('Ma_don_hang', 'fk_tt_don_hang')->references('Ma_don_hang')->on('Don_hang');
            $table->foreign('Ma_dang_ky_goi', 'fk_tt_dang_ky_goi')->references('Ma_dang_ky')->on('Dang_ky_goi');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE Thanh_toan ADD CONSTRAINT chk_tt_doi_tuong CHECK (Ma_don_hang IS NOT NULL OR Ma_dang_ky_goi IS NOT NULL)');
        }

        Schema::create('Giao_hang', function (Blueprint $table) {
            $table->id('Ma_giao_hang');
            $table->unsignedBigInteger('Ma_don_hang')->unique();
            $table->unsignedBigInteger('Ma_nhan_vien_dieu_phoi');
            $table->string('Don_vi_van_chuyen', 100)->nullable();
            $table->string('Ma_van_don', 100)->nullable();
            $table->enum('Trang_thai', ['Chuan_bi', 'Dang_giao', 'Giao_thanh_cong', 'Giao_that_bai'])->default('Chuan_bi');
            $table->dateTime('Ngay_xuat_giao')->nullable();
            $table->dateTime('Ngay_giao_thanh_cong')->nullable();
            $table->timestamps();

            $table->foreign('Ma_don_hang', 'fk_ghang_don_hang')->references('Ma_don_hang')->on('Don_hang')->onDelete('cascade');
            $table->foreign('Ma_nhan_vien_dieu_phoi', 'fk_ghang_nhan_vien')->references('Ma_nguoi_dung')->on('Nguoi_dung');
        });

        Schema::create('Diem_tich_luy', function (Blueprint $table) {
            $table->id('Ma_gd_diem');
            $table->unsignedBigInteger('Ma_nguoi_dung');
            $table->unsignedBigInteger('Ma_don_hang')->nullable();
            $table->enum('Loai_giao_dich', ['Tich_diem', 'Su_dung', 'Hoan_diem']);
            $table->integer('So_diem');
            $table->string('Mo_ta', 255)->nullable();
            $table->timestamps();

            $table->index('Ma_nguoi_dung', 'idx_dtl_nguoi_dung');
            $table->foreign('Ma_nguoi_dung', 'fk_dtl_nguoi_dung')->references('Ma_nguoi_dung')->on('Nguoi_dung');
            $table->foreign('Ma_don_hang', 'fk_dtl_don_hang')->references('Ma_don_hang')->on('Don_hang');
        });

        Schema::create('Khieu_nai', function (Blueprint $table) {
            $table->id('Ma_khieu_nai');
            $table->unsignedBigInteger('Ma_don_hang');
            $table->unsignedBigInteger('Ma_nguoi_dung');
            $table->unsignedBigInteger('Ma_nhan_vien_xu_ly')->nullable();
            $table->string('Ly_do', 255);
            $table->text('Mo_ta_chi_tiet');
            $table->enum('Hinh_thuc_xu_ly', ['Chua_xac_dinh', 'Hoan_tien', 'Giao_bu', 'Tu_choi'])->default('Chua_xac_dinh');
            $table->enum('Trang_thai', ['Cho_xu_ly', 'Dang_xu_ly', 'Da_giai_quyet', 'Tu_choi'])->default('Cho_xu_ly');
            $table->dateTime('Ngay_xu_ly')->nullable();
            $table->timestamps();

            $table->foreign('Ma_don_hang', 'fk_kn_don_hang')->references('Ma_don_hang')->on('Don_hang');
            $table->foreign('Ma_nguoi_dung', 'fk_kn_nguoi_dung')->references('Ma_nguoi_dung')->on('Nguoi_dung');
            $table->foreign('Ma_nhan_vien_xu_ly', 'fk_kn_nhan_vien')->references('Ma_nguoi_dung')->on('Nguoi_dung');
        });

        Schema::table('Don_hang', function (Blueprint $table) {
            $table->foreign('Ma_khieu_nai', 'fk_dh_khieu_nai')->references('Ma_khieu_nai')->on('Khieu_nai');
        });

        Schema::create('Tep_bang_chung', function (Blueprint $table) {
            $table->id('Ma_tep');
            $table->unsignedBigInteger('Ma_khieu_nai');
            $table->enum('Loai_tep', ['Hinh_anh', 'Video']);
            $table->string('Duong_dan', 500);
            $table->timestamps();

            $table->foreign('Ma_khieu_nai', 'fk_tbc_khieu_nai')
                  ->references('Ma_khieu_nai')->on('Khieu_nai')->onDelete('cascade');
        });

        Schema::create('Hoan_tien', function (Blueprint $table) {
            $table->id('Ma_hoan_tien');
            $table->unsignedBigInteger('Ma_khieu_nai')->unique();
            $table->unsignedBigInteger('Ma_thanh_toan');
            $table->decimal('So_tien', 12, 2);
            $table->string('Ma_giao_dich_hoan_momo', 100)->nullable();
            $table->enum('Trang_thai', ['Cho_xu_ly', 'Thanh_cong', 'That_bai'])->default('Cho_xu_ly');
            $table->dateTime('Ngay_hoan')->nullable();
            $table->timestamps();

            $table->foreign('Ma_khieu_nai', 'fk_ht_khieu_nai')->references('Ma_khieu_nai')->on('Khieu_nai');
            $table->foreign('Ma_thanh_toan', 'fk_ht_thanh_toan')->references('Ma_thanh_toan')->on('Thanh_toan');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Hoan_tien');
        Schema::dropIfExists('Tep_bang_chung');
        Schema::table('Don_hang', function (Blueprint $table) {
            $table->dropForeign('fk_dh_khieu_nai');
        });
        Schema::dropIfExists('Khieu_nai');
        Schema::dropIfExists('Diem_tich_luy');
        Schema::dropIfExists('Giao_hang');
        Schema::dropIfExists('Thanh_toan');
        Schema::dropIfExists('Phan_bo_lo_hang');
        Schema::dropIfExists('Chi_tiet_don_hang');
        Schema::dropIfExists('Don_hang');
    }
};