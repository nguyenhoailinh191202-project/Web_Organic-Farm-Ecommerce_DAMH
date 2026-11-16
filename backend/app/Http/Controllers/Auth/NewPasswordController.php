<?php

/*
 * Xác thực token/OTP khôi phục và cập nhật mật khẩu mới (CV04.5).
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
use Illuminate\Validation\ValidationException;

class NewPasswordController extends Controller
{
    use ApiResponse;

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'string', 'email'],
            'token'    => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'email.required'     => 'Vui lòng nhập địa chỉ email.',
            'email.email'        => 'Địa chỉ email không đúng định dạng.',
            'token.required'     => 'Vui lòng nhập mã xác thực OTP.',
            'password.required'  => 'Vui lòng nhập mật khẩu mới.',
            'password.min'       => 'Mật khẩu phải chứa ít nhất 8 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không trùng khớp.',
        ]);

        $user = NguoiDung::where('Email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Địa chỉ email này không tồn tại trong hệ thống.'],
            ]);
        }

        if ($user->Trang_thai === 'Khoa') {
            return $this->errorResponse(
                message: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
                status: 403,
                errorCode: self::ERR_FORBIDDEN
            );
        }

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $user->Email)
            ->first();

        if (!$resetRecord) {
            throw ValidationException::withMessages([
                'token' => ['Mã xác thực không hợp lệ hoặc bạn chưa yêu cầu cấp mã.'],
            ]);
        }

        if (Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $user->Email)->delete();
            throw ValidationException::withMessages([
                'token' => ['Mã xác thực đã hết hạn hiệu lực. Vui lòng yêu cầu cấp lại mã mới.'],
            ]);
        }

        $inputToken = trim($request->token);
        if (!Hash::check($inputToken, $resetRecord->token)) {
            throw ValidationException::withMessages([
                'token' => ['Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại.'],
            ]);
        }

        $user->Mat_khau_ma_hoa = Hash::make($request->password);
        $user->save();

        // Thu hồi toàn bộ phiên đăng nhập cũ trên các thiết bị khác
        $user->tokens()->delete();

        // Xóa mã OTP đã dùng
        DB::table('password_reset_tokens')->where('email', $user->Email)->delete();

        Log::info("Tài khoản {$user->Email} đã cập nhật mật khẩu mới thành công.");

        return $this->successResponse(
            message: 'Đặt lại mật khẩu thành công! Vui lòng sử dụng mật khẩu mới để đăng nhập.',
            data: ['email' => $user->Email],
            status: 200
        );
    }
}
