"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// The username in the nav, opening a dropdown of account links + logout.
export default function AccountMenu({ label, isAdmin }: { label: string; isAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="account-menu" ref={ref}>
      <button
        className="account-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label} <span className="caret">▾</span>
      </button>
      {open && (
        <div className="account-dropdown" role="menu">
          {isAdmin && (
            <Link role="menuitem" href="/admin" onClick={() => setOpen(false)}>
              Admin dashboard
            </Link>
          )}
          <Link role="menuitem" href="/deals" onClick={() => setOpen(false)}>
            My deals
          </Link>
          <Link role="menuitem" href="/profile" onClick={() => setOpen(false)}>
            My profile
          </Link>
          <button role="menuitem" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
