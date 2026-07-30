"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Plus,
  Minus,
  Clock,
  CheckCircle2,
  User as UserIcon,
  ListOrdered,
  Sparkles,
  ChevronRight,
  Star,
  Zap,
  Search,
  Home,
  UtensilsCrossed,
  Receipt,
  X,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─────────────────────────────────────────── */
type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
};
type CartItem = MenuItem & { quantity: number };

/* ─── Animation Variants ─────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: "easeIn" } },
};

const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemFadeUp = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const cartBarVariants = {
  hidden: { y: 120, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 340, damping: 28 } },
};

const ticketVariants = {
  initial: { opacity: 0, scale: 0.7, rotate: -3 },
  animate: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 260, damping: 22, delay: 0.1 } },
};

/* ─── Skeleton Card ──────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 flex gap-3 shadow-sm">
      <div className="skeleton w-20 h-20 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-8 w-20 rounded-xl mt-3" />
      </div>
    </div>
  );
}

/* ─── Category Emoji Map ─────────────────────────────── */
const categoryEmoji: Record<string, string> = {
  "Snacks": "🍟", "Meals": "🍱", "Drinks": "🥤", "Breakfast": "🥞",
  "Desserts": "🍰", "Rice": "🍚", "Rolls": "🌯", "Sandwiches": "🥪",
  "Biryani": "🍛", "Burgers": "🍔", "Pizza": "🍕", "Chinese": "🥡",
  "South Indian": "🫓", "North Indian": "🫕",
};
function getCategoryEmoji(cat: string) {
  return categoryEmoji[cat] ?? "🍽️";
}

const placeholderGradients = [
  "from-orange-100 to-amber-100", "from-red-100 to-rose-100",
  "from-yellow-100 to-orange-100", "from-pink-100 to-red-100",
  "from-amber-100 to-yellow-100",
];

