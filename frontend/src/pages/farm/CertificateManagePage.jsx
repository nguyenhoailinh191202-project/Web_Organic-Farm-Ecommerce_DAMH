/* Quality certification and lab inspection report management page. */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Award,
  Plus,
  Search,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Building2,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  Pencil,
  Trash2,
  Upload,
  X,
  Loader2,
  ExternalLink,
  ChevronDown,
  Check,
  ShieldCheck,
  Sprout,
  Download,
} from "lucide-react";
import { farmApi } from "../../services/farmApi";
import { showGlobalToast } from "../../components/GlobalToast";
import {
  isApiValidationError,
  notifyApiErrorToast,
} from "../../services/axiosClient";

const CERT_PRESETS = [
  {
    label: "VietGAP Trồng trọt",
    name: "Chứng nhận VietGAP Trồng trọt",
    issuer: "Viện Nghiên cứu Rau quả",
  },
  {
    label: "Hữu cơ TCVN 11041",
    name: "Chứng nhận Hữu cơ Việt Nam (TCVN 11041)",
    issuer: "Trung tâm Chứng nhận Phù hợp QUACERT",
  },
  {
    label: "Kiểm định Quatest 3",
    name: "Phiếu kết quả kiểm định mẫu đất & nước",
    issuer: "Trung tâm Kỹ thuật Tiêu chuẩn Đo lường Chất lượng 3 (QUATEST 3)",
  },
  {
    label: "GlobalGAP",
    name: "Chứng nhận GlobalGAP",
    issuer: "SGS Việt Nam",
  },
];

function getTodayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addMonthsLocal(baseDateStr, months) {
  if (!baseDateStr) return "";
  const parts = baseDateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "";
  const d = new Date(parts[0], parts[1] - 1 + months, parts[2]);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Custom dropdown khóa cứng chiều rộng 100% — chọn Lô hàng thu hoạch
function BatchSelectDropdown({ batches = [], value, onChange, labelId, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const selectedBatch = batches.find((b) => String(b.id) === String(value));
  const filtered = query.trim()
    ? batches.filter((b) => {
        const q = query.trim().toLowerCase();
        return (
          (b.batch_code || "").toLowerCase().includes(q) ||
          (b.product_name || "").toLowerCase().includes(q) ||
          (b.plot_name || "").toLowerCase().includes(q) ||
          String(b.id).includes(q)
        );
      })
    : batches;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((prev) => !prev);
          setQuery("");
        }}
        className={`w-full min-w-0 px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-left flex items-center justify-between gap-2 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          isOpen
            ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20"
            : error
              ? "border-red-300 bg-red-50/30"
              : "border-slate-200 hover:border-slate-300 hover:bg-white"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedBatch ? (
            <>
              <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800 truncate">
                {selectedBatch.batch_code} · {selectedBatch.product_name}
              </span>
            </>
          ) : (
            <span className="text-slate-500 truncate">
              Chọn lô hàng thu hoạch cần gắn chứng nhận
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={labelId}
          className="absolute left-0 right-0 top-full mt-1.5 z-40 w-full max-w-full bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {batches.length > 5 && (
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm mã lô, nông sản hoặc lô đất..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto overflow-x-hidden p-1.5 space-y-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-5 text-center text-xs text-slate-500">
                Không tìm thấy lô hàng thu hoạch phù hợp.
              </div>
            ) : (
              filtered.map((batch) => {
                const isSelected = String(value) === String(batch.id);
                return (
                  <button
                    key={batch.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(batch);
                      setIsOpen(false);
                    }}
                    className={`w-full min-w-0 text-left px-3 py-2.5 rounded-xl flex items-start justify-between gap-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/80"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-[13px] font-bold text-slate-800 break-words leading-snug">
                          {batch.product_name}
                        </div>
                        <div className="text-[11px] text-slate-500 break-words leading-snug mt-0.5 tabular-nums">
                          {batch.batch_code} · Thu {batch.harvest_date} · {batch.plot_name}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Custom dropdown khóa cứng chiều rộng 100% — chọn Sản phẩm (khi gắn theo sản phẩm chung)
function ProductSelectDropdown({ products = [], value, onChange, labelId, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const selectedProd = products.find((p) => String(p.id) === String(value));
  const filtered = query.trim()
    ? products.filter((p) =>
        (p.name || "").toLowerCase().includes(query.trim().toLowerCase())
      )
    : products;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((prev) => !prev);
          setQuery("");
        }}
        className={`w-full min-w-0 px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-left flex items-center justify-between gap-2 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          isOpen
            ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20"
            : error
              ? "border-red-300 bg-red-50/30"
              : "border-slate-200 hover:border-slate-300 hover:bg-white"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedProd ? (
            <>
              <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800 truncate">
                {selectedProd.name}
              </span>
            </>
          ) : (
            <span className="text-slate-500 truncate">
              Chọn sản phẩm nông sản áp dụng
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={labelId}
          className="absolute left-0 right-0 top-full mt-1.5 z-40 w-full max-w-full bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {products.length > 5 && (
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm tên nông sản..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto overflow-x-hidden p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                Không tìm thấy sản phẩm phù hợp.
              </div>
            ) : (
              filtered.map((p) => {
                const isSelected = String(value) === String(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(String(p.id));
                      setIsOpen(false);
                    }}
                    className={`w-full min-w-0 text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-950 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs sm:text-[13px] break-words min-w-0 flex-1 leading-snug">
                      {p.name}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10.5px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.unit}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CertificateManagePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    expiring_soon: 0,
    expired: 0,
    batch_attached: 0,
  });
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");

  // Upload / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [attachMode, setAttachMode] = useState("batch"); // "batch" | "product"
  const [formState, setFormState] = useState({
    Ma_lo_hang: "",
    Ma_san_pham: "",
    Ten_chung_nhan: "",
    To_chuc_cap: "",
    Ngay_cap: getTodayLocal(),
    Ngay_het_han: addMonthsLocal(getTodayLocal(), 12),
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Preview Modal & Delete Confirm Modal
  const [previewCert, setPreviewCert] = useState(null);
  const [deletingCert, setDeletingCert] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Thông báo nổi dùng chung toàn hệ thống (top-center)
  const showToast = useCallback((msg, type = "success") => {
    showGlobalToast(msg, type);
  }, []);

  const fetchCertificates = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await farmApi.getCertificates();
      const payload = res.data?.data ?? res.data ?? res ?? {};
      setCertificates(Array.isArray(payload.certificates) ? payload.certificates : []);
      if (payload.stats) {
        setStats(payload.stats);
      }
    } catch (err) {
      notifyApiErrorToast(err, "Không thể tải danh sách chứng nhận. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [batchRes, prodRes] = await Promise.all([
        farmApi.getBatches(),
        farmApi.getFarmProducts(),
      ]);
      const batchPayload = batchRes.data?.data ?? batchRes.data ?? batchRes ?? {};
      setBatches(Array.isArray(batchPayload.batches) ? batchPayload.batches : []);

      const prodPayload = prodRes.data?.data ?? prodRes.data ?? prodRes ?? [];
      setProducts(Array.isArray(prodPayload) ? prodPayload : []);
    } catch (err) {
      notifyApiErrorToast(err, "Không thể tải dữ liệu chứng nhận.");
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
    fetchReferenceData();
  }, [fetchCertificates, fetchReferenceData]);

  // Cleanup blob preview URL
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  const resetFileSelection = useCallback(() => {
    setSelectedFile(null);
    setFilePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  }, []);

  const openCreateModal = useCallback(
    (prefillBatchId = "") => {
      const today = getTodayLocal();
      const matchedBatch = batches.find((b) => String(b.id) === String(prefillBatchId));
      setEditingCert(null);
      setAttachMode("batch");
      setFormState({
        Ma_lo_hang: prefillBatchId ? String(prefillBatchId) : "",
        Ma_san_pham: matchedBatch?.product_id ? String(matchedBatch.product_id) : "",
        Ten_chung_nhan: "",
        To_chuc_cap: "",
        Ngay_cap: today,
        Ngay_het_han: addMonthsLocal(today, 12),
      });
      resetFileSelection();
      setFieldErrors({});
      setIsFormOpen(true);
    },
    [batches, resetFileSelection]
  );

  const openEditModal = useCallback(
    (cert) => {
      setEditingCert(cert);
      setAttachMode(cert.batch_id ? "batch" : "product");
      setFormState({
        Ma_lo_hang: cert.batch_id ? String(cert.batch_id) : "",
        Ma_san_pham: cert.product_id ? String(cert.product_id) : "",
        Ten_chung_nhan: cert.name || "",
        To_chuc_cap: cert.issuer || "",
        Ngay_cap: cert.issued_date || getTodayLocal(),
        Ngay_het_han: cert.expiry_date || "",
      });
      resetFileSelection();
      setFieldErrors({});
      setIsFormOpen(true);
    },
    [resetFileSelection]
  );

  // Tự mở modal khi chuyển từ trang Lô thu hoạch (?batch_id=...&upload=1)
  useEffect(() => {
    const batchIdParam = searchParams.get("batch_id");
    const uploadParam = searchParams.get("upload");
    if (uploadParam === "1" && batchIdParam) {
      openCreateModal(batchIdParam);
      setSearchParams({}, { replace: true });
    } else if (batchIdParam) {
      const matched = batches.find((b) => String(b.id) === String(batchIdParam));
      if (matched?.batch_code) {
        setSearchTerm(matched.batch_code);
      }
    }
  }, [searchParams, batches, openCreateModal, setSearchParams]);

  // Chọn file và validate phía client
  const handleChooseFile = (file) => {
    if (!file) return;
    const allowedExts = ["pdf", "jpg", "jpeg", "png", "webp"];
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!allowedExts.includes(ext)) {
      setFieldErrors((prev) => ({
        ...prev,
        file: "Chỉ chấp nhận tệp định dạng PDF, JPG, JPEG, PNG hoặc WEBP.",
      }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        file: "Dung lượng tệp vượt quá giới hạn tối đa 10MB.",
      }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, file: undefined }));
    setSelectedFile(file);
    setFilePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const today = getTodayLocal();
    const errors = {};

    if (attachMode === "batch" && !formState.Ma_lo_hang) {
      errors.Ma_lo_hang = "Vui lòng chọn lô hàng thu hoạch để gắn chứng nhận.";
    }
    if (attachMode === "product" && !formState.Ma_san_pham) {
      errors.Ma_san_pham = "Vui lòng chọn sản phẩm nông sản áp dụng.";
    }
    if (!formState.Ten_chung_nhan.trim() || formState.Ten_chung_nhan.trim().length < 3) {
      errors.Ten_chung_nhan = "Vui lòng nhập tên chứng nhận hoặc phiếu kiểm định (tối thiểu 3 ký tự).";
    }
    if (!formState.To_chuc_cap.trim() || formState.To_chuc_cap.trim().length < 2) {
      errors.To_chuc_cap = "Vui lòng nhập tên tổ chức cấp hoặc đơn vị kiểm định.";
    }
    if (!formState.Ngay_cap) {
      errors.Ngay_cap = "Vui lòng chọn ngày cấp.";
    } else if (formState.Ngay_cap > today) {
      errors.Ngay_cap = "Ngày cấp không được lớn hơn ngày hôm nay.";
    }
    if (formState.Ngay_het_han && formState.Ngay_cap && formState.Ngay_het_han < formState.Ngay_cap) {
      errors.Ngay_het_han = "Ngày hết hạn phải sau hoặc bằng ngày cấp.";
    }
    if (!editingCert && !selectedFile) {
      errors.file = "Vui lòng tải lên tệp bản scan chứng nhận hoặc kết quả kiểm định.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (attachMode === "batch" && formState.Ma_lo_hang) {
        formData.append("Ma_lo_hang", formState.Ma_lo_hang);
        if (formState.Ma_san_pham) {
          formData.append("Ma_san_pham", formState.Ma_san_pham);
        }
      } else if (attachMode === "product" && formState.Ma_san_pham) {
        formData.append("Ma_san_pham", formState.Ma_san_pham);
      }

      formData.append("Ten_chung_nhan", formState.Ten_chung_nhan.trim());
      formData.append("To_chuc_cap", formState.To_chuc_cap.trim());
      formData.append("Ngay_cap", formState.Ngay_cap);
      if (formState.Ngay_het_han) {
        formData.append("Ngay_het_han", formState.Ngay_het_han);
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      if (editingCert) {
        const res = await farmApi.updateCertificate(editingCert.id, formData);
        const updatedCert = res.data?.data ?? res.data;
        if (updatedCert?.id != null) {
          const previousCert =
            certificates.find((cert) => String(cert.id) === String(updatedCert.id)) ||
            editingCert;
          const wasValid = ["valid", "no_expiry"].includes(previousCert.validity_status);
          const isValid = ["valid", "no_expiry"].includes(updatedCert.validity_status);

          setCertificates((prev) =>
            prev.map((cert) =>
              String(cert.id) === String(updatedCert.id) ? updatedCert : cert
            )
          );
          setStats((prev) => ({
            ...prev,
            valid: Math.max(
              0,
              (Number(prev.valid) || 0) - Number(wasValid) + Number(isValid)
            ),
            expiring_soon: Math.max(
              0,
              (Number(prev.expiring_soon) || 0) -
                Number(previousCert.validity_status === "expiring_soon") +
                Number(updatedCert.validity_status === "expiring_soon")
            ),
            expired: Math.max(
              0,
              (Number(prev.expired) || 0) -
                Number(previousCert.validity_status === "expired") +
                Number(updatedCert.validity_status === "expired")
            ),
            batch_attached: Math.max(
              0,
              (Number(prev.batch_attached) || 0) -
                Number(Boolean(previousCert.batch_id)) +
                Number(Boolean(updatedCert.batch_id))
            ),
          }));
        }
        showToast("Đã cập nhật hồ sơ chứng nhận thành công.");
      } else {
        const res = await farmApi.uploadCertificate(formData);
        const createdCert = res.data?.data ?? res.data;
        if (createdCert?.id != null) {
          setCertificates((prev) => [
            createdCert,
            ...prev.filter((cert) => String(cert.id) !== String(createdCert.id)),
          ]);
          setStats((prev) => ({
            ...prev,
            total: (Number(prev.total) || 0) + 1,
            valid:
              (Number(prev.valid) || 0) +
              (["valid", "no_expiry"].includes(createdCert.validity_status) ? 1 : 0),
            expiring_soon:
              (Number(prev.expiring_soon) || 0) +
              (createdCert.validity_status === "expiring_soon" ? 1 : 0),
            expired:
              (Number(prev.expired) || 0) +
              (createdCert.validity_status === "expired" ? 1 : 0),
            batch_attached:
              (Number(prev.batch_attached) || 0) + (createdCert.batch_id ? 1 : 0),
          }));
        }
        showToast("Đã tải lên chứng nhận và gắn vào hồ sơ thành công.");
      }

      setIsFormOpen(false);
      resetFileSelection();
    } catch (err) {
      if (isApiValidationError(err)) {
        const mapped = {};
        Object.keys(err.fieldErrors).forEach((key) => {
          const value = err.fieldErrors[key];
          mapped[key] = Array.isArray(value) ? value[0] : value;
        });
        setFieldErrors(mapped);
      } else {
        notifyApiErrorToast(err, "Không thể lưu hồ sơ chứng nhận. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCert) return;
    setDeleteSubmitting(true);
    try {
      await farmApi.deleteCertificate(deletingCert.id);
      setCertificates((prev) =>
        prev.filter((cert) => String(cert.id) !== String(deletingCert.id))
      );
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, (Number(prev.total) || 0) - 1),
        valid: ["valid", "no_expiry"].includes(deletingCert.validity_status)
          ? Math.max(0, (Number(prev.valid) || 0) - 1)
          : Number(prev.valid) || 0,
        expiring_soon:
          deletingCert.validity_status === "expiring_soon"
            ? Math.max(0, (Number(prev.expiring_soon) || 0) - 1)
            : Number(prev.expiring_soon) || 0,
        expired:
          deletingCert.validity_status === "expired"
            ? Math.max(0, (Number(prev.expired) || 0) - 1)
            : Number(prev.expired) || 0,
        batch_attached: deletingCert.batch_id
          ? Math.max(0, (Number(prev.batch_attached) || 0) - 1)
          : Number(prev.batch_attached) || 0,
      }));
      showToast(`Đã xóa chứng nhận "${deletingCert.name}".`);
      setDeletingCert(null);
      if (String(previewCert?.id) === String(deletingCert.id)) {
        setPreviewCert(null);
      }
    } catch (err) {
      notifyApiErrorToast(err, "Không thể xóa hồ sơ chứng nhận.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const filteredCertificates = useMemo(() => {
    return certificates.filter((item) => {
      if (statusFilter === "valid" && !["valid", "no_expiry"].includes(item.validity_status)) {
        return false;
      }
      if (statusFilter === "expiring_soon" && item.validity_status !== "expiring_soon") {
        return false;
      }
      if (statusFilter === "expired" && item.validity_status !== "expired") {
        return false;
      }
      if (scopeFilter === "batch" && !item.batch_id) return false;
      if (scopeFilter === "product" && item.batch_id) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const combined = [
          item.name,
          item.issuer,
          item.batch_code,
          item.product_name,
          item.plot_name,
          item.season_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!combined.includes(q)) return false;
      }

      return true;
    });
  }, [certificates, statusFilter, scopeFilter, searchTerm]);

  const renderValidityBadge = (cert) => {
    if (cert.validity_status === "expired") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Đã hết hạn</span>
        </span>
      );
    }
    if (cert.validity_status === "expiring_soon") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Còn {cert.days_remaining} ngày</span>
        </span>
      );
    }
    if (cert.validity_status === "no_expiry") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Theo đợt kiểm định</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Còn hiệu lực</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/70">
              <Award className="w-5 h-5" />
            </span>
            <span>Chứng Nhận & Kiểm Định</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchCertificates(true)}
            disabled={refreshing}
            className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Làm mới danh sách"
            aria-label="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => openCreateModal("")}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tải Chứng Nhận</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Hồ Sơ</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 tabular-nums">
            {stats.total}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Đã Gắn Lô Hàng</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">
            {stats.batch_attached}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Còn Hiệu Lực</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">
            {stats.valid}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cần Gia Hạn</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 tabular-nums">
            {stats.expiring_soon + stats.expired}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Filter & Search Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Validity Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {[
                { id: "ALL", label: "Tất cả", count: stats.total },
                { id: "valid", label: "Còn hiệu lực", count: stats.valid },
                { id: "expiring_soon", label: "Sắp hết hạn", count: stats.expiring_soon },
                { id: "expired", label: "Hết hạn", count: stats.expired },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                      statusFilter === tab.id ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Scope Filter */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200">
              {[
                { id: "ALL", label: "Mọi phạm vi" },
                { id: "batch", label: "Gắn lô hàng" },
                { id: "product", label: "Theo sản phẩm" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScopeFilter(s.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    scopeFilter === s.id
                      ? "bg-emerald-50 text-emerald-800 font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên chứng nhận, đơn vị, mã lô..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Loading / Empty / List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            <span className="text-xs font-medium">Đang tải danh sách chứng nhận...</span>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">
              {certificates.length === 0
                ? "Chưa có hồ sơ chứng nhận nào"
                : "Không tìm thấy chứng nhận phù hợp bộ lọc"}
            </h3>
            <button
              type="button"
              onClick={() => openCreateModal("")}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải Chứng Nhận</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto max-h-[calc(100vh-270px)] min-h-[460px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 shadow-2xs">
                  <tr className="bg-slate-50/95 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-4 sm:px-5">Chứng Nhận / Kiểm Định</th>
                    <th className="py-2.5 px-3.5">Lô Hàng & Nông Sản Gắn</th>
                    <th className="py-2.5 px-3.5">Thời Hạn Hiệu Lực</th>
                    <th className="py-2.5 px-3.5">Tệp Bản Scan</th>
                    <th className="py-2.5 px-4 sm:px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 sm:px-5 max-w-xs">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              cert.file_kind === "pdf"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}
                          >
                            {cert.file_kind === "pdf" ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <ImageIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 leading-snug break-words">
                              {cert.name}
                            </p>
                            <p className="text-[11.5px] text-slate-500 mt-0.5 flex items-center gap-1 break-words">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{cert.issuer}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {cert.batch_id ? (
                            <Link
                              to={`/farm/batches?search=${cert.batch_id}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold transition-colors"
                              title="Mở lô hàng này trong trang Lô thu hoạch & QR"
                            >
                              <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-mono">{cert.batch_code}</span>
                              <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0" />
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">
                              Áp dụng chung sản phẩm
                            </span>
                          )}
                          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{cert.product_name}</span>
                          </div>
                          {cert.plot_name && (
                            <div className="text-[11px] text-slate-400">
                              {cert.plot_name}
                              {cert.batch_harvest_date ? ` · Thu ${cert.batch_harvest_date}` : ""}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          {renderValidityBadge(cert)}
                          <div className="text-[11px] text-slate-500 tabular-nums space-y-0.5">
                            <div>Cấp: {cert.issued_date}</div>
                            <div>
                              Hết hạn:{" "}
                              <span className="font-semibold text-slate-700">
                                {cert.expiry_date || "Không giới hạn"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => setPreviewCert(cert)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-semibold transition-colors cursor-pointer max-w-[190px]"
                          title="Xem bản scan chứng nhận"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{cert.file_name || "Xem tệp"}</span>
                        </button>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewCert(cert)}
                            className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Xem chi tiết & bản scan"
                            aria-label="Xem chi tiết chứng nhận"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(cert)}
                            className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Chỉnh sửa / Gắn lại lô hàng"
                            aria-label="Chỉnh sửa chứng nhận"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCert(cert)}
                            className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa hồ sơ chứng nhận"
                            aria-label="Xóa chứng nhận"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100 max-h-[calc(100vh-270px)] overflow-y-auto scrollbar-thin">
              {filteredCertificates.map((cert) => (
                <div key={cert.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 leading-snug break-words">
                        {cert.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 break-words">{cert.issuer}</p>
                    </div>
                    {renderValidityBadge(cert)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {cert.batch_id ? (
                      <Link
                        to={`/farm/batches?search=${cert.batch_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono"
                      >
                        <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>{cert.batch_code}</span>
                      </Link>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold">
                        Theo sản phẩm
                      </span>
                    )}
                    <span className="text-slate-700 font-semibold">{cert.product_name}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                    <span>Cấp: {cert.issued_date}</span>
                    <span>Hết hạn: {cert.expiry_date || "Không giới hạn"}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPreviewCert(cert)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem bản scan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(cert)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 cursor-pointer"
                      aria-label="Chỉnh sửa"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCert(cert)}
                      className="p-2 rounded-xl border border-red-200 text-red-600 cursor-pointer"
                      aria-label="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal: Tải lên / Chỉnh sửa Chứng nhận & Kết quả kiểm định */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingCert ? "Cập Nhật Chứng Nhận" : "Tải Chứng Nhận & Kết Quả Kiểm Định"}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && !submitting && setIsFormOpen(false)}
        >
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/80 to-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                    {editingCert
                      ? "Cập Nhật Hồ Sơ Chứng Nhận"
                      : "Tải Chứng Nhận & Kết Quả Kiểm Định"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    Gắn bản scan PDF/hình ảnh vào lô hàng thu hoạch hoặc sản phẩm
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={submitting}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Đóng hộp thoại"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              id="certificate-upload-form"
              onSubmit={handleSubmitForm}
              className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-5 sm:p-6 space-y-4"
            >
              {/* Phạm vi gắn chứng nhận */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phạm Vi Áp Dụng <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setAttachMode("batch")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      attachMode === "batch"
                        ? "bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-200"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Gắn vào Lô hàng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachMode("product");
                      setFormState((prev) => ({ ...prev, Ma_lo_hang: "" }));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      attachMode === "product"
                        ? "bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-200"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <Sprout className="w-3.5 h-3.5 shrink-0" />
                    <span>Theo Sản phẩm</span>
                  </button>
                </div>
              </div>

              {/* Chọn Lô hàng hoặc Sản phẩm (Custom Dropdown khóa chiều rộng 100%) */}
              {attachMode === "batch" ? (
                <div>
                  <label
                    id="cert-batch-label"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Lô Hàng Thu Hoạch <span className="text-red-500">*</span>
                  </label>
                  <BatchSelectDropdown
                    batches={batches}
                    value={formState.Ma_lo_hang}
                    labelId="cert-batch-label"
                    error={fieldErrors.Ma_lo_hang}
                    onChange={(batch) => {
                      setFormState((prev) => ({
                        ...prev,
                        Ma_lo_hang: String(batch.id),
                        Ma_san_pham: batch.product_id ? String(batch.product_id) : "",
                      }));
                      setFieldErrors((prev) => ({ ...prev, Ma_lo_hang: undefined }));
                    }}
                  />
                  {fieldErrors.Ma_lo_hang && (
                    <p className="text-red-600 text-[11px] mt-1 font-medium">
                      {fieldErrors.Ma_lo_hang}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label
                    id="cert-product-label"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Sản Phẩm Nông Sản <span className="text-red-500">*</span>
                  </label>
                  <ProductSelectDropdown
                    products={products}
                    value={formState.Ma_san_pham}
                    labelId="cert-product-label"
                    error={fieldErrors.Ma_san_pham}
                    onChange={(prodId) => {
                      setFormState((prev) => ({ ...prev, Ma_san_pham: prodId }));
                      setFieldErrors((prev) => ({ ...prev, Ma_san_pham: undefined }));
                    }}
                  />
                  {fieldErrors.Ma_san_pham && (
                    <p className="text-red-600 text-[11px] mt-1 font-medium">
                      {fieldErrors.Ma_san_pham}
                    </p>
                  )}
                </div>
              )}

              {/* Gợi ý mẫu chứng nhận nhanh */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tên Chứng Nhận / Phiếu Kiểm Định <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={formState.Ten_chung_nhan}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, Ten_chung_nhan: e.target.value }))
                  }
                  placeholder="Ví dụ: Chứng nhận VietGAP Trồng trọt hoặc Phiếu kiểm nghiệm mẫu đất/nước"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                {fieldErrors.Ten_chung_nhan && (
                  <p className="text-red-600 text-[11px] mt-1 font-medium">
                    {fieldErrors.Ten_chung_nhan}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CERT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          Ten_chung_nhan: preset.name,
                          To_chuc_cap: preset.issuer,
                        }))
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tổ chức cấp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tổ Chức Cấp / Đơn Vị Kiểm Định <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.To_chuc_cap}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, To_chuc_cap: e.target.value }))
                  }
                  placeholder="Ví dụ: QUACERT, QUATEST 3, Viện Nghiên cứu Rau quả..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                {fieldErrors.To_chuc_cap && (
                  <p className="text-red-600 text-[11px] mt-1 font-medium">
                    {fieldErrors.To_chuc_cap}
                  </p>
                )}
              </div>

              {/* Ngày cấp & Ngày hết hạn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="min-w-0">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between gap-2">
                    <span>
                      Ngày Cấp <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal normal-case">
                      Tối đa: Hôm nay
                    </span>
                  </label>
                  <input
                    type="date"
                    max={getTodayLocal()}
                    value={formState.Ngay_cap}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, Ngay_cap: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  {fieldErrors.Ngay_cap && (
                    <p className="text-red-600 text-[11px] mt-1 font-medium">
                      {fieldErrors.Ngay_cap}
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between gap-2">
                    <span>Ngày Hết Hạn</span>
                    <span className="text-[10px] text-slate-400 font-normal normal-case">
                      Để trống nếu theo đợt
                    </span>
                  </label>
                  <input
                    type="date"
                    min={formState.Ngay_cap || undefined}
                    value={formState.Ngay_het_han}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, Ngay_het_han: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  {fieldErrors.Ngay_het_han && (
                    <p className="text-red-600 text-[11px] mt-1 font-medium">
                      {fieldErrors.Ngay_het_han}
                    </p>
                  )}
                </div>
              </div>

              {/* Gợi ý nhanh thời hạn */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-bold text-slate-500 px-1">Thời hạn:</span>
                {[
                  { label: "+6 tháng", months: 6 },
                  { label: "+1 năm", months: 12 },
                  { label: "+2 năm", months: 24 },
                ].map((opt) => {
                  const target = addMonthsLocal(formState.Ngay_cap || getTodayLocal(), opt.months);
                  const active = formState.Ngay_het_han === target;
                  return (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => setFormState((prev) => ({ ...prev, Ngay_het_han: target }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                        active
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border-slate-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setFormState((prev) => ({ ...prev, Ngay_het_han: "" }))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                    !formState.Ngay_het_han
                      ? "bg-slate-700 text-white border-slate-700"
                      : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  Không giới hạn
                </button>
              </div>

              {/* Khu vực tải lên tệp PDF / Bản scan hình ảnh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bản Scan Chứng Nhận / Kết Quả Kiểm Định{" "}
                  {!editingCert && <span className="text-red-500">*</span>}
                </label>

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleChooseFile(file);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50/70"
                      : fieldErrors.file
                        ? "border-red-300 bg-red-50/30"
                        : "border-slate-300 bg-slate-50/60 hover:border-emerald-500 hover:bg-emerald-50/25"
                  }`}
                >
                  <Upload className="w-6 h-6 text-emerald-600 mb-1.5" />
                  <span className="text-xs font-bold text-emerald-800">
                    {selectedFile
                      ? "Chọn tệp khác để thay thế"
                      : editingCert
                        ? "Tải bản scan mới (để trống nếu giữ nguyên tệp cũ)"
                        : "Bấm chọn hoặc kéo thả tệp vào đây"}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Hỗ trợ PDF, JPG, PNG, WEBP · Dung lượng tối đa 10MB
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleChooseFile(file);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>

                {selectedFile && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {filePreviewUrl ? (
                        <img
                          src={filePreviewUrl}
                          alt="Xem trước bản scan"
                          className="w-12 h-12 rounded-xl object-cover border border-emerald-200 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={resetFileSelection}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                      title="Bỏ chọn tệp"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {!selectedFile && editingCert && (
                  <p className="text-[11px] text-slate-500 mt-1.5 truncate">
                    Tệp hiện tại: <strong className="text-slate-700">{editingCert.file_name}</strong>
                  </p>
                )}

                {fieldErrors.file && (
                  <p className="text-red-600 text-[11px] mt-1 font-medium">{fieldErrors.file}</p>
                )}
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy Bỏ
              </button>

              <button
                type="submit"
                form="certificate-upload-form"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu hồ sơ...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{editingCert ? "Lưu Thay Đổi" : "Lưu & Gắn Chứng Nhận"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xem trước Bản Scan / PDF Chứng nhận */}
      {previewCert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem bản scan chứng nhận"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setPreviewCert(null)}
        >
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 sm:px-6 py-4 bg-[#064e2e] text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Award className="w-5 h-5 text-emerald-300 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                    {previewCert.name}
                  </h3>
                  <p className="text-[11px] text-emerald-200 truncate">
                    {previewCert.issuer}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                className="text-emerald-200 hover:text-white p-1.5 rounded-full cursor-pointer shrink-0"
                aria-label="Đóng cửa sổ xem tệp"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
              {/* Metadata bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Lô hàng gắn
                  </span>
                  <strong className="text-emerald-800 font-mono">
                    {previewCert.batch_code || "Áp dụng chung"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Sản phẩm
                  </span>
                  <strong className="text-slate-800">{previewCert.product_name}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Ngày cấp
                  </span>
                  <strong className="text-slate-800 tabular-nums">{previewCert.issued_date}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Hạn hiệu lực
                  </span>
                  <strong className="text-slate-800 tabular-nums">
                    {previewCert.expiry_date || "Theo đợt kiểm định"}
                  </strong>
                </div>
              </div>

              {/* Document Preview Area */}
              {previewCert.file_available ? (
                previewCert.file_kind === "image" ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-900/5 p-2 flex items-center justify-center">
                    <img
                      src={previewCert.file_url}
                      alt={previewCert.name}
                      className="max-h-[58vh] w-auto object-contain rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100">
                    <iframe
                      title={previewCert.name}
                      src={previewCert.file_url}
                      className="w-full h-[58vh]"
                    />
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center space-y-3">
                  <FileText className="w-10 h-10 text-amber-600 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Hồ sơ mẫu chưa có tệp bản scan thực tế trên máy chủ
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                      Đường dẫn lưu trong CSDL là <code className="font-mono">{previewCert.file_path}</code>. Bạn có thể tải tệp PDF hoặc ảnh chụp bản scan thật lên để thay thế ngay.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const target = previewCert;
                      setPreviewCert(null);
                      openEditModal(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải Bản Scan Thật Thay Thế</span>
                  </button>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              {previewCert.file_available ? (
                <a
                  href={previewCert.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Mở / Tải Bản Scan</span>
                </a>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận xóa chứng nhận */}
      {deletingCert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận xóa chứng nhận"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && !deleteSubmitting && setDeletingCert(null)}
        >
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800">Xóa hồ sơ chứng nhận?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">
                  Bạn có chắc muốn xóa <strong className="text-slate-800">"{deletingCert.name}"</strong>
                  {deletingCert.batch_code ? ` khỏi lô hàng ${deletingCert.batch_code}` : ""}? Thao tác này không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCert(null)}
                disabled={deleteSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteSubmitting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleteSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xóa Chứng Nhận</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
