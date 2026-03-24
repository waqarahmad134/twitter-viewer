"use client";

import { useState } from "react";
import ProfileViewer from "@/components/ProfileViewer";

export default function ProfileViewerPage() {
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
          Twitter Profile Viewer
        </h1>
        <p className="text-x-gray">
          Browse any Twitter profile anonymously. Paste @username or profile URL below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste @username or https://x.com/username"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-x-blue focus:border-transparent outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-x-blue hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            View Profile
          </button>
        </div>
      </form>

      {submitValue ? <ProfileViewer input={submitValue} /> : null}
    </div>
  );
}

