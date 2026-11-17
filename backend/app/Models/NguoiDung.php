<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class NguoiDung extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'Nguoi_dung';
    protected $primaryKey = 'Ma_nguoi_dung';

    protected $fillable = [
        'Ma_vai_tro', 'Ho_ten', 'Email', 'So_dien_thoai', 'Mat_khau_ma_hoa', 'Trang_thai',
    ];

    protected $hidden = ['Mat_khau_ma_hoa'];

    public function getAuthPassword(): string
    {
        return $this->Mat_khau_ma_hoa;
    }

    public function getAuthPasswordName(): string
    {
        return 'Mat_khau_ma_hoa';
    }

    public function getRememberTokenName(): string
    {
        return '';
    }

    public function getEmailForPasswordReset(): string
    {
        return $this->Email;
    }

    public function routeNotificationForMail(): string
    {
        return $this->Email;
    }

    public function vaiTro()
    {
        return $this->belongsTo(VaiTro::class, 'Ma_vai_tro', 'Ma_vai_tro');
    }

    public function getRoleSlug(): string
    {
        $rawRole = $this->vaiTro?->Ten_vai_tro ?? 'Customer';

        return match (strtolower(str_replace([' ', '_'], '', $rawRole))) {
            'admin' => 'admin',
            'sales' => 'sales',
            'farmstaff' => 'farm_staff',
            default => 'customer',
        };
    }

    public function hasPermission(string $tenQuyen): bool
    {
        return $this->vaiTro?->quyens()->where('Ten_quyen', $tenQuyen)->exists() ?? false;
    }
}