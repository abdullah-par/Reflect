import { ContentBlock, ContentBlockMark } from '../../api';
import { JSONContent } from '@tiptap/react';

// Convert our schema's marks to Tiptap HTML
export function blockToHTML(block: ContentBlock): string {
  if (!block.marks || block.marks.length === 0) {
    // Escape HTML characters in plain text to avoid injection or breaking parsing
    return escapeHtml(block.text);
  }

  // We need to inject tags at the start and end indices.
  // This is best done by building an array of events (open/close tag) at specific indices.
  const events: { index: number; type: 'open' | 'close'; tag: string }[] = [];
  block.marks.forEach(mark => {
    let tag = '';
    if (mark.type === 'bold') tag = 'strong';
    else if (mark.type === 'italic') tag = 'em';
    else if (mark.type === 'underline') tag = 'u';
    
    if (tag) {
      events.push({ index: mark.start, type: 'open', tag });
      events.push({ index: mark.end, type: 'close', tag });
    }
  });

  // Sort events:
  // For same index: closing tags should process before opening tags? 
  // Wait, if it's the same index, we want closing tags of earlier marks to close, then opening tags.
  // We can just rely on the browser to fix badly nested tags if we just insert them.
  // A robust way is to build a tree, but since Tiptap parses HTML flexibly, inserting raw tags might work perfectly.
  events.sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    if (a.type === b.type) return 0;
    return a.type === 'close' ? -1 : 1; // close before open
  });

  let html = '';
  let lastIndex = 0;
  events.forEach(ev => {
    html += escapeHtml(block.text.substring(lastIndex, ev.index));
    html += ev.type === 'open' ? `<${ev.tag}>` : `</${ev.tag}>`;
    lastIndex = ev.index;
  });
  html += escapeHtml(block.text.substring(lastIndex));
  return html;
}

// Convert Tiptap JSON content to our schema (text string + marks array)
export function tiptapToSchemaTextAndMarks(content?: JSONContent[]): { text: string; marks: ContentBlockMark[] } {
  let text = '';
  const marks: ContentBlockMark[] = [];

  if (!content) return { text, marks };

  content.forEach(node => {
    if (node.type === 'text' && node.text) {
      const start = text.length;
      text += node.text;
      const end = text.length;

      if (node.marks) {
        node.marks.forEach((mark: any) => {
          let markType = '';
          if (mark.type === 'bold') markType = 'bold';
          else if (mark.type === 'italic') markType = 'italic';
          else if (mark.type === 'underline') markType = 'underline';
          
          if (markType) {
            marks.push({ type: markType, start, end });
          }
        });
      }
    } else if (node.type === 'hardBreak') {
       text += '\n';
    }
  });

  // Consolidate adjacent identical marks
  const consolidatedMarks: ContentBlockMark[] = [];
  const marksByType = new Map<string, ContentBlockMark[]>();
  
  marks.forEach(m => {
    if (!marksByType.has(m.type)) marksByType.set(m.type, []);
    marksByType.get(m.type)!.push(m);
  });

  marksByType.forEach((typeMarks, type) => {
    typeMarks.sort((a, b) => a.start - b.start);
    if (typeMarks.length === 0) return;
    
    let current = { ...typeMarks[0] };
    for (let i = 1; i < typeMarks.length; i++) {
      const next = typeMarks[i];
      if (current.end === next.start) {
        current.end = next.end; // merge
      } else {
        consolidatedMarks.push(current);
        current = { ...next };
      }
    }
    consolidatedMarks.push(current);
  });

  return { text, marks: consolidatedMarks };
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
