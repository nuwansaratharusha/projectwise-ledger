import { useState } from "react";
import { useProjectNotes } from "@/hooks/use-data";
import { useSaveNote, useDeleteNote } from "@/hooks/use-mutations";
import { EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDateTime } from "@/lib/format";
import { Plus, PencilSimple, Trash, Check, X } from "@phosphor-icons/react";

export function NotesTab({ projectId }: { projectId: string }) {
  const { data: notes = [] } = useProjectNotes(projectId);
  const saveNote = useSaveNote();
  const deleteNote = useDeleteNote();

  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleAdd() {
    if (!newContent.trim()) return;
    await saveNote.mutateAsync({
      projectId,
      content: newContent.trim(),
    });
    setNewContent("");
    setAdding(false);
  }

  async function handleEdit() {
    if (!editId || !editContent.trim()) return;
    await saveNote.mutateAsync({
      id: editId,
      projectId,
      content: editContent.trim(),
    });
    setEditId(null);
    setEditContent("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </p>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add note
          </Button>
        )}
      </div>

      {/* Add note form */}
      {adding && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <Textarea
            placeholder="Write a note…"
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saveNote.isPending}>
              {saveNote.isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setNewContent("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 && !adding ? (
        <EmptyState
          title="No notes yet"
          description="Add notes to keep track of important details."
          actionLabel="Add note"
          onAction={() => setAdding(true)}
        />
      ) : (
        <ul className="space-y-2">
          {notes.map((n) =>
            editId === n.id ? (
              <li key={n.id} className="rounded-lg border border-primary/30 p-3">
                <Textarea
                  rows={3}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  autoFocus
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleEdit}
                    disabled={saveNote.isPending}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditId(null)}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>
              </li>
            ) : (
              <li
                key={n.id}
                className="rounded-lg border border-border p-3"
              >
                <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(n.created_at)}
                    {n.updated_at !== n.created_at
                      ? ` · edited ${formatDateTime(n.updated_at)}`
                      : ""}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setEditId(n.id);
                        setEditContent(n.content);
                      }}
                      aria-label="Edit note"
                    >
                      <PencilSimple className="h-3.5 w-3.5 text-muted-foreground" weight="duotone" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
                      onClick={() => setDeleteId(n.id)}
                      aria-label="Delete note"
                    >
                      <Trash className="h-3.5 w-3.5" weight="duotone" />
                    </button>
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteNote.mutate(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
