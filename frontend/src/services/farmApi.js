/* API calls for farm seasons, logs, batches, and certificates. */
import axiosClient from "./axiosClient";

let farmInfoCache = null;
let farmProductsCache = null;
let farmSeasonsCache = null;

export const farmApi = {
  // Lấy dữ liệu mùa vụ tức thời từ cache bộ nhớ/localStorage/sessionStorage
  getCachedSeasons: () => {
    const raw = farmSeasonsCache?.data?.data ?? farmSeasonsCache?.data ?? farmSeasonsCache;
    if (Array.isArray(raw)) return raw;
    try {
      const saved = localStorage.getItem("cached_farm_seasons") || sessionStorage.getItem("cached_farm_seasons");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  // Quản lý mùa vụ (Seasons)
  getSeasons: async (params, force = false) => {
    if (!force && !params && farmSeasonsCache) {
      return farmSeasonsCache;
    }
    const res = await axiosClient.get("/farm/seasons", { params });
    if (!params) {
      farmSeasonsCache = res;
      try {
        const dataToSave = res?.data?.data ?? res?.data ?? res;
        if (dataToSave) {
          localStorage.setItem("cached_farm_seasons", JSON.stringify(dataToSave));
          sessionStorage.setItem("cached_farm_seasons", JSON.stringify(dataToSave));
        }
      } catch {}
    }
    return res;
  },

  createSeason: async (data) => {
    farmSeasonsCache = null;
    try {
      localStorage.removeItem("cached_farm_seasons");
      sessionStorage.removeItem("cached_farm_seasons");
    } catch {}
    return axiosClient.post("/farm/seasons", data);
  },
  getSeasonDetail: (id) => axiosClient.get(`/farm/seasons/${id}`),
  updateSeason: async (id, data) => {
    farmSeasonsCache = null;
    try {
      localStorage.removeItem("cached_farm_seasons");
      sessionStorage.removeItem("cached_farm_seasons");
    } catch {}
    return axiosClient.put(`/farm/seasons/${id}`, data);
  },
  deleteSeason: async (id) => {
    farmSeasonsCache = null;
    try {
      localStorage.removeItem("cached_farm_seasons");
      sessionStorage.removeItem("cached_farm_seasons");
    } catch {}
    return axiosClient.delete(`/farm/seasons/${id}`);
  },

  // Quản lý lô canh tác trong mùa vụ (Plots)
  createPlot: async (seasonId, data) => {
    farmSeasonsCache = null;
    try {
      localStorage.removeItem("cached_farm_seasons");
      sessionStorage.removeItem("cached_farm_seasons");
    } catch {}
    return axiosClient.post(`/farm/seasons/${seasonId}/plots`, data);
  },
  updatePlot: async (seasonId, plotId, data) => {
    farmSeasonsCache = null;
    try {
      localStorage.removeItem("cached_farm_seasons");
      sessionStorage.removeItem("cached_farm_seasons");
    } catch {}
    return axiosClient.put(`/farm/seasons/${seasonId}/plots/${plotId}`, data);
  },
  deletePlot: async (seasonId, plotId) => {
    farmSeasonsCache = null;
    try {
      localStorage.removeItem("cached_farm_seasons");
      sessionStorage.removeItem("cached_farm_seasons");
    } catch {}
    return axiosClient.delete(`/farm/seasons/${seasonId}/plots/${plotId}`);
  },

  // Danh mục nông sản giống trồng (Cache client-side)
  getFarmProducts: async (force = false) => {
    if (!force && farmProductsCache) {
      return farmProductsCache;
    }
    const res = await axiosClient.get("/farm/products");
    farmProductsCache = res;
    return res;
  },

  // Thông tin & địa chỉ cơ sở nông trại (Cache client-side)
  getFarmInfo: async (force = false) => {
    if (!force && farmInfoCache) {
      return farmInfoCache;
    }
    const res = await axiosClient.get("/farm/info");
    farmInfoCache = res;
    return res;
  },
  updateFarmInfo: async (data) => {
    const res = await axiosClient.put("/farm/info", data);
    farmInfoCache = res;
    return res;
  },

  // Quản lý nhật ký canh tác (Farming Logs)
  getFarmingLogs: (params) => axiosClient.get("/farm/farming-logs", { params }),
  createFarmingLog: async (formData) => {
    farmSeasonsCache = null;
    try {
      localStorage.removeItem("cached_farm_seasons");
      sessionStorage.removeItem("cached_farm_seasons");
    } catch {}
    return axiosClient.post("/farm/farming-logs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteFarmingLog: async (id) => {
    farmSeasonsCache = null;
    try {
      localStorage.removeItem("cached_farm_seasons");
      sessionStorage.removeItem("cached_farm_seasons");
    } catch {}
    return axiosClient.delete(`/farm/farming-logs/${id}`);
  },

  // Các API cho lô thu hoạch & chứng nhận
  getBatches: (params) => axiosClient.get("/farm/batches", { params }),
  getBatchDetail: (id) => axiosClient.get(`/farm/batches/${id}`),
  createBatch: async (data) => {
    farmSeasonsCache = null;
    try {
      localStorage.removeItem("cached_farm_seasons");
      sessionStorage.removeItem("cached_farm_seasons");
    } catch {}
    return axiosClient.post("/farm/batches", data);
  },
  updateBatch: (id, data) => axiosClient.put(`/farm/batches/${id}`, data),
  recordBatchWastage: (id, data) => axiosClient.post(`/farm/batches/${id}/wastage`, data),
  getEligiblePlots: () => axiosClient.get("/farm/batches/eligible-plots"),
  getDisposals: () => axiosClient.get("/farm/batches/disposals"),
  generateBatchQr: (id, config) => axiosClient.post(`/farm/batches/${id}/qr`, null, config),
  getBatchQrPrintTemplate: (id, config) =>
    axiosClient.get(`/farm/batches/${id}/qr-print`, config),
  getCertificates: (params) => axiosClient.get("/farm/certificates", { params }),
  uploadCertificate: (formData) =>
    axiosClient.post("/farm/certificates", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateCertificate: (id, formData) => {
    if (formData instanceof FormData) {
      formData.append("_method", "PUT");
      return axiosClient.post(`/farm/certificates/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return axiosClient.put(`/farm/certificates/${id}`, formData);
  },
  deleteCertificate: (id) => axiosClient.delete(`/farm/certificates/${id}`),
};
