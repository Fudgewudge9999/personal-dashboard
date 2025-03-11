import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, FileText, FolderPlus, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Note, NoteCategory } from "@/types/supabase";
import { useNavigate } from "react-router-dom";

// New Note Button Component
function NewNoteButton() {
  const navigate = useNavigate();
  
  return (
    <Button 
      type="button"
      onClick={() => navigate("/new-note")}
    >
      <Plus className="mr-2 h-4 w-4" />
      New Note
    </Button>
  );
}

// Edit Note Button Component
function EditNoteButton({ note, onNoteUpdated }: { note: Note, onNoteUpdated: () => void }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: note.title,
    content: note.content || "",
    note_category_id: note.note_category_id || "",
  });
  const [categories, setCategories] = useState<NoteCategory[]>([]);

  useEffect(() => {
    if (isDialogOpen) {
      fetchCategories();
    }
  }, [isDialogOpen]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("note_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateNote = async () => {
    try {
      if (!noteForm.title.trim()) {
        toast({
          title: "Error",
          description: "Note title is required",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("notes")
        .update({
          title: noteForm.title,
          content: noteForm.content,
          note_category_id: noteForm.note_category_id || null,
        })
        .eq("id", note.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note updated successfully",
      });

      setIsDialogOpen(false);
      onNoteUpdated();
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleOpenChange(true);
        }}
        aria-label="Edit note"
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={handleOpenChange}
      >
        <DialogPortal>
          <DialogOverlay />
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              updateNote();
            }}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={noteForm.title}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, title: e.target.value })
                    }
                    placeholder="Note title"
                    spellCheck={false}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <Select
                    value={noteForm.note_category_id || "uncategorized"}
                    onValueChange={(value) =>
                      setNoteForm({ ...noteForm, note_category_id: value === "uncategorized" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">Uncategorized</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    Content
                  </label>
                  <Textarea
                    id="content"
                    value={noteForm.content}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, content: e.target.value })
                    }
                    placeholder="Note content"
                    rows={8}
                    spellCheck={false}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}

// Delete Note Button Component
function DeleteNoteButton({ note, onNoteDeleted }: { note: Note, onNoteDeleted: () => void }) {
  const { toast } = useToast();

  const deleteNote = async () => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", note.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note deleted successfully",
      });

      onNoteDeleted();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      aria-label="Delete note"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

export function NotesView() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "alphabetical">("newest");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<NoteCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [showCategoryActionsFor, setShowCategoryActionsFor] = useState<string | null>(null);

  // Fetch notes and categories on component mount
  useEffect(() => {
    fetchNotes();
    fetchCategories();
  }, []);

  // Open category dialog for editing
  const openEditCategoryDialog = (category: NoteCategory) => {
    setCurrentCategory(category);
    setEditCategoryName(category.name);
    setIsEditCategoryDialogOpen(true);
  };

  const resetCategoryForm = () => {
    setNewCategoryName("");
  };

  const resetEditCategoryForm = () => {
    setEditCategoryName("");
    setCurrentCategory(null);
  };

  const handleCategoryDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetCategoryForm();
    }
    setIsCategoryDialogOpen(open);
  };

  const handleEditCategoryDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetEditCategoryForm();
    }
    setIsEditCategoryDialogOpen(open);
  };

  // Fetch notes from Supabase
  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch categories from Supabase
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("note_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create a new category
  const createCategory = async () => {
    try {
      if (!newCategoryName.trim()) {
        toast({
          title: "Error",
          description: "Category name is required",
          variant: "destructive",
        });
        return;
      }

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a category",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("note_categories")
        .insert({ 
          name: newCategoryName,
          user_id: user.id
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category created successfully",
      });

      setCategories([...(data || []), ...categories]);
      setNewCategoryName("");
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update an existing category
  const updateCategory = async () => {
    try {
      if (!currentCategory || !editCategoryName.trim()) {
        toast({
          title: "Error",
          description: "Category name is required",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("note_categories")
        .update({ name: editCategoryName })
        .eq("id", currentCategory.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully",
      });

      // Update local state
      setCategories(
        categories.map((cat) =>
          cat.id === currentCategory.id
            ? { ...cat, name: editCategoryName }
            : cat
        )
      );

      setIsEditCategoryDialogOpen(false);
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete a category
  const deleteCategory = async (id: string) => {
    try {
      // Check if there are notes using this category
      const notesWithCategory = notes.filter(
        (note) => note.note_category_id === id
      );

      if (notesWithCategory.length > 0) {
        toast({
          title: "Error",
          description: "Cannot delete category with notes. Remove notes first.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("note_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      // Update local state
      setCategories(categories.filter((cat) => cat.id !== id));
      
      // If the deleted category was selected, reset selection
      if (selectedCategory === id) {
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter and sort notes
  const filteredAndSortedNotes = notes
    .filter((note) => !selectedCategory || note.note_category_id === selectedCategory)
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortOrder === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

  // Get category name by ID
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Count notes in a category
  const countNotesInCategory = (categoryId: string) => {
    return notes.filter((note) => note.note_category_id === categoryId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notes</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleCategoryDialogOpenChange(true)}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New Category
          </Button>
          <NewNoteButton />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div 
                className={`cursor-pointer p-2 rounded ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                onClick={() => setSelectedCategory(null)}
              >
                All Notes
              </div>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`group flex items-center justify-between p-2 rounded ${
                    selectedCategory === category.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  <div 
                    className="flex-1 cursor-pointer flex justify-between items-center"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">
                      {countNotesInCategory(category.id)}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCategoryActionsFor(
                        showCategoryActionsFor === category.id ? null : category.id
                      );
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  
                  {showCategoryActionsFor === category.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditCategoryDialog(category);
                          setShowCategoryActionsFor(null);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (countNotesInCategory(category.id) > 0) {
                            toast({
                              title: "Error",
                              description: "Cannot delete category with notes. Remove notes first.",
                              variant: "destructive",
                            });
                            setShowCategoryActionsFor(null);
                            return;
                          }
                          
                          if (confirm('Are you sure you want to delete this category?')) {
                            deleteCategory(category.id);
                          }
                          setShowCategoryActionsFor(null);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-3/4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {selectedCategory
                ? `${getCategoryName(selectedCategory)} Notes`
                : "All Notes"}
            </h2>
            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredAndSortedNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notes found. Create a new note to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAndSortedNotes.map((note) => (
                <Card 
                  key={note.id} 
                  className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/notes/${note.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      <div className="flex gap-1">
                        <EditNoteButton 
                          note={note} 
                          onNoteUpdated={fetchNotes} 
                        />
                        <DeleteNoteButton 
                          note={note} 
                          onNoteDeleted={fetchNotes} 
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>{getCategoryName(note.note_category_id)}</span>
                      <span>
                        {new Date(note.updated_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm">
                      {note.content || "No content"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={handleCategoryDialogOpenChange}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createCategory();
            }}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="categoryName" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={handleEditCategoryDialogOpenChange}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              updateCategory();
            }}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="editCategoryName" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="editCategoryName"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    placeholder="Category name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditCategoryDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
} 