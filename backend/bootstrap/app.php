<?php

use App\Traits\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Routing\Exceptions\InvalidSignatureException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Tránh redirect sang route('login') gây lỗi 500 trên các request API
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : '/login');

        // Khai báo alias middleware RBAC phân quyền vai trò và quyền hạn (CV04.6)
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request, Throwable $e) => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->render(function (Throwable $e, Request $request) {
            if (!$request->is('api/*') && !$request->expectsJson()) {
                return null;
            }

            // Anonymous class sử dụng Trait ApiResponse để truy cập hằng số hợp lệ trên PHP 8.2+
            $codes = new class {
                use ApiResponse;
            };

            $buildError = fn (
                string $message,
                int $status,
                string $errorCode,
                mixed $errors = null,
                array $headers = []
            ) => response()->json([
                'success'    => false,
                'message'    => $message,
                'error_code' => $errorCode,
                'data'       => null,
                'meta'       => null,
                'errors'     => $errors,
            ], $status, $headers);

            // 422: Lỗi dữ liệu đầu vào
            if ($e instanceof ValidationException) {
                return $buildError(
                    'Dữ liệu đầu vào không hợp lệ.',
                    422,
                    $codes::ERR_VALIDATION,
                    $e->errors()
                );
            }

            // 401: Chưa đăng nhập hoặc Token hết hạn / không hợp lệ
            if ($e instanceof AuthenticationException) {
                return $buildError(
                    'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.',
                    401,
                    $codes::ERR_UNAUTHENTICATED
                );
            }

            // 403: Không có quyền truy cập
            if (
                $e instanceof AuthorizationException
                || $e instanceof AccessDeniedHttpException
                || $e instanceof InvalidSignatureException
            ) {
                return $buildError(
                    $e->getMessage() ?: 'Bạn không có quyền truy cập tài nguyên này.',
                    403,
                    $codes::ERR_FORBIDDEN
                );
            }

            // 404: Không tìm thấy bản ghi Eloquent hoặc endpoint API
            if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                $isModel = $e instanceof ModelNotFoundException
                    || $e->getPrevious() instanceof ModelNotFoundException;

                return $buildError(
                    $isModel ? 'Không tìm thấy dữ liệu yêu cầu.' : 'Không tìm thấy đường dẫn API yêu cầu.',
                    404,
                    $codes::ERR_NOT_FOUND
                );
            }

            // 405: Sai phương thức HTTP
            if ($e instanceof MethodNotAllowedHttpException) {
                return $buildError(
                    'Phương thức HTTP không được hỗ trợ cho endpoint này.',
                    405,
                    $codes::ERR_METHOD_NOT_ALLOWED,
                    null,
                    $e->getHeaders()
                );
            }

            // 413: Tệp tải lên vượt dung lượng tối đa
            if ($e instanceof PostTooLargeException) {
                return $buildError(
                    'Dung lượng tệp tải lên vượt quá giới hạn cho phép của máy chủ.',
                    413,
                    $codes::ERR_VALIDATION
                );
            }

            // 429: Vượt giới hạn tần suất gọi API
            if ($e instanceof ThrottleRequestsException) {
                return $buildError(
                    'Thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
                    429,
                    $codes::ERR_TOO_MANY_REQUESTS,
                    null,
                    $e->getHeaders()
                );
            }

            // Bảo toàn mọi HTTP Exception hợp lệ khác (400, 403, 404, 405, 409, 422...), KHÔNG ép về 500
            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();
                $codeMap = [
                    400 => $codes::ERR_BAD_REQUEST,
                    401 => $codes::ERR_UNAUTHENTICATED,
                    403 => $codes::ERR_FORBIDDEN,
                    404 => $codes::ERR_NOT_FOUND,
                    405 => $codes::ERR_METHOD_NOT_ALLOWED,
                    409 => $codes::ERR_CONFLICT,
                    422 => $codes::ERR_VALIDATION,
                    429 => $codes::ERR_TOO_MANY_REQUESTS,
                ];

                return $buildError(
                    $e->getMessage() ?: 'Yêu cầu không hợp lệ.',
                    $status,
                    $codeMap[$status] ?? 'HTTP_ERROR',
                    null,
                    $e->getHeaders()
                );
            }

            // 500: Chỉ lỗi hệ thống chưa xử lý mới trả về 500
            return $buildError(
                config('app.debug') ? $e->getMessage() : 'Lỗi xử lý nội bộ máy chủ.',
                500,
                $codes::ERR_SERVER
            );
        });
    })->create();
