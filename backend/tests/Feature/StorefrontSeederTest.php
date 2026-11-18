<?php

namespace Tests\Feature;

use Database\Seeders\StorefrontSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StorefrontSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_available_products_with_traceability_and_sales_data(): void
    {
        $this->seed(StorefrontSeeder::class);
        $this->seed(StorefrontSeeder::class);

        $this->assertSame(6, DB::table('san_pham')->where('Trang_thai', 'Dang_ban')->count());
        $this->assertSame(6, DB::table('ma_qr_truy_xuat')->count());
        $this->assertSame(6, DB::table('chung_nhan')->count());
        $this->assertSame(6, DB::table('chi_tiet_don_hang')->count());

        $availableProducts = DB::table('san_pham as sp')
            ->join('lo_canh_tac as lct', 'sp.Ma_san_pham', '=', 'lct.Ma_san_pham')
            ->join('lo_hang as lh', 'lct.Ma_lo_canh_tac', '=', 'lh.Ma_lo_canh_tac')
            ->where('sp.Trang_thai', 'Dang_ban')
            ->whereIn('lh.Trang_thai', ['Con_hang', 'Sap_het_han'])
            ->where('lh.So_luong_con_lai', '>', 0)
            ->whereDate('lh.Han_su_dung', '>=', now()->toDateString())
            ->distinct()
            ->count('sp.Ma_san_pham');

        $this->assertSame(6, $availableProducts);
        $this->assertSame(
            6,
            DB::table('chi_tiet_don_hang as ctdh')
                ->join('don_hang as dh', 'ctdh.Ma_don_hang', '=', 'dh.Ma_don_hang')
                ->where('dh.Trang_thai', '!=', 'Da_huy')
                ->distinct()
                ->count('ctdh.Ma_san_pham')
        );
    }
}
