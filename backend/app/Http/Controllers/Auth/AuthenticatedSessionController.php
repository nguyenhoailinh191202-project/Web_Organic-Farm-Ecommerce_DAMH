<?php

/*
 * Đăng nhập và điều hướng phân luồng theo vai trò (CV04.4).
 */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthenticatedSessionController extends Controller
{
    use ApiResponse;

    /**
     * Xác thực thông tin đăng nhập và trả về người dùng, token và đường dẫn điều hướng theo vai trò.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required'    => 'Vui lòng nhập địa chỉ email.',
            'email.email'       => 'Địa chỉ email không đúng định dạng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ]);

        $throttleKey = Str::transliterate(Str::lower($request->input('email')) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return $this->errorResponse(
                message: "Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau {$seconds} giây.",
                status: 429,
                errorCode: self::ERR_TOO_MANY_REQUESTS,
                errors: [
                    'email' => ["Thao tác quá nhanh. Vui lòng đợi {$seconds} giây trước khi thử lại."],
                ],
                meta: ['retry_after' => $seconds],
                headers: ['Retry-After' => (string) $seconds]
            );
        }

        $user = NguoiDung::with('vaiTro.quyens')
            ->where('Email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->Mat_khau_ma_hoa)) {
            RateLimiter::hit($throttleKey, 60);

            return $this->errorResponse(
                message: 'Email hoặc mật khẩu không chính xác.',
                status: 422,
                errorCode: self::ERR_VALIDATION,
                errors: [
                    'email' => ['Email hoặc mật khẩu không chính xác.'],
                ]
            );
        }

        if ($user->Trang_thai === 'Khoa') {
            return $this->errorResponse(
                message: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
                status: 403,
                errorCode: self::ERR_FORBIDDEN
            );
        }

        RateLimiter::clear($throttleKey);

        $role = $user->getRoleSlug();

        $redirectUrl = match ($role) {
            'admin'      => '/admin',
            'sales'      => '/sales/orders',
            'farm_staff' => '/farm/seasons',
            default      => '/',
        };

        $permissions = $user->vaiTro?->quyens->pluck('Ten_quyen')->toArray() ?? [];
        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse(
            message: 'Đăng nhập thành công.',
            data: [
                'user' => [
                    'id'          => $user->Ma_nguoi_dung,
                    'name'        => $user->Ho_ten,
                    'email'       => $user->Email,
                    'phone'       => $user->So_dien_thoai,
                    'role'        => $role,
                    'roles'       => [$role],
                    'vai_tro'     => $role,
                    'status'      => $user->Trang_thai,
                    'permissions' => $permissions,
                ],
                'token'        => $token,
                'redirect_url' => $redirectUrl,
            ],
            status: 200
        );
    }

    /**
     * Hủy phiên đăng nhập và thu hồi token Sanctum hiện tại.
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->successResponse(
            message: 'Đăng xuất khỏi hệ thống thành công.',
            data: null,
            status: 200
        );
    }
}
