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
public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required'    => 'Vui lòng nhập địa chỉ email.',
            'email.email'       => 'Địa chỉ email không đúng định dạng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ]);

        $throttleKey = Str::transliterate(Str::lower($validated['email']) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            event(new Lockout($request));
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'email' => ["Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau {$seconds} giây."],
            ]);
        }

        $user = NguoiDung::with('vaiTro.quyens')
            ->where('Email', Str::lower(trim($validated['email'])))
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->Mat_khau_ma_hoa)) {
            RateLimiter::hit($throttleKey);

            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không chính xác.'],
            ]);
        }

        RateLimiter::clear($throttleKey);

        if ($user->Trang_thai === 'Khoa') {
            return $this->errorResponse(
                message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.',
                status: 403,
                errorCode: self::ERR_FORBIDDEN,
                errors: [
                    'email' => ['Tài khoản này đã bị khóa do vi phạm chính sách hoặc bởi Quản trị viên.'],
                ]
            );
        }

        $normalizedRole = $user->getRoleSlug();
        $token = $user->createToken('auth_token')->plainTextToken;

        $userData = [
            'id'          => $user->Ma_nguoi_dung,
            'name'        => $user->Ho_ten,
            'email'       => $user->Email,
            'phone'       => $user->So_dien_thoai,
            'role'        => $normalizedRole,
            'roles'       => [$normalizedRole],
            'status'      => $user->Trang_thai,
            'permissions' => $user->vaiTro?->quyens->pluck('Ten_quyen')->toArray() ?? [],
        ];

        return $this->successResponse(
            message: 'Đăng nhập thành công.',
            data: [
                'user'  => $userData,
                'token' => $token,
            ]
        );
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
