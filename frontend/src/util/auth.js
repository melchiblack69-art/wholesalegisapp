// utils/auth.js

import { jwtDecode } from "jwt-decode";

export const isTokenExpired = (token) => {
    if (!token) return true;

    try {
        const decoded = jwtDecode(token);

        return decoded.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

import { useLoading } from "../hooks/useLoading";

const { showLoading, hideLoading } = useLoading();

const doSomething = async () => {
  showLoading("Saving...");
  try {
    // work
  } finally {
    hideLoading();
  }
};