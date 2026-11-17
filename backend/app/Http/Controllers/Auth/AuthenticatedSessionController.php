<?php

/*
 * Đăng nhập và trả về người dùng, token, roles và permissions.
 */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use App\Traits\ApiResponse;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    use ApiResponse;
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): Response|JsonResponse
    {
        $request->authenticate();

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        /** @var \App\Models\NguoiDung $user */
        $user = Auth::user();

        // Kiểm tra trạng thái tài khoản bị khóa
        if ($user && $user->Trang_thai === 'Khoa') {
            Auth::guard('web')->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.',
                'error_code' => 'ACCOUNT_LOCKED',
                'errors' => [
                    'email' => ['Tài khoản này đã bị khóa do vi phạm chính sách hoặc bởi Quản trị viên.'],
                ],
            ], 403);
        }

        $rawRole = $user?->vaiTro?->Ten_vai_tro ?? 'Customer';
        $normalizedRole = match (strtolower(str_replace([' ', '_'], '', $rawRole))) {
            'admin' => 'admin',
            'sales' => 'sales',
            'farmstaff' => 'farm_staff',
            default => 'customer',
        };

        $token = $user?->createToken('auth_token')->plainTextToken;

        $userData = [
            'id' => $user->Ma_nguoi_dung,
            'name' => $user->Ho_ten,
            'email' => $user->Email,
            'phone' => $user->So_dien_thoai,
            'role' => $normalizedRole,
            'roles' => [$normalizedRole],
            'status' => $user->Trang_thai === 'Hoat_dong' ? 'active' : 'locked',
        ];

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập thành công.',
                'error_code' => null,
                'data' => [
                    'user' => $userData,
                    'token' => $token,
                ],
                'user' => $userData,
                'token' => $token,
            ], 200);
        }

        return response()->noContent();
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): Response|JsonResponse
    {
        /** @var \App\Models\NguoiDung|null $user */
        $user = Auth::user();
        if ($user && method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Đăng xuất thành công.',
            ], 200);
        }

        return response()->noContent();
    }
}
