<?php

/*
 * Đăng nhập và điều hướng phân luồng theo vai trò (CV04.4).
 */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthenticatedSessionController extends Controller
{
    /**
     * Xác thực thông tin đăng nhập và trả về người dùng, token và đường dẫn điều hướng theo vai trò.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ]);

        $throttleKey = Str::transliterate(Str::lower($request->input('email')) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau {$seconds} giây.",
                'error_code' => 'TOO_MANY_REQUESTS',
                'errors' => [
                    'email' => ["Thao tác quá nhanh. Vui lòng đợi {$seconds} giây trước khi thử lại."]
                ],
            ], 429);
        }

        $user = NguoiDung::with('vaiTro.quyens')
            ->where('Email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->Mat_khau_ma_hoa)) {
            RateLimiter::hit($throttleKey);
            return response()->json([
                'success' => false,
                'message' => 'Email hoặc mật khẩu không chính xác.',
                'error_code' => 'INVALID_CREDENTIALS',
                'errors' => [
                    'email' => ['Email hoặc mật khẩu không chính xác.']
                ],
            ], 422);
        }

        // Kiểm tra trạng thái hoạt động của tài khoản
        if ($user->Trang_thai === 'Khoa') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
                'error_code' => 'ACCOUNT_LOCKED',
                'errors' => null,
            ], 403);
        }

        RateLimiter::clear($throttleKey);

        // Xác định vai trò chuẩn hóa và điều hướng phân luồng
        $maVaiTro = (int)$user->Ma_vai_tro;
        $role = match ($maVaiTro) {
            1 => 'admin',
            2 => 'sales',
            3 => 'farm_staff',
            default => 'customer',
        };

        $redirectUrl = match ($role) {
            'admin' => '/admin',
            'sales' => '/sales/orders',
            'farm_staff' => '/farm/seasons',
            default => '/',
        };

        $permissions = $user->vaiTro?->quyens->pluck('Ten_quyen')->toArray() ?? [];

        // Khởi tạo token Sanctum cho phiên làm việc
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công.',
            'data' => [
                'user' => [
                    'id' => $user->Ma_nguoi_dung,
                    'name' => $user->Ho_ten,
                    'email' => $user->Email,
                    'phone' => $user->So_dien_thoai,
                    'role' => $role,
                    'roles' => [$role],
                    'vai_tro' => $role,
                    'permissions' => $permissions,
                ],
                'token' => $token,
                'redirect_url' => $redirectUrl,
            ],
            'errors' => null,
        ], 200);
    }

    /**
     * Hủy phiên đăng nhập và thu hồi token.
     */
   public function destroy(Request $request): JsonResponse
{
    $request->user()?->currentAccessToken()?->delete();

    return response()->json([
        'success'    => true,
        'message'    => 'Đăng xuất khỏi hệ thống thành công.',
        'error_code' => null,
        'data'       => null,
        'meta'       => null,
        'errors'     => null,
    ], 200);
}
}
