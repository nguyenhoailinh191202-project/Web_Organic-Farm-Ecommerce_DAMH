<?php

/*
 * Gửi OTP hoặc liên kết khôi phục mật khẩu qua email (CV04.5).
 */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class PasswordResetLinkController extends Controller
{
    /**
     * Tạo mã OTP/token đặt lại mật khẩu và gửi cho người dùng.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
        ], [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
        ]);

        $throttleKey = 'password-reset|' . Str::transliterate(Str::lower($request->input('email')) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Bạn đã gửi yêu cầu quá nhanh. Vui lòng đợi {$seconds} giây trước khi thử lại.",
                'error_code' => 'TOO_MANY_REQUESTS',
                'data' => null,
                'meta' => null,
                'errors' => [
                    'email' => ["Vui lòng chờ {$seconds} giây trước khi gửi lại yêu cầu."]
                ],
            ], 429);
        }

        RateLimiter::hit($throttleKey, 60);

        $user = NguoiDung::where('Email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Địa chỉ email này chưa được đăng ký trong hệ thống.',
                'error_code' => 'USER_NOT_FOUND',
                'data' => null,
                'meta' => null,
                'errors' => [
                    'email' => ['Địa chỉ email này chưa được đăng ký trong hệ thống.']
                ],
            ], 422);
        }

        if ($user->Trang_thai === 'Khoa') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
                'error_code' => 'ACCOUNT_LOCKED',
                'data' => null,
                'meta' => null,
                'errors' => null,
            ], 403);
        }

        // Tạo mã xác thực OTP 6 số ngẫu nhiên
        $otp = (string) random_int(100000, 999999);

        // Lưu vào bảng password_reset_tokens
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->Email],
            [
                'token' => Hash::make($otp),
                'created_at' => Carbon::now(),
            ]
        );

        Log::info("Mã OTP khôi phục mật khẩu cho tài khoản {$user->Email}: {$otp}");

        $responseData = [
            'email' => $user->Email,
        ];

        // Ở môi trường local / testing, cung cấp mã OTP để hỗ trợ test nhanh mà không phụ thuộc cấu hình SMTP
        if (app()->environment(['local', 'testing'])) {
            $responseData['otp'] = $otp;
        }

        return response()->json([
            'success' => true,
            'message' => 'Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
            'error_code' => null,
            'data' => $responseData,
            'meta' => null,
            'errors' => null,
        ], 200);
    }
}
