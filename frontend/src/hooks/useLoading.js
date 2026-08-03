import { useCallback } from "react";
import { showGlobalLoading, hideGlobalLoading } from "../util/loadBus";

export function useLoading() {
  const showLoading = useCallback((label) => showGlobalLoading(label), []);
  const hideLoading = useCallback(() => hideGlobalLoading(), []);
  return { showLoading, hideLoading };
}