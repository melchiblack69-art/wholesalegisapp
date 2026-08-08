import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

const normalizeCompanies = (rows) => (Array.isArray(rows) ? rows.map((c) => ({ ...c, name: c.name || c.company_name })) : []);

export const queryKeys = {
  categories: ["categories"],
  companies: ["companies"],
  mapCompanies: ["map-companies"],
  stats: ["stats"],
  company: (id) => ["company", id],
  products: (id) => ["company-products", id],
  images: (id) => ["company-images", id],
};

export const publicId = (entity) => entity?.public_id || entity?.id;
let queryLogNumber = 0;

function queryLogMeta() {
  queryLogNumber += 1;
  return `#${queryLogNumber} ${new Date().toISOString()}`;
}

// Temporary diagnostics: remove this wrapper when request tracing is no longer needed.
export function loggedQuery(queryId, queryKey, request) {
  return async () => {
    const label = JSON.stringify(queryKey);
    console.log(`[${queryLogMeta()}] [TANSTACK QUERY MISS] - Query ID: ${queryId}, Query Key: ${label} - [DATABASE].`);
    try {
      return await request();
    } catch (error) { throw error; }
  };
}

export function useLoggedQuery(queryId, options) {
  const queryClient = useQueryClient();
  const loggedKey = useRef(null);
  const queryKeyLabel = JSON.stringify(options.queryKey);
  const hadCachedData = queryClient.getQueryData(options.queryKey) !== undefined;
  const result = useQuery(options);

  useEffect(() => {
    if (hadCachedData && result.data !== undefined && !result.isFetching && loggedKey.current !== queryKeyLabel) {
      console.log(`[${queryLogMeta()}] [TANSTACK QUERY HIT] - Query ID: ${queryId}, Query Key: ${queryKeyLabel} - [TANSTACK QUERY].`);
      loggedKey.current = queryKeyLabel;
    }
  }, [hadCachedData, queryId, queryKeyLabel, result.data, result.isFetching]);

  return result;
}

export function useCategories() {
  return useLoggedQuery("categories-list", { queryKey: queryKeys.categories, queryFn: loggedQuery("categories-list", queryKeys.categories, () => api.get("/api/user/categories")), staleTime: 10 * 60 * 1000, select: (rows) => Array.isArray(rows) ? rows : [] });
}
export function useCompanies() {
  return useLoggedQuery("companies-list", { queryKey: queryKeys.companies, queryFn: loggedQuery("companies-list", queryKeys.companies, () => api.get("/api/user/companies")), staleTime: 2 * 60 * 1000, select: normalizeCompanies });
}
export function useMapCompanies() {
  return useLoggedQuery("map-companies", { queryKey: queryKeys.mapCompanies, queryFn: loggedQuery("map-companies", queryKeys.mapCompanies, () => api.get("/api/user/map")), staleTime: 2 * 60 * 1000, select: (rows) => Array.isArray(rows) ? rows : [] });
}
export function useAccraLocationSuggestions(query) {
  const normalizedQuery = query.trim();
  return useQuery({
    queryKey: ["accra-location-suggestions", normalizedQuery.toLowerCase()],
    queryFn: async () => {
      const params = new URLSearchParams({ format: "jsonv2", addressdetails: "1", limit: "5", countrycodes: "gh", bounded: "1", viewbox: "-0.55,5.85,0.35,5.45", q: `${normalizedQuery}, Accra, Ghana` });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Location search failed");
      const rows = await response.json();
      return Array.isArray(rows) ? rows : [];
    },
    enabled: normalizedQuery.length >= 2,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
export function useStats() {
  return useLoggedQuery("stats", { queryKey: queryKeys.stats, queryFn: loggedQuery("stats", queryKeys.stats, () => api.get("/api/user/stats")), staleTime: 10 * 60 * 1000 });
}
export function useCompany(id) {
  return useLoggedQuery("company-details", { queryKey: queryKeys.company(id), queryFn: loggedQuery("company-details", queryKeys.company(id), () => api.get(`/api/user/companies/${id}`)), enabled: Boolean(id), staleTime: 5 * 60 * 1000 });
}
export function useCompanyProducts(id) {
  return useLoggedQuery("company-products", { queryKey: queryKeys.products(id), queryFn: loggedQuery("company-products", queryKeys.products(id), () => api.get(`/api/user/company-product/${id}`)), enabled: Boolean(id), staleTime: 10 * 60 * 1000, select: (rows) => Array.isArray(rows) ? rows : [] });
}
export function useCompanyImages(id) {
  return useLoggedQuery("company-images", { queryKey: queryKeys.images(id), queryFn: loggedQuery("company-images", queryKeys.images(id), () => api.get(`/api/user/company/${id}/images`)), enabled: Boolean(id), staleTime: 15 * 60 * 1000, select: (data) => Array.isArray(data) ? data : (Array.isArray(data?.images) ? data.images : []) });
}
