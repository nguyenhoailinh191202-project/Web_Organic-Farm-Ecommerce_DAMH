<?php

/*
 * Gửi OTP hoặc liên kết khôi phục mật khẩu qua email (CV04.5).
 */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use App\Traits\ApiResponse;
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
    use ApiResponse;

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
        ], [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email'    => 'Địa chỉ email không đúng định dạng.',
        ]);

        $throttleKey = 'password-reset|' . Str::transliterate(Str::lower($request->input('email')) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return $this->errorResponse(
                message: "Bạn đã gửi yêu cầu quá nhanh. Vui lòng đợi {$seconds} giây trước khi thử lại.",
                status: 429,
                errorCode: self::ERR_TOO_MANY_REQUESTS,
                errors: [
                    'email' => ["Vui lòng chờ {$seconds} giây trước khi gửi lại yêu cầu."],
                ],
                meta: ['retry_after' => $seconds],
                headers: ['Retry-After' => (string) $seconds]
            );
        }

        RateLimiter::hit($throttleKey, 60);

        $user = NguoiDung::where('Email', $request->email)->first();

        if (!$user) {
            return $this->errorResponse(
                message: 'Địa chỉ email này chưa được đăng ký trong hệ thống.',
                status: 422,
                errorCode: self::ERR_VALIDATION,
                errors: [
                    'email' => ['Địa chỉ email này chưa được đăng ký trong hệ thống.'],
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

        $otp = (string) random_int(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->Email],
            [
                'token'      => Hash::make($otp),
                'created_at' => Carbon::now(),
            ]
        );

        Log::info("Mã OTP khôi phục mật khẩu cho tài khoản {$user->Email}: {$otp}");

        $responseData = [
            'email' => $user->Email,
        ];

        if (app()->environment(['local', 'testing'])) {
            $responseData['otp'] = $otp;
        }

        return $this->successResponse(
            message: 'Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
            data: $responseData,
            status: 200
        );
    }
}
