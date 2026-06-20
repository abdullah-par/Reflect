import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { GripVertical, Type, Bold, Italic, Underline as UnderlineIcon } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContentBlock } from '../../api';
import { blockToHTML, tiptapToSchemaTextAndMarks } from './utils';

const FONT_OPTIONS = [
  'Crimson Text', 'Lora', 'Playfair Display', 'Libre Baskerville',
  'Merriweather', 'Source Serif 4', 'Courier Prime', 'Inter'
];

interface BlockNodeProps {
  block: ContentBlock;
  index: number;
  autoFocus?: boolean;
  onUpdate: (id: string, updates: Partial<ContentBlock>) => void;
  onSplit: (id: string, newText: string, newMarks: any[]) => void;
  onMergePrevious: (id: string) => void;
  onNavigation: (direction: 'up' | 'down', fromIndex: number, cursorAt?: 'start' | 'end') => void;
  onSlashCommand: (x: number, y: number, query: string, blockId: string) => void;
  onCloseSlashCommand: () => void;
  isActiveSlashTarget: boolean;
}

export function BlockNode({
  block, index, autoFocus,
  onUpdate, onSplit, onMergePrevious, onNavigation,
  onSlashCommand, onCloseSlashCommand, isActiveSlashTarget
}: BlockNodeProps) {
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // We handle block types in React, not Tiptap
        bulletList: false,
        orderedList: false,
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: block.type === 'paragraph' ? "Type '/' for commands" : 
                     block.type === 'heading1' ? "Heading 1" : 
                     block.type === 'heading2' ? "Heading 2" : "",
        showOnlyWhenEditable: true,
        emptyEditorClass: 'is-editor-empty',
      })
    ],
    content: blockToHTML(block),
    onUpdate: ({ editor }: any) => {
      const { text, marks } = tiptapToSchemaTextAndMarks(editor.getJSON().content);
      onUpdate(block.id, { text, marks });
      
      // Slash command logic
      const textContent = editor.getText();
      if (textContent.startsWith('/')) {
        const query = textContent.slice(1);
        const { left, top } = editor.view.coordsAtPos(editor.state.selection.from);
        onSlashCommand(left, top, query, block.id);
      } else if (isActiveSlashTarget) {
        onCloseSlashCommand();
      }
    },
    editorProps: {
      handleKeyDown: (view: any, event: any) => {
        if (isActiveSlashTarget) {
          if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key)) {
            return true; // Let slash menu handle it
          }
        }
        
        const { state } = view;
        const { selection } = state;
        const { empty, $from } = selection;
        const textContent = view.state.doc.textContent;

        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          if (isActiveSlashTarget) return true; // prevent enter splitting if menu open
          
          if (block.type === 'divider') {
             onSplit(block.id, "", []);
             return true;
          }

          // Split block
          const endPos = state.doc.content.size;
          let newText = '';
          let newMarks: any[] = [];
          
          if ($from.pos < endPos) {
             const restJson = editor?.getJSON()?.content?.[0]?.content || [];
             // Complex splitting of JSON is hard, easiest way: 
             // We can just rely on editor.getText() for simplicity, or delete the rest here
             const slice = state.doc.slice($from.pos);
             const parsed = tiptapToSchemaTextAndMarks(slice.toJSON().content);
             newText = parsed.text;
             newMarks = parsed.marks;
             
             // Remove the rest from this editor
             view.dispatch(state.tr.delete($from.pos, endPos));
          }
          
          onSplit(block.id, newText, newMarks);
          return true;
        }

        if (event.key === 'Backspace' && empty && $from.pos === 1) {
          event.preventDefault();
          onMergePrevious(block.id);
          return true;
        }

        if (event.key === 'ArrowUp' && empty) {
          // If at start, move up
          const lineStart = view.coordsAtPos(1).top;
          const cursorPos = view.coordsAtPos($from.pos).top;
          if (Math.abs(lineStart - cursorPos) < 5) {
             event.preventDefault();
             onNavigation('up', index, 'end');
             return true;
          }
        }

        if (event.key === 'ArrowDown' && empty) {
          // If at end, move down
          const endPos = state.doc.content.size;
          const lineEnd = view.coordsAtPos(endPos).top;
          const cursorPos = view.coordsAtPos($from.pos).top;
          if (Math.abs(lineEnd - cursorPos) < 5) {
             event.preventDefault();
             onNavigation('down', index, 'start');
             return true;
          }
        }

        return false;
      }
    }
  }, [block.id]);

  useEffect(() => {
    if (editor && autoFocus) {
      setTimeout(() => {
        editor.commands.focus('end');
      }, 0);
    }
  }, [editor, autoFocus]);

  // Expose editor methods via a ref attached to the DOM element for cross-block communication
  useEffect(() => {
    if (containerRef.current && editor) {
      (containerRef.current as any).editor = editor;
    }
  }, [editor]);

  // Clear slash command if block becomes empty or no longer starts with slash
  useEffect(() => {
    if (!editor) return;
    const text = editor.getText();
    if (isActiveSlashTarget && !text.startsWith('/')) {
      onCloseSlashCommand();
    }
  }, [block.text, isActiveSlashTarget, editor, onCloseSlashCommand]);

  const blockStyle: React.CSSProperties = {
    fontFamily: block.fontFamily || 'inherit',
    fontSize: block.fontSize ? `${block.fontSize}px` : 'inherit',
  };

  const renderContent = () => {
    if (block.type === 'divider') {
      return <hr className="block-divider" style={blockStyle} />;
    }
    
    const Component = 
      block.type === 'heading1' ? 'h1' : 
      block.type === 'heading2' ? 'h2' : 
      block.type === 'quote' ? 'blockquote' : 'div';
      
    const content = (
      <Component className={`block-content block-${block.type}`} style={blockStyle}>
        <EditorContent editor={editor} />
        {editor && (
          <BubbleMenu editor={editor} className="bubble-menu">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'is-active' : ''}
              aria-label="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'is-active' : ''}
              aria-label="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'is-active' : ''}
              aria-label="Underline"
            >
              <UnderlineIcon size={14} />
            </button>
          </BubbleMenu>
        )}
      </Component>
    );

    if (block.type === 'bullet') {
      return <ul className="block-list"><li style={blockStyle}>{content}</li></ul>;
    }
    if (block.type === 'numbered') {
      return <ol className="block-list"><li style={blockStyle}>{content}</li></ol>;
    }

    return content;
  };

  return (
    <div 
      ref={(node) => {
        containerRef.current = node;
        setNodeRef(node);
      }}
      className="block-row"
      style={style}
    >
      <div className="block-gutter">
        <div className="block-gutter-actions">
          <button 
            className="gutter-btn drag-handle" 
            ref={setActivatorNodeRef} 
            {...attributes} 
            {...listeners}
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </button>
          <div className="font-override-container">
            <button 
              className="gutter-btn font-override-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Override Font"
            >
              <Type size={14} />
            </button>
            {showSettings && (
              <div className="font-override-popover">
                <select 
                  value={block.fontFamily || ''} 
                  onChange={e => onUpdate(block.id, { fontFamily: e.target.value || undefined })}
                >
                  <option value="">Default Font</option>
                  {FONT_OPTIONS.map(font => (
                    <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                  ))}
                </select>
                <div className="font-size-stepper">
                  <button onClick={() => onUpdate(block.id, { fontSize: Math.max(12, (block.fontSize || 16) - 1) })}>-</button>
                  <span>{block.fontSize || 'Default'}</span>
                  <button onClick={() => onUpdate(block.id, { fontSize: Math.min(32, (block.fontSize || 16) + 1) })}>+</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="block-main">
        {renderContent()}
      </div>
    </div>
  );
}
