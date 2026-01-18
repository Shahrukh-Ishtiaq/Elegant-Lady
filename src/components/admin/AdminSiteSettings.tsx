import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2, Image as ImageIcon, Save, RefreshCw, Plus, GripVertical } from "lucide-react";

interface SiteSettings {
  id: string;
  hero_image_url: string | null;
  hero_images: string[] | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  updated_at: string;
}

export const AdminSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImages, setHeroImages] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "main")
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data as SiteSettings);
        setHeroTitle(data.hero_title || "");
        setHeroSubtitle(data.hero_subtitle || "");
        // Use hero_images array or fallback to single hero_image_url
        const images = (data as SiteSettings).hero_images || [];
        if (images.length === 0 && data.hero_image_url) {
          setHeroImages([data.hero_image_url]);
        } else {
          setHeroImages(images);
        }
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} must be less than 10MB`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `hero-${Date.now()}-${i}.${fileExt}`;
        const filePath = `hero/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("site_images")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data } = supabase.storage
          .from("site_images")
          .getPublicUrl(filePath);

        newImages.push(data.publicUrl);
      }

      if (newImages.length > 0) {
        setHeroImages(prev => [...prev, ...newImages]);
        toast.success(`${newImages.length} image(s) uploaded!`);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          id: "main",
          hero_image_url: heroImages[0] || null, // Keep first image as default
          hero_images: heroImages,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });

      if (error) throw error;

      toast.success("Settings saved successfully!");
      fetchSettings();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Failed to save settings: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const removeHeroImage = (index: number) => {
    setHeroImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= heroImages.length) return;
    setHeroImages(prev => {
      const newImages = [...prev];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      return newImages;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Hero Section Settings
          </CardTitle>
          <CardDescription>
            Customize the hero section that appears on the homepage. Upload multiple images for a sliding carousel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hero Images Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Hero Images ({heroImages.length})</Label>
              <p className="text-xs text-muted-foreground">
                {heroImages.length > 1 ? "Multiple images will display as a carousel" : "Add more images for a carousel"}
              </p>
            </div>
            
            {heroImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {heroImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Hero ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    {index === 0 && (
                      <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveImage(index, index - 1)}
                        >
                          ↑
                        </Button>
                      )}
                      {index < heroImages.length - 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveImage(index, index + 1)}
                        >
                          ↓
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeHeroImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hero images set</p>
                <p className="text-sm">Upload images to display in the hero section</p>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Images
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Hero Title */}
          <div className="space-y-2">
            <Label htmlFor="heroTitle">Hero Title</Label>
            <Input
              id="heroTitle"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Enter hero title"
            />
          </div>

          {/* Hero Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
            <Input
              id="heroSubtitle"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="Enter hero subtitle"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button variant="outline" onClick={fetchSettings}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
