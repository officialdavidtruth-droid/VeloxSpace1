import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useWorkspace } from "../lib/workspace";
import { PLATFORMS } from "../lib/platforms";
import { getHolidaysForDay, COUNTRY_OPTIONS } from "../lib/holidays";
import { LoadingInline } from "./LoadingScreen";
import type { AppUser } from "../lib/supabase";
import type { PlatformId, ScheduledPost } from "../types";
import {
  ChevronLeft, ChevronRight, Plus, X, Send, Clock,
  Globe, Loader2, Sparkles, Calendar as CalIcon,
} from "lucide-react";

const PLATFORM_COLORS: Record<string, string> = {
  instagram:"#E1306C", facebook:"#1877F2", linkedin:"#0A66C2",
  twitter:"#000000", tiktok:"#69C9D0", youtube:"#FF0000",
};
const PLATFORM_EMOJI: Record<string, string> = {
  instagram:"📸", facebook:"👥", linkedin:"💼",
  twitter:"🐦", tiktok:"🎵", youtube:"▶️",
};
const DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDate; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export function Calendar({ user }: { user: AppUser }) {
  const { workspace, canUse } = useWorkspace();
  const today = new Date();
  const [year,    setYear]    = useState(today.getFullYear());
  const [month,   setMonth]   = useState(today.getMonth());
  const [country, setCountry] = useState("NG");
  const [posts,   setPosts]   = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [panel, setPanel]     = useState(false);

  // Compose state
  const [content,    setContent]    = useState("");
  const [ctaText,    setCtaText]    = useState("");
  const [platforms,  setPlatforms]  = useState<Set<string>>(new Set());
  const [schedTime,  setSchedTime]  = useState("09:00");
  const [posting,    setPosting]    = useState(false);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiOptions,  setAiOptions]  = useState<string[]>([]);

  useEffect(() => { if (workspace?.id) load(); }, [workspace?.id, year, month]);

  const load = async () => {
    setLoading(true);
    const startDate = `${year}-${String(month+1).padStart(2,"0")}-01`;
    const endDate   = `${year}-${String(month+1).padStart(2,"0")}-${new Date(year,month+1,0).getDate()}`;
    const { data } = await supabase.from("scheduled_posts")
      .select("*").eq("workspace_id", workspace?.id)
      .gte("scheduled_for", startDate).lte("scheduled_for", endDate + "T23:59:59")
      .order("scheduled_for", { ascending: true });
    setPosts((data as ScheduledPost[]) ?? []);
    setLoading(false);
  };

  const days = useMemo(() => getMonthGrid(year, month), [year, month]);

  const postsByDay = useMemo(() => {
    const map: Record<number, ScheduledPost[]> = {};
    posts.forEach(p => {
      if (!p.scheduled_for) return;
      const d = new Date(p.scheduled_for).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(p);
    });
    return map;
  }, [posts]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const openDay = (day: number) => {
    setSelected(day); setPanel(true);
    setContent(""); setCtaText(""); setPlatforms(new Set()); setSchedTime("09:00"); setAiOptions([]);
  };

  const togglePlatform = (id: string) => {
    setPlatforms(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const generateCaptions = async () => {
    if (!content && platforms.size === 0) return;
    setAiLoading(true);
    try {
      const platform = Array.from(platforms)[0] ?? "instagram";
      const holidays = selected ? getHolidaysForDay(selected, month+1, year, country) : [];
      const holidayCtx = holidays.length ? `This day has: ${holidays.map(h=>h.name).join(", ")}.` : "";
      const res = await fetch("/api/ai-insights", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _captionMode: true,
          platform, draft: content, cta: ctaText, holidayContext: holidayCtx,
          metrics: [], posts: [],
        }),
      });
      const data = await res.json();
      if (data.captions) setAiOptions(data.captions);
    } catch {}
    setAiLoading(false);
  };

  const schedulePost = async () => {
    if (!content.trim() || platforms.size === 0 || !selected) return;
    setPosting(true);
    const scheduled_for = new Date(year, month, selected);
    const [h, m] = schedTime.split(":").map(Number);
    scheduled_for.setHours(h, m, 0, 0);

    await supabase.from("scheduled_posts").insert({
      uid: user.uid, workspace_id: workspace?.id,
      content, cta_text: ctaText, platforms: Array.from(platforms),
      status: "scheduled", scheduled_for: scheduled_for.toISOString(),
      results: {}, created_at: new Date().toISOString(),
    });

    setPosting(false); setPanel(false); await load();
  };

  const deletePost = async (id: string) => {
    await supabase.from("scheduled_posts").delete().eq("id", id);
    await load();
  };

  if (loading) return <LoadingInline label="Loading calendar…" />;

  const selectedHolidays = selected ? getHolidaysForDay(selected, month+1, year, country) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold mb-1" style={{ color:"var(--text)" }}>Content Calendar</h1>
          <p className="text-sm" style={{ color:"var(--muted)" }}>Plan, schedule, and publish content — with local holidays built in</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="text-sm rounded-xl px-3 py-2 border outline-none"
            style={{ background:"var(--surface)", borderColor:"var(--border)", color:"var(--text)" }}>
            {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Calendar card */}
      <div className="glow-card rounded-2xl overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:"var(--border)" }}>
          <button onClick={prevMonth} className="p-2 rounded-xl hover:opacity-70 transition-all" style={{ color:"var(--muted)" }}>
            <ChevronLeft size={18}/>
          </button>
          <h2 className="font-display text-lg font-semibold" style={{ color:"var(--text)" }}>
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:opacity-70 transition-all" style={{ color:"var(--muted)" }}>
            <ChevronRight size={18}/>
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor:"var(--border)" }}>
          {DOW.map(d => (
            <div key={d} className="text-center py-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color:"var(--muted)" }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 divide-x divide-y" style={{ borderColor:"var(--border)" }}>
          {days.map((day, i) => {
            if (!day) return <div key={i} className="min-h-[90px]" style={{ background:"var(--card-alt)" }} />;

            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const dayPosts = postsByDay[day] ?? [];
            const holidays = getHolidaysForDay(day, month+1, year, country);

            return (
              <div key={i} onClick={() => openDay(day)}
                className="min-h-[90px] p-2 cursor-pointer transition-all hover:opacity-90 relative"
                style={{ background: isToday ? "var(--primary-soft)" : "var(--card)" }}>
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                    style={{
                      background: isToday ? "var(--primary)" : "transparent",
                      color: isToday ? "#fff" : "var(--text)"
                    }}>{day}</span>
                  <Plus size={11} className="opacity-0 hover:opacity-100" style={{ color:"var(--muted)" }}/>
                </div>

                {/* Holidays */}
                {holidays.slice(0,2).map(h => (
                  <div key={h.name} className="text-[9px] font-medium px-1 py-0.5 rounded mb-0.5 truncate"
                    style={{ background:"var(--warning-bg)", color:"var(--warning)" }}>
                    {h.emoji} {h.name}
                  </div>
                ))}

                {/* Posts */}
                {dayPosts.slice(0,3).map(p => (
                  <div key={p.id} className="text-[9px] px-1 py-0.5 rounded mb-0.5 truncate font-medium"
                    style={{
                      background: `${PLATFORM_COLORS[(p.platforms as string[])[0]] ?? "#888"}20`,
                      color: PLATFORM_COLORS[(p.platforms as string[])[0]] ?? "var(--text)"
                    }}>
                    {PLATFORM_EMOJI[(p.platforms as string[])[0]]} {p.content.slice(0, 25)}…
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-[9px]" style={{ color:"var(--muted)" }}>+{dayPosts.length-3} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs" style={{ color:"var(--muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background:"var(--warning-bg)", border:"1px solid var(--warning)" }}/>
          Holiday
        </span>
        {Object.entries(PLATFORM_COLORS).map(([id, color]) => (
          <span key={id} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background:`${color}30`, border:`1px solid ${color}` }}/>
            {PLATFORM_EMOJI[id]} {id}
          </span>
        ))}
      </div>

      {/* Side panel */}
      {panel && selected && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setPanel(false)}>
          <div className="flex-1" />
          <div className="w-full max-w-md h-full overflow-y-auto shadow-2xl"
            style={{ background:"var(--card)", borderLeft:"1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}>

            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor:"var(--border)" }}>
              <div>
                <h3 className="font-display text-base font-semibold" style={{ color:"var(--text)" }}>
                  {MONTHS[month]} {selected}, {year}
                </h3>
                {selectedHolidays.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color:"var(--warning)" }}>
                    {selectedHolidays.map(h => `${h.emoji} ${h.name}`).join(" · ")}
                  </p>
                )}
              </div>
              <button onClick={() => setPanel(false)} className="p-1.5 rounded-lg" style={{ color:"var(--muted)" }}><X size={16}/></button>
            </div>

            {/* Existing posts for this day */}
            {(postsByDay[selected] ?? []).length > 0 && (
              <div className="p-4 border-b space-y-2" style={{ borderColor:"var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:"var(--muted)" }}>Scheduled for this day</p>
                {(postsByDay[selected] ?? []).map(p => (
                  <div key={p.id} className="rounded-xl p-3 flex items-start gap-2" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate mb-1" style={{ color:"var(--text)" }}>{p.content}</p>
                      <div className="flex gap-1 flex-wrap">
                        {(p.platforms as string[]).map(pl => (
                          <span key={pl} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background:`${PLATFORM_COLORS[pl]}20`, color:PLATFORM_COLORS[pl] }}>
                            {PLATFORM_EMOJI[pl]} {pl}
                          </span>
                        ))}
                        <span className="text-[10px] pill pill-neutral">{p.status}</span>
                      </div>
                    </div>
                    <button onClick={() => deletePost(p.id!)} className="shrink-0 p-1 text-red-400 hover:opacity-70"><X size={12}/></button>
                  </div>
                ))}
              </div>
            )}

            {/* New post compose */}
            <div className="p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color:"var(--muted)" }}>Add post for this day</p>

              {/* Platform selector */}
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.filter(p => p.id !== "google_ads" && p.id !== "meta_ads").map(p => (
                  <button key={p.id} onClick={() => togglePlatform(p.id)}
                    className="text-xs px-2.5 py-1.5 rounded-xl border transition-all"
                    style={platforms.has(p.id)
                      ? { background:`${PLATFORM_COLORS[p.id]}15`, color:PLATFORM_COLORS[p.id], borderColor:`${PLATFORM_COLORS[p.id]}60` }
                      : { background:"var(--surface)", color:"var(--muted)", borderColor:"var(--border)" }}>
                    {PLATFORM_EMOJI[p.id]} {p.name}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div>
                <textarea value={content} onChange={e => setContent(e.target.value)}
                  placeholder="Write your post content…" rows={4}
                  className="w-full text-sm rounded-xl px-3 py-2.5 border outline-none resize-none"
                  style={{ background:"var(--surface)", borderColor:"var(--border)", color:"var(--text)" }}/>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px]" style={{ color:"var(--muted)" }}>{content.length} chars</span>
                  {canUse("aiCaptions") && (
                    <button onClick={generateCaptions} disabled={aiLoading}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all"
                      style={{ background:"var(--primary-soft)", color:"var(--primary)" }}>
                      {aiLoading ? <Loader2 size={11} className="animate-spin"/> : <Sparkles size={11}/>}
                      AI suggest
                    </button>
                  )}
                </div>
              </div>

              {/* AI caption options */}
              {aiOptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold" style={{ color:"var(--primary)" }}>Pick a caption:</p>
                  {aiOptions.map((opt, i) => (
                    <button key={i} onClick={() => { setContent(opt); setAiOptions([]); }}
                      className="w-full text-left text-xs p-3 rounded-xl border transition-all hover:opacity-80"
                      style={{ background:"var(--card-alt)", borderColor:"var(--border)", color:"var(--text)" }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color:"var(--muted)" }}>Call to action (optional)</label>
                <input value={ctaText} onChange={e => setCtaText(e.target.value)}
                  placeholder="e.g. Click the link in bio, DM us to order"
                  className="w-full text-sm rounded-xl px-3 py-2.5 border outline-none"
                  style={{ background:"var(--surface)", borderColor:"var(--border)", color:"var(--text)" }}/>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <Clock size={14} style={{ color:"var(--muted)" }}/>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color:"var(--muted)" }}>Post time</label>
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                    className="text-sm rounded-xl px-3 py-2 border outline-none"
                    style={{ background:"var(--surface)", borderColor:"var(--border)", color:"var(--text)" }}/>
                </div>
              </div>

              <button onClick={schedulePost} disabled={posting || !content.trim() || platforms.size === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white gradient-primary hover:opacity-90 disabled:opacity-50 transition-all">
                {posting ? <Loader2 size={14} className="animate-spin"/> : <CalIcon size={14}/>}
                {posting ? "Scheduling…" : "Add to calendar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
