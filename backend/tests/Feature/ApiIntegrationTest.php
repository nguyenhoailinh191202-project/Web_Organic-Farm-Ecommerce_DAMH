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
}
