<?php

/*
 * Đăng ký tài khoản khách hàng và cấp quyền vai trò Customer.
 */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\NguoiDung;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:150', 'unique:Nguoi_dung,Email'],
            'phone' => ['nullable', 'string', 'max:20', 'unique:Nguoi_dung,So_dien_thoai'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'name.required' => 'Vui lòng nhập họ và tên.',
            'name.max' => 'Họ và tên tối đa 150 ký tự.',
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'email.unique' => 'Email này đã được sử dụng trên hệ thống.',
            'phone.unique' => 'Số điện thoại này đã được sử dụng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.confirmed' => 'Xác nhận mật khẩu không trùng khớp.',
        ]);

        $user = NguoiDung::create([
            'Ma_vai_tro' => 4, // 4: Customer
            'Ho_ten' => $request->name,
            'Email' => $request->email,
            'So_dien_thoai' => $request->phone,
            'Mat_khau_ma_hoa' => Hash::make($request->password),
            'Trang_thai' => 'Hoat_dong',
        ]);

        event(new Registered($user));

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký tài khoản khách hàng thành công.',
            'data' => [
                'user' => [
                    'id' => $user->Ma_nguoi_dung,
                    'name' => $user->Ho_ten,
                    'email' => $user->Email,
                    'phone' => $user->So_dien_thoai,
                    'role' => 'customer',
                    'roles' => ['customer'],
                ],
                'token' => $token,
            ],
            'errors' => null,
        ], 201);
    }
}