/* ─── Add Button ─────────────────────────────────────── */
function AddButton({ onAdd, qty, onRemove }: { onAdd: () => void; qty: number; onRemove: () => void }) {
  const [bouncing, setBouncing] = useState(false);

  const handleAdd = () => {
    setBouncing(true);
    onAdd();
    setTimeout(() => setBouncing(false), 300);
  };

  if (qty > 0) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center bg-orange-50 border border-orange-200 rounded-xl overflow-hidden"
      >
        <button onClick={onRemove} className="w-9 h-9 flex items-center justify-center text-orange-600 hover:bg-orange-100 active:bg-orange-200 transition-colors">
          <Minus size={14} strokeWidth={2.5} />
        </button>
        <motion.span key={qty} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="w-8 text-center text-sm font-bold text-slate-800">
          {qty}
        </motion.span>
        <button onClick={handleAdd} className="w-9 h-9 flex items-center justify-center text-orange-600 hover:bg-orange-100 active:bg-orange-200 transition-colors">
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={handleAdd}
      animate={bouncing ? { scale: [1, 1.22, 0.92, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileTap={{ scale: 0.92 }}
      className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 active:shadow-sm transition-shadow"
    >
      <Plus size={14} strokeWidth={2.5} />
      Add
    </motion.button>
  );
}

/* ─── Menu Item Card ─────────────────────────────────── */
function MenuItemCard({ item, qty, onAdd, onRemove, index }: {
  item: MenuItem; qty: number; onAdd: () => void; onRemove: () => void; index: number;
}) {
  const gradient = placeholderGradients[index % placeholderGradients.length];
  const rating = 4 + (item.name.charCodeAt(0) % 2);

  return (
    <motion.div variants={itemFadeUp} layout className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 overflow-hidden group">
      <div className="flex p-3 gap-3">
        <div className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <span className="text-3xl">{getCategoryEmoji(item.category)}</span>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate pr-1">{item.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-xs text-slate-400">4.{rating}</span>
            </div>
            <p className="text-orange-600 font-bold text-base mt-1">₹{item.price}</p>
          </div>
          <div className="flex justify-end mt-1">
            <AddButton onAdd={onAdd} qty={qty} onRemove={onRemove} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Digital Ticket Screen ──────────────────────────── */
function TicketScreen({ ticket, onBack, onOrders }: {
  ticket: { code: string; status: string; name: string }; onBack: () => void; onOrders: () => void;
}) {
  const statusColors: Record<string, string> = {
    pending: "from-blue-400 to-blue-600", preparing: "from-amber-400 to-orange-500",
    ready: "from-green-400 to-emerald-500", completed: "from-slate-400 to-slate-600",
  };
  const statusLabels: Record<string, string> = {
    pending: "Order Received 📋", preparing: "Being Prepared 👨‍🍳",
    ready: "Ready to Pick Up! 🎉", completed: "Completed ✅",
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-screen qb-gradient-soft flex flex-col items-center justify-center p-4 pb-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-orange-100/60 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-red-100/60 blur-3xl" />
      </div>
      <motion.div variants={ticketVariants} initial="initial" animate="animate" className="w-full max-w-sm relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl shadow-orange-200/50 overflow-hidden">
          <div className="qb-gradient px-6 pt-8 pb-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute rounded-full border border-white/40"
                  style={{ width: `${(i+1)*40}px`, height: `${(i+1)*40}px`, top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
              ))}
            </div>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="text-white w-9 h-9" strokeWidth={2} />
            </motion.div>
            <h2 className="text-2xl font-black text-white tracking-tight">Order Confirmed!</h2>
            <p className="text-white/80 text-sm mt-1">Hey {ticket.name}, your order is in! 🎉</p>
          </div>
          <div className="flex items-center px-4">
            <div className="w-6 h-6 rounded-full bg-background -ml-7 shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-2" />
            <div className="w-6 h-6 rounded-full bg-background -mr-7 shrink-0" />
          </div>
          <div className="px-6 py-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Your Order Code</p>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 18 }}
              className="bg-slate-50 rounded-2xl py-5 border-2 border-dashed border-slate-200">
              <span className="text-6xl font-black tracking-[0.25em] qb-text-gradient">{ticket.code}</span>
            </motion.div>
            <p className="text-xs text-slate-400 mt-2">Show this code at the counter</p>
          </div>
          <div className="px-6 pb-6">
            <div className={`bg-gradient-to-r ${statusColors[ticket.status] || statusColors.pending} text-white rounded-xl py-3 px-4 text-center font-semibold text-sm shadow-lg`}>
              {statusLabels[ticket.status] || "Processing..."}
            </div>
          </div>
          <div className="flex items-center px-4">
            <div className="w-6 h-6 rounded-full bg-background -ml-7 shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-2" />
            <div className="w-6 h-6 rounded-full bg-background -mr-7 shrink-0" />
          </div>
          <div className="px-6 py-5 space-y-2">
            <button onClick={onOrders} className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors">
              View My Orders
            </button>
            <button onClick={onBack} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
              Order More Food
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Bottom Nav ─────────────────────────────────────── */
function BottomNav({ active, user, onNav }: { active: string; user: User | null; onNav: (tab: string) => void }) {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "menu", icon: UtensilsCrossed, label: "Menu" },
    { id: "orders", icon: Receipt, label: "Orders" },
    { id: "profile", icon: UserIcon, label: "Profile" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 glass-card border-t border-slate-200/80 bottom-safe">
      <div className="max-w-md mx-auto flex justify-around items-center px-2 py-2">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button key={tab.id} onClick={() => onNav(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${isActive ? "text-orange-600" : "text-slate-400 hover:text-slate-600"}`}>
              <div className="relative">
                {isActive && (
                  <motion.div layoutId="nav-indicator" className="absolute inset-0 bg-orange-100 rounded-lg -m-1"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} className="relative z-10" />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-orange-600" : "text-slate-400"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────── */
export default function StudentInterface() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderTicket, setOrderTicket] = useState<{ code: string; status: string; name: string } | null>(null);

  useEffect(() => {
    checkUser();
    fetchMenu();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setProfile(data);
    }
  }

  async function fetchMenu() {
    try {
      const { data, error } = await supabase.from("menu_items").select("*").eq("is_available", true).order("category", { ascending: true });
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  }

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing && existing.quantity > 1) return prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter((i) => i.id !== id);
    });
  };

  const getQuantity = (id: string) => cart.find((i) => i.id === id)?.quantity || 0;
  const cartTotal = useMemo(() => cart.reduce((t, i) => t + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((t, i) => t + i.quantity, 0), [cart]);

  const timeSlots = useMemo(() => {
    const slots: { display: string; value: string }[] = [];
    const now = new Date();
    const ms15 = 15 * 60 * 1000;
    const start = new Date(Math.ceil((now.getTime() + ms15) / ms15) * ms15);
    start.setSeconds(0, 0);
    for (let i = 0; i < 10; i++) {
      const slot = new Date(start.getTime() + i * ms15);
      const display = slot.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const hh = String(slot.getHours()).padStart(2, "0");
      const mm = String(slot.getMinutes()).padStart(2, "0");
      slots.push({ display, value: `${hh}:${mm}:00` });
    }
    return slots;
  }, []);

  const categories = useMemo(() => Array.from(new Set(menuItems.map((i) => i.category))), [menuItems]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (activeCategory !== "All") items = items.filter((i) => i.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    return items;
  }, [menuItems, activeCategory, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleCheckoutClick = () => {
    if (!user) { router.push("/login"); } else { setIsCheckoutOpen(true); }
  };

  const handleCheckout = async () => {
    if (!user || !pickupTime || cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const orderCode = Math.floor(1000 + Math.random() * 9000).toString();
      const { data: orderData, error: orderError } = await supabase
        .from("orders").insert({ user_id: user.id, order_code: orderCode, total_amount: cartTotal, pickup_time: pickupTime, status: "pending", payment_status: "pending" })
        .select().single();
      if (orderError) throw orderError;
      const { error: itemsError } = await supabase.from("order_items").insert(
        cart.map((item) => ({ order_id: orderData.id, item_id: item.id, quantity: item.quantity }))
      );
      if (itemsError) throw itemsError;
      setOrderTicket({ code: orderCode, status: "pending", name: profile?.full_name || "Guest" });
      setCart([]);
      setIsCheckoutOpen(false);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavTab = (tab: string) => {
    if (tab === "orders" || tab === "profile") {
      if (!user) router.push("/login");
      else router.push("/orders");
    } else {
      setActiveTab(tab);
    }
  };

  if (orderTicket) {
    return <TicketScreen ticket={orderTicket} onBack={() => setOrderTicket(null)} onOrders={() => router.push("/orders")} />;
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Header */}
      <motion.header initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-20 glass-card border-b border-slate-200/80">
        <div className="max-w-md mx-auto px-4 pt-4 pb-3">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black qb-text-gradient tracking-tight">QuickBite</span>
                <motion.div animate={{ rotate: [0, 15, -10, 15, 0] }} transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.6 }}>
                  <Zap size={18} className="text-orange-500 fill-orange-400" />
                </motion.div>
              </div>
              <p className="text-xs text-slate-400">{user ? `Hey, ${profile?.full_name?.split(" ")[0] || "there"} 👋` : "Campus Canteen"}</p>
            </div>
            <div className="flex gap-2 items-center">
              {user ? (
                <button onClick={() => router.push("/orders")}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                  <ListOrdered size={18} />
                </button>
              ) : (
                <button onClick={() => router.push("/login")}
                  className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors">
                  <UserIcon size={14} /> Login
                </button>
              )}
              <button onClick={() => cart.length > 0 && handleCheckoutClick()}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                <ShoppingCart size={18} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu items…"
              className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 outline-none border border-transparent focus:border-orange-200 transition-all placeholder:text-slate-400" />
            <AnimatePresence>
              {searchQuery && (
                <motion.button initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
                  onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* Category Pills */}
        {!loading && categories.length > 0 && (
          <div className="max-w-md mx-auto overflow-x-auto scrollbar-hide px-4 pb-3">
            <div className="flex gap-2 w-max">
              {["All", ...categories].map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <motion.button key={cat} onClick={() => setActiveCategory(cat)} whileTap={{ scale: 0.92 }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive ? "qb-gradient text-white shadow-md shadow-orange-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}>
                    {cat !== "All" && <span>{getCategoryEmoji(cat)}</span>}
                    {cat}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </motion.header>

      {/* Hero Banner */}
      <AnimatePresence mode="wait">
        {activeTab === "home" && !searchQuery && activeCategory === "All" && !loading && menuItems.length > 0 && (
          <motion.div key="hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }} className="max-w-md mx-auto px-4 pt-4 pb-2">
            <div className="relative qb-gradient rounded-3xl p-5 overflow-hidden shadow-lg shadow-orange-300/30">
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -right-2 bottom-2 w-20 h-20 rounded-full bg-red-600/20" />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={13} className="text-yellow-300" />
                  <span className="text-white/80 text-xs font-medium">Today&apos;s Specials</span>
                </div>
                <h2 className="text-white text-xl font-black leading-snug max-w-[60%]">Fresh & Hot, Ready in Minutes! 🔥</h2>
                <p className="text-white/70 text-xs mt-1 max-w-[60%]">{menuItems.length} items available now</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory(categories[0] || "All")}
                  className="mt-3 flex items-center gap-1 bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-full shadow-md">
                  Explore Menu <ChevronRight size={12} />
                </motion.button>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl">🍱</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu */}
      <main className="max-w-md mx-auto px-4 pt-4 pb-4">
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </motion.div>
        ) : filteredItems.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-slate-600 font-semibold">No items found</h3>
            <p className="text-slate-400 text-sm mt-1">{searchQuery ? `No results for "${searchQuery}"` : "Menu is currently empty"}</p>
            {searchQuery && <button onClick={() => setSearchQuery("")} className="mt-4 text-orange-600 text-sm font-medium hover:underline">Clear search</button>}
          </motion.div>
        ) : (
          <motion.div key={activeCategory + searchQuery} variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <motion.section key={category} variants={itemFadeUp}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{getCategoryEmoji(category)}</span>
                  <h2 className="text-base font-bold text-slate-800">{category}</h2>
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs text-slate-400 font-medium">{items.length} items</span>
                </div>
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2.5">
                  {items.map((item, index) => (
                    <MenuItemCard key={item.id} item={item} qty={getQuantity(item.id)}
                      onAdd={() => addToCart(item)} onRemove={() => removeFromCart(item.id)} index={index} />
                  ))}
                </motion.div>
              </motion.section>
            ))}
          </motion.div>
        )}
      </main>

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div key="cart-bar" variants={cartBarVariants} initial="hidden" animate="visible" exit="hidden"
            className="fixed bottom-[68px] left-0 right-0 z-20 px-4 pb-2">
            <div className="max-w-md mx-auto">
              <motion.button onClick={handleCheckoutClick} whileTap={{ scale: 0.97 }}
                className="w-full qb-gradient text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-xl shadow-orange-400/30">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-xl w-9 h-9 flex items-center justify-center">
                    <motion.span key={cartCount} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="text-white font-black text-sm">
                      {cartCount}
                    </motion.span>
                  </div>
                  <div className="text-left">
                    <p className="text-white/70 text-[10px] font-medium leading-none">{cartCount} {cartCount === 1 ? "item" : "items"} in cart</p>
                    <motion.p key={cartTotal} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-white font-black text-base leading-tight">
                      ₹{cartTotal}
                    </motion.p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5">
                  <span className="text-white font-bold text-sm">{user ? "Checkout" : "Login"}</span>
                  <ChevronRight size={15} className="text-white" />
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md bg-white border-0 rounded-3xl overflow-hidden max-h-[92vh] overflow-y-auto p-0 w-[calc(100vw-2rem)] mx-auto">
          <div className="qb-gradient p-6 text-white">
            <DialogTitle className="text-2xl font-black text-white">Complete Order</DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-1">Review your items and pick a time slot.</DialogDescription>
          </div>
          <div className="p-5 space-y-5">
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Order Summary</h4>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryEmoji(item.category)}</span>
                      <span className="text-slate-700 font-medium">{item.quantity}× {item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-800">Total</span>
                <span className="text-xl font-black qb-text-gradient">₹{cartTotal}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ordering As</Label>
              <div className="flex items-center gap-2 bg-slate-50 py-3 px-4 rounded-xl border border-slate-200">
                <div className="w-8 h-8 rounded-full qb-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {(profile?.full_name || "?")[0].toUpperCase()}
                </div>
                <span className="font-semibold text-slate-800 text-sm">{profile?.full_name || "Loading..."}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pickup-time" className="text-xs font-bold uppercase tracking-widest text-slate-400">Pickup Time</Label>
              <Select value={pickupTime} onValueChange={setPickupTime}>
                <SelectTrigger id="pickup-time" className="bg-slate-50 border-slate-200 rounded-xl py-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <SelectValue placeholder="Select a 15-min slot" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => <SelectItem key={slot.value} value={slot.value}>{slot.display}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-indigo-100 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider">UPI</span>
                <h4 className="font-bold text-indigo-900 text-sm">Payment Required</h4>
              </div>
              <p className="text-xs text-indigo-600/80 mb-3 leading-relaxed">Complete payment via any UPI app before confirming your order.</p>
              <a href={`upi://pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || ""}&pn=QuickBite&am=${cartTotal}&cu=INR`}
                className="flex items-center justify-center gap-2 w-full bg-white text-indigo-700 font-bold py-3 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm text-sm"
                target="_blank" rel="noreferrer">
                💳 Pay ₹{cartTotal} via UPI App
              </a>
            </div>
          </div>
          <DialogFooter className="px-5 pb-6">
            <Button disabled={!pickupTime || isSubmitting} onClick={handleCheckout}
              className="w-full qb-gradient text-white py-6 rounded-2xl text-base font-black shadow-lg shadow-orange-300/30 disabled:opacity-50 disabled:shadow-none transition-all">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                  Confirming…
                </span>
              ) : "✅ I've Paid – Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav active={activeTab} user={user} onNav={handleNavTab} />
    </div>
  );
}
