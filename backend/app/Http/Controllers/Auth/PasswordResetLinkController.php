<?php

/*
 * Gửi liên kết khôi phục mật khẩu qua email sử dụng Mailpit (CV04.5).
 */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class PasswordResetLinkController extends Controller
{
    /**
     * Handle an incoming password reset link request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status != Password::RESET_LINK_SENT) {
            $translatedStatus = __($status);
            $msg = match ($status) {
                Password::INVALID_USER => 'Không tìm thấy tài khoản với địa chỉ email này trong hệ thống.',
                Password::RESET_THROTTLED => 'Bạn đã gửi yêu cầu khôi phục gần đây. Vui lòng đợi trong giây lát trước khi gửi lại.',
                default => ($translatedStatus === 'passwords.user' ? 'Không tìm thấy tài khoản với địa chỉ email này trong hệ thống.' : $translatedStatus),
            };

            throw ValidationException::withMessages([
                'email' => [$msg],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn! Vui lòng kiểm tra hòm thư Mailpit.',
            'status' => __($status),
        ]);
    }
}

