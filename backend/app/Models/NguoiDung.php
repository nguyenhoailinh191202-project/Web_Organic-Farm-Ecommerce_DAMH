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

    public function vaiTro()
    {
        return $this->belongsTo(VaiTro::class, 'Ma_vai_tro', 'Ma_vai_tro');
    }

    public function hasPermission(string $tenQuyen): bool
    {
        return $this->vaiTro?->quyens()->where('Ten_quyen', $tenQuyen)->exists() ?? false;
    }

    public function getRoleSlug(): string
    {
        return match ((int)$this->Ma_vai_tro) {
            1 => 'admin',
            2 => 'sales',
            3 => 'farm_staff',
            default => 'customer',
        };
    }

    public function hasRole(string|array $roles): bool
    {
        $currentRole = $this->getRoleSlug();
        if (is_array($roles)) {
            return in_array($currentRole, $roles, true);
        }
        return $currentRole === $roles;
    }
}