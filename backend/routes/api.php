<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
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

// 1. Nhóm API Xác thực & Khôi phục mật khẩu (CV04.3 - CV04.6)
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
Route::post('/reset-password', [NewPasswordController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () use ($standardOk) {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    Route::get('/user', function (Request $request) use ($standardOk) {
        $user = $request->user();

        if ($user->Trang_thai === 'Khoa') {
            $user->currentAccessToken()?->delete();

            return response()->json([
                'success'    => false,
                'message'    => 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên.',
                'error_code' => 'FORBIDDEN',
                'data'       => null,
                'meta'       => null,
                'errors'     => null,
            ], 403);
        }

        $user->loadMissing('vaiTro.quyens');
        $roleSlug = $user->getRoleSlug();

        return $standardOk('Lấy thông tin phiên làm việc thành công.', [
            'user' => [
                'id'      => $user->Ma_nguoi_dung,
                'name'    => $user->Ho_ten,
                'email'   => $user->Email,
                'phone'   => $user->So_dien_thoai,
                'role'    => $roleSlug,
                'roles'   => [$roleSlug],
                'vai_tro' => $roleSlug,
                'status'  => $user->Trang_thai,
            ],
            'permissions' => $user->vaiTro?->quyens->pluck('Ten_quyen')->toArray() ?? [],
        ]);
    });
});

// 2. Các endpoint kiểm thử nội bộ (chỉ khả dụng trong local / testing)
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

    Route::middleware(['auth:sanctum', 'role:admin'])->get('/test/rbac/admin', function () use ($standardOk) {
        return $standardOk('Quyền Quản trị viên (Admin) hợp lệ.');
    });

    Route::middleware(['auth:sanctum', 'role:farm_staff,admin'])->get('/test/rbac/farm', function () use ($standardOk) {
        return $standardOk('Quyền Kỹ thuật nông trại (Farm Staff) hợp lệ.');
    });

    Route::middleware(['auth:sanctum', 'role:sales,admin'])->get('/test/rbac/sales', function () use ($standardOk) {
        return $standardOk('Quyền Nhân viên bán hàng (Sales) hợp lệ.');
    });

    Route::middleware(['auth:sanctum', 'role:customer'])->get('/test/rbac/customer', function () use ($standardOk) {
        return $standardOk('Quyền Khách hàng (Customer) hợp lệ.');
    });
}
