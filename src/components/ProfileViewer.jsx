"use client";

import { useState, useEffect } from "react";
import { extractUsername } from "../utils/parsers";

export default function ProfileViewer({ input }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const copyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const handle = extractUsername(input);
    if (!handle) {
      setError("Invalid username. Use @username or https://x.com/username");
      setLoading(false);
      return;
    }

    fetch(`/api/profile?handle=${encodeURIComponent(handle)}`)
      .then((res) => {
        if (!res.ok)
          return res.json().then((e) => {
            throw new Error(e.error || e.message || "Failed to fetch");
          });
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [input]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
        <div className="h-24 bg-slate-200" />
        <div className="px-4 -mt-12 relative">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-200" />
          <div className="mt-4 space-y-2">
            <div className="h-5 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-100 rounded w-1/4" />
          </div>
          <div className="mt-4 flex gap-6">
            <div className="h-4 bg-slate-100 rounded w-24" />
            <div className="h-4 bg-slate-100 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        {/* <p className="font-semibold text-amber-800">Profile Unavailable</p>
        <p className="text-amber-700 mt-1">{error}</p>
        <p className="text-amber-600 text-sm mt-2 mb-4">
          Profile data relies on Nitter instances, which may be blocked or
          down. Try again later.
        </p> */}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-lg font-medium text-amber-800 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const {
    screenName,
    name,
    description,
    profileImageUrl,
    bannerUrl,
    followersCount,
    followingCount,
    tweetsCount,
    tweets,
    location,
    joinDate,
  } = data;

  const initials =
    (name || screenName)
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Banner */}
      {bannerUrl ? (
        <div className="h-32 md:h-40 bg-slate-200">
          <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-24 bg-slate-200" />
      )}

      {/* Profile header */}
      <div className="px-4 -mt-12 relative">
        <div className="relative w-24 h-24 rounded-full border-4 border-white shadow overflow-hidden bg-slate-200 flex items-center justify-center">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt=""
              className="w-full h-full object-cover absolute inset-0"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement?.querySelector(".avatar-fallback")?.classList.remove("hidden");
              }}
            />
          ) : null}
          <span
            className={`avatar-fallback text-2xl font-bold text-slate-500 ${
              profileImageUrl ? "hidden" : ""
            }`}
            aria-hidden
          >
            {initials}
          </span>
        </div>
        <h1 className="font-display text-xl font-bold mt-4">{name || screenName}</h1>
        <p className="text-x-gray">@{screenName}</p>
        {description ? (
          <p className="mt-3 text-x-black whitespace-pre-wrap">{description}</p>
        ) : null}

        {location || joinDate ? (
          <div className="mt-2 flex flex-wrap gap-4 text-x-gray text-sm">
            {location ? <span>{location}</span> : null}
            {joinDate ? <span>Joined {joinDate}</span> : null}
          </div>
        ) : null}

        {/* Stats */}
        <div className="flex gap-6 mt-4 text-x-gray">
          <span>
            <strong className="text-x-black">
              {followersCount.toLocaleString()}
            </strong>{" "}
            Followers
          </span>
          <span>
            <strong className="text-x-black">
              {followingCount.toLocaleString()}
            </strong>{" "}
            Following
          </span>
          {tweetsCount > 0 ? (
            <span>
              <strong className="text-x-black">{tweetsCount.toLocaleString()}</strong>{" "}
              Tweets
            </span>
          ) : null}
        </div>

        {/* Download avatar/banner */}
        <div className="mt-4 flex gap-3">
          {profileImageUrl ? (
            <a
              href={profileImageUrl}
              download={`${screenName}-avatar.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-x-blue hover:underline"
            >
              Download Avatar
            </a>
          ) : null}
          {bannerUrl ? (
            <a
              href={bannerUrl}
              download={`${screenName}-banner.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-x-blue hover:underline"
            >
              Download Banner
            </a>
          ) : null}
        </div>
      </div>

      {/* Timeline tweets */}
      {tweets?.length > 0 ? (
        <div className="border-t border-slate-200 mt-6">
          <h2 className="font-display font-semibold px-4 py-3 border-b border-slate-100">Tweets</h2>
          <ul className="divide-y divide-slate-100">
            {tweets.map((t, i) => (
              <li key={i} className="px-4 py-4 hover:bg-slate-50/50 transition-colors">
                {t.isRetweet ? (
                  <p className="text-xs text-x-gray mb-1 flex items-center gap-1">
                    <span className="text-green-600">↻</span> {name || screenName} retweeted
                  </p>
                ) : null}
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-x-black">
                        {t.author || name || screenName}
                      </span>
                      {t.username ? <span className="text-x-gray text-sm">@{t.username}</span> : null}
                      {t.date ? <span className="text-x-gray text-sm">· {t.date}</span> : null}
                    </div>
                    <p className="text-x-black mt-1 whitespace-pre-wrap break-words">
                      {t.text || "—"}
                    </p>
                    {t.stats ? (
                      <div className="flex flex-wrap gap-4 mt-2 text-x-gray text-sm">
                        <span>
                          <strong className="text-x-black">{(t.stats.replies ?? 0).toLocaleString()}</strong>{" "}
                          replies
                        </span>
                        <span>
                          <strong className="text-x-black">{(t.stats.retweets ?? 0).toLocaleString()}</strong>{" "}
                          retweets
                        </span>
                        <span>
                          <strong className="text-x-black">{(t.stats.likes ?? 0).toLocaleString()}</strong>{" "}
                          likes
                        </span>
                        {t.stats.views && Number(t.stats.views ?? 0) > 0 ? (
                          <span>
                            <strong className="text-x-black">{(t.stats.views || 0).toLocaleString()}</strong>{" "}
                            views
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Link to X */}
      <div className="px-4 pb-6 flex flex-wrap gap-3">
        <button
          onClick={() => copyLink(`https://x.com/${screenName}`)}
          className="text-x-blue hover:underline font-medium"
        >
          {copied ? "✓ Copied!" : "Copy link"}
        </button>
        <a
          href={`https://x.com/${screenName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-x-blue hover:underline font-medium"
        >
          View on X →
        </a>
      </div>
    </div>
  );
}

