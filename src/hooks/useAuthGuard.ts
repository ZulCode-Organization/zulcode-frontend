"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRequireAuth() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) router.replace("/welcome");
  }, [router]);
}

export function useRedirectIfAuth() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) router.replace("/home");
  }, [router]);
}