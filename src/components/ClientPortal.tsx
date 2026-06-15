import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { LoadingScreen } from "./LoadingScreen";
import { VeloxMark, VeloxWordmark } from "./VeloxLogo";
import { useTheme } from "../lib/theme";
import { PLATFORMS } from "../lib/platforms";
import { Users, Eye, TrendingUp, BarChart3, ExternalLink, Wifi, WifiOff } from "lucide-react";

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(1)}k`;
  return n.toLocaleString();
}
const EMOJI: Record<string, string> = { instagram:"📸", facebook:"👥", linkedin:"💼", twitter:"🐦", tiktok:"🎵", youtube:"▶️" };

export function ClientPortal({ token }: { token: string }) {
  const { isDark } = useTheme();
  const [workspace, setWorkspace] = useState<any>(null);
  const [metrics,   setMetrics]   = useState<any[]>([]);
  const [insight,   setInsight]   = useState<any>(null);
  const [topPosts,  setTopPosts]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => { load(); }, [token]);

  const load = async () => {
    // Find workspace by portal token
    const { data: ws, error: wsErr } = await supabase.from("workspaces")
      .select("id, name, type, plan, portal_enabled")
      .eq("portal_token", token).eq("portal_enabled", true).maybeSingle();

    if (wsErr || !ws) { setError("This client portal link is invalid or has been disabled."); setLoading(false); return; }
    setWorkspace(ws);

    const [mRes, iRes, pRes] = await Promise.all([
      supabase.from("social_metrics").select("*").eq("workspace_id", ws.id),
      supabase.from("ai_insights").select("*").eq("workspace_id", ws.id).eq("platform","all").order("generated_at",{ascending:false}).limit(1).maybeSingle(),
      supabase.from("platform_posts").select("*").eq("workspace_id", ws.id).order("engagement_rate",{ascending:false}).limit(6),
    ]);

    setMetrics(mRes.data ?? []);
    setInsight(iRes.data);
    setTopPosts(pRes.data ?? []);
    setLoading(false);
  };

  if (loading) return <LoadingScreen label="Loading client portal…" />;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"var(--bg)" }}>
      <div className="text-center p-8">
        <VeloxMark size={48} className="mx-auto mb-4" />
        <p className="text-sm" style={{ color:"var(--muted)" }}>{error}</p>
      </div>
    </div>
  );

  const totalFollowers = metrics.reduce((s, m) => s + m.followers, 0);
  const totalReach     = metrics.reduce((s, m) => s + m.reach, 0);
  const avgER          = metrics.length ? metrics.reduce((s, m) => s + m.engagement_rate, 0) / metrics.length : 0;

  return (
    <div className="min-h-screen" style={{ background:"var(--bg)" }}>
      {/* Header */}
      <div className="border-b px-6 py-4" style={{ background:"var(--card)", borderColor:"var(--border)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VeloxMark size={32} />
            <div>
              <p className="text-sm font-semibold" style={{ color:"var(--text)" }}>{workspace.name}</p>
              <p className="text-xs" style={{ color:"var(--muted)" }}>Client Analytics Portal · Read only</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <VeloxWordmark className="text-xs opacity-50" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:"Total Followers",  value:fmtNum(totalFollowers), Icon:Users,      color:"var(--primary)" },
            { label:"Monthly Reach",    value:fmtNum(totalReach),     Icon:Eye,        color:"var(--info)"    },
            { label:"Avg Engagement",   value:`${avgER.toFixed(1)}%`, Icon:TrendingUp, color:"var(--success)" },
            { label:"Platforms Active", value:String(metrics.length), Icon:BarChart3,  color:"#9333ea"        },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="glow-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color:"var(--muted)" }}>{label}</p>
                <div className="p-2 rounded-xl" style={{ background:`${color}15`, color }}><Icon size={14}/></div>
              </div>
              <p className="text-2xl font-mono font-semibold" style={{ color:"var(--text)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Platform metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.filter(p => !["google_ads","meta_ads"].includes(p.id)).map(platform => {
            const m = metrics.find(x => x.platform === platform.id);
            return (
              <div key={platform.id} className="glow-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  {m?.profile_picture_url ? (
                    <img src={m.profile_picture_url} alt="" className="w-10 h-10 rounded-full object-cover avatar-ring"/>
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:`${platform.color}15` }}>
                      {EMOJI[platform.id]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold" style={{ color:"var(--text)" }}>{platform.name}</p>
                    <span className={`pill ${m ? "pill-success" : "pill-neutral"}`}>
                      {m ? <><Wifi size={9}/> Active</> : <><WifiOff size={9}/> Not connected</>}
                    </span>
                  </div>
                </div>
                {m && (
                  <div className="grid grid-cols-3 gap-2">
                    {[["Followers",fmtNum(m.followers)],["Reach",fmtNum(m.reach)],[`${m.engagement_rate.toFixed(1)}%`,"ER"]].map(([v,l]) => (
                      <div key={l}><p className="text-[10px]" style={{ color:"var(--muted)" }}>{l}</p><p className="text-sm font-semibold font-mono" style={{ color:"var(--text)" }}>{v}</p></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI insight summary */}
        {insight && insight.key_insight && (
          <div className="glow-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base font-semibold" style={{ color:"var(--text)" }}>AI Performance Summary</h3>
              <div className="text-2xl font-mono font-bold" style={{ color:"var(--primary)" }}>{insight.overall_score.toFixed(1)}/10</div>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color:"var(--text-soft)" }}>{insight.key_insight}</p>
            {insight.working?.length > 0 && (
              <div className="space-y-1">
                {insight.working.slice(0,2).map((w: string, i: number) => (
                  <p key={i} className="text-xs flex items-start gap-2" style={{ color:"var(--success)" }}>✓ {w}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top posts */}
        {topPosts.length > 0 && (
          <div>
            <h3 className="font-display text-base font-semibold mb-3" style={{ color:"var(--text)" }}>Top performing posts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPosts.map(post => (
                <div key={post.id} className="glow-card rounded-xl overflow-hidden">
                  {(post.thumbnail_url || post.media_url) && (
                    <div className="h-32 overflow-hidden">
                      <img src={post.thumbnail_url || post.media_url} alt=""
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs truncate mb-2" style={{ color:"var(--text)" }}>{post.caption}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold" style={{ color:"var(--primary)" }}>
                        {post.engagement_rate.toFixed(1)}% ER
                      </span>
                      {post.post_url && (
                        <a href={post.post_url} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] flex items-center gap-1" style={{ color:"var(--muted)" }}>
                          View <ExternalLink size={9}/>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 border-t" style={{ borderColor:"var(--border)" }}>
          <p className="text-xs" style={{ color:"var(--muted)" }}>
            Powered by <strong>VeloxSpace</strong> · Data updates each time your account is synced
          </p>
        </div>
      </div>
    </div>
  );
}
