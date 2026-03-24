// Prefer local Docker Nitter first. Override with NITTER_LOCAL if needed.
const LOCAL_NITTER =
  process.env.NITTER_LOCAL || "http://127.0.0.1:3002";

const NITTER_INSTANCES = [
  "https://nitter.net",
  "https://nitter.poast.org",
  "https://nitter.privacyredirect.com",
  "https://xcancel.com",
  "https://nitter.space",
  "https://nitter.catsarch.com",
  "https://nuku.trabun.org",
];

const FETCH_OPTIONS = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html",
  },
  redirect: "follow",
};

let localNitterHealthCache = { ok: null, checkedAt: 0 };
const LOCAL_NITTER_HEALTH_TTL_MS = 30_000;

async function isLocalNitterHealthy() {
  const now = Date.now();
  if (
    localNitterHealthCache.ok != null &&
    now - localNitterHealthCache.checkedAt < LOCAL_NITTER_HEALTH_TTL_MS
  ) {
    return localNitterHealthCache.ok;
  }

  try {
    const healthUrl = `${LOCAL_NITTER.replace(/\/$/, "")}/`;
    const res = await fetch(healthUrl, { ...FETCH_OPTIONS, signal: AbortSignal.timeout(2500) });
    const ok = res.ok;
    localNitterHealthCache = { ok, checkedAt: now };
    return ok;
  } catch {
    localNitterHealthCache = { ok: false, checkedAt: now };
    return false;
  }
}

function decodeHtmlEntities(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

function parseStatNumber(str) {
  if (!str || typeof str !== "string") return 0;
  const s = str.trim().replace(/,/g, "").replace(/\s+/g, "");
  const m = s.match(/^([\d.]+)\s*([KkMm])?$/);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  if (isNaN(n)) return 0;
  const suffix = (m[2] || "").toUpperCase();
  if (suffix === "K") n *= 1000;
  else if (suffix === "M") n *= 1000000;
  return Math.floor(n);
}

let browserPromise = null;
async function getBrowser() {
  if (!browserPromise) {
    const puppeteer = await import("puppeteer");
    browserPromise = puppeteer.default.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1920,1080",
      ],
    });
  }
  return browserPromise;
}

async function fetchWithBrowser(url) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 4000));
    return await page.content();
  } finally {
    await page.close();
  }
}

export async function fetchTweet(username, tweetId) {
  const user = username.replace(/^@/, "").toLowerCase();
  const bases = NITTER_INSTANCES;
  const localBase = LOCAL_NITTER.replace(/\/$/, "");

  // 1) Try local Docker Nitter first (fast/no bot checks)
  if (await isLocalNitterHealthy()) {
    try {
      const url = `${localBase}/${user}/status/${tweetId}`;
      const res = await fetch(url, FETCH_OPTIONS);
      if (res.ok) {
        const html = await res.text();
        if (html && (html.includes("main-tweet") || html.includes("timeline-item"))) {
          return parseNitterTweet(html, user, tweetId, localBase);
        }
        if (html.includes("unavailable") || html.includes("suspended")) {
          const err = new Error("Tweet unavailable or deleted");
          err.statusCode = 404;
          throw err;
        }
      }
    } catch (e) {
      if (e.statusCode === 404) throw e;
      console.warn(`Local Nitter ${localBase} tweet failed, falling back:`, e.message);
    }
  }

  // 2) Fallback: public Nitter instances via Puppeteer
  for (const base of bases) {
    try {
      const url = `${base}/${user}/status/${tweetId}`;
      let html;

      const useFetch =
        base.startsWith("http://localhost") || base.startsWith("http://127.0.0.1");
      if (useFetch) {
        const res = await fetch(url, FETCH_OPTIONS);
        if (!res.ok) continue;
        html = await res.text();
      } else {
        html = await fetchWithBrowser(url);
      }

      if (html && (html.includes("main-tweet") || html.includes("timeline-item"))) {
        return parseNitterTweet(html, user, tweetId, base);
      }
      if (html.includes("unavailable") || html.includes("suspended")) {
        const err = new Error("Tweet unavailable or deleted");
        err.statusCode = 404;
        throw err;
      }
    } catch (e) {
      if (e.statusCode === 404) throw e;
      console.warn(`Nitter ${base} tweet failed:`, e.message);
      continue;
    }
  }

  const err = new Error(
    "Tweet unavailable. Nitter instances may be down or blocked."
  );
  err.statusCode = 503;
  throw err;
}

