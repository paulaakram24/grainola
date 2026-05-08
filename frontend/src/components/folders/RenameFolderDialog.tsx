'use client';
import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateFolder, type Folder } from '@/hooks/useFolders';
import { toast } from '@/hooks/useToast';

export function RenameFolderDialog({ folder, onClose }: { folder: Folder; onClose: () => void }) {
  const [name, setName] = useState(folder.name);
  const updateFolder = useUpdateFolder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === folder.name) { onClose(); return; }
    try {
      await updateFolder.mutateAsync({ id: folder.id, name: name.trim() });
      onClose();
    } catch {
      toast({ title: 'Could not rename folder', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-sm">Rename Folder</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>New name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={updateFolder.isPending}>
              {updateFolder.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
