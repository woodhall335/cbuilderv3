// src/components/RichEditor.tsx
'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

export default function RichEditor({
  value,
  onChange,
  placeholder = 'Write…',
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true }),
    ],
    // Avoid SSR/hydration mismatch
    immediatelyRender: false,
    content: '', // set after mount below
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[280px] p-3',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Set initial content on the client, without triggering onUpdate
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return <div className="text-sm text-neutral-500">Loading editor…</div>;

  return (
    <div className="rounded border bg-white">
      <div className="flex flex-wrap gap-2 border-b p-2 text-sm">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-neutral-200' : ''}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-neutral-200' : ''}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-neutral-200' : ''}`}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-2 py-1 rounded ${editor.isActive('paragraph') ? 'bg-neutral-200' : ''}`}
        >
          ¶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-neutral-200' : ''}`}
        >
          H2
        </button>
      </div>

      <EditorContent editor={editor} className="min-h-[280px]" />
    </div>
  );
}
