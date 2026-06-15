/**
 * Netlify Scheduled Function — runs every 15 minutes
 * Finds all posts where scheduled_for <= now() and status = 'scheduled'
 * and publishes them using the same logic as publish-post.mts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const TEXT_POSTABLE = new Set(["facebook","linkedin","twitter"]);

async function getConn(workspaceId: string, platform: string) {
  const { data } = await supabase.from("platform_connections")
    .select("account_id, access_token, connected")
    .eq("workspace_id", workspaceId).eq("platform", platform).maybeSingle();
  if (!data?.connected || !data.access_token) return null;
  return data;
}

async function postFacebook(pageId: string, token: string, content: string) {
  const params = new URLSearchParams({ message: content, access_token: token });
  const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, { method: "POST", body: params });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return `https://facebook.com/${data.id}`;
}

async function postLinkedIn(orgId: string, token: string, content: string) {
  const body = { author: `urn:li:organization:${orgId}`, lifecycleState: "PUBLISHED", specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text: content }, shareMediaCategory: "NONE" } }, visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" } };
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" }, body: JSON.stringify(body) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).message ?? "LinkedIn error"); }
  const id = res.headers.get("x-restli-id") ?? "";
  return `https://www.linkedin.com/feed/update/${id}`;
}

async function postTwitter(token: string, content: string) {
  const res = await fetch("https://api.twitter.com/2/tweets", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ text: content }) });
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0]?.message ?? "X API error");
  return `https://x.com/i/web/status/${data.data?.id}`;
}

export default async () => {
  const now = new Date().toISOString();

  // Find all due scheduled posts
  const { data: duePosts, error } = await supabase.from("scheduled_posts")
    .select("*").eq("status", "scheduled").lte("scheduled_for", now);

  if (error || !duePosts?.length) return;

  for (const post of duePosts) {
    const results: Record<string, { success: boolean; post_url?: string; error?: string }> = {};
    let anySuccess = false;

    for (const platform of (post.platforms as string[])) {
      if (!TEXT_POSTABLE.has(platform)) { results[platform] = { success: false, error: "not_supported" }; continue; }
      try {
        const conn = await getConn(post.workspace_id, platform);
        if (!conn) { results[platform] = { success: false, error: "not_connected" }; continue; }
        let url = "";
        if (platform === "facebook") url = await postFacebook(conn.account_id, conn.access_token, post.content);
        else if (platform === "linkedin") url = await postLinkedIn(conn.account_id, conn.access_token, post.content);
        else if (platform === "twitter") url = await postTwitter(conn.access_token, post.content);
        results[platform] = { success: true, post_url: url };
        anySuccess = true;
      } catch (e: any) { results[platform] = { success: false, error: e.message }; }
    }

    await supabase.from("scheduled_posts").update({
      status: anySuccess ? "published" : "failed",
      results, published_at: new Date().toISOString(),
    }).eq("id", post.id);

    // Create notification for published post
    if (anySuccess && post.workspace_id) {
      const successPlatforms = Object.entries(results).filter(([,r]) => r.success).map(([p]) => p).join(", ");
      await supabase.from("notifications").insert({
        workspace_id: post.workspace_id, uid: post.uid ?? "",
        type: "scheduled", title: `✅ Scheduled post published`,
        message: `Your post went live on ${successPlatforms}`,
        read: false, created_at: new Date().toISOString(),
      });
    }
  }
};

export const config = { schedule: "*/15 * * * *" };