export async function fetchProfile(screenName) {
  const normalized = screenName.replace(/^@/, "").toLowerCase();
  const bases = NITTER_INSTANCES;
  const localBase = LOCAL_NITTER.replace(/\/$/, "");

  // 1) Try local Docker Nitter first (fast/no bot checks)
  if (await isLocalNitterHealthy()) {
    try {
      const url = `${localBase}/${normalized}`;
      const res = await fetch(url, FETCH_OPTIONS);
      if (res.ok) {
        const html = await res.text();
        if (html && (html.includes("profile-card") || html.includes("profile-bio"))) {
          return parseNitterProfile(html, normalized, localBase);
        }
      }
    } catch (e) {
      console.warn(`Local Nitter ${localBase} profile failed, falling back:`, e.message);
    }
  }

  // 2) Fallback: public Nitter instances via Puppeteer
  for (const base of bases) {
    try {
      const url = `${base}/${normalized}`;
      let html;

      const useFetch =
        base.startsWith("http://localhost") || base.startsWith("http://127.0.0.1");
      if (useFetch) {
        const res = await fetch(url, FETCH_OPTIONS);
        if (!res.ok) continue;
        html = await res.text();
      } else {
        html = await fetchWithBrowser(url);
      }

      if (html && (html.includes("profile-card") || html.includes("profile-bio"))) {
        return parseNitterProfile(html, normalized, base);
      }
    } catch (e) {
      console.warn(`Nitter ${base} profile failed:`, e.message);
      continue;
    }
  }

  const err = new Error(
    "Profile unavailable. Nitter instances may be down or blocked."
  );
  err.statusCode = 503;
  throw err;
}

function parseNitterTweet(html, username, tweetId, base) {
  const baseClean = base.replace(/\/$/, "");

  function resolveUrl(url) {
    if (!url || typeof url !== "string") return "";
    url = url.trim().replace(/^['"]|['"]$/g, "");
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("//")) return "https:" + url;
    if (url.startsWith("/")) return baseClean + url;
    return url;
  }

  function isValidImageUrl(url) {
    return (
      url &&
      url.length > 10 &&
      (url.includes(".") || url.includes("/pic/") || url.startsWith("http"))
    );
  }

  const tweet = {
    id: tweetId,
    text: "",
    createdAt: "",
    user: {
      name: username,
      screenName: username,
      profileImageUrl: "",
      verified: false,
    },
    favoriteCount: 0,
    retweetCount: 0,
    replyCount: 0,
    viewCount: 0,
    mediaDetails: [],
    photos: [],
    video: null,
  };

  const mainBlock =
    html.match(
      /class="main-tweet"[\s\S]*?<div class="tweet-body">([\s\S]*?)<(?:div|footer)/
    ) ||
    html.match(
      /class="timeline-item[^"]*"[^>]*data-username="([^"]+)"[\s\S]*?<div class="tweet-body">([\s\S]*?)<div class="tweet-stats"/
    );
  const bodyHtml = mainBlock ? mainBlock[2] || mainBlock[1] : html;

  const avatarMatch =
    bodyHtml.match(/class="tweet-avatar"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/) ||
    html.match(/class="tweet-avatar"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/);
  if (avatarMatch) {
    const url = resolveUrl(avatarMatch[1]);
    if (isValidImageUrl(url)) tweet.user.profileImageUrl = url;
  }

  const fullnameMatch =
    bodyHtml.match(/class="fullname"[^>]*>([^<]+)</) ||
    html.match(/class="fullname"[^>]*>([^<]+)</);
  if (fullnameMatch) tweet.user.name = fullnameMatch[1].trim();

  const usernameMatch =
    bodyHtml.match(/class="username"[^>]*>[\s\S]*?@([^<]+)</) ||
    html.match(/@([a-zA-Z0-9_]+)/);
  if (usernameMatch)
    tweet.user.screenName = usernameMatch[1].trim().replace(/^@/, "");

  if (html.includes("verified-icon") || html.includes("icon-verified"))
    tweet.user.verified = true;

  const contentMatch =
    bodyHtml.match(/class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/) ||
    html.match(/class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (contentMatch)
    tweet.text = decodeHtmlEntities(
      contentMatch[1].replace(/<[^>]+>/g, "").trim()
    );

  const dateMatch = html.match(
    /class="tweet-published"[^>]*>[\s\S]*?([A-Za-z]+\s+\d{1,2}[,\s]+[A-Za-z0-9:\s]+|[\d]+\s*[A-Za-z]+\s+ago)/
  );
  if (dateMatch) tweet.createdAt = dateMatch[1].trim();

  const mainTweetHtml = html.includes("main-tweet")
    ? html.match(/class="main-tweet"[\s\S]*?(?=class="timeline"|$)/)?.[0] || html
    : html;
  const statsBlock = mainTweetHtml.match(/class="tweet-stats"[\s\S]*?<\/div>/);
  if (statsBlock) {
    const statMatches = statsBlock[0].match(/>\s*([\d,.KkMm\s]+?)\s*</g);
    if (statMatches && statMatches.length >= 3) {
      tweet.replyCount = parseStatNumber(
        statMatches[0].replace(/^>\s*|\s*<$/g, "")
      );
      tweet.retweetCount = parseStatNumber(
        statMatches[1].replace(/^>\s*|\s*<$/g, "")
      );
      tweet.favoriteCount = parseStatNumber(
        statMatches[2].replace(/^>\s*|\s*<$/g, "")
      );
      if (statMatches[3])
        tweet.viewCount = parseStatNumber(
          statMatches[3].replace(/^>\s*|\s*<$/g, "")
        );
    }
  }
  if (
    tweet.replyCount === 0 &&
    tweet.retweetCount === 0 &&
    tweet.favoriteCount === 0
  ) {
    const searchHtml = mainTweetHtml || html;
    const replyM = searchHtml.match(/icon-comment[^>]*>[\s\S]*?([\d,.KkMm]+)/i);
    const retweetM = searchHtml.match(/icon-retweet[^>]*>[\s\S]*?([\d,.KkMm]+)/i);
    const likeM = searchHtml.match(
      /(?:icon-heart|icon-like)[^>]*>[\s\S]*?([\d,.KkMm]+)/i
    );
    if (replyM) tweet.replyCount = parseStatNumber(replyM[1]);
    if (retweetM) tweet.retweetCount = parseStatNumber(retweetM[1]);
    if (likeM) tweet.favoriteCount = parseStatNumber(likeM[1]);
  }

  const imgMatches = html.matchAll(/<img[^>]+src="([^"]+)"[^>]*(?:alt="[^"]*")?/g);
  for (const m of imgMatches) {
    const url = resolveUrl(m[1]);
    if (
      isValidImageUrl(url) &&
      !url.includes("avatar") &&
      !url.includes("profile") &&
      !url.includes("logo")
    ) {
      tweet.photos.push(url);
    }
  }
  const videoMatch =
    html.match(/<video[^>]*>[\s\S]*?<source[^>]+src="([^"]+)"/) ||
    html.match(/<source[^>]+src="([^"]+)"[^>]+type="video\//);
  if (videoMatch) {
    tweet.video = { url: resolveUrl(videoMatch[1]) };
  }

  return tweet;
}

