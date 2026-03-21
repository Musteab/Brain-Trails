"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useCardStyles } from "@/hooks/useCardStyles";
import { supabase } from "@/lib/supabase";
import { Shield, Users, HelpCircle, Activity, Search, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import BackgroundLayer from "@/components/layout/BackgroundLayer";

type AdminTab = "users" | "support" | "stats";

export default function AdminPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const { isSun, muted } = useCardStyles();
  
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);

  // Data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tickets, setTickets] = useState<any[]>([]);

  // Actions states
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [updatingTicket, setUpdatingTicket] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchOverview = async () => {
      setLoading(true);
      try {
        const [{ count: userCount, data: usersData }, { count: ticketCount, data: ticketsData }] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact" }).order('created_at', { ascending: false }),
          supabase.from("support_tickets").select("*", { count: "exact" }).order('created_at', { ascending: false }),
        ]);

        setTotalUsers(userCount || 0);
        setTotalTickets(ticketCount || 0);
        setUsers(usersData || []);
        setTickets(ticketsData || []);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUser(userId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("profiles") as any).update({ role: newRole }).eq("id", userId);
      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleTicketStatusChange = async (ticketId: string, newStatus: string) => {
    setUpdatingTicket(ticketId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("support_tickets") as any).update({ status: newStatus }).eq("id", ticketId);
      if (error) throw error;
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Failed to update ticket status:", err);
    } finally {
      setUpdatingTicket(null);
    }
  };

  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative pb-20 ${isSun ? "text-slate-800" : "text-white"}`}>
      <BackgroundLayer />
      
      <div className="relative z-10 max-w-6xl mx-auto pt-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/")}
            className={`p-2 rounded-xl backdrop-blur-sm border transition-colors ${
              isSun 
                ? "bg-white/70 border-slate-200 hover:bg-white text-slate-600" 
                : "bg-white/10 border-white/20 hover:bg-white/20 text-slate-300"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
              <ShieldAlert className={isSun ? "text-rose-600" : "text-rose-400"} />
              Admin Dashboard
            </h1>
            <p className={`text-sm ${muted}`}>Manage the realm and oversee its inhabitants.</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: totalUsers, icon: Users, color: isSun ? "text-emerald-600" : "text-emerald-400", bg: isSun ? "bg-emerald-50" : "bg-emerald-500/10" },
            { label: "Total Tickets", value: totalTickets, icon: HelpCircle, color: isSun ? "text-purple-600" : "text-purple-400", bg: isSun ? "bg-purple-50" : "bg-purple-500/10" },
            { label: "Active Today", value: "---", icon: Activity, color: isSun ? "text-amber-600" : "text-amber-400", bg: isSun ? "bg-amber-50" : "bg-amber-500/10" },
            { label: "System Health", value: "100%", icon: Shield, color: isSun ? "text-blue-600" : "text-blue-400", bg: isSun ? "bg-blue-50" : "bg-blue-500/10" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-2xl border backdrop-blur-md ${isSun ? "bg-white/80 border-slate-200" : "bg-white/5 border-white/10"}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase mb-1 ${muted}`}>{stat.label}</p>
                  <p className="text-2xl font-bold font-heading">{loading ? "..." : stat.value}</p>
                </div>
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className={`rounded-3xl border backdrop-blur-xl overflow-hidden ${isSun ? "bg-white/90 border-slate-200" : "bg-slate-900/80 border-slate-700/50"}`}>
          {/* Tabs */}
          <div className={`flex border-b ${isSun ? "border-slate-200" : "border-slate-700/50"}`}>
            {(["users", "support", "stats"] as AdminTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-bold capitalize transition-colors ${
                  activeTab === tab
                    ? isSun ? "text-rose-600 border-b-2 border-rose-600 bg-rose-50/50" : "text-rose-400 border-b-2 border-rose-500 bg-rose-500/5"
                    : muted + " hover:bg-black/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 min-h-[400px]">
            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold font-heading">User Management</h3>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isSun ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700"}`}>
                    <Search className={`w-4 h-4 ${muted}`} />
                    <input type="text" placeholder="Search users..." className={`bg-transparent outline-none text-sm w-48 ${isSun ? "placeholder-slate-400" : "placeholder-slate-500"}`} />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-sm ${isSun ? "border-slate-200" : "border-slate-700"} ${muted}`}>
                        <th className="py-3 px-4 font-medium">User</th>
                        <th className="py-3 px-4 font-medium">Email / ID</th>
                        <th className="py-3 px-4 font-medium">Role</th>
                        <th className="py-3 px-4 font-medium">Level</th>
                        <th className="py-3 px-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className={`border-b last:border-0 transition-colors ${isSun ? "border-slate-100 hover:bg-slate-50/50" : "border-slate-800 hover:bg-white/5"}`}>
                          <td className="py-3 px-4">
                            <div className="font-bold flex items-center gap-2">
                              {u.display_name}
                              {u.role === 'dev' && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                            </div>
                            <div className={`text-xs ${muted}`}>{u.title || "No title"}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className={`text-xs font-mono bg-black/5 px-2 py-0.5 rounded truncate w-32 ${muted}`} title={u.id}>
                              {u.id.substring(0, 8)}...
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={u.role || "student"}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={updatingUser === u.id}
                              className={`text-xs px-2 py-1 rounded w-32 border outline-none ${
                                isSun 
                                  ? "bg-white border-slate-200 text-slate-700" 
                                  : "bg-slate-800 border-slate-700 text-slate-300"
                              }`}
                            >
                              <option value="student">Student</option>
                              <option value="guild_leader">Guild Leader</option>
                              <option value="beta_tester">Beta Tester</option>
                              <option value="admin">Admin</option>
                              <option value="dev">Developer</option>
                            </select>
                            {updatingUser === u.id && <Loader2 className="w-3 h-3 inline ml-2 animate-spin text-amber-500" />}
                          </td>
                          <td className="py-3 px-4 text-sm font-bold">
                            Lv.{u.level}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className={`text-xs px-3 py-1.5 rounded font-bold transition-colors ${isSun ? "text-rose-600 hover:bg-rose-50 border border-rose-200" : "text-rose-400 hover:bg-rose-500/10 border border-rose-500/20"}`}>
                              Ban
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="py-12 text-center text-sm opacity-50">No users found.</div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === "support" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold font-heading mb-4">Support Tickets</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className={`p-4 rounded-xl border ${isSun ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700"}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${
                            ticket.category === 'bug' ? 'bg-rose-500/10 text-rose-500' :
                            ticket.category === 'feature' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-amber-500/10 text-amber-500'
                          }`}>
                            {ticket.category}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${
                            ticket.severity === 'critical' ? 'bg-red-500/20 text-red-600' :
                            ticket.severity === 'high' ? 'bg-amber-500/20 text-amber-600' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {ticket.severity || "normal"}
                          </span>
                        </div>
                        <select
                          value={ticket.status || "open"}
                          onChange={(e) => handleTicketStatusChange(ticket.id, e.target.value)}
                          disabled={updatingTicket === ticket.id}
                          className={`text-xs font-bold px-2 py-1 rounded border outline-none ${
                            ticket.status === 'resolved' || ticket.status === 'closed'
                              ? isSun ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : isSun ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700"
                          }`}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      
                      <h4 className="font-bold text-sm mb-1">{ticket.subject}</h4>
                      <p className={`text-sm mb-3 whitespace-pre-wrap ${isSun ? "text-slate-600" : "text-slate-300"}`}>
                        {ticket.message}
                      </p>
                      
                      <div className={`flex justify-between items-center text-xs ${muted}`}>
                        <span>From user: <span className="font-mono bg-black/5 px-1 rounded">{ticket.user_id.substring(0,8)}</span></span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  
                  {tickets.length === 0 && (
                    <div className="py-12 text-center">
                      <HelpCircle className={`w-12 h-12 mx-auto mb-3 opacity-20`} />
                      <p className={`text-sm font-bold ${muted}`}>No support tickets yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === "stats" && (
               <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <Activity className={`w-12 h-12 mb-4 opacity-50 ${muted}`} />
                <h3 className="text-lg font-bold mb-2">Detailed System Stats</h3>
                <p className={`max-w-md ${muted}`}>View detailed analytics on guild activity, focus time, and cosmetic purchases. (Charts pending).</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
