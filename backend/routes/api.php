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

// Các API xác thực người dùng công khai (CV04.3 - CV04.5)
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
Route::post('/reset-password', [NewPasswordController::class, 'store']);

// Các API yêu cầu đăng nhập qua Sanctum Token (CV04.4 & CV04.6)
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
                'id'     => $user->Ma_nguoi_dung,
                'name'   => $user->Ho_ten,
                'email'  => $user->Email,
                'phone'  => $user->So_dien_thoai,
                'role'   => $roleSlug,
                'roles'  => [$roleSlug],
                'status' => $user->Trang_thai,
            ],
            'permissions' => $user->vaiTro?->quyens->pluck('Ten_quyen')->toArray() ?? [],
        ]);
    });
});

// Webhook công khai từ ApiPay (không qua auth:sanctum, xác thực bằng HMAC signature)
Route::post('/webhooks/apipay', \App\Http\Controllers\Api\Webhook\ApiPayWebhookController::class);

// Nhóm API Khách hàng (bảo vệ bằng auth:sanctum + role:customer)
Route::middleware(['auth:sanctum', 'role:customer'])->prefix('customer')->group(function () {
    Route::post('/checkout', [\App\Http\Controllers\Api\Customer\CheckoutController::class, 'store']);
});

// Nhóm API Nhân viên Nông trại (bảo vệ bằng auth:sanctum + role:farm_staff)
Route::middleware(['auth:sanctum', 'role:farm_staff'])->prefix('farm')->group(function () {
    Route::get('/seasons', [\App\Http\Controllers\Api\FarmStaff\SeasonController::class, 'index']);
    Route::post('/seasons', [\App\Http\Controllers\Api\FarmStaff\SeasonController::class, 'store']);
    Route::get('/seasons/{id}', [\App\Http\Controllers\Api\FarmStaff\SeasonController::class, 'show']);
    Route::put('/seasons/{id}', [\App\Http\Controllers\Api\FarmStaff\SeasonController::class, 'update']);
    Route::delete('/seasons/{id}', [\App\Http\Controllers\Api\FarmStaff\SeasonController::class, 'destroy']);
    Route::post('/seasons/{id}/plots', [\App\Http\Controllers\Api\FarmStaff\SeasonController::class, 'storePlot']);
    Route::put('/seasons/{id}/plots/{plotId}', [\App\Http\Controllers\Api\FarmStaff\SeasonController::class, 'updatePlot']);
    Route::delete('/seasons/{id}/plots/{plotId}', [\App\Http\Controllers\Api\FarmStaff\SeasonController::class, 'destroyPlot']);
    Route::get('/products', [\App\Http\Controllers\Api\FarmStaff\SeasonController::class, 'getProducts']);
    Route::get('/info', [\App\Http\Controllers\Api\FarmStaff\SeasonController::class, 'getFarmInfo']);
    Route::put('/info', [\App\Http\Controllers\Api\FarmStaff\SeasonController::class, 'updateFarmInfo']);

    Route::get('/farming-logs', [\App\Http\Controllers\Api\FarmStaff\FarmingLogController::class, 'index']);
    Route::post('/farming-logs', [\App\Http\Controllers\Api\FarmStaff\FarmingLogController::class, 'store']);
    Route::delete('/farming-logs/{id}', [\App\Http\Controllers\Api\FarmStaff\FarmingLogController::class, 'destroy']);
});

// Nhóm API Quản trị viên (bảo vệ bằng auth:sanctum + role:admin)
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/reports/dashboard', [\App\Http\Controllers\Api\Admin\ReportController::class, 'dashboard']);
    Route::get('/users', [\App\Http\Controllers\Api\Admin\UserRoleController::class, 'index']);
    Route::put('/users/{id}/status', [\App\Http\Controllers\Api\Admin\UserRoleController::class, 'updateStatus']);
    Route::get('/settings', [\App\Http\Controllers\Api\Admin\SystemSettingController::class, 'index']);
    Route::put('/settings', [\App\Http\Controllers\Api\Admin\SystemSettingController::class, 'update']);
});
