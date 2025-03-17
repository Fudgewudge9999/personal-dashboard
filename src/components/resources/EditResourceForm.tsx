import { useState, useRef, useEffect } from "react";
import { AppButton } from "../common/AppButton";
import { Folder, File, Link, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

interface Resource {
  id: string;
  title: string;
  type: "document" | "spreadsheet" | "link";
  category_id: string;
  subcategory_id?: string;
  url?: string;
  description?: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
}

interface EditResourceFormProps {
  resource: Resource;
  categories: { id: string; name: string; count: number }[];
  subcategories: Subcategory[];
  onSubmit: (resourceId: string, updates: Partial<Resource>) => void;
  onCancel: () => void;
}

export function EditResourceForm({ resource, categories, subcategories, onSubmit, onCancel }: EditResourceFormProps) {
  const [title, setTitle] = useState(resource.title);
  const [type, setType] = useState<"document" | "spreadsheet" | "link">(resource.type);
  const [categoryId, setCategoryId] = useState(resource.category_id);
  const [subcategoryId, setSubcategoryId] = useState<string | undefined>(resource.subcategory_id);
  const [url, setUrl] = useState(resource.url || "");
  const [description, setDescription] = useState(resource.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter subcategories when category changes
  useEffect(() => {
    if (categoryId) {
      const filtered = subcategories.filter(sub => sub.category_id === categoryId);
      setFilteredSubcategories(filtered);
      
      // If the current subcategory doesn't belong to the selected category, reset it
      if (subcategoryId && !filtered.some(sub => sub.id === subcategoryId)) {
        setSubcategoryId(undefined);
      }
    } else {
      setFilteredSubcategories([]);
      setSubcategoryId(undefined);
    }
  }, [categoryId, subcategories, subcategoryId]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const uploadFile = async (): Promise<{ path: string; size: number; type: string } | null> => {
    if (!selectedFile) return null;
    
    try {
      setIsUploading(true);
      
      // Create a unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('resources')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      // Track upload progress manually
      setUploadProgress(100);
      
      if (error) {
        throw error;
      }
      
      return {
        path: data.path,
        size: selectedFile.size,
        type: selectedFile.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    
    try {
      setIsSubmitting(true);
      
      let fileData = null;
      
      // Only upload file if a file is selected and the type is not a link
      if (selectedFile && type !== "link") {
        fileData = await uploadFile();
      }
      
      const updates: Partial<Resource> = {
        title,
        type,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        description: description.trim() || null
      };
      
      if (type === "link") {
        updates.url = url.trim() || null;
        // Clear file data if switching to link type
        updates.file_path = null;
        updates.file_size = null;
        updates.file_type = null;
      } else if (fileData) {
        // Only update file data if a new file was uploaded
        updates.file_path = fileData.path;
        updates.file_size = fileData.size;
        updates.file_type = fileData.type;
        updates.url = null;
      }
      
      onSubmit(resource.id, updates);
    } catch (error) {
      console.error('Error updating resource:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="resource-title" className="text-sm font-medium">
          Resource Title
        </label>
        <input
          id="resource-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Weekly Lesson Plan Template"
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Resource Type</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className={`flex flex-col items-center justify-center p-3 rounded-md border ${
              type === "document" ? "border-primary bg-primary/5" : "border-input"
            }`}
            onClick={() => setType("document")}
          >
            <File size={24} className="mb-2 text-blue-500" />
            <span className="text-sm">Document</span>
          </button>
          <button
            type="button"
            className={`flex flex-col items-center justify-center p-3 rounded-md border ${
              type === "spreadsheet" ? "border-primary bg-primary/5" : "border-input"
            }`}
            onClick={() => setType("spreadsheet")}
          >
            <File size={24} className="mb-2 text-green-500" />
            <span className="text-sm">Spreadsheet</span>
          </button>
          <button
            type="button"
            className={`flex flex-col items-center justify-center p-3 rounded-md border ${
              type === "link" ? "border-primary bg-primary/5" : "border-input"
            }`}
            onClick={() => setType("link")}
          >
            <Link size={24} className="mb-2 text-purple-500" />
            <span className="text-sm">Link</span>
          </button>
        </div>
      </div>
      
      {type === "link" ? (
        <div className="space-y-2">
          <label htmlFor="resource-url" className="text-sm font-medium">
            URL
          </label>
          <input
            id="resource-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="resource-file" className="text-sm font-medium">
            Upload File {resource.file_path && !selectedFile && "(Optional)"}
          </label>
          {!selectedFile ? (
            <div className="border-2 border-dashed rounded-md p-6 text-center">
              <input
                id="resource-file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full"
              >
                <Upload size={24} className="mb-2 text-muted-foreground" />
                {resource.file_path ? (
                  <>
                    <span className="text-sm text-muted-foreground">Current file: {resource.file_path.split('/').pop()}</span>
                    <span className="text-xs text-muted-foreground mt-1">Click to replace</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-muted-foreground">Click to upload a file</span>
                    <span className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, etc.</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="border rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <File size={20} className="mr-2 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={16} />
                </button>
              </div>
              
              {isUploading && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-right mt-1">{uploadProgress}%</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="resource-category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="resource-category"
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
      
      <div className="space-y-2">
        <label htmlFor="resource-subcategory" className="text-sm font-medium">
          Subcategory (Optional)
        </label>
        <select
          id="resource-subcategory"
          value={subcategoryId || ""}
          onChange={(e) => setSubcategoryId(e.target.value || undefined)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">None</option>
          {filteredSubcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="resource-description" className="text-sm font-medium">
          Description (Optional)
        </label>
        <textarea
          id="resource-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a brief description of this resource..."
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
        />
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
          disabled={isSubmitting || !title.trim() || !categoryId || (type === "link" && !url.trim())}
          isLoading={isSubmitting}
        >
          Update Resource
        </AppButton>
      </div>
    </form>
  );
} 