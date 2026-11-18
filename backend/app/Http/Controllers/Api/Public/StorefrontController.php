<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StorefrontController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/categories
     * Lấy danh sách danh mục từ bảng danh_muc kèm số lượng sản phẩm đang bán.
     */
/**
     * GET /api/categories
     * Lấy danh sách danh mục từ bảng danh_muc kèm số lượng sản phẩm đang bán.
     */
    public function categories(): JsonResponse
    {
        $categories = Cache::get('public_categories_list');

        if (empty($categories)) {
            $categories = DB::table('danh_muc as dm')
                ->leftJoin('san_pham as sp', function ($join) {
                    $join->on('dm.Ma_danh_muc', '=', 'sp.Ma_danh_muc')
                         ->where('sp.Trang_thai', '=', 'Dang_ban');
                })
                ->select(
                    'dm.Ma_danh_muc as id',
                    'dm.Ten_danh_muc as name',
                    'dm.Mo_ta as description',
                    DB::raw('COUNT(sp.Ma_san_pham) as products_count')
                )
                ->groupBy('dm.Ma_danh_muc', 'dm.Ten_danh_muc', 'dm.Mo_ta')
                ->orderBy('dm.Ma_danh_muc', 'asc')
                ->get()
                ->toArray();

            if (! empty($categories)) {
                Cache::put('public_categories_list', $categories, 300);
            }
        }

        return $this->successResponse(
            message: 'Lấy danh sách danh mục thành công.',
            data: $categories
        );
    }

    /**
     * GET /api/products
     * Lấy danh sách nông sản (lọc theo category_id, sắp xếp best_selling).
     */
