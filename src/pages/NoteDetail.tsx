import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Note, NoteCategory } from "@/types/supabase";
import { ArrowLeft, Edit, Trash2, Save, X } from "lucide-react";

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [category, setCategory] = useState<NoteCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    note_category_id: "",
  });

  useEffect(() => {
    const fetchNote = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!id) {
          throw new Error("Note ID is required");
        }

        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Note not found");

        setNote(data);
        setEditForm({
          title: data.title,
          content: data.content || "",
          note_category_id: data.note_category_id || "",
        });

        // If the note has a category, fetch the category details
        if (data.note_category_id) {
          const { data: categoryData, error: categoryError } = await supabase
            .from("note_categories")
            .select("*")
            .eq("id", data.note_category_id)
            .single();

          if (!categoryError && categoryData) {
            setCategory(categoryData);
          }
        }
      } catch (err) {
        console.error("Error fetching note:", err);
        setError("Failed to fetch note. Please try again.");
        toast({
          title: "Error",
          description: "Failed to fetch note. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [id, toast]);

  useEffect(() => {
    // Fetch categories when editing mode is activated
    if (isEditing) {
      fetchCategories();
    }
  }, [isEditing]);

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

  const handleDelete = async () => {
    if (!note) return;

    if (confirm("Are you sure you want to delete this note?")) {
      try {
        const { error } = await supabase.from("notes").delete().eq("id", note.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Note deleted successfully",
        });

        navigate("/notes");
      } catch (error) {
        console.error("Error deleting note:", error);
        toast({
          title: "Error",
          description: "Failed to delete note. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdate = async () => {
    if (!note) return;

    try {
      if (!editForm.title.trim()) {
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
          title: editForm.title,
          content: editForm.content,
          note_category_id: editForm.note_category_id || null,
        })
        .eq("id", note.id);

      if (error) throw error;

      // Update local note state with edited values
      setNote({
        ...note,
        title: editForm.title,
        content: editForm.content,
        note_category_id: editForm.note_category_id || null,
      });

      // If the category changed, fetch the new category details
      if (note.note_category_id !== editForm.note_category_id) {
        if (editForm.note_category_id) {
          const { data: categoryData, error: categoryError } = await supabase
            .from("note_categories")
            .select("*")
            .eq("id", editForm.note_category_id)
            .single();

          if (!categoryError && categoryData) {
            setCategory(categoryData);
          } else {
            setCategory(null);
          }
        } else {
          setCategory(null);
        }
      }

      toast({
        title: "Success",
        description: "Note updated successfully",
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/notes")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notes
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p>Loading note...</p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-red-500">
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : note ? (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                {isEditing ? (
                  <div className="w-full">
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="text-lg font-bold mb-2"
                      placeholder="Note title"
                    />
                    <div className="mb-4">
                      <Select
                        value={editForm.note_category_id || "uncategorized"}
                        onValueChange={(value) =>
                          setEditForm({ ...editForm, note_category_id: value === "uncategorized" ? "" : value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uncategorized">Uncategorized</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <CardTitle className="text-2xl font-bold">{note.title}</CardTitle>
                )}
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleUpdate}
                      >
                        <Save className="mr-2 h-4 w-4" /> Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {!isEditing && (
                <div className="text-sm text-muted-foreground flex justify-between mt-2">
                  <span>
                    {category ? category.name : "Uncategorized"}
                  </span>
                  <span>
                    Last updated: {new Date(note.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="py-6">
              {isEditing ? (
                <Textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  placeholder="Note content"
                  rows={16}
                  className="resize-none"
                />
              ) : (
                <div className="prose prose-sm max-w-none whitespace-pre-line">
                  {note.content || "No content"}
                </div>
              )}
            </CardContent>
            {!isEditing && (
              <CardFooter className="border-t bg-muted/50 py-3">
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(note.created_at).toLocaleDateString()}
                </div>
              </CardFooter>
            )}
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p>Note not found.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
} 