function parseNitterProfile(html, screenName, base = "https://nitter.net") {
  const baseClean = base.replace(/\/$/, "");

  function resolveUrl(url) {
    if (!url || typeof url !== "string") return "";
    url = url.trim().replace(/^['"]|['"]$/g, "");
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("//")) return "https:" + url;
    if (url.startsWith("/")) return baseClean + url;
    return url;
  }

  function isValidImageUrl(url) {
    return (
      url &&
      url.length > 10 &&
      (url.includes(".") || url.includes("/pic/") || url.startsWith("http"))
    );
  }

  const profile = {
    screenName,
    name: screenName,
    description: "",
    profileImageUrl: "",
    bannerUrl: "",
    followersCount: 0,
    followingCount: 0,
    tweetsCount: 0,
    tweets: [],
    location: "",
    joinDate: "",
  };

  const bioMatch = html.match(
    /class="profile-bio"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i
  );
  if (bioMatch)
    profile.description = decodeHtmlEntities(
      bioMatch[1].replace(/<[^>]+>/g, "").trim()
    );

  const nameMatch = html.match(/class="profile-card-fullname"[^>]*>([^<]+)</);
  if (nameMatch) profile.name = nameMatch[1].trim();

  const avatarBlock =
    html.match(
      /class="profile-card-avatar"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/
    ) || html.match(/profile-card-avatar[^>]*href="([^"]+)"[^>]*>/);
  if (avatarBlock) {
    const url = resolveUrl(avatarBlock[1]);
    if (isValidImageUrl(url)) profile.profileImageUrl = url;
  }
  if (!profile.profileImageUrl) {
    const imgAlt = html.match(
      /<img[^>]+class="[^"]*avatar[^"]*"[^>]+src="(https?:\/\/[^"]+)"/
    );
    if (imgAlt && isValidImageUrl(imgAlt[1])) profile.profileImageUrl = imgAlt[1];
  }

  const bannerBlock = html.match(
    /class="profile-banner"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/
  );
  if (bannerBlock) {
    const url = resolveUrl(bannerBlock[1] || bannerBlock[2]);
    if (isValidImageUrl(url)) profile.bannerUrl = url;
  }
  const bannerStyle = html.match(
    /class="profile-banner"[^>]*style="[^"]*url\(([^)]+)\)/
  );
  if (!profile.bannerUrl && bannerStyle) {
    const url = resolveUrl(bannerStyle[1]);
    if (isValidImageUrl(url)) profile.bannerUrl = url;
  }

  const followersLi = html.match(
    /<li[^>]*class="[^"]*followers[^"]*"[^>]*>[\s\S]*?profile-stat-num">\s*([\d,]+)\s*</
  );
  if (followersLi)
    profile.followersCount = parseInt(followersLi[1].replace(/,/g, ""), 10);

  const followingLi = html.match(
    /<li[^>]*class="[^"]*following[^"]*"[^>]*>[\s\S]*?profile-stat-num">\s*([\d,]+)\s*</
  );
  if (followingLi)
    profile.followingCount = parseInt(followingLi[1].replace(/,/g, ""), 10);

  const postsLi = html.match(
    /<li[^>]*class="[^"]*posts[^"]*"[^>]*>[\s\S]*?profile-stat-num">\s*([\d,]+)\s*</
  );
  if (postsLi)
    profile.tweetsCount = parseInt(postsLi[1].replace(/,/g, ""), 10);

  const locMatch =
    html.match(/class="profile-location"[^>]*>[\s\S]*?<a[^>]*>([^<]+)</) ||
    html.match(/class="profile-location"[^>]*>[\s\S]*?<span[^>]*>([^<]+)</);
  if (locMatch) profile.location = locMatch[1].trim();

  const joinMatch = html.match(
    /class="profile-joindate"[^>]*>[\s\S]*?(?:Joined\s+)?([A-Za-z]+\s+\d{4})/i
  );
  if (joinMatch) profile.joinDate = joinMatch[1].trim();

  const tweetBodies = html.split(/class="tweet-body"/i);
  profile.tweets = [];
  for (let i = 1; i < tweetBodies.length && profile.tweets.length < 15; i++) {
    const block = tweetBodies[i];
    const tweet = {
      text: "",
      author: "",
      username: "",
      date: "",
      isRetweet: false,
      stats: {},
    };

    const retweetMatch = block.match(
      /class="retweet-header"[^>]*>[\s\S]*?([^<]+)\s+retweeted/i
    );
    if (retweetMatch) tweet.isRetweet = true;

    const contentMatch = block.match(
      /class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/
    );
    if (contentMatch)
      tweet.text = decodeHtmlEntities(
        contentMatch[1].replace(/<[^>]+>/g, "").trim()
      );

    const fullnameMatch = block.match(/class="fullname"[^>]*>([^<]+)</);
    if (fullnameMatch) tweet.author = fullnameMatch[1].trim();

    const usernameMatch = block.match(
      /class="username"[^>]*>[\s\S]*?@([^<\s]+)/
    );
    if (usernameMatch) tweet.username = usernameMatch[1].trim();

    const dateMatch =
      block.match(/class="tweet-date"[^>]*>[\s\S]*?<a[^>]*>([^<]+)</) ||
      block.match(/title="([^"]+)"/);
    if (dateMatch) tweet.date = dateMatch[1].trim();

    const statsBlock = block.match(/class="tweet-stats"[\s\S]*?<\/div>/);
    if (statsBlock) {
      const statMatches = statsBlock[0].match(/>\s*([\d,.KkMm\s]+?)\s*</g);
      if (statMatches && statMatches.length >= 3) {
        tweet.stats = {
          replies: parseStatNumber(
            statMatches[0].replace(/^>\s*|\s*<$/g, "")
          ),
          retweets: parseStatNumber(
            statMatches[1].replace(/^>\s*|\s*<$/g, "")
          ),
          likes: parseStatNumber(
            statMatches[2].replace(/^>\s*|\s*<$/g, "")
          ),
          views: statMatches[3]
            ? parseStatNumber(statMatches[3].replace(/^>\s*|\s*<$/g, ""))
            : 0,
        };
      }
    }
    if (!tweet.stats.replies && !tweet.stats.retweets && !tweet.stats.likes) {
      const r = block.match(/icon-comment[^>]*>[\s\S]*?([\d,.KkMm]+)/i);
      const rt = block.match(/icon-retweet[^>]*>[\s\S]*?([\d,.KkMm]+)/i);
      const l = block.match(/(?:icon-heart|icon-like)[^>]*>[\s\S]*?([\d,.KkMm]+)/i);
      if (r || rt || l) {
        tweet.stats = {
          replies: r ? parseStatNumber(r[1]) : 0,
          retweets: rt ? parseStatNumber(rt[1]) : 0,
          likes: l ? parseStatNumber(l[1]) : 0,
          views: 0,
        };
      }
    }

    if (tweet.text && tweet.text.length > 1) {
      profile.tweets.push(tweet);
    }
  }

  return profile;
}
