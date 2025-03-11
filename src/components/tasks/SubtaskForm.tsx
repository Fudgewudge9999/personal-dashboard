import { useState, useEffect } from "react";
import { AppButton } from "../common/AppButton";

interface SubtaskFormProps {
  onSubmit: (subtask: {
    title: string;
  }) => void;
  onCancel: () => void;
  initialData?: {
    title: string;
  };
  mode?: 'add' | 'edit';
}

export function SubtaskForm({ onSubmit, onCancel, initialData, mode = 'add' }: SubtaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
    }
  }, [initialData]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    
    onSubmit({
      title,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="subtask-title" className="text-sm font-medium">
          Subtask Title
        </label>
        <input
          id="subtask-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Research topic outline"
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <AppButton type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </AppButton>
        <AppButton type="submit" disabled={!title.trim() || isSubmitting}>
          {isSubmitting ? `${mode === 'add' ? 'Adding' : 'Saving'}...` : mode === 'add' ? 'Add Subtask' : 'Save Changes'}
        </AppButton>
      </div>
    </form>
  );
} 