"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.push("/home");
    } else {
      router.push("/welcome");
    }
  }, [router]);
  
  return null;
}
