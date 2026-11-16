<?php

/*
 * Kiểm tra quyền hạn cụ thể của người dùng (RBAC - CV04.6).
 */

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class CheckPermission
{
    /**
     * Xử lý request và xác thực người dùng có các quyền hạn cụ thể.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$permissions  Danh sách tên quyền hạn yêu cầu
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        // 1. Kiểm tra phiên đăng nhập
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

        // 3. Kiểm tra từng quyền hạn
        foreach ($permissions as $permissionGroup) {
            $parts = explode(',', $permissionGroup);
            foreach ($parts as $part) {
                $permission = trim($part);
                if ($permission !== '' && method_exists($user, 'hasPermission')) {
                    if (!$user->hasPermission($permission)) {
                        throw new AccessDeniedHttpException("Tài khoản của bạn thiếu quyền hạn yêu cầu: [{$permission}].");
                    }
                }
            }
        }

        return $next($request);
    }
}
