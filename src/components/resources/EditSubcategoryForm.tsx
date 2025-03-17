import { useState } from "react";
import { AppButton } from "../common/AppButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

interface EditSubcategoryFormProps {
  subcategory: Subcategory;
  categories: Category[];
  onSubmit: (subcategory: { id: string; name: string; category_id: string }) => void;
  onCancel: () => void;
}

export function EditSubcategoryForm({ subcategory, categories, onSubmit, onCancel }: EditSubcategoryFormProps) {
  const [name, setName] = useState(subcategory.name);
  const [categoryId, setCategoryId] = useState(subcategory.category_id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    try {
      setIsSubmitting(true);

      // Update in Supabase
      const { error } = await supabase
        .from("subcategories")
        .update({
          name: name.trim(),
          category_id: categoryId,
        })
        .eq("id", subcategory.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("A subcategory with this name already exists");
        } else {
          throw error;
        }
        return;
      }

      onSubmit({
        id: subcategory.id,
        name: name.trim(),
        category_id: categoryId,
      });
    } catch (error) {
      console.error("Error updating subcategory:", error);
      toast.error("Failed to update subcategory");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="subcategory-name" className="text-sm font-medium">
          Subcategory Name
        </label>
        <input
          id="subcategory-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., JavaScript Tutorials"
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="parent-category" className="text-sm font-medium">
          Parent Category
        </label>
        <select
          id="parent-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
        >
          {categories.length === 0 ? (
            <option value="" disabled>
              No categories available
            </option>
          ) : (
            categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <AppButton
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </AppButton>
        <AppButton
          type="submit"
          disabled={isSubmitting || !name.trim() || !categoryId}
          isLoading={isSubmitting}
        >
          Update Subcategory
        </AppButton>
      </div>
    </form>
  );
} 