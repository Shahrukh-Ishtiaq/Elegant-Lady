import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Review {
  id: string;
  product_id: string;
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
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReview.name.trim() || !newReview.comment.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user?.id || null,
          user_name: newReview.name.trim(),
          rating: newReview.rating,
          comment: newReview.comment.trim(),
        });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setNewReview({ name: "", rating: 5, comment: "" });
      setShowForm(false);
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string, currentCount: number) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ helpful_count: currentCount + 1 })
        .eq('id', reviewId);

      if (error) throw error;
      
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
      ));
      toast.success("Thanks for your feedback!");
    } catch (error) {
      console.error('Error updating helpful count:', error);
    }
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
                          placeholder="Share your experience with this product..."
                          rows={4}
                          maxLength={500}
                          disabled={submitting}
                        />
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
              >
                <Card>
                  <CardContent className="pt-6">
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
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    
                    <p className="text-muted-foreground mb-4">{review.comment}</p>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpful(review.id, review.helpful_count)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Helpful ({review.helpful_count})
                    </Button>
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