<?php

/*
 * Xác thực token/OTP khôi phục và cập nhật mật khẩu mới (CV04.5).
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
use Illuminate\Validation\ValidationException;

class NewPasswordController extends Controller
{
    /**
     * Xác thực mã OTP/token và cập nhật mật khẩu mới cho tài khoản.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'token.required' => 'Vui lòng nhập mã xác thực OTP.',
            'password.required' => 'Vui lòng nhập mật khẩu mới.',
            'password.min' => 'Mật khẩu phải chứa ít nhất 8 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không trùng khớp.',
        ]);

        $user = NguoiDung::where('Email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Địa chỉ email này không tồn tại trong hệ thống.'],
            ]);
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

        // Lấy bản ghi mã xác thực từ bảng password_reset_tokens
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $user->Email)
            ->first();

        if (!$resetRecord) {
            throw ValidationException::withMessages([
                'token' => ['Mã xác thực không hợp lệ hoặc bạn chưa yêu cầu cấp mã.'],
            ]);
        }

        // Kiểm tra thời hạn hiệu lực của mã (60 phút)
        if (Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $user->Email)->delete();
            throw ValidationException::withMessages([
                'token' => ['Mã xác thực đã hết hạn hiệu lực. Vui lòng yêu cầu cấp lại mã mới.'],
            ]);
        }

        // Kiểm tra khớp mã xác thực OTP / Token
        $inputToken = trim($request->token);
        $isValidToken = Hash::check($inputToken, $resetRecord->token) || ($inputToken === $resetRecord->token);

        if (!$isValidToken) {
            throw ValidationException::withMessages([
                'token' => ['Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại.'],
            ]);
        }

        // Cập nhật mật khẩu mới mã hóa an toàn vào bảng Nguoi_dung
        $user->Mat_khau_ma_hoa = Hash::make($request->password);
        $user->save();

        // Xóa token đã sử dụng để đảm bảo tính an toàn một lần (single-use)
        DB::table('password_reset_tokens')->where('email', $user->Email)->delete();

        Log::info("Tài khoản {$user->Email} đã cập nhật mật khẩu mới thành công qua chức năng quên mật khẩu.");

        return response()->json([
            'success' => true,
            'message' => 'Đặt lại mật khẩu thành công! Vui lòng sử dụng mật khẩu mới để đăng nhập.',
            'error_code' => null,
            'data' => [
                'email' => $user->Email,
            ],
            'meta' => null,
            'errors' => null,
        ], 200);
    }
}
