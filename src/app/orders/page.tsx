"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Loader2, RefreshCw, Package } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─────────────────────────────────────────── */
type OrderItem = {
  quantity: number;
  menu_items: { name: string } | null;
};

type Order = {
  id: string;
  order_code: string;
  total_amount: number;
  pickup_time: string;
  status: "pending" | "preparing" | "ready" | "completed";
  created_at: string;
  order_items: OrderItem[];
};

/* ─── Helpers ────────────────────────────────────────── */
function formatPickupTime(t: string): string {
  if (!t || t.length < 5) return "—";
  return t.substring(0, 5);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const STATUS_CONFIG: Record<Order["status"], { label: string; colors: string; dot: string }> = {
  pending:   { label: "Pending",   colors: "bg-amber-50 text-amber-800 border-amber-200",  dot: "bg-amber-400 animate-pulse" },
  preparing: { label: "Preparing", colors: "bg-blue-50 text-blue-800 border-blue-200",    dot: "bg-blue-500 animate-pulse" },
  ready:     { label: "Ready! 🎉", colors: "bg-green-50 text-green-800 border-green-200", dot: "bg-green-500" },
  completed: { label: "Completed", colors: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

function StatusBadge({ status }: { status: Order["status"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.colors}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ─── Page ───────────────────────────────────────────── */
export default function MyOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const fetchOrders = useCallback(async (userId: string) => {
    setFetchError("");
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_code, total_amount, pickup_time, status, created_at,
          order_items (
            quantity,
            menu_items ( name )
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as unknown as Order[]) ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load orders.";
      console.error("[Orders] fetchOrders:", err);
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) router.replace("/login");
        return;
      }

      if (isMounted) setUser(user);
      await fetchOrders(user.id);

      if (!isMounted) return;

      // Realtime: keep active order statuses up-to-date
      channel = supabase
        .channel(`user-orders-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updated = payload.new as Partial<Order> & { id: string; status: Order["status"] };
            setOrders((prev) =>
              prev.map((o) => o.id === updated.id ? { ...o, status: updated.status } : o)
            );
          }
        )
        .subscribe();
    };

    init();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [router, fetchOrders]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== "completed");
  const pastOrders   = orders.filter((o) => o.status === "completed");

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Back to menu"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-slate-800 flex-1">My Orders</h1>
          <button
            onClick={() => user && fetchOrders(user.id)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-8">
        {/* Error state */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {fetchError}
          </div>
        )}

        {/* Active Orders */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-bold text-slate-800">Active Orders</h2>
            {activeOrders.length > 0 && (
              <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {activeOrders.length}
              </span>
            )}
          </div>

          {activeOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
              <Package size={28} className="mx-auto mb-2 text-slate-300" />
              No active orders.
            </div>
          ) : (
            <motion.div className="space-y-3" initial="initial" animate="animate">
              <AnimatePresence>
                {activeOrders.map((order) => (
                  <motion.div key={order.id} variants={cardVariants} layout>
                    <Card className="border border-slate-100 shadow-sm overflow-hidden">
                      {/* Status-colored top stripe */}
                      <div className={`h-1 w-full ${
                        order.status === "pending"   ? "bg-amber-400" :
                        order.status === "preparing" ? "bg-blue-500"  :
                        order.status === "ready"     ? "bg-green-500" : "bg-slate-300"
                      }`} />
                      <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <CardDescription className="text-xs font-medium text-slate-400">Ticket Code</CardDescription>
                            <CardTitle className="text-3xl font-black tracking-widest text-slate-800 leading-tight">
                              {order.order_code}
                            </CardTitle>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </CardHeader>

                      <CardContent className="px-4 pb-4">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 mb-3 bg-slate-50 px-3 py-2 rounded-xl">
                          <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                          Pickup at {formatPickupTime(order.pickup_time)}
                        </div>
                        <ul className="space-y-1 text-sm text-slate-600 mb-3 border-b border-slate-100 pb-3">
                          {order.order_items.map((item, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="font-bold text-slate-800 shrink-0">{item.quantity}×</span>
                              <span>{item.menu_items?.name ?? "Unknown item"}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500 font-medium">Total</span>
                          <span className="font-black text-base text-slate-800">₹{order.total_amount}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* Past Orders */}
        <section>
          <h2 className="text-base font-bold text-slate-800 mb-3">Past Orders</h2>
          {pastOrders.length === 0 ? (
            <p className="text-slate-400 text-sm">No past orders yet.</p>
          ) : (
            <div className="space-y-2">
              {pastOrders.map((order) => (
                <Card key={order.id} className="border border-slate-100 shadow-none bg-white">
                  <CardContent className="p-4 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm">#{order.order_code}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.created_at)}</p>
                      <ul className="mt-1 space-y-0.5">
                        {order.order_items.slice(0, 2).map((item, idx) => (
                          <li key={idx} className="text-xs text-slate-500 truncate">
                            {item.quantity}× {item.menu_items?.name ?? "Item"}
                          </li>
                        ))}
                        {order.order_items.length > 2 && (
                          <li className="text-xs text-slate-400">+{order.order_items.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-slate-800">₹{order.total_amount}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
