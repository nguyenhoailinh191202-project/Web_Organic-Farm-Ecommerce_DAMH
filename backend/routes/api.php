<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

$standardOk = fn (string $message, mixed $data = null) => response()->json([
    'success'    => true,
    'message'    => $message,
    'error_code' => null,
    'data'       => $data,
    'meta'       => null,
    'errors'     => null,
], 200);

Route::get('/ping', fn () => $standardOk('Kết nối Laravel API thành công.'));

if (app()->environment(['local', 'testing'])) {
    Route::post('/test/json', function (Request $request) use ($standardOk) {
        $validated = $request->validate([
            'ten_san_pham' => ['required', 'string', 'max:100'],
            'so_luong'     => ['required', 'integer', 'min:1'],
        ], [
            'ten_san_pham.required' => 'Vui lòng nhập tên sản phẩm.',
            'so_luong.required'     => 'Vui lòng nhập số lượng.',
            'so_luong.integer'      => 'Số lượng phải là số nguyên.',
            'so_luong.min'          => 'Số lượng tối thiểu là 1.',
        ]);

        return $standardOk('Nhận dữ liệu JSON thành công.', $validated);
    });

    Route::post('/test/upload', function (Request $request) use ($standardOk) {
        $request->validate([
            'mo_ta' => ['required', 'string', 'max:255'],
            'file'  => ['required', 'file', 'mimes:jpg,jpeg,png,webp,mp4,mov,pdf', 'max:20480'],
        ], [
            'mo_ta.required' => 'Vui lòng nhập mô tả tệp đính kèm.',
            'file.required'  => 'Vui lòng chọn tệp ảnh hoặc video.',
            'file.mimes'     => 'Chỉ chấp nhận tệp jpg, jpeg, png, webp, mp4, mov, pdf.',
            'file.max'       => 'Dung lượng tệp tối đa là 20MB.',
        ]);

        $file = $request->file('file');

        return $standardOk('Nhận FormData thành công.', [
            'mo_ta'         => $request->input('mo_ta'),
            'original_name' => $file->getClientOriginalName(),
            'mime_type'     => $file->getMimeType(),
            'size_bytes'    => $file->getSize(),
        ]);
    });

    Route::get('/test/error-401', fn () => abort(401));
    Route::get('/test/error-403', fn () => abort(403));
    Route::get('/test/error-500', function () {
        throw new \RuntimeException('Giả lập lỗi hệ thống nội bộ 500 để kiểm thử Exception Handler.');
    });

    // Các endpoint kiểm thử phân quyền RBAC (chỉ khả dụng trong local/testing)
    Route::middleware(['auth:sanctum', 'role:admin'])->get('/test/rbac/admin', function () use ($standardOk) {
        return $standardOk('Quyền Quản trị viên (Admin) hợp lệ.');
    });

    Route::middleware(['auth:sanctum', 'role:farm_staff'])->get('/test/rbac/farm', function () use ($standardOk) {
        return $standardOk('Quyền Kỹ thuật nông trại (Farm Staff) hợp lệ.');
    });

    Route::middleware(['auth:sanctum', 'role:sales'])->get('/test/rbac/sales', function () use ($standardOk) {
        return $standardOk('Quyền Nhân viên bán hàng (Sales) hợp lệ.');
    });

    Route::middleware(['auth:sanctum', 'role:customer'])->get('/test/rbac/customer', function () use ($standardOk) {
        return $standardOk('Quyền Khách hàng (Customer) hợp lệ.');
    });
}

// Endpoint lấy thông tin phiên làm việc người dùng hiện tại (CV04.6)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) use ($standardOk) {
    $user = $request->user();
    if ($user && method_exists($user, 'load')) {
        $user->load('vaiTro.quyens');
    }

    $roleSlug = method_exists($user, 'getRoleSlug')
        ? $user->getRoleSlug()
        : match ((int)$user->Ma_vai_tro) {
            1 => 'admin',
            2 => 'sales',
            3 => 'farm_staff',
            default => 'customer',
        };

    return $standardOk('Lấy thông tin phiên làm việc thành công.', [
        'user' => [
            'id' => $user->Ma_nguoi_dung,
            'name' => $user->Ho_ten,
            'email' => $user->Email,
            'phone' => $user->So_dien_thoai,
            'role' => $roleSlug,
            'roles' => [$roleSlug],
            'status' => $user->Trang_thai,
        ],
        'permissions' => $user->vaiTro?->quyens->pluck('Ten_quyen')->toArray() ?? [],
    ]);
});

// Định tuyến xác thực người dùng và đăng ký tài khoản khách hàng
require __DIR__ . '/auth.php';
