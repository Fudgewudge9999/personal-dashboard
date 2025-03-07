import { useState } from "react";
import { AppButton } from "../common/AppButton";
import { supabase } from "@/integrations/supabase/client";
import { addUserIdToData } from "@/utils/supabase-utils";

interface AddCategoryFormProps {
  onSubmit: (category: string) => void;
  onCancel: () => void;
}

export function AddCategoryForm({ onSubmit, onCancel }: AddCategoryFormProps) {
  const [categoryName, setCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Add user_id to the category data
      const categoryWithUserId = await addUserIdToData({
        name: categoryName.trim()
      });
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryWithUserId])
        .select();
        
      if (error) throw error;
      
      onSubmit(categoryName.trim());
    } catch (error) {
      console.error("Error adding category:", error);
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
        <AppButton type="submit" disabled={!categoryName.trim() || isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Category"}
        </AppButton>
      </div>
    </form>
  );
}
