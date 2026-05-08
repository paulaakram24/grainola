'use client';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { KeyboardSensor } from '@dnd-kit/core';
import { FolderItem } from './FolderItem';
import { useReorderFolders, type Folder } from '@/hooks/useFolders';

export function SortableFolderList({ folders }: { folders: Folder[] }) {
  const reorder = useReorderFolders();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = folders.findIndex((f) => f.id === active.id);
    const newIndex = folders.findIndex((f) => f.id === over.id);

    const reordered = arrayMove(folders, oldIndex, newIndex);
    reorder.mutate(reordered.map((f) => f.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={folders.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {folders.map((folder) => (
            <FolderItem key={folder.id} folder={folder} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
