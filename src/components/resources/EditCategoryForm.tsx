import { useState } from "react";
import { AppButton } from "../common/AppButton";
import { supabase } from "@/integrations/supabase/client";

interface EditCategoryFormProps {
  categoryId: string;
  initialName: string;
  onSubmit: (categoryId: string, newName: string) => void;
  onCancel: () => void;
}

export function EditCategoryForm({ categoryId, initialName, onSubmit, onCancel }: EditCategoryFormProps) {
  const [categoryName, setCategoryName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || categoryName.trim() === initialName) return;
    
    setIsSubmitting(true);
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('categories')
        .update({ name: categoryName.trim() })
        .eq('id', categoryId);
        
      if (error) throw error;
      
      onSubmit(categoryId, categoryName.trim());
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="category-name" className="text-sm font-medium">
          Category Name
        </label>
        <input
          id="category-name"
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="e.g., Study Materials"
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <AppButton type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </AppButton>
        <AppButton 
          type="submit" 
          disabled={!categoryName.trim() || categoryName.trim() === initialName || isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Category"}
        </AppButton>
      </div>
    </form>
  );
} 