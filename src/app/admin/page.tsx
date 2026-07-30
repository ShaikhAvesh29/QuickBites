"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Check, Loader2, Utensils, IndianRupee, Lock, Eye, EyeOff, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */
type OrderItem = {
  quantity: number;
  menu_items: { name: string } | null;
};

type Order = {
  id: string;
  order_code: string;
  profiles: { full_name: string } | null;
  total_amount: number;
  pickup_time: string;
  status: "pending" | "preparing" | "ready" | "completed";
  order_items: OrderItem[];
};

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
};

/* ─── Constants ──────────────────────────────────────── */
const STATUS_FLOW: Record<string, "preparing" | "ready" | "completed"> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Start Preparing",
  preparing: "Mark as Ready",
  ready: "Handed Over ✓",
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-800 border-amber-200",
  preparing: "bg-blue-100 text-blue-800 border-blue-200",
  ready:     "bg-green-100 text-green-800 border-green-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_BAR_COLORS: Record<string, string> = {
  pending:   "bg-amber-400",
  preparing: "bg-blue-500",
  ready:     "bg-green-500",
  completed: "bg-slate-400",
};

const STATUS_BTN_COLORS: Record<string, string> = {
  pending:   "bg-blue-600 hover:bg-blue-700 text-white",
  preparing: "bg-green-600 hover:bg-green-700 text-white",
  ready:     "bg-slate-900 hover:bg-slate-800 text-white",
};

/* ─── Helpers ────────────────────────────────────────── */
function formatPickupTime(t: string): string {
  if (!t || t.length < 5) return t ?? "—";
  return t.substring(0, 5);
}

function formatPrice(n: number): string {
  return Number.isFinite(n) ? `₹${n}` : "—";
}

