import { CardContainer } from "../common/CardContainer";
import { AppButton } from "../common/AppButton";
import { Plus, Search, FolderOpen, Bookmark, File, ExternalLink, FolderPlus, X, Folder, Link, MoreVertical, Edit, Trash2, Pencil } from "lucide-react";
import { Badge } from "../common/Badge";
import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { AddResourceForm } from "./AddResourceForm";
import { EditResourceForm } from "./EditResourceForm";
import { AddCategoryForm } from "./AddCategoryForm";
import { EditCategoryForm } from "./EditCategoryForm";
import { AddSubcategoryForm } from "./AddSubcategoryForm";
import { EditSubcategoryForm } from "./EditSubcategoryForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addUserIdToData } from "@/utils/supabase-utils";

interface Resource {
  id: string;
  title: string;
  type: "document" | "spreadsheet" | "link";
  category_id: string;
  subcategory_id?: string;
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

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  user_id?: string;
  created_at?: string;
}

export function ResourcesView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddSubcategoryModalOpen, setIsAddSubcategoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [isEditSubcategoryModalOpen, setIsEditSubcategoryModalOpen] = useState(false);
  const [showCategoryActionsFor, setShowCategoryActionsFor] = useState<string | null>(null);
  const [showSubcategoryActionsFor, setShowSubcategoryActionsFor] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCategories();
    fetchResources();
    fetchSubcategories();
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
  
  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*');
        
      if (error) throw error;
      
      setSubcategories(data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast.error('Failed to load subcategories');
    }
  };
  
  const handleAddResource = async (resource: Omit<Resource, "id" | "created_at">) => {
    try {
      setIsAddingResource(true);
      
      // Add user_id to the resource data
      const resourceWithUserId = await addUserIdToData({
        title: resource.title,
        type: resource.type,
        category_id: resource.category_id,
        url: resource.url,
        description: resource.description,
        file_path: resource.file_path,
        file_size: resource.file_size,
        file_type: resource.file_type
      });
      
      const { data, error } = await supabase
        .from("resources")
        .insert(resourceWithUserId)
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
    const matchesSubcategory = selectedSubcategory ? resource.subcategory_id === selectedSubcategory : true;
    const matchesSearch = searchQuery
      ? resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true;
    return matchesCategory && matchesSubcategory && matchesSearch;
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

  // Find subcategory name by id
  const getSubcategoryName = (subcategoryId?: string) => {
    if (!subcategoryId) return null;
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    return subcategory ? subcategory.name : null;
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

  const handleUpdateResource = async (resourceId: string, updates: Partial<Resource>) => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', resourceId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update local state
      setResources(resources.map(resource => 
        resource.id === resourceId ? { ...resource, ...updates } : resource
      ));
      
      setShowEditModal(false);
      toast.success("Resource updated successfully");
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
    }
  };

  const handleEditCategory = async (categoryId: string, newName: string) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('id', categoryId);
        
      if (error) throw error;
      
      // Update local state
      setCategories(categories.map(cat => 
        cat.id === categoryId ? { ...cat, name: newName } : cat
      ));
      
      setIsEditCategoryModalOpen(false);
      toast.success("Category updated successfully");
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleAddSubcategory = async (subcategory: { name: string; category_id: string }) => {
    try {
      // Add user_id to the subcategory data
      const subcategoryWithUserId = await addUserIdToData({
        name: subcategory.name,
        category_id: subcategory.category_id,
      });

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

      setSubcategories([...subcategories, data]);
      setIsAddSubcategoryModalOpen(false);
      toast.success("Subcategory added successfully");
    } catch (error) {
      console.error("Error adding subcategory:", error);
      toast.error("Failed to add subcategory");
    }
  };

  const handleEditSubcategory = async (subcategory: { id: string; name: string; category_id: string }) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .update({
          name: subcategory.name,
          category_id: subcategory.category_id
        })
        .eq('id', subcategory.id);
        
      if (error) throw error;
      
      setSubcategories(subcategories.map(sub => 
        sub.id === subcategory.id ? { ...sub, ...subcategory } : sub
      ));
      
      setIsEditSubcategoryModalOpen(false);
      toast.success("Subcategory updated successfully");
    } catch (error) {
      console.error('Error updating subcategory:', error);
      toast.error('Failed to update subcategory');
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    try {
      // Check if subcategory has resources
      const resourcesInSubcategory = resources.filter(resource => resource.subcategory_id === subcategoryId);
      
      if (resourcesInSubcategory.length > 0) {
        toast.error("Cannot delete subcategory with resources. Remove resources first.");
        return;
      }
      
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategoryId);
        
      if (error) throw error;
      
      setSubcategories(subcategories.filter(sub => sub.id !== subcategoryId));
      toast.success("Subcategory deleted successfully");
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast.error('Failed to delete subcategory');
    }
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
                <div
                  key={category.id}
                  className="space-y-1"
                >
                  <div
                    className={`group flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === category.id ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                    }`}
                  >
                    <button
                      className="flex-1 text-left flex items-center justify-between"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSelectedSubcategory(null);
                      }}
                    >
                      <span>{category.name}</span>
                      <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </button>
                    <div className="relative ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCategoryActionsFor(showCategoryActionsFor === category.id ? null : category.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <MoreVertical size={14} />
                      </button>
                      
                      {showCategoryActionsFor === category.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border">
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(category);
                                setIsEditCategoryModalOpen(true);
                                setShowCategoryActionsFor(null);
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit size={14} className="mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsAddSubcategoryModalOpen(true);
                                setShowCategoryActionsFor(null);
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <FolderPlus size={14} className="mr-2" />
                              Add Subcategory
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (category.count > 0) {
                                  toast.error("Cannot delete category with resources. Remove resources first.");
                                  setShowCategoryActionsFor(null);
                                  return;
                                }
                                
                                if (confirm('Are you sure you want to delete this category?')) {
                                  handleDeleteCategory(category.id);
                                }
                                setShowCategoryActionsFor(null);
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Subcategories */}
                  {selectedCategory === category.id && (
                    <div className="ml-4 space-y-1">
                      {subcategories
                        .filter(sub => sub.category_id === category.id)
                        .map(subcategory => (
                          <div
                            key={subcategory.id}
                            className={`group flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                              selectedSubcategory === subcategory.id ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                            }`}
                          >
                            <button
                              className="flex-1 text-left flex items-center"
                              onClick={() => setSelectedSubcategory(subcategory.id)}
                            >
                              <span className="text-sm">{subcategory.name}</span>
                            </button>
                            <div className="relative ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowSubcategoryActionsFor(showSubcategoryActionsFor === subcategory.id ? null : subcategory.id);
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full"
                              >
                                <MoreVertical size={14} />
                              </button>
                              
                              {showSubcategoryActionsFor === subcategory.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border">
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSubcategory(subcategory);
                                        setIsEditSubcategoryModalOpen(true);
                                        setShowSubcategoryActionsFor(null);
                                      }}
                                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      <Edit size={14} className="mr-2" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Are you sure you want to delete this subcategory?')) {
                                          handleDeleteSubcategory(subcategory.id);
                                        }
                                        setShowSubcategoryActionsFor(null);
                                      }}
                                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    >
                                      <Trash2 size={14} className="mr-2" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
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
                    className="group flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors relative"
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
                    <div className="flex-1" onClick={() => handleResourceClick(resource)}>
                      <h3 className="font-medium">{resource.title}</h3>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(resource.created_at).toLocaleDateString('en-GB')}
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
                          {resource.subcategory_id && (
                            <>
                              <span className="mx-1">/</span>
                              <span>{getSubcategoryName(resource.subcategory_id)}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActionsFor(showActionsFor === resource.id ? null : resource.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 rounded-full transition-opacity"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {showActionsFor === resource.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingResource(resource);
                                setShowEditModal(true);
                                setShowActionsFor(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit size={16} className="mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this resource?')) {
                                  handleDeleteResource(resource.id, resource.category_id);
                                }
                                setShowActionsFor(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              <Trash2 size={16} className="mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
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
          subcategories={subcategories}
          onSubmit={handleAddResource}
          onCancel={() => setShowAddResourceModal(false)}
        />
      </Modal>
      
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Resource"
        className="max-w-md mx-auto"
      >
        {editingResource && (
          <EditResourceForm
            resource={editingResource}
            categories={categories}
            subcategories={subcategories}
            onSubmit={handleUpdateResource}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>
      
      <Modal
        isOpen={isEditCategoryModalOpen}
        onClose={() => setIsEditCategoryModalOpen(false)}
        title="Edit Category"
        className="max-w-md mx-auto"
      >
        {editingCategory && (
          <EditCategoryForm
            categoryId={editingCategory.id}
            initialName={editingCategory.name}
            onSubmit={handleEditCategory}
            onCancel={() => setIsEditCategoryModalOpen(false)}
          />
        )}
      </Modal>

      <Modal
        isOpen={isAddSubcategoryModalOpen}
        onClose={() => setIsAddSubcategoryModalOpen(false)}
        title="Add New Subcategory"
        className="max-w-md mx-auto"
      >
        <AddSubcategoryForm
          categories={categories}
          onSubmit={handleAddSubcategory}
          onCancel={() => setIsAddSubcategoryModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditSubcategoryModalOpen}
        onClose={() => setIsEditSubcategoryModalOpen(false)}
        title="Edit Subcategory"
        className="max-w-md mx-auto"
      >
        {editingSubcategory && (
          <EditSubcategoryForm
            subcategory={editingSubcategory}
            categories={categories}
            onSubmit={handleEditSubcategory}
            onCancel={() => setIsEditSubcategoryModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
