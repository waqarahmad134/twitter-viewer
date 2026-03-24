"use client";

import { useState } from "react";

const EXAMPLE = `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Twitter Viewer",
  "url": "https://example.com/"
}`;

export default function SchemaForm({
  initial = {},
  submitLabel,
  saving,
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(initial.name || "");
  const [schemaJson, setSchemaJson] = useState(
    initial.schemaJson || EXAMPLE
  );
  const [isActive, setIsActive] = useState(
    initial.isActive !== undefined ? Boolean(initial.isActive) : true
  );
  const [sortOrder, setSortOrder] = useState(
    Number.isFinite(Number(initial.sortOrder)) ? Number(initial.sortOrder) : 0
  );

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      name: name.trim() || "Schema",
      schemaJson,
      isActive,
      sortOrder,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Label (admin only)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          placeholder="e.g. Organization, WebSite, FAQ"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          JSON-LD (complete JSON object or array)
        </label>
        <textarea
          value={schemaJson}
          onChange={(e) => setSchemaJson(e.target.value)}
          rows={18}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono"
          spellCheck={false}
        />
        <p className="mt-1 text-xs text-zinc-500">
          Must be valid JSON. Saved as-is after normalization (parsed + re-stringified).
        </p>
      </div>

      <div className="flex flex-wrap gap-6 items-center">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active (output on public site)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-700">Sort order</span>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-x-blue text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitLabel || "Save"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
