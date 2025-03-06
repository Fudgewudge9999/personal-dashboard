import { CardContainer } from "../common/CardContainer";
import { AppButton } from "../common/AppButton";
import { Plus, Search, FolderOpen, Bookmark, File, ExternalLink, FolderPlus, X, Folder, Link } from "lucide-react";
import { Badge } from "../common/Badge";
import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { AddResourceForm } from "./AddResourceForm";
import { AddCategoryForm } from "./AddCategoryForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Resource {
  id: string;
  title: string;
  type: "document" | "spreadsheet" | "link";
  category_id: string;
  url?: string;
  description?: string;
  created_at: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

export function ResourcesView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddingResource, setIsAddingResource] = useState(false);
  
  useEffect(() => {
    fetchCategories();
    fetchResources();
  }, []);
  
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
        
      if (error) throw error;
      
      console.log("Categories fetched from Supabase:", data);
      
      // Transform data to include resource count (initially 0)
      const categoriesWithCount = data.map(cat => ({
        id: cat.id,
        name: cat.name,
        count: 0
      }));
      
      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };
  
  const fetchResources = async () => {
    setIsLoadingResources(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*');
        
      if (error) throw error;
      
      // Cast the data to the correct type
      const typedResources = data?.map(resource => ({
        ...resource,
        type: resource.type as "document" | "spreadsheet" | "link"
      })) || [];
      
      setResources(typedResources);
      
      // Update category counts
      if (typedResources && categories.length > 0) {
        const categoryCounts = categories.map(cat => {
          const count = typedResources.filter(resource => resource.category_id === cat.id).length;
          return { ...cat, count };
        });
        setCategories(categoryCounts);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setIsLoadingResources(false);
    }
  };
  
  const handleAddResource = async (resource: Omit<Resource, "id" | "created_at">) => {
    try {
      setIsAddingResource(true);
      
      const { data, error } = await supabase
        .from("resources")
        .insert({
          title: resource.title,
          type: resource.type,
          category_id: resource.category_id,
          url: resource.url,
          description: resource.description,
          file_path: resource.file_path,
          file_size: resource.file_size,
          file_type: resource.file_type
        })
        .select()
        .single();

      if (error) throw error;

      setResources((prev) => [...prev, data as Resource]);
      updateCategoryCounts([...resources, data as Resource]);
      setShowAddResourceModal(false);
      toast.success("Resource added successfully");
    } catch (error) {
      console.error("Error adding resource:", error);
      toast.error("Failed to add resource");
    } finally {
      setIsAddingResource(false);
    }
  };
  
  const handleAddCategory = async (categoryName: string) => {
    console.log("handleAddCategory called with:", categoryName);
    console.log("Current categories in state:", categories);
    
    // Check if category already exists in local state
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      console.log("Category already exists in local state");
      toast.error("Category already exists");
      return;
    }
    
    // No need to check in the database again since the category was already added in AddCategoryForm
    // Just refresh the categories list
    console.log("Refreshing categories...");
    await fetchCategories(); // Refresh categories
    setIsAddCategoryModalOpen(false);
    toast.success("Category created successfully");
  };
  
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // Check if category has resources
      const resourcesInCategory = resources.filter(resource => resource.category_id === categoryId);
      
      if (resourcesInCategory.length > 0) {
        toast.error("Cannot delete category with resources. Remove resources first.");
        return;
      }
      
      // Delete from Supabase
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
        
      if (error) throw error;
      
      // Update local state
      setCategories(categories.filter(cat => cat.id !== categoryId));
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };
  
  const handleDeleteResource = async (resourceId: string, categoryId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);
        
      if (error) throw error;
      
      // Update local state
      setResources(resources.filter(resource => resource.id !== resourceId));
      
      // Update category count
      setCategories(categories.map(cat => 
        cat.id === categoryId 
          ? { ...cat, count: cat.count - 1 } 
          : cat
      ));
      
      toast.success("Resource deleted successfully");
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };
  
  // Filter resources based on selected category and search query
  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory ? resource.category_id === selectedCategory : true;
    const matchesSearch = searchQuery
      ? resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true;
    return matchesCategory && matchesSearch;
  });
  
  // Sort resources by created_at (newest first)
  const sortedResources = [...filteredResources].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Find category name by id
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const getFileUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('resources')
        .createSignedUrl(filePath, 60); // URL valid for 60 seconds
      
      if (error) throw error;
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      toast.error("Error accessing file. Please try again.");
      return null;
    }
  };

  const openInEdge = async (url: string) => {
    try {
      // Attempt to open in Microsoft Edge using the microsoft-edge protocol
      window.location.href = `microsoft-edge:${url}`;
      
      // Since we can't detect if Edge opened successfully, we'll set a small timeout
      // before falling back to the default browser
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(false);
        }, 1000);
      });
    } catch (error) {
      console.error('Error opening in Edge:', error);
      return false;
    }
  };

  const handleResourceClick = async (resource: Resource) => {
    let url: string | null = null;
    
    if (resource.type === "link" && resource.url) {
      url = resource.url;
    } else if (resource.file_path) {
      url = await getFileUrl(resource.file_path);
    }

    if (url) {
      try {
        // First attempt to open in Edge
        const edgeResult = await openInEdge(url);
        
        // If Edge doesn't open (or after timeout), fall back to default browser
        if (!edgeResult) {
          window.open(url, "_blank");
        }
      } catch (error) {
        console.error('Error opening resource:', error);
        // Fall back to default browser
        window.open(url, "_blank");
      }
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const updateCategoryCounts = (updatedResources: Resource[]) => {
    const newCategories = categories.map(cat => ({
      ...cat,
      count: updatedResources.filter(resource => resource.category_id === cat.id).length
    }));
    setCategories(newCategories);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">Resources</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Categories</h2>
              <AppButton 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsAddCategoryModalOpen(true)}
              >
                <Plus size={16} />
              </AppButton>
            </div>
            
            <div className="space-y-1 mb-4">
              <button
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedCategory === null ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                All Resources
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex justify-between items-center ${
                    selectedCategory === category.id ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span>{category.name}</span>
                  <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="pt-4 border-t">
              <AppButton 
                icon={<Plus size={18} />}
                onClick={() => setShowAddResourceModal(true)}
                disabled={categories.length === 0}
              >
                Add Resource
              </AppButton>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {selectedCategory 
                  ? categories.find(c => c.id === selectedCategory)?.name 
                  : "All Resources"}
              </h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    className="pl-8 h-9 w-[200px] rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <AppButton onClick={() => setShowAddResourceModal(true)}>
                  Add Resource
                </AppButton>
              </div>
            </div>
            
            {isLoadingResources ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : sortedResources.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No resources found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedCategory
                    ? "There are no resources in this category yet."
                    : searchQuery
                    ? "No resources match your search."
                    : "There are no resources yet."}
                </p>
                <AppButton
                  onClick={() => setShowAddResourceModal(true)}
                  className="mt-4"
                >
                  Add your first resource
                </AppButton>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleResourceClick(resource)}
                  >
                    <div className="mr-4 mt-1">
                      {resource.type === "document" ? (
                        <File className="h-8 w-8 text-blue-500" />
                      ) : resource.type === "spreadsheet" ? (
                        <File className="h-8 w-8 text-green-500" />
                      ) : (
                        <Link className="h-8 w-8 text-purple-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{resource.title}</h3>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(resource.created_at).toLocaleDateString()}
                        </span>
                        {resource.file_size && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{formatFileSize(resource.file_size)}</span>
                          </>
                        )}
                        <span className="mx-2">•</span>
                        <span>
                          {getCategoryName(resource.category_id)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Modal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        title="Add New Category"
        className="max-w-md mx-auto"
      >
        <AddCategoryForm
          onSubmit={handleAddCategory}
          onCancel={() => setIsAddCategoryModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={showAddResourceModal}
        onClose={() => setShowAddResourceModal(false)}
        title="Add New Resource"
        className="max-w-md mx-auto"
      >
        <AddResourceForm
          categories={categories}
          onSubmit={handleAddResource}
          onCancel={() => setShowAddResourceModal(false)}
        />
      </Modal>
    </div>
  );
}