/**
     * GET /api/products
     * Lấy danh sách nông sản (lọc theo category_id, sắp xếp best_selling).
     */
    public function products(Request $request): JsonResponse
    {
        $categoryId = $request->query('category_id');
        $sort = $request->query('sort', 'latest');
        $perPage = min((int) $request->query('per_page', 8), 50);
        $page = (int) $request->query('page', 1);

        $cacheKey = "public_products_v2_{$categoryId}_{$sort}_{$perPage}_p{$page}";
        $cached = Cache::get($cacheKey);

        if (! empty($cached)) {
            return $this->paginatedResponse(
                message: 'Lấy danh sách nông sản thành công.',
                paginator: $cached
            );
        }

        // 1. Tổng số lượng đã bán từ các đơn không bị hủy
        $soldSub = DB::table('chi_tiet_don_hang as ctdh')
            ->join('don_hang as dh', 'ctdh.Ma_don_hang', '=', 'dh.Ma_don_hang')
            ->where('dh.Trang_thai', '!=', 'Da_huy')
            ->select('ctdh.Ma_san_pham', DB::raw('COALESCE(SUM(ctdh.So_luong), 0) as total_sold'))
            ->groupBy('ctdh.Ma_san_pham');

        // 2. Lấy lô hàng FEFO gần nhất (nối lo_hang -> lo_canh_tac, cột So_luong_con_lai)
        $fefoBatchSub = DB::table('lo_hang as lh')
            ->join('lo_canh_tac as lct', 'lh.Ma_lo_canh_tac', '=', 'lct.Ma_lo_canh_tac')
            ->whereIn('lh.Trang_thai', ['Con_hang', 'Sap_het_han'])
            ->where('lh.So_luong_con_lai', '>', 0)
            ->whereDate('lh.Han_su_dung', '>=', now()->toDateString())
            ->select(
                'lct.Ma_san_pham',
                DB::raw('SUBSTRING_INDEX(GROUP_CONCAT(lh.Ma_lo_hang ORDER BY lh.Han_su_dung ASC), ",", 1) as batch_id')
            )
            ->groupBy('lct.Ma_san_pham');

        $query = DB::table('san_pham as sp')
            ->join('danh_muc as dm', 'sp.Ma_danh_muc', '=', 'dm.Ma_danh_muc')
            ->leftJoin('nong_trai as nt', 'sp.Ma_nong_trai', '=', 'nt.Ma_nong_trai')
            ->leftJoinSub($soldSub, 'sales', 'sp.Ma_san_pham', '=', 'sales.Ma_san_pham')
            ->leftJoinSub($fefoBatchSub, 'batch', 'sp.Ma_san_pham', '=', 'batch.Ma_san_pham')
            ->where('sp.Trang_thai', 'Dang_ban')
            ->select(
                'sp.Ma_san_pham as id',
                'sp.Ma_danh_muc as category_id',
                'dm.Ten_danh_muc as category_name',
                'sp.Ten_san_pham as name',
                'sp.Don_vi_tinh as unit',
                'sp.Gia_ban as base_price',
                DB::raw('fn_gia_ban_hien_tai(sp.Ma_san_pham) as current_price'),
                DB::raw('fn_ton_kho_kha_dung(sp.Ma_san_pham) as available_stock'),
                'sp.Hinh_anh_dai_dien as image',
                'nt.Ten_nong_trai as origin',
                DB::raw('COALESCE(sales.total_sold, 0) as sold_count'),
                'batch.batch_id'
            );

        if (! empty($categoryId)) {
            $query->where('sp.Ma_danh_muc', (int) $categoryId);
        }

        if ($sort === 'best_selling') {
            $query->orderByDesc('sold_count')->orderByDesc('sp.Ma_san_pham');
        } else {
            $query->orderByDesc('sp.Ma_san_pham');
        }

        $paginator = $query->paginate($perPage);

        // 3. Ánh xạ mã QR (Chuoi_ma_qr) và chứng nhận (Ten_chung_nhan)
        $items = collect($paginator->items());
        $batchIds = $items->pluck('batch_id')->filter()->unique()->values();
        $productIds = $items->pluck('id')->unique()->values();

        $qrMap = $batchIds->isNotEmpty()
            ? DB::table('ma_qr_truy_xuat')->whereIn('Ma_lo_hang', $batchIds)->pluck('Chuoi_ma_qr', 'Ma_lo_hang')->toArray()
            : [];

        $certMap = $productIds->isNotEmpty()
            ? DB::table('chung_nhan')->whereIn('Ma_san_pham', $productIds)->pluck('Ten_chung_nhan', 'Ma_san_pham')->toArray()
            : [];

        $fallbackProdImages = [
            1 => 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=600&q=80',
            2 => 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&q=80',
            3 => 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
            4 => 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=600&q=80',
            5 => 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
            6 => 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?auto=format&fit=crop&w=600&q=80',
        ];

        $paginator->getCollection()->transform(function ($item) use ($qrMap, $certMap, $fallbackProdImages) {
            $item->qr_code = $item->batch_id ? ($qrMap[$item->batch_id] ?? null) : null;
            $rawCert = $certMap[$item->id] ?? 'VietGAP';
            $item->certification = str_contains($rawCert, 'GlobalGAP')
                ? 'GlobalGAP'
                : (str_contains($rawCert, 'Hữu cơ') ? 'Hữu cơ TCVN' : 'VietGAP');

            if (empty($item->image) || ! str_starts_with($item->image, 'http')) {
                $item->image = $fallbackProdImages[$item->id] ?? $fallbackProdImages[2];
            }
            return $item;
        });

        if ($paginator->total() > 0) {
            Cache::put($cacheKey, $paginator, 60);
        }

        return $this->paginatedResponse(
            message: 'Lấy danh sách nông sản thành công.',
            paginator: $paginator
        );
    }

    /**
     * GET /api/flash-sales/active
     * Lấy chương trình Flash Sale đang diễn ra kèm danh sách lô hàng cận hạn (FEFO).
     */
    public function flashSales(): JsonResponse
    {
        $cacheKey = 'public_active_flash_sales_v1';
        $data = Cache::get($cacheKey);

        if (empty($data)) {
            $campaign = DB::table('chuong_trinh_flash_sale')
                ->where('Trang_thai', 'Dang_dien_ra')
                ->orderByDesc('Ma_flash_sale')
                ->first();

            if (! $campaign) {
                return $this->successResponse(
                    message: 'Hiện không có chương trình Flash Sale nào đang diễn ra.',
                    data: null
                );
            }

            $rows = DB::table('chi_tiet_flash_sale as ctfs')
                ->join('lo_hang as lh', 'ctfs.Ma_lo_hang', '=', 'lh.Ma_lo_hang')
                ->join('lo_canh_tac as lct', 'lh.Ma_lo_canh_tac', '=', 'lct.Ma_lo_canh_tac')
                ->join('san_pham as sp', 'lct.Ma_san_pham', '=', 'sp.Ma_san_pham')
                ->leftJoin('ma_qr_truy_xuat as qr', 'lh.Ma_lo_hang', '=', 'qr.Ma_lo_hang')
                ->where('ctfs.Ma_flash_sale', $campaign->Ma_flash_sale)
                ->whereIn('lh.Trang_thai', ['Con_hang', 'Sap_het_han'])
                ->where('lh.So_luong_con_lai', '>', 0)
                ->select(
                    'ctfs.Ma_ct_flash_sale as flash_sale_item_id',
                    'sp.Ma_san_pham as id',
                    'sp.Ten_san_pham as name',
                    'sp.Don_vi_tinh as unit',
                    'sp.Gia_ban as base_price',
                    'ctfs.Gia_giam as sale_price',
                    'ctfs.So_luong_gioi_han as limit_qty',
                    'ctfs.So_luong_da_ban as sold_qty',
                    'sp.Hinh_anh_dai_dien as image',
                    'lh.Ma_lo_hang as batch_id',
                    'lh.Ngay_thu_hoach as harvest_date',
                    'lh.Han_su_dung as expiry_date',
                    'lh.So_luong_con_lai as available_stock',
                    'lct.Ten_lo as plot_name',
                    'qr.Chuoi_ma_qr as qr_code'
                )
                ->orderBy('lh.Han_su_dung', 'asc')
                ->get();

            $fallbackProdImages = [
                1 => 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=600&q=80',
                2 => 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&q=80',
                3 => 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
                4 => 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=600&q=80',
                5 => 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
                6 => 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?auto=format&fit=crop&w=600&q=80',
            ];

            $items = $rows->map(function ($item) use ($fallbackProdImages) {
                $base = (float) $item->base_price;
                $sale = (float) $item->sale_price;
                $item->discount_percent = $base > 0 ? (int) round((($base - $sale) / $base) * 100) : 0;

                if (empty($item->image) || ! str_starts_with($item->image, 'http')) {
                    $item->image = $fallbackProdImages[$item->id] ?? $fallbackProdImages[1];
                }
                return $item;
            })->toArray();

            $data = [
                'id'         => $campaign->Ma_flash_sale,
                'title'      => $campaign->Ten_chuong_trinh,
                'start_time' => $campaign->Thoi_gian_bat_dau,
                'end_time'   => $campaign->Thoi_gian_ket_thuc,
                'items'      => $items,
            ];

            if (! empty($items)) {
                Cache::put($cacheKey, $data, 60);
            }
        }

        return $this->successResponse(
            message: 'Lấy chương trình Flash Sale thành công.',
            data: $data
        );
    }
}