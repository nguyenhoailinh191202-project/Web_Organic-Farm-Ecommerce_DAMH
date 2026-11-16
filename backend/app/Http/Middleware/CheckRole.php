<?php

/*
 * Kiểm tra vai trò người dùng trong hệ thống (RBAC - CV04.6).
 */

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class CheckRole
{
    /**
     * Xử lý request và xác thực vai trò được phép truy cập.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  Danh sách vai trò được phép (ví dụ: 'admin', 'sales', 'farm_staff', 'customer')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        // 1. Kiểm tra xác thực phiên đăng nhập
        if (!$user) {
            throw new AuthenticationException('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
        }

        // 2. Kiểm tra trạng thái tài khoản
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

        // 3. Lấy định danh vai trò chuẩn hóa
        $userRole = method_exists($user, 'getRoleSlug')
            ? $user->getRoleSlug()
            : match ((int)$user->Ma_vai_tro) {
                1 => 'admin',
                2 => 'sales',
                3 => 'farm_staff',
                default => 'customer',
            };

        // Phân tách các vai trò truyền vào (hỗ trợ cả cú pháp role:admin,sales hoặc role:admin)
        $allowedRoles = [];
        foreach ($roles as $roleGroup) {
            $parts = explode(',', $roleGroup);
            foreach ($parts as $part) {
                $trimmed = trim($part);
                if ($trimmed !== '') {
                    $allowedRoles[] = $trimmed;
                }
            }
        }

        // Nếu có danh sách vai trò yêu cầu và vai trò hiện tại không thuộc danh sách
        if (!empty($allowedRoles) && !in_array($userRole, $allowedRoles, true)) {
            $requiredRolesText = implode(', ', $allowedRoles);
            throw new AccessDeniedHttpException("Bạn không có quyền truy cập chức năng này. Yêu cầu vai trò: [{$requiredRolesText}].");
        }

        return $next($request);
    }
}
