/* User account and permission management page with responsive card/table layout and instant pagination. */
import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import { useToast } from "../../context/ToastContext";

export default function UserManagementPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getUsers({
        page,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        per_page: 10,
      });
      const data = res.data;
      setUsers(data?.data || []);
      if (data?.meta) {
        setMeta({
          current_page: data.meta.current_page || 1,
          last_page: data.meta.last_page || 1,
          total: data.meta.total || 0,
        });
      }
    } catch (err) {
      setError("Không thể tải danh sách tài khoản. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    const newStatus = user.Trang_thai === "Hoat_dong" ? "Khoa" : "Hoat_dong";
    const confirmText =
      newStatus === "Khoa"
        ? `Bạn có chắc chắn muốn khóa tài khoản "${user.Ho_ten}"? Người dùng này sẽ bị thu hồi phiên đăng nhập ngay lập tức.`
        : `Bạn có muốn mở khóa cho tài khoản "${user.Ho_ten}"?`;

    const confirmed = await toast.confirm({
      title: newStatus === "Khoa" ? "Khóa tài khoản" : "Mở khóa tài khoản",
      message: confirmText,
      confirmText: newStatus === "Khoa" ? "Khóa tài khoản" : "Mở khóa",
      cancelText: "Hủy",
      variant: newStatus === "Khoa" ? "danger" : "warning",
    });

    if (!confirmed) return;

    setUpdatingId(user.Ma_nguoi_dung);
    try {
      await adminApi.updateUserStatus(user.Ma_nguoi_dung, newStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.Ma_nguoi_dung === user.Ma_nguoi_dung ? { ...u, Trang_thai: newStatus } : u
        )
      );
      toast.success(
        newStatus === "Khoa"
          ? `Đã khóa tài khoản "${user.Ho_ten}".`
          : `Đã mở khóa tài khoản "${user.Ho_ten}".`
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể cập nhật trạng thái tài khoản.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (roleName, roleId) => {
    const normalized = String(roleName || "").trim().toLowerCase();
    const id = Number(roleId);

    if (id === 1 || normalized === "admin" || normalized === "quản trị viên") {
      return { label: "Admin", bg: "bg-[#00450d] text-white border-[#006e1c]" };
    }
    if (id === 2 || normalized === "sales" || normalized === "nhân viên bán hàng") {
      return { label: "Sales", bg: "bg-amber-100 text-amber-900 border-amber-300" };
    }
    if (id === 3 || normalized === "farm_staff" || normalized === "farm staff" || normalized === "nhân viên nông trại") {
      return { label: "Farm Staff", bg: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    }
    if (id === 4 || normalized === "customer" || normalized === "khách hàng") {
      return { label: "Customer", bg: "bg-blue-50 text-blue-700 border-blue-200" };
    }

    return { label: roleName || "User", bg: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Quản Lý Tài Khoản & Phân Quyền
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng cộng: <strong className="text-slate-800">{meta.total}</strong> tài khoản trong hệ thống XanhFarm.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchUsers()}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shrink-0"
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="farm_staff">Kỹ sư nông trại (Farm Staff)</option>
            <option value="sales">Bán hàng (Sales)</option>
            <option value="customer">Khách hàng (Customer)</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="hidden sm:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10.5px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Họ & Tên</th>
                <th className="px-5 py-3.5">Liên Hệ</th>
                <th className="px-5 py-3.5">Vai Trò</th>
                <th className="px-5 py-3.5">Trạng Thái</th>
                <th className="px-5 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-400">
                    Không tìm thấy tài khoản người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleBadge = getRoleBadge(u.vai_tro?.Ten_vai_tro, u.Ma_vai_tro);
                  const isLocked = u.Trang_thai === "Khoa";
                  const isUpdating = updatingId === u.Ma_nguoi_dung;

                  return (
                    <tr key={u.Ma_nguoi_dung} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                            {(u.Ho_ten || u.Email || "U").charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[160px]">{u.Ho_ten || "Chưa cập nhật"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-mono text-slate-800">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{u.Email}</span>
                        </div>
                        {u.So_dien_thoai && (
                          <div className="flex items-center gap-1.5 font-mono text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{u.So_dien_thoai}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${roleBadge.bg}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            isLocked
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isLocked ? "bg-red-500" : "bg-emerald-500"}`}
                          />
                          {isLocked ? "Tạm khóa" : "Hoạt động"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          disabled={isUpdating || u.Ma_vai_tro === 1}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                            u.Ma_vai_tro === 1
                              ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400"
                              : isLocked
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                              : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                          }`}
                          title={u.Ma_vai_tro === 1 ? "Không thể khóa tài khoản Quản trị viên cao nhất" : ""}
                        >
                          {isLocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              Mở khóa
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              Khóa
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (< 640px) */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="bg-white p-6 rounded-2xl border text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Đang tải dữ liệu...
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border text-center text-slate-400 text-xs">
            Không tìm thấy tài khoản người dùng phù hợp.
          </div>
        ) : (
          users.map((u) => {
            const roleBadge = getRoleBadge(u.vai_tro?.Ten_vai_tro, u.Ma_vai_tro);
            const isLocked = u.Trang_thai === "Khoa";
            const isUpdating = updatingId === u.Ma_nguoi_dung;

            return (
              <div
                key={u.Ma_nguoi_dung}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                      {(u.Ho_ten || u.Email || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {u.Ho_ten || "Chưa cập nhật"}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{u.Email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${roleBadge.bg}`}
                  >
                    {roleBadge.label}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                      isLocked
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isLocked ? "bg-red-500" : "bg-emerald-500"}`}
                    />
                    {isLocked ? "Tạm khóa" : "Hoạt động"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(u)}
                    disabled={isUpdating || u.Ma_vai_tro === 1}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                      u.Ma_vai_tro === 1
                        ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400"
                        : isLocked
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isLocked ? "Mở khóa" : "Khóa tài khoản"}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200/90 text-xs text-slate-600">
          <span>
            Trang <strong>{meta.current_page}</strong> / {meta.last_page} ({meta.total} kết quả)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page >= meta.last_page || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
