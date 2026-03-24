"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";

function ToolbarButton({ onClick, active, disabled, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded px-2.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-zinc-800 text-white"
          : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function MenuBar({ editor }) {
  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href || "https://";
    const url = window.prompt("Link URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL", "https://");
    if (!url) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 bg-zinc-50 px-2 py-2">
      <ToolbarButton
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
      >
        H3
      </ToolbarButton>
      <span className="mx-1 h-6 w-px bg-zinc-200" aria-hidden />
      <ToolbarButton
        title="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
      >
        S
      </ToolbarButton>
      <span className="mx-1 h-6 w-px bg-zinc-200" aria-hidden />
      <ToolbarButton
        title="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        “ ”
      </ToolbarButton>
      <ToolbarButton
        title="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
      >
        {"</>"}
      </ToolbarButton>
      <span className="mx-1 h-6 w-px bg-zinc-200" aria-hidden />
      <ToolbarButton title="Link" onClick={setLink} active={editor.isActive("link")}>
        Link
      </ToolbarButton>
      <ToolbarButton title="Image" onClick={addImage} active={false}>
        Image
      </ToolbarButton>
      <span className="mx-1 h-6 w-px bg-zinc-200" aria-hidden />
      <ToolbarButton
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        Undo
      </ToolbarButton>
      <ToolbarButton
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        Redo
      </ToolbarButton>
    </div>
  );
}

/**
 * WordPress-style rich text (TipTap / ProseMirror). Works with React 19 — no findDOMNode.
 * Outputs HTML for `content_html` on the server.
 */
export default function PostContentEditor({
  value,
  onChange,
  placeholder = "Write your post…",
}) {
  const fromSelf = useRef(false);

  const editor = useEditor(
    {
      shouldRerenderOnTransaction: true,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
        }),
        Image.configure({ allowBase64: false }),
        Placeholder.configure({ placeholder }),
      ],
      content: "",
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            "min-h-[280px] px-4 py-3 outline-none max-w-none text-[15px] leading-relaxed text-zinc-900 " +
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 " +
            "[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:text-zinc-700 " +
            "[&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:text-sm [&_code]:font-mono " +
            "[&_pre]:rounded-lg [&_pre]:bg-zinc-900 [&_pre]:p-3 [&_pre]:text-zinc-100 [&_pre]:overflow-x-auto " +
            "[&_a]:text-x-blue [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2",
        },
      },
      onUpdate: ({ editor: ed }) => {
        fromSelf.current = true;
        onChange(ed.getHTML());
      },
    },
    []
  );

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (fromSelf.current) {
      fromSelf.current = false;
      return;
    }
    const next = value || "";
    if (next === editor.getHTML()) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 min-h-[320px] animate-pulse" />
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="post-tiptap-editor bg-white" />
    </div>
  );
}
