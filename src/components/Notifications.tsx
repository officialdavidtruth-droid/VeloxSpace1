import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useWorkspace } from "../lib/workspace";
import { Bell, X, CheckCheck, TrendingUp, TrendingDown, Star, Users, Link2, Calendar } from "lucide-react";

interface Notification {
  id: string; workspace_id: string; uid: string;
  type: string; title: string; message: string;
  read: boolean; created_at: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  milestone: <Star size={14} style={{ color:"var(--warning)" }}/>,
  success:   <TrendingUp size={14} style={{ color:"var(--success)" }}/>,
  warning:   <TrendingDown size={14} style={{ color:"var(--danger)" }}/>,
  referral:  <Users size={14} style={{ color:"var(--primary)" }}/>,
  info:      <Bell size={14} style={{ color:"var(--info)" }}/>,
  scheduled: <Calendar size={14} style={{ color:"var(--primary)" }}/>,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell({ uid }: { uid: string }) {
  const { workspace } = useWorkspace();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (workspace?.id) load(); }, [workspace?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const load = async () => {
    const { data } = await supabase.from("notifications")
      .select("*").eq("workspace_id", workspace?.id)
      .order("created_at", { ascending: false }).limit(20);
    setNotifications((data as Notification[]) ?? []);
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true })
      .eq("workspace_id", workspace?.id).eq("read", false);
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const dismiss = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(ns => ns.filter(n => n.id !== id));
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(o => !o); if (!open && unread > 0) markAllRead(); }}
        className="relative p-2 rounded-xl transition-all"
        style={{ color:"var(--muted)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
        <Bell size={16}/>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
            style={{ background:"var(--danger)" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
          style={{ background:"var(--card)", border:"1px solid var(--border)", boxShadow:"var(--shadow-lg)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor:"var(--border)" }}>
            <h3 className="text-sm font-semibold" style={{ color:"var(--text)" }}>Notifications</h3>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="text-[10px] flex items-center gap-1" style={{ color:"var(--primary)" }}>
                <CheckCheck size={11}/> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor:"var(--border)" }}>
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={20} className="mx-auto mb-2" style={{ color:"var(--muted)" }}/>
                <p className="text-xs" style={{ color:"var(--muted)" }}>No notifications yet</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3 transition-all"
                style={{ background: n.read ? "transparent" : "var(--primary-soft)" }}>
                <div className="shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? TYPE_ICON.info}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color:"var(--text)" }}>{n.title}</p>
                  {n.message && <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color:"var(--muted)" }}>{n.message}</p>}
                  <p className="text-[10px] mt-1" style={{ color:"var(--muted)" }}>{timeAgo(n.created_at)}</p>
                </div>
                <button onClick={() => dismiss(n.id)} className="shrink-0 p-0.5 rounded hover:opacity-70" style={{ color:"var(--muted)" }}>
                  <X size={11}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Call this from sync functions to generate smart notifications */
export async function generateSyncNotifications(
  workspaceId: string, uid: string,
  platform: string, newMetrics: any, prevMetrics: any
) {
  const notifications: Omit<Notification, "id" | "created_at">[] = [];

  if (prevMetrics && newMetrics) {
    const followerDiff = (newMetrics.followers ?? 0) - (prevMetrics.followers ?? 0);
    const followerPct  = prevMetrics.followers > 0 ? (followerDiff / prevMetrics.followers) * 100 : 0;
    const erDiff       = (newMetrics.engagement_rate ?? 0) - (prevMetrics.engagement_rate ?? 0);

    if (followerDiff >= 100 || followerPct >= 5) {
      notifications.push({
        workspace_id: workspaceId, uid, type: "milestone",
        title: `📈 ${platform} followers up +${followerDiff.toLocaleString()}`,
        message: `You gained ${followerDiff} followers (${followerPct.toFixed(1)}% growth)`,
        read: false,
      });
    } else if (followerDiff <= -50 || followerPct <= -5) {
      notifications.push({
        workspace_id: workspaceId, uid, type: "warning",
        title: `⚠️ ${platform} lost ${Math.abs(followerDiff)} followers`,
        message: `Your follower count dropped ${Math.abs(followerPct).toFixed(1)}%. Check your recent content.`,
        read: false,
      });
    }

    if (erDiff >= 1) {
      notifications.push({
        workspace_id: workspaceId, uid, type: "success",
        title: `✅ ${platform} engagement is up`,
        message: `Engagement rate improved by ${erDiff.toFixed(2)}%`,
        read: false,
      });
    } else if (erDiff <= -1.5) {
      notifications.push({
        workspace_id: workspaceId, uid, type: "warning",
        title: `⚠️ ${platform} engagement dropped`,
        message: `Engagement rate fell by ${Math.abs(erDiff).toFixed(2)}%. Try posting at peak hours.`,
        read: false,
      });
    }

    // Follower milestones
    const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
    for (const milestone of milestones) {
      if ((prevMetrics.followers ?? 0) < milestone && (newMetrics.followers ?? 0) >= milestone) {
        notifications.push({
          workspace_id: workspaceId, uid, type: "milestone",
          title: `🎉 ${milestone.toLocaleString()} followers on ${platform}!`,
          message: `Congratulations on reaching this milestone! Keep it up.`,
          read: false,
        });
      }
    }
  }

  if (notifications.length > 0) {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
    await sb.from("notifications").insert(notifications.map(n => ({
      ...n, created_at: new Date().toISOString()
    })));
  }
}
