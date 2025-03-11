import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
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
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { NoteCategory } from "@/types/supabase";
import { useAuth } from "@/context/AuthContext";

export default function NewNote() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    note_category_id: "",
  });
  const [categories, setCategories] = useState<NoteCategory[]>([]);

  // Log authentication state
  useEffect(() => {
    console.log('NewNote auth state:', { isAuthenticated, authLoading });
  }, [isAuthenticated, authLoading]);

  // Fetch categories when component mounts and user is authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const loadCategories = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const { data, error } = await supabase
            .from("note_categories")
            .select("*")
            .order("name");

          if (error) throw error;
          setCategories(data || []);
        } catch (error) {
          console.error("Error fetching categories:", error);
          setError("Failed to load categories. Please try again.");
          toast({
            title: "Error",
            description: "Failed to load categories. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      loadCategories();
    }
  }, [toast, isAuthenticated, authLoading]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-8">
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p>Checking authentication...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Redirect if not authenticated using Navigate component
  if (!isAuthenticated) {
    console.log('NewNote: Not authenticated, redirecting to login');
    return <Navigate to="/auth/login" replace />;
  }

  const createNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!noteForm.title.trim()) {
        toast({
          title: "Error",
          description: "Note title is required",
          variant: "destructive",
        });
        return;
      }

      if (!user) {
        throw new Error("You must be logged in to create a note");
      }

      console.log('Creating note with data:', { ...noteForm, user_id: user.id });

      const { data, error } = await supabase.from("notes").insert({
        title: noteForm.title,
        content: noteForm.content,
        note_category_id: noteForm.note_category_id || null,
        user_id: user.id
      }).select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Note created successfully:', data);

      toast({
        title: "Success",
        description: "Note created successfully",
      });

      // Navigate back to notes page
      navigate("/notes");
    } catch (error: any) {
      console.error("Error creating note:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create note. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-8">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-red-500">
                <p>{error}</p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/notes")}
                  className="mt-4"
                >
                  Back to Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Note</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <form onSubmit={createNote} className="space-y-6">
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
                    value={noteForm.note_category_id}
                    onValueChange={(value) =>
                      setNoteForm({ ...noteForm, note_category_id: value === "uncategorized" ? null : value })
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
                    rows={12}
                    spellCheck={false}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/notes")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Note
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 