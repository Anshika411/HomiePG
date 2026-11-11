"use client";

import React from "react";
import AdminShell from "../../components/AdminShell";
import OwnersPage from "../../components/OwnersPage";
import { useRouter } from "next/navigation";

export default function OwnersRoute() {
  const router = useRouter();

  return (
    <AdminShell>
      <OwnersPage onGoBack={() => router.push("/")} />
    </AdminShell>
  );
}
