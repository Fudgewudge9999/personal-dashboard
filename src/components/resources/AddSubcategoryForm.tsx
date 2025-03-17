import { useState } from "react";
import { AppButton } from "../common/AppButton";
import { supabase } from "@/integrations/supabase/client";
import { addUserIdToData } from "@/utils/supabase-utils";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface AddSubcategoryFormProps {
  categories: Category[];
  onSubmit: (subcategory: { name: string; category_id: string }) => void;
  onCancel: () => void;
}

export function AddSubcategoryForm({ categories, onSubmit, onCancel }: AddSubcategoryFormProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    try {
      setIsSubmitting(true);

      // Add user_id to the subcategory data
      const subcategoryWithUserId = await addUserIdToData({
        name: name.trim(),
        category_id: categoryId,
      });

      // Insert into Supabase
      const { data, error } = await supabase
        .from("subcategories")
        .insert(subcategoryWithUserId)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("A subcategory with this name already exists");
        } else {
          throw error;
        }
        return;
      }

      onSubmit({
        name: name.trim(),
        category_id: categoryId,
      });
      
      setName("");
    } catch (error) {
      console.error("Error adding subcategory:", error);
      toast.error("Failed to add subcategory");
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
          Add Subcategory
        </AppButton>
      </div>
    </form>
  );
} 