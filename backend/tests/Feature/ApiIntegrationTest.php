<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ApiIntegrationTest extends TestCase
{
    public function test_api_response_contract_and_http_error_statuses(): void
    {
        $this->getJson('/api/ping')
            ->assertOk()
            ->assertJsonStructure(['success', 'message', 'error_code', 'data', 'meta', 'errors'])
            ->assertJsonPath('success', true)
            ->assertJsonPath('error_code', null);

        $this->getJson('/api/test/error-401')
            ->assertUnauthorized()
            ->assertJsonPath('error_code', 'UNAUTHENTICATED');

        $this->getJson('/api/test/error-403')
            ->assertForbidden()
            ->assertJsonPath('error_code', 'FORBIDDEN');

        $this->getJson('/api/not-found')
            ->assertNotFound()
            ->assertJsonPath('error_code', 'NOT_FOUND');

        $this->getJson('/api/test/json')
            ->assertStatus(405)
            ->assertJsonPath('error_code', 'METHOD_NOT_ALLOWED');

        $this->postJson('/api/test/json', [])
            ->assertUnprocessable()
            ->assertJsonPath('error_code', 'VALIDATION_ERROR')
            ->assertJsonStructure(['errors' => ['ten_san_pham', 'so_luong']]);

        config(['app.debug' => false]);
        $this->getJson('/api/test/error-500')
            ->assertServerError()
            ->assertJsonPath('error_code', 'SERVER_ERROR');
    }

    public function test_json_and_multipart_requests_are_accepted(): void
    {
        $this->postJson('/api/test/json', [
            'ten_san_pham' => 'Rau cải',
            'so_luong' => 3,
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.so_luong', 3);

        $this->post('/api/test/upload', [
            'mo_ta' => 'Ảnh kiểm thử',
            'file' => UploadedFile::fake()->create('quality.jpg', 10, 'image/jpeg'),
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.original_name', 'quality.jpg');
    }

    public function test_login_authentication_and_role_routing(): void
    {
        // 1. Đăng nhập Admin
        $this->postJson('/api/login', [
            'email' => 'admin@nongsansach.vn',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonPath('user.name', 'Nguyễn Minh Quản Trị')
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role', 'roles', 'status']]);

        $this->postJson('/api/logout')->assertOk();

        // 2. Đăng nhập Sales
        $this->postJson('/api/login', [
            'email' => 'sales.ha@nongsansach.vn',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'sales')
            ->assertJsonPath('user.name', 'Trần Thị Thu Hà (Sales)');

        $this->postJson('/api/logout')->assertOk();

        // 3. Đăng nhập Farm Staff (Kỹ sư canh tác)
        $this->postJson('/api/login', [
            'email' => 'farm.kythuat@nongsansach.vn',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'farm_staff')
            ->assertJsonPath('user.name', 'Phạm Hoàng Kỹ Thuật (Farm Staff)');

        $this->postJson('/api/logout')->assertOk();

        // 4. Đăng nhập Customer (Khách hàng)
        $this->postJson('/api/login', [
            'email' => 'ngocanh.khach@gmail.com',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonPath('user.name', 'Đặng Ngọc Anh');

        $this->postJson('/api/logout')->assertOk();

        // 5. Đăng nhập sai mật khẩu -> Lỗi 422
        $this->postJson('/api/login', [
            'email' => 'admin@nongsansach.vn',
            'password' => 'wrong_password',
        ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['email']]);
    }

    public function test_customer_registration_flow(): void
    {
        $uniqueEmail = 'khachhang_test_' . uniqid() . '@gmail.com';
        $uniquePhone = '098' . rand(1000000, 9999999);

        // 1. Đăng ký tài khoản Khách hàng hợp lệ (CV04.3)
        $response = $this->postJson('/api/register', [
            'name' => 'Nguyễn Thị Hoa Khách Hàng',
            'email' => $uniqueEmail,
            'phone' => $uniquePhone,
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonPath('user.email', $uniqueEmail)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'phone', 'role', 'roles', 'status']]);

        // Đăng xuất sau khi tạo
        $this->postJson('/api/logout')->assertOk();

        // 2. Thử đăng ký trùng email -> Báo lỗi 422
        $this->postJson('/api/register', [
            'name' => 'Người Dùng Trùng Email',
            'email' => $uniqueEmail,
            'phone' => '097' . rand(1000000, 9999999),
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau123',
        ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['email']]);

        // 3. Đăng ký mật khẩu không trùng khớp -> Báo lỗi 422
        $this->postJson('/api/register', [
            'name' => 'Người Dùng Sai Xác Nhận',
            'email' => 'different_' . uniqid() . '@gmail.com',
            'phone' => '096' . rand(1000000, 9999999),
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau456',
        ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['password']]);
    }

    public function test_forgot_and_reset_password_mailpit_flow(): void
    {
        $uniqueTestEmail = 'forgot_test_' . uniqid() . '@nongsansach.vn';
        $uniqueTestPhone = '091' . rand(1000000, 9999999);

        // Tạo tài khoản khách hàng kiểm thử mới cho luồng reset password
        $testUser = \App\Models\NguoiDung::create([
            'Ma_vai_tro' => 4,
            'Ho_ten' => 'Người Dùng Kiểm Thử Mailpit',
            'Email' => $uniqueTestEmail,
            'So_dien_thoai' => $uniqueTestPhone,
            'Mat_khau_ma_hoa' => \Illuminate\Support\Facades\Hash::make('oldpassword123'),
            'Trang_thai' => 'Hoat_dong',
        ]);

        // 1. Gửi yêu cầu quên mật khẩu đến email khách hàng qua Mailpit (CV04.5)
        $this->postJson('/api/forgot-password', [
            'email' => $uniqueTestEmail,
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        // 2. Gửi yêu cầu với email không tồn tại -> Báo lỗi 422
        $this->postJson('/api/forgot-password', [
            'email' => 'nonexistent_account_' . uniqid() . '@nongsansach.vn',
        ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['email']]);

        // 3. Đặt lại mật khẩu với token không hợp lệ -> Báo lỗi 422
        $this->postJson('/api/reset-password', [
            'token' => 'invalid-token-12345',
            'email' => $uniqueTestEmail,
            'password' => 'matkhaumoi888',
            'password_confirmation' => 'matkhaumoi888',
        ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['email']]);

        // 4. Lấy token hợp lệ từ Password broker để thực hiện đổi mật khẩu
        $validToken = \Illuminate\Support\Facades\Password::createToken($testUser);

        // 5. Đặt lại mật khẩu thành công bằng token hợp lệ
        $this->postJson('/api/reset-password', [
            'token' => $validToken,
            'email' => $uniqueTestEmail,
            'password' => 'matkhaumoi888',
            'password_confirmation' => 'matkhaumoi888',
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        // 6. Đăng nhập ngay bằng mật khẩu mới
        $this->postJson('/api/login', [
            'email' => $uniqueTestEmail,
            'password' => 'matkhaumoi888',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'customer');

        $this->postJson('/api/logout')->assertOk();

        // 7. Dọn dẹp tài khoản kiểm thử
        $testUser->delete();
    }
}