/* ─── Gate Screen ────────────────────────────────────── */
const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ADMIN_PASS) {
      // Persist unlock in sessionStorage so a page refresh keeps access
      sessionStorage.setItem("qb_admin_unlocked", "1");
      onUnlock();
    } else {
      setError("Incorrect password. Try again.");
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div
        className={`w-full max-w-sm bg-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-transform ${shaking ? "animate-bounce" : ""}`}
        style={shaking ? { animation: "shake 0.4s ease" } : {}}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Lock className="text-white w-8 h-8" strokeWidth={1.8} />
          </div>
          <h1 className="text-xl font-black text-white">Admin Access</h1>
          <p className="text-white/70 text-sm mt-1">QuickBite Kitchen Panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="admin-pass" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Admin Password
            </Label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <Input
                id="admin-pass"
                type={show ? "text" : "password"}
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(""); }}
                placeholder="Enter password"
                autoFocus
                className="pl-9 pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20 h-11"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold h-11 rounded-xl"
          >
            Unlock Dashboard
          </Button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-10px); }
          40%      { transform: translateX(10px); }
          60%      { transform: translateX(-8px); }
          80%      { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────── */
export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // New item form state
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  // Per-row price editing state (controlled)
  const [editPrices, setEditPrices] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState("");

  // Check session on mount (persist unlock across refresh)
  useEffect(() => {
    if (sessionStorage.getItem("qb_admin_unlocked") === "1") {
      setUnlocked(true);
    }
  }, []);

  /* ── Data fetching ── */
  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_code, total_amount, pickup_time, status,
          profiles ( full_name ),
          order_items (
            quantity,
            menu_items ( name )
          )
        `)
        .neq("status", "completed")
        .order("pickup_time", { ascending: true });

      if (error) throw error;
      setOrders((data as Order[]) ?? []);
      setIsOnline(true);
    } catch (err: unknown) {
      console.error("[Admin] fetchOrders:", err);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, price, category, image_url, is_available")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      const items = (data as MenuItem[]) ?? [];
      setMenuItems(items);
      // Seed controlled price inputs
      const priceMap: Record<string, string> = {};
      items.forEach((i) => { priceMap[i.id] = String(i.price); });
      setEditPrices(priceMap);
    } catch (err: unknown) {
      console.error("[Admin] fetchMenu:", err);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!unlocked) return;

    fetchOrders();
    fetchMenu();

    // Realtime: listen to ALL order events and refresh
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => { fetchOrders(); }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setIsOnline(true);
        if (status === "CLOSED" || status === "CHANNEL_ERROR") setIsOnline(false);
      });

    return () => { supabase.removeChannel(channel); };
  }, [unlocked, fetchOrders, fetchMenu]);

  /* ── Order status update ── */
  const updateOrderStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = STATUS_FLOW[currentStatus];
    if (!nextStatus) return;

    setOrderError("");
    // Optimistic update
    setOrders((prev) =>
      nextStatus === "completed"
        ? prev.filter((o) => o.id !== orderId)
        : prev.map((o) => o.id === orderId ? { ...o, status: nextStatus } : o)
    );

    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId);

    if (error) {
      console.error("[Admin] updateOrderStatus:", error);
      setOrderError(`Failed to update order #${orderId.slice(-4)}: ${error.message}`);
      // Rollback on failure
      fetchOrders();
    }
  };

  /* ── Add menu item ── */
  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");

    const priceNum = parseFloat(newPrice);
    if (!newName.trim() || !newCategory.trim()) {
      setAddError("Item name and category are required.");
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setAddError("Please enter a valid price (≥ 0).");
      return;
    }

    setIsAddingItem(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          name: newName.trim(),
          price: priceNum,
          category: newCategory.trim(),
          image_url: newImageUrl.trim() || null,
          is_available: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic insert — no full refetch needed
      const newItem = data as MenuItem;
      setMenuItems((prev) => [...prev, newItem].sort((a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      ));
      setEditPrices((prev) => ({ ...prev, [newItem.id]: String(newItem.price) }));

      setNewName("");
      setNewPrice("");
      setNewCategory("");
      setNewImageUrl("");
      setAddSuccess(`"${newItem.name}" added successfully!`);
      setTimeout(() => setAddSuccess(""), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add item.";
      setAddError(msg);
    } finally {
      setIsAddingItem(false);
    }
  };

  /* ── Toggle availability ── */
  const toggleAvailability = async (id: string, current: boolean) => {
    // Optimistic
    setMenuItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, is_available: !current } : item)
    );

    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !current })
      .eq("id", id);

    if (error) {
      console.error("[Admin] toggleAvailability:", error);
      // Rollback
      setMenuItems((prev) =>
        prev.map((item) => item.id === id ? { ...item, is_available: current } : item)
      );
    }
  };

  /* ── Update price (controlled input, save on blur or Enter) ── */
  const handlePriceBlur = async (item: MenuItem) => {
    const raw = editPrices[item.id] ?? "";
    const val = parseFloat(raw);

    if (isNaN(val) || val < 0) {
      // Reset to original price
      setEditPrices((prev) => ({ ...prev, [item.id]: String(item.price) }));
      return;
    }
    if (val === item.price) return; // No change

    setUpdatingId(item.id);
    const { error } = await supabase
      .from("menu_items")
      .update({ price: val })
      .eq("id", item.id);

    if (error) {
      console.error("[Admin] updatePrice:", error);
      setEditPrices((prev) => ({ ...prev, [item.id]: String(item.price) }));
    } else {
      setMenuItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, price: val } : i)
      );
      setEditPrices((prev) => ({ ...prev, [item.id]: String(val) }));
    }
    setUpdatingId(null);
  };

  /* ── Delete item ── */
  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from the menu? This cannot be undone.`)) return;

    setMenuItems((prev) => prev.filter((i) => i.id !== id));
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      console.error("[Admin] deleteItem:", error);
      fetchMenu(); // Rollback via refetch
    }
  };

  /* ── Render: Gate ── */
  if (!unlocked) {
    return <AdminGate onUnlock={() => setUnlocked(true)} />;
  }

  /* ── Render: Dashboard ── */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Utensils className="text-orange-500" size={20} />
            <h1 className="text-xl font-black tracking-tight">
              QuickBite <span className="text-slate-400 font-normal text-base">| Kitchen Panel</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Online indicator */}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${isOnline ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? "Live" : "Offline"}
            </div>

            <button
              onClick={fetchOrders}
              title="Refresh orders"
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            >
              <RefreshCw size={16} />
            </button>

            <button
              onClick={() => { sessionStorage.removeItem("qb_admin_unlocked"); setUnlocked(false); }}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <Lock size={13} />
              Lock
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {orderError && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <AlertCircle size={15} className="shrink-0" />
            {orderError}
            <button onClick={() => setOrderError("")} className="ml-auto text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
          </div>
        )}

        <Tabs defaultValue="orders" className="space-y-5">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm w-fit">
            <TabsTrigger
              value="orders"
              className="rounded-lg px-6 py-2 text-sm font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
            >
              🍳 Active Orders
            </TabsTrigger>
            <TabsTrigger
              value="menu"
              className="rounded-lg px-6 py-2 text-sm font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
            >
              📋 Menu Management
            </TabsTrigger>
          </TabsList>

          {/* ─── ORDERS KANBAN ─── */}
          <TabsContent value="orders">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(["pending", "preparing", "ready"] as const).map((col) => {
                  const colOrders = orders.filter((o) => o.status === col);
                  return (
                    <div key={col} className="flex flex-col rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                      {/* Column Header */}
                      <div className={`px-4 py-3 flex items-center justify-between ${
                        col === "pending"   ? "bg-amber-50 border-b border-amber-100" :
                        col === "preparing" ? "bg-blue-50 border-b border-blue-100" :
                                             "bg-green-50 border-b border-green-100"
                      }`}>
                        <h3 className="font-bold text-slate-700 capitalize text-sm flex items-center gap-2">
                          {col === "pending" && "⏳"}
                          {col === "preparing" && "👨‍🍳"}
                          {col === "ready" && "✅"}
                          {col}
                        </h3>
                        <Badge variant="secondary" className="font-bold">{colOrders.length}</Badge>
                      </div>

                      {/* Cards */}
                      <div className="flex-1 bg-slate-100/60 p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
                        {colOrders.length === 0 ? (
                          <div className="text-center text-slate-400 text-sm py-10">
                            No orders {col}
                          </div>
                        ) : (
                          colOrders.map((order) => (
                            <Card key={order.id} className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow bg-white">
                              {/* Status stripe */}
                              <div className={`h-1 w-full ${STATUS_BAR_COLORS[order.status]}`} />
                              <CardHeader className="pb-1 pt-3 px-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order</span>
                                    <CardTitle className="text-2xl font-black text-slate-800 leading-tight">
                                      #{order.order_code}
                                    </CardTitle>
                                    <CardDescription className="font-semibold text-slate-700 mt-0.5">
                                      {order.profiles?.full_name ?? "Guest"}
                                    </CardDescription>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="flex items-center gap-1 font-mono text-sm bg-white border-slate-200">
                                      <Clock className="w-3 h-3" />
                                      {formatPickupTime(order.pickup_time)}
                                    </Badge>
                                    <span className="text-xs font-bold text-slate-500">{formatPrice(order.total_amount)}</span>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="px-4 pb-4">
                                <ul className="space-y-1 mb-3 bg-slate-50 rounded-lg p-2">
                                  {order.order_items.map((item, idx) => (
                                    <li key={idx} className="text-sm flex items-start gap-2 text-slate-600">
                                      <span className="font-bold text-slate-900 shrink-0">{item.quantity}×</span>
                                      <span>{item.menu_items?.name ?? "Unknown item"}</span>
                                    </li>
                                  ))}
                                </ul>

                                <Button
                                  className={`w-full font-bold rounded-xl ${STATUS_BTN_COLORS[order.status]}`}
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, order.status)}
                                >
                                  {STATUS_LABEL[order.status]}
                                </Button>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── MENU MANAGEMENT ─── */}
          <TabsContent value="menu">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add Item Form */}
              <Card className="lg:col-span-1 shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Add Menu Item</CardTitle>
                  <CardDescription>New items go live immediately.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddMenuItem} className="space-y-3" noValidate>
                    {addError && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                        <AlertCircle size={12} className="shrink-0 mt-0.5" />
                        {addError}
                      </div>
                    )}
                    {addSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg">
                        ✓ {addSuccess}
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor="item-name" className="text-xs font-semibold">Item Name *</Label>
                      <Input
                        id="item-name"
                        value={newName}
                        onChange={(e) => { setNewName(e.target.value); setAddError(""); }}
                        placeholder="e.g. Masala Dosa"
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="item-price" className="text-xs font-semibold">Price (₹) *</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <Input
                          id="item-price"
                          type="number"
                          min="0"
                          step="0.5"
                          value={newPrice}
                          onChange={(e) => { setNewPrice(e.target.value); setAddError(""); }}
                          className="pl-8 h-9 text-sm"
                          placeholder="60"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="item-category" className="text-xs font-semibold">Category *</Label>
                      <Input
                        id="item-category"
                        value={newCategory}
                        onChange={(e) => { setNewCategory(e.target.value); setAddError(""); }}
                        placeholder="e.g. South Indian"
                        className="h-9 text-sm"
                        list="category-suggestions"
                      />
                      <datalist id="category-suggestions">
                        {["Snacks","Meals","Drinks","Breakfast","Desserts","Rice","Rolls","Sandwiches","Biryani","Burgers","South Indian","North Indian","Chinese"].map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="item-image" className="text-xs font-semibold">Image URL <span className="text-slate-400 font-normal">(optional)</span></Label>
                      <Input
                        id="item-image"
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://…"
                        className="h-9 text-sm"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 rounded-xl"
                      disabled={isAddingItem}
                    >
                      {isAddingItem ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Adding…</span>
                      ) : (
                        "+ Add to Menu"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Menu Table */}
              <Card className="lg:col-span-2 shadow-sm border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Menu Catalog</CardTitle>
                      <CardDescription>Edit prices or toggle item availability.</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-bold">{menuItems.length} items</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {menuLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : menuItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No menu items yet. Add one using the form.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="font-semibold pl-5">Item</TableHead>
                            <TableHead className="font-semibold">Category</TableHead>
                            <TableHead className="font-semibold w-32">Price (₹)</TableHead>
                            <TableHead className="font-semibold text-center w-28">Status</TableHead>
                            <TableHead className="font-semibold text-right pr-5 w-20">Delete</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {menuItems.map((item) => (
                            <TableRow
                              key={item.id}
                              className={`transition-colors ${!item.is_available ? "opacity-50 bg-slate-50/60" : "hover:bg-slate-50/50"}`}
                            >
                              <TableCell className="font-semibold text-sm pl-5 max-w-[160px]">
                                <span className="truncate block">{item.name}</span>
                              </TableCell>
                              <TableCell className="text-slate-500 text-sm">{item.category}</TableCell>
                              <TableCell>
                                <div className="relative w-28">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={editPrices[item.id] ?? String(item.price)}
                                    onChange={(e) =>
                                      setEditPrices((prev) => ({ ...prev, [item.id]: e.target.value }))
                                    }
                                    onBlur={() => handlePriceBlur(item)}
                                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                    className="h-8 text-sm w-full pr-6"
                                    disabled={updatingId === item.id}
                                  />
                                  {updatingId === item.id && (
                                    <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <button
                                  onClick={() => toggleAvailability(item.id, item.is_available)}
                                  className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                                    item.is_available
                                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                      : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                  }`}
                                >
                                  {item.is_available ? "● Available" : "○ Hidden"}
                                </button>
                              </TableCell>
                              <TableCell className="text-right pr-5">
                                <button
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  className="text-xs text-slate-400 hover:text-red-600 transition-colors font-medium"
                                >
                                  Delete
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
