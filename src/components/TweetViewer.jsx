"use client";

import { useState, useEffect } from "react";
import { extractTweetUrlParts } from "../utils/parsers";

export default function TweetViewer({ input }) {
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
    const parts = extractTweetUrlParts(input);
    if (!parts) {
      setError("Invalid tweet URL. Use format: https://x.com/username/status/1234567890");
      setLoading(false);
      return;
    }

    fetch(`/api/tweet?url=${encodeURIComponent(input)}`)
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
        <div className="p-4 flex gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
          </div>
        </div>
        <div className="px-4 pb-4 space-y-2">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-4/5" />
        </div>
        <div className="px-4 py-4 border-t border-slate-100 flex gap-6">
          <div className="h-4 bg-slate-100 rounded w-20" />
          <div className="h-4 bg-slate-100 rounded w-20" />
          <div className="h-4 bg-slate-100 rounded w-20" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <p className="font-semibold">Error</p>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const {
    id,
    user,
    text,
    createdAt,
    favoriteCount,
    retweetCount,
    replyCount,
    viewCount,
    photos,
    video,
  } = data;

  const tweetUrl =
    id && user?.screenName
      ? `https://x.com/${user.screenName}/status/${id}`
      : null;
  const mediaUrls = [];

  if (photos?.length) {
    photos.forEach((url) => {
      mediaUrls.push({
        url: typeof url === "string" ? url : url.url || url.media_url_https,
        type: "photo",
      });
    });
  }
  if (video?.url) mediaUrls.push({ url: video.url, type: "video" });

  const formatDate = (d) => {
    if (!d) return "";
    try {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime()))
        return parsed.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
    } catch {}
    return d;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt=""
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
            {(user?.name || user?.screenName || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-x-black">{user?.name}</span>
            {user?.verified ? <span className="text-x-blue">✓</span> : null}
            <span className="text-x-gray">@{user?.screenName}</span>
          </div>
          <p className="text-x-gray text-sm">{formatDate(createdAt)}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-x-black whitespace-pre-wrap break-words">{text}</p>
      </div>

      {/* Media */}
      {mediaUrls.length > 0 ? (
        <div className="border-t border-slate-100">
          {mediaUrls.map((m, i) =>
            m.type === "video" ? (
              <video key={i} src={m.url} controls className="w-full max-h-96" />
            ) : (
              <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={m.url}
                  alt=""
                  className="w-full max-h-96 object-contain bg-slate-100"
                />
              </a>
            )
          )}
        </div>
      ) : null}

      {/* Stats */}
      <div className="px-4 py-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-x-gray">
        <div className="flex gap-6">
          <span>
            <strong className="text-x-black">{replyCount}</strong> Replies
          </span>
          <span>
            <strong className="text-x-black">{retweetCount}</strong> Retweets
          </span>
          <span>
            <strong className="text-x-black">{favoriteCount}</strong> Likes
          </span>
          {viewCount > 0 ? (
            <span>
              <strong className="text-x-black">{viewCount.toLocaleString()}</strong> Views
            </span>
          ) : null}
        </div>
        {tweetUrl ? (
          <div className="ml-auto flex gap-3">
            <button
              onClick={() => copyLink(tweetUrl)}
              className="text-x-blue hover:underline font-medium text-sm"
            >
              {copied ? "✓ Copied!" : "Copy link"}
            </button>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-x-blue hover:underline font-medium text-sm"
            >
              Open on X →
            </a>
          </div>
        ) : null}
      </div>

      {/* Download media links */}
      {mediaUrls.length > 0 ? (
        <div className="px-4 pb-4 flex gap-3 -mt-2">
          {mediaUrls.map((m, i) => (
            <a
              key={i}
              href={m.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-x-blue hover:underline"
            >
              Download {m.type === "video" ? "video" : "image"} {i + 1}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

