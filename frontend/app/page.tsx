"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { homePathFor, LoadingMessage, useAuth } from "@/components/auth-provider";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(user ? homePathFor(user.role) : "/login");
  }, [loading, user, router]);

  return <LoadingMessage />;
}
