<?php

/*
 * Đăng ký tài khoản Khách hàng mới (CV04.3).
 */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use App\Models\VaiTro;
use App\Traits\ApiResponse;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    use ApiResponse;

    /**
     * Handle an incoming registration request.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:150'],
            'email'    => ['required', 'string', 'lowercase', 'email', 'max:150', 'unique:Nguoi_dung,Email'],
            'phone'    => ['nullable', 'string', 'max:15', 'unique:Nguoi_dung,So_dien_thoai'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'name.required'      => 'Vui lòng nhập họ và tên.',
            'email.required'     => 'Vui lòng nhập địa chỉ email.',
            'email.email'        => 'Địa chỉ email không đúng định dạng.',
            'email.unique'       => 'Địa chỉ email này đã được sử dụng.',
            'phone.unique'       => 'Số điện thoại này đã được sử dụng.',
            'password.required'  => 'Vui lòng nhập mật khẩu.',
            'password.confirmed' => 'Xác nhận mật khẩu không trùng khớp.',
        ]);

        // Lấy mã vai trò Customer (mặc định là 4)
        $customerRole = VaiTro::where('Ten_vai_tro', 'Customer')->value('Ma_vai_tro') ?? 4;

        $phone = $validated['phone'] ?? $request->input('so_dien_thoai');
        $cleanPhone = ($phone !== null && trim($phone) !== '') ? trim($phone) : null;

        $user = NguoiDung::create([
            'Ma_vai_tro'      => $customerRole,
            'Ho_ten'          => $validated['name'],
            'Email'           => $validated['email'],
            'So_dien_thoai'   => $cleanPhone,
            'Mat_khau_ma_hoa' => Hash::make($validated['password']),
            'Trang_thai'      => 'Hoat_dong',
        ]);
            'Mat_khau_ma_hoa' => Hash::make($validated['password']),
            'Trang_thai'      => 'Hoat_dong',
        ]);

        event(new Registered($user));

        $token = $user->createToken('auth_token')->plainTextToken;

        $userData = [
            'id'          => $user->Ma_nguoi_dung,
            'name'        => $user->Ho_ten,
            'email'       => $user->Email,
            'phone'       => $user->So_dien_thoai,
            'role'        => 'customer',
            'roles'       => ['customer'],
            'status'      => $user->Trang_thai,
            'permissions' => [],
        ];

        return $this->successResponse(
            message: 'Đăng ký tài khoản thành công!',
            data: [
                'user'  => $userData,
                'token' => $token,
            ],
            status: 201
        );
    }
}
