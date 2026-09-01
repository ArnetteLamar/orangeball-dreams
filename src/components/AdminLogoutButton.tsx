"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    router.push("/pt/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn btn-outline-danger btn-sm"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}
