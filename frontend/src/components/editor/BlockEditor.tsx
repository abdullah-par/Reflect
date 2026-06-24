import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ContentBlock } from '../../api';
import { BlockNode } from './BlockNode';
import { SlashCommandMenu } from './SlashCommandMenu';

interface BlockEditorProps {
  initialBlocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  readOnly?: boolean;
  typewriterMode?: boolean;
}

export function BlockEditor({ initialBlocks, onChange, readOnly, typewriterMode }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(
    initialBlocks.length > 0 ? initialBlocks : [{ id: uuidv4(), type: 'paragraph', text: '', marks: [] }]
  );
  
  // Track slash command state
  const [slashMenu, setSlashMenu] = useState<{ x: number, y: number, query: string, blockId: string } | null>(null);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!typewriterMode) return;

    const handleInputOrSelection = () => {
      if (slashMenu !== null) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().length > 0) return;

      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0).cloneRange();
      let rect = range.getBoundingClientRect();

      if (rect.top === 0 && rect.bottom === 0) {
        const element = range.startContainer.nodeType === Node.ELEMENT_NODE
          ? (range.startContainer as Element)
          : range.startContainer.parentElement;
        if (element) {
          rect = element.getBoundingClientRect();
        }
      }

      if (rect.top === 0 && rect.bottom === 0) return;

      const targetY = window.innerHeight * 0.40;
      const currentY = rect.top;
      const diff = currentY - targetY;

      if (Math.abs(diff) > 2) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
          window.scrollBy(0, diff);
        } else {
          const start = window.scrollY;
          const targetScrollY = start + diff;
          const duration = 100;
          const startTime = performance.now();

          const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = progress * (2 - progress);
            window.scrollTo(0, start + (targetScrollY - start) * ease);
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('input', handleInputOrSelection);
      container.addEventListener('keydown', handleInputOrSelection);
    }
    return () => {
      if (container) {
        container.removeEventListener('input', handleInputOrSelection);
        container.removeEventListener('keydown', handleInputOrSelection);
      }
    };
  }, [typewriterMode, slashMenu]);

  useEffect(() => {
    onChange(blocks);
  }, [blocks, onChange]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateBlock = useCallback((id: string, updates: Partial<ContentBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const splitBlock = useCallback((id: string, newText: string, newMarks: any[]) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      
      const currentBlock = prev[idx];
      const newBlock: ContentBlock = {
        id: uuidv4(),
        type: currentBlock.type === 'heading1' || currentBlock.type === 'heading2' ? 'paragraph' : currentBlock.type,
        text: newText,
        marks: newMarks,
        // Optional: inherit font settings
        fontFamily: currentBlock.fontFamily,
        fontSize: currentBlock.fontSize
      };
      
      setFocusBlockId(newBlock.id);
      
      const newBlocks = [...prev];
      newBlocks.splice(idx + 1, 0, newBlock);
      return newBlocks;
    });
  }, []);

  const mergePrevious = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx <= 0) return prev; // Cannot merge first block
      
      const currentBlock = prev[idx];
      const prevBlock = prev[idx - 1];
      
      // We need to append currentBlock's text to prevBlock, and shift marks.
      const prevTextLen = prevBlock.text.length;
      const shiftedMarks = (currentBlock.marks || []).map(m => ({
        ...m,
        start: m.start + prevTextLen,
        end: m.end + prevTextLen
      }));
      
      const mergedBlock: ContentBlock = {
        ...prevBlock,
        text: prevBlock.text + currentBlock.text,
        marks: [...(prevBlock.marks || []), ...shiftedMarks]
      };
      
      const newBlocks = [...prev];
      newBlocks[idx - 1] = mergedBlock;
      newBlocks.splice(idx, 1);
      
      // Focus previous block at the precise merge point
      setTimeout(() => {
        focusEditorNode(mergedBlock.id, prevTextLen);
      }, 0);
      
      return newBlocks;
    });
  }, []);

  const navigateBlock = useCallback((direction: 'up' | 'down', fromIndex: number, cursorAt?: 'start' | 'end') => {
    const targetIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (targetIndex >= 0 && targetIndex < blocks.length) {
      focusEditorNode(blocks[targetIndex].id, cursorAt);
    }
  }, [blocks]);

  const focusEditorNode = (id: string, position: 'start' | 'end' | number = 'end') => {
    if (!containerRef.current) return;
    // Find the React Node via DOM
    const blockRows = containerRef.current.querySelectorAll('.block-row');
    for (let i = 0; i < blockRows.length; i++) {
      const row = blockRows[i] as any;
      const editor = row.editor;
      if (editor && blocks[i].id === id) {
        if (typeof position === 'number') {
          editor.commands.focus(position + 1); // +1 because Tiptap document pos 0 is before paragraph node
        } else {
          editor.commands.focus(position);
        }
        break;
      }
    }
  };

  const executeSlashCommand = useCallback((type: string) => {
    if (!slashMenu) return;
    
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === slashMenu.blockId);
      if (idx === -1) return prev;
      
      const newBlocks = [...prev];
      // strip the / command text (e.g. "/he")
      const newText = ""; 
      
      newBlocks[idx] = {
        ...newBlocks[idx],
        type,
        text: newText,
        marks: []
      };
      
      // Focus after changing type
      setTimeout(() => focusEditorNode(slashMenu.blockId, 'end'), 0);
      return newBlocks;
    });
    setSlashMenu(null);
  }, [slashMenu]);

  // If readOnly, just render content
  if (readOnly) {
    return (
      <div className="block-editor readonly">
        {blocks.map(block => (
          <BlockNode 
            key={block.id} 
            block={block} 
            index={0} 
            onUpdate={() => {}} 
            onSplit={() => {}} 
            onMergePrevious={() => {}} 
            onNavigation={() => {}} 
            onSlashCommand={() => {}} 
            onCloseSlashCommand={() => {}} 
            isActiveSlashTarget={false}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="block-editor" ref={containerRef}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, index) => (
            <BlockNode
              key={block.id}
              block={block}
              index={index}
              autoFocus={focusBlockId === block.id}
              onUpdate={updateBlock}
              onSplit={splitBlock}
              onMergePrevious={mergePrevious}
              onNavigation={navigateBlock}
              isActiveSlashTarget={slashMenu?.blockId === block.id}
              onSlashCommand={(x, y, query, blockId) => setSlashMenu({ x, y, query, blockId })}
              onCloseSlashCommand={() => setSlashMenu(null)}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      {slashMenu && (
        <SlashCommandMenu
          x={slashMenu.x}
          y={slashMenu.y}
          query={slashMenu.query}
          onSelect={executeSlashCommand}
          onClose={() => setSlashMenu(null)}
        />
      )}
    </div>
  );
}
