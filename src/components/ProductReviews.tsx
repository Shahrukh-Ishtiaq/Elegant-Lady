import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, User, Loader2, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  comment: string;
  helpful_count: number;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
  productRating: number;
  reviewCount: number;
}

export const ProductReviews = ({ productId, productRating, reviewCount }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({ name: "", rating: 5, comment: "" });
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editData, setEditData] = useState({ rating: 5, comment: "" });
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
    
    // Set up realtime subscription for instant review updates
    const channel = supabase
      .channel(`reviews-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          console.log('Review change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newReview = payload.new as Review;
            setReviews(prev => {
              // Avoid duplicates
              if (prev.some(r => r.id === newReview.id)) return prev;
              const updated = [newReview, ...prev];
              // Update product stats
              updateProductStats(updated);
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedReview = payload.new as Review;
            setReviews(prev => {
              const updated = prev.map(r => 
                r.id === updatedReview.id ? updatedReview : r
              );
              updateProductStats(updated);
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedReview = payload.old as Review;
            setReviews(prev => {
              const updated = prev.filter(r => r.id !== deletedReview.id);
              updateProductStats(updated);
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Reviews subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  const fetchReviews = async () => {
    try {
      // Only select necessary fields - exclude user_id from public exposure
      // user_id is only needed for ownership checks (edit/delete)
      const { data, error } = await supabase
        .from('reviews')
        .select('id, product_id, user_id, user_name, rating, comment, helpful_count, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const reviewsData = data || [];
      setReviews(reviewsData);
      
      // Sync product rating/review_count if there's a mismatch
      if (reviewsData.length > 0) {
        const avgRating = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        const roundedRating = Math.round(avgRating * 10) / 10;
        
        if (roundedRating !== productRating || reviewsData.length !== reviewCount) {
          await supabase
            .from('products')
            .update({ 
              rating: roundedRating, 
              review_count: reviewsData.length 
            })
            .eq('id', productId);
        }
      } else if (reviewCount > 0) {
        // Reset stats if no reviews
        await supabase
          .from('products')
          .update({ rating: 0, review_count: 0 })
          .eq('id', productId);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update product rating and review count in the products table
  const updateProductStats = async (reviewsList: Review[]) => {
    const avgRating = reviewsList.length > 0 
      ? reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length 
      : 0;
    
    try {
      await supabase
        .from('products')
        .update({ 
          rating: Math.round(avgRating * 10) / 10, 
          review_count: reviewsList.length 
        })
        .eq('id', productId);
    } catch (error) {
      console.error('Error updating product stats:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReview.name.trim() || !newReview.comment.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newReview.comment.trim().length < 10) {
      toast.error("Please write at least 10 characters for your review");
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        product_id: productId,
        user_id: user?.id || null,
        user_name: newReview.name.trim(),
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        helpful_count: 0,
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) {
        console.error('Review insert error:', error);
        throw error;
      }

      // Optimistically add the review to local state immediately
      if (data) {
        const updatedReviews = [data, ...reviews];
        setReviews(updatedReviews);
        // Update product stats immediately
        await updateProductStats(updatedReviews);
      }

      toast.success("Review submitted successfully! Thank you for your feedback.");
      setNewReview({ name: "", rating: 5, comment: "" });
      setShowForm(false);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      if (error.code === '42501') {
        toast.error("Permission denied. Please try logging in first.");
      } else {
        toast.error("Failed to submit review. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = async (reviewId: string) => {
    if (editData.comment.trim().length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          rating: editData.rating,
          comment: editData.comment.trim() 
        })
        .eq('id', reviewId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setReviews(prev => {
        const updated = prev.map(r => 
          r.id === reviewId 
            ? { ...r, rating: editData.rating, comment: editData.comment.trim() }
            : r
        );
        updateProductStats(updated);
        return updated;
      });

      setEditingReview(null);
      toast.success("Review updated!");
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error("Failed to update review");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setReviews(prev => {
        const updated = prev.filter(r => r.id !== reviewId);
        updateProductStats(updated);
        return updated;
      });

      toast.success("Review deleted");
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error("Failed to delete review");
    }
  };

  const startEditReview = (review: Review) => {
    setEditingReview(review.id);
    setEditData({ rating: review.rating, comment: review.comment });
  };

  const handleHelpful = async (reviewId: string, currentCount: number) => {
    try {
      const newCount = (currentCount || 0) + 1;
      const { error } = await supabase
        .from('reviews')
        .update({ helpful_count: newCount })
        .eq('id', reviewId);

      if (error) throw error;
      
      // Optimistic update
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, helpful_count: newCount } : r
      ));
      toast.success("Thanks for your feedback!");
    } catch (error) {
      console.error('Error updating helpful count:', error);
      toast.error("Could not update. Please try again.");
    }
  };

  const canEditReview = (review: Review) => {
    return user && review.user_id === user.id;
  };

  const displayReviews = reviews;
  const actualReviewCount = reviews.length;
  const actualRating = actualReviewCount > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / actualReviewCount 
    : productRating;

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: displayReviews.filter(r => Math.floor(r.rating) === star).length,
    percentage: displayReviews.length > 0 
      ? (displayReviews.filter(r => Math.floor(r.rating) === star).length / displayReviews.length) * 100 
      : 0,
  }));

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Rating Summary */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary">{actualRating.toFixed(1)}</p>
              <StarRating rating={actualRating} size="lg" />
              <p className="text-sm text-muted-foreground mt-1">
                Based on {actualReviewCount} review{actualReviewCount !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="space-y-2">
              {ratingBreakdown.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm w-8">{star} ★</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-yellow-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.1 * star }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>

            <Button 
              className="w-full" 
              onClick={() => setShowForm(!showForm)}
            >
              Write a Review
            </Button>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">Write Your Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Your Name</label>
                        <Input
                          value={newReview.name}
                          onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                          placeholder="Enter your name"
                          maxLength={50}
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Rating</label>
                        <div className="mt-1">
                          <StarRating
                            rating={newReview.rating}
                            size="lg"
                            interactive
                            onRatingChange={(rating) => setNewReview({ ...newReview, rating })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Your Review</label>
                        <Textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          placeholder="Share your experience with this product... (minimum 10 characters)"
                          rows={4}
                          maxLength={500}
                          disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {newReview.comment.length}/500 characters
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={submitting}>
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Review"
                          )}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {displayReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
              </CardContent>
            </Card>
          ) : (
            displayReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                layout
              >
                <Card>
                  <CardContent className="pt-6">
                    {editingReview === review.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Rating</label>
                          <div className="mt-1">
                            <StarRating
                              rating={editData.rating}
                              size="lg"
                              interactive
                              onRatingChange={(rating) => setEditData({ ...editData, rating })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Your Review</label>
                          <Textarea
                            value={editData.comment}
                            onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
                            rows={3}
                            maxLength={500}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEditReview(review.id)}>
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingReview(null)}>
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{review.user_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} size="sm" />
                            {canEditReview(review) && (
                              <div className="flex gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => startEditReview(review)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete your review. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteReview(review.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-4">{review.comment}</p>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHelpful(review.id, review.helpful_count || 0)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Helpful ({review.helpful_count || 0})
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};