import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  badge_text: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export const AdminPromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_percentage: "",
    badge_text: "30% OFF",
    is_active: true,
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const promotionData = {
      title: formData.title,
      description: formData.description || null,
      discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
      badge_text: formData.badge_text || null,
      is_active: formData.is_active,
    };

    try {
      if (editingPromotion) {
        const { error } = await supabase
          .from("promotions")
          .update(promotionData)
          .eq("id", editingPromotion.id);

        if (error) throw error;
        toast.success("Promotion updated");
      } else {
        const { error } = await supabase
          .from("promotions")
          .insert(promotionData);

        if (error) throw error;
        toast.success("Promotion created");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPromotions();
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast.error("Failed to save promotion");
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description || "",
      discount_percentage: promotion.discount_percentage?.toString() || "",
      badge_text: promotion.badge_text || "30% OFF",
      is_active: promotion.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;

    try {
      const { error } = await supabase
        .from("promotions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Promotion deleted");
      fetchPromotions();
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error("Failed to delete promotion");
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("promotions")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
      toast.success(isActive ? "Promotion deactivated" : "Promotion activated");
      fetchPromotions();
    } catch (error) {
      console.error("Error toggling promotion:", error);
      toast.error("Failed to update promotion");
    }
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setFormData({
      title: "",
      description: "",
      discount_percentage: "",
      badge_text: "30% OFF",
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Promotions ({promotions.length})
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Promotion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? "Edit Promotion" : "Add New Promotion"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summer Sale"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Up to 30% off on selected items"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount %</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="30"
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="badge">Badge Text</Label>
                  <Input
                    id="badge"
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    placeholder="30% OFF"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <Button type="submit" className="w-full">
                {editingPromotion ? "Update Promotion" : "Create Promotion"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {promotions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No promotions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Badge</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{promotion.title}</div>
                        {promotion.description && (
                          <div className="text-sm text-muted-foreground">{promotion.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{promotion.badge_text}</Badge>
                    </TableCell>
                    <TableCell>{promotion.discount_percentage}%</TableCell>
                    <TableCell>
                      <Badge 
                        variant={promotion.is_active ? "default" : "outline"}
                        className={promotion.is_active ? "bg-green-500" : ""}
                      >
                        {promotion.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(promotion.id, promotion.is_active)}
                        >
                          {promotion.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(promotion)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(promotion.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};