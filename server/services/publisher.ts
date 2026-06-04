/**
 * Publishing service — posts content to each connected platform via their APIs.
 * Tokens are fetched from the database; refresh is handled automatically.
 */
import {
  getConnectedAccount,
  incrementPublishCount,
  updateConnectedAccountTokens,
  updateContentQueueItemStatus,
} from "../db";
import { refreshPlatformToken } from "./oauthProviders";
import type { ContentQueueItem } from "../../drizzle/schema";

// ─── Token refresh helper ─────────────────────────────────────────────────────
async function getValidToken(userId: number, platform: ContentQueueItem["platform"]): Promise<string> {
  const account = await getConnectedAccount(userId, platform);
  if (!account) throw new Error(`No connected account for platform: ${platform}`);

  const isExpired = account.tokenExpiresAt && account.tokenExpiresAt < new Date();
  if (isExpired && account.refreshToken) {
    const refreshed = await refreshPlatformToken(platform, account.refreshToken, account.accessToken);
    const expiresAt = refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000) : null;
    await updateConnectedAccountTokens(account.id, refreshed.access_token, refreshed.refresh_token ?? account.refreshToken, expiresAt);
    return refreshed.access_token;
  }
  return account.accessToken;
}

// ─── YouTube ──────────────────────────────────────────────────────────────────
async function publishToYouTube(item: ContentQueueItem): Promise<void> {
  const token = await getValidToken(item.userId, "google_youtube");
  const meta = (item.metadata ?? {}) as Record<string, unknown>;

  if (item.contentType === "community_post") {
    // YouTube Community Post
    const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id&mine=true", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const channelData = (await channelRes.json()) as { items: { id: string }[] };
    const channelId = channelData.items?.[0]?.id;
    if (!channelId) throw new Error("No YouTube channel found");

    const res = await fetch("https://www.googleapis.com/youtube/v3/communityPosts?part=snippet", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ snippet: { channelId, text: item.body } }),
    });
    if (!res.ok) throw new Error(`YouTube community post failed: ${await res.text()}`);
  } else {
    // Video upload — expects a video URL in metadata
    const videoUrl = meta.videoUrl as string | undefined;
    if (!videoUrl) throw new Error("YouTube video upload requires metadata.videoUrl");

    const videoRes = await fetch(videoUrl);
    const videoBuffer = await videoRes.arrayBuffer();

    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": "video/*",
          "X-Upload-Content-Length": String(videoBuffer.byteLength),
        },
        body: JSON.stringify({
          snippet: { title: item.title ?? "Untitled", description: item.body ?? "" },
          status: { privacyStatus: (meta.privacy as string) ?? "public" },
        }),
      }
    );
    if (!initRes.ok) throw new Error(`YouTube upload init failed: ${await initRes.text()}`);
    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) throw new Error("No upload URL returned from YouTube");

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/*", "Content-Length": String(videoBuffer.byteLength) },
      body: videoBuffer,
    });
    if (!uploadRes.ok) throw new Error(`YouTube video upload failed: ${await uploadRes.text()}`);
  }
}

// ─── Facebook ─────────────────────────────────────────────────────────────────
async function publishToFacebook(item: ContentQueueItem): Promise<void> {
  const token = await getValidToken(item.userId, "meta_facebook");
  const meta = (item.metadata ?? {}) as Record<string, unknown>;

  // Get user's pages
  const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
  const pagesData = (await pagesRes.json()) as { data: { id: string; access_token: string }[] };
  const page = pagesData.data?.[0];
  if (!page) throw new Error("No Facebook Page found");

  const pageToken = page.access_token;
  const pageId = page.id;

  const mediaUrls = (item.mediaUrls ?? []) as string[];
  if (mediaUrls.length > 0) {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: mediaUrls[0], caption: item.body, access_token: pageToken }),
    });
    if (!res.ok) throw new Error(`Facebook photo post failed: ${await res.text()}`);
  } else {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: item.body, access_token: pageToken }),
    });
    if (!res.ok) throw new Error(`Facebook post failed: ${await res.text()}`);
  }
}

// ─── Instagram ────────────────────────────────────────────────────────────────
async function publishToInstagram(item: ContentQueueItem): Promise<void> {
  const token = await getValidToken(item.userId, "meta_instagram");

  // Get Instagram Business Account
  const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
  const pagesData = (await pagesRes.json()) as { data: { id: string; access_token: string }[] };
  const page = pagesData.data?.[0];
  if (!page) throw new Error("No Facebook Page found for Instagram");

  const igRes = await fetch(
    `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
  );
  const igData = (await igRes.json()) as { instagram_business_account?: { id: string } };
  const igAccountId = igData.instagram_business_account?.id;
  if (!igAccountId) throw new Error("No Instagram Business Account linked");

  const mediaUrls = (item.mediaUrls ?? []) as string[];
  const imageUrl = mediaUrls[0];
  if (!imageUrl) throw new Error("Instagram post requires at least one image URL in mediaUrls");

  // Create media container
  const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption: item.body, access_token: page.access_token }),
  });
  if (!containerRes.ok) throw new Error(`Instagram media container failed: ${await containerRes.text()}`);
  const container = (await containerRes.json()) as { id: string };

  // Publish container
  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: page.access_token }),
  });
  if (!publishRes.ok) throw new Error(`Instagram publish failed: ${await publishRes.text()}`);
}

// ─── TikTok ───────────────────────────────────────────────────────────────────
async function publishToTikTok(item: ContentQueueItem): Promise<void> {
  const token = await getValidToken(item.userId, "tiktok");
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const videoUrl = meta.videoUrl as string | undefined;
  if (!videoUrl) throw new Error("TikTok post requires metadata.videoUrl");

  // Initialize upload
  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      post_info: {
        title: item.title ?? item.body?.slice(0, 150) ?? "ContentFlow Post",
        privacy_level: (meta.privacy as string) ?? "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
    }),
  });
  if (!initRes.ok) throw new Error(`TikTok video init failed: ${await initRes.text()}`);
}

// ─── Reddit ───────────────────────────────────────────────────────────────────
async function publishToReddit(item: ContentQueueItem): Promise<void> {
  const token = await getValidToken(item.userId, "reddit");
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const subreddit = (meta.subreddit as string) ?? "test";

  const body: Record<string, string> = {
    sr: subreddit,
    kind: "self",
    title: item.title ?? item.body?.slice(0, 300) ?? "ContentFlow Post",
    text: item.body ?? "",
    resubmit: "true",
    nsfw: "false",
    spoiler: "false",
  };

  const res = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "ContentFlowAI/1.0",
    },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`Reddit post failed: ${await res.text()}`);
}

// ─── Google Business Profile ──────────────────────────────────────────────────
async function publishToGoogleBusiness(item: ContentQueueItem): Promise<void> {
  const token = await getValidToken(item.userId, "google_business");

  const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!accountsRes.ok) throw new Error(`Failed to fetch Google Business accounts: ${await accountsRes.text()}`);
  const accountsData = (await accountsRes.json()) as { accounts: { name: string }[] };
  const account = accountsData.accounts?.[0];
  if (!account) throw new Error("No Google Business account found");

  const locationsRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const locationsData = (await locationsRes.json()) as { locations: { name: string }[] };
  const location = locationsData.locations?.[0];
  if (!location) throw new Error("No Google Business location found");

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${location.name}/localPosts`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        languageCode: "en-US",
        summary: item.body,
        topicType: "STANDARD",
      }),
    }
  );
  if (!res.ok) throw new Error(`Google Business post failed: ${await res.text()}`);
}

// ─── Main publish dispatcher ──────────────────────────────────────────────────
export async function publishQueueItem(item: ContentQueueItem): Promise<void> {
  await updateContentQueueItemStatus(item.id, "processing");
  try {
    switch (item.platform) {
      case "google_youtube":
        await publishToYouTube(item);
        break;
      case "google_business":
        await publishToGoogleBusiness(item);
        break;
      case "meta_facebook":
        await publishToFacebook(item);
        break;
      case "meta_instagram":
        await publishToInstagram(item);
        break;
      case "tiktok":
        await publishToTikTok(item);
        break;
      case "reddit":
        await publishToReddit(item);
        break;
      default:
        throw new Error(`Unknown platform: ${item.platform}`);
    }
    await updateContentQueueItemStatus(item.id, "published", undefined, new Date());
    await incrementPublishCount(item.userId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Publisher] Failed to publish item ${item.id}:`, msg);
    await updateContentQueueItemStatus(item.id, "failed", msg);
    throw err;
  }
}
