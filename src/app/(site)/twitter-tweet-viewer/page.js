"use client";

import { useState } from "react";
import TweetViewer from "@/components/TweetViewer";

export default function TweetViewerPage() {
  const [input, setInput] = useState("");
  const [submitValue, setSubmitValue] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) setSubmitValue(input.trim());
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-x-black mb-2">
          Twitter Tweet Viewer
        </h1>
        <p className="text-x-gray">
          View tweets instantly with engagement stats and media. Paste a tweet URL below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste tweet URL: https://x.com/username/status/1234567890"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-x-blue focus:border-transparent outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-x-blue hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            View Tweet
          </button>
        </div>
      </form>

      {submitValue ? <TweetViewer input={submitValue} /> : null}
    </div>
  );
}

