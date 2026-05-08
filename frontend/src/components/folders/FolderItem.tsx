'use client';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';
import { useDeleteFolder } from '@/hooks/useFolders';
import type { Folder } from '@/hooks/useFolders';
import { Button } from '@/components/ui/button';
import { RenameFolderDialog } from './RenameFolderDialog';
import { toast } from '@/hooks/useToast';

export function FolderItem({ folder }: { folder: Folder }) {
  const { activeFolderId, setActiveFolderId } = useUIStore();
  const deleteFolder = useDeleteFolder();
  const [showMenu, setShowMenu] = useState(false);
  const [showRename, setShowRename] = useState(false);

  const isActive = activeFolderId === folder.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = async () => {
    if (folder.isDefault) return;
    if (!confirm(`Delete "${folder.name}"? Meetings will be moved to All Meetings.`)) return;
    try {
      await deleteFolder.mutateAsync(folder.id);
      if (isActive) setActiveFolderId(null);
    } catch {
      toast({ title: 'Could not delete folder', variant: 'destructive' });
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors',
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
        onClick={() => setActiveFolderId(isActive ? null : folder.id)}
      >
        {!folder.isDefault && (
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}

        <FolderOpen className="h-4 w-4 flex-shrink-0" style={{ color: folder.color }} />
        <span className="flex-1 truncate">{folder.name}</span>
        <span className="text-xs opacity-60">{folder._count.meetings}</span>

        {!folder.isDefault && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>

            {showMenu && (
              <div className="absolute right-0 top-7 z-20 w-36 bg-white rounded-lg border border-border shadow-lg py-1">
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowRename(true); }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Rename
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-red-50"
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); handleDelete(); }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showRename && (
        <RenameFolderDialog folder={folder} onClose={() => setShowRename(false)} />
      )}
    </>
  );
}
