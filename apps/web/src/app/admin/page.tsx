"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("identifyToken");
    router.replace(token ? "/admin/painel" : "/admin/login");
  }, [router]);

  return null;
}
