import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/StarRating";
import { Review } from "@/types/product";
import { ThumbsUp, User } from "lucide-react";
import { toast } from "sonner";

interface ProductReviewsProps {
  productId: string;
  productRating: number;
  reviewCount: number;
}

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: "1",
    productId: "1",
    userName: "Sarah M.",
    rating: 5,
    comment: "Absolutely love this! The quality is amazing and it fits perfectly. Super comfortable for everyday wear.",
    date: "2024-01-15",
    helpful: 12,
  },
  {
    id: "2",
    productId: "1",
    userName: "Ayesha K.",
    rating: 4,
    comment: "Great product, soft fabric and beautiful design. Delivery was quick too!",
    date: "2024-01-10",
    helpful: 8,
  },
  {
    id: "3",
    productId: "2",
    userName: "Fatima R.",
    rating: 5,
    comment: "Best purchase I've made! The material is so soft and the fit is true to size.",
    date: "2024-01-08",
    helpful: 15,
  },
  {
    id: "4",
    productId: "3",
    userName: "Zara H.",
    rating: 4,
    comment: "Beautiful piece, very elegant. Would definitely recommend to others.",
    date: "2024-01-05",
    helpful: 6,
  },
  {
    id: "5",
    productId: "5",
    userName: "Nadia A.",
    rating: 5,
    comment: "Exceeded my expectations! The support is excellent and it's so comfortable.",
    date: "2024-01-03",
    helpful: 20,
  },
];

export const ProductReviews = ({ productId, productRating, reviewCount }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: "", rating: 5, comment: "" });

  const productReviews = reviews.filter(r => r.productId === productId || reviews.length < 3);
  const displayReviews = productReviews.length > 0 ? productReviews : reviews.slice(0, 3);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReview.name.trim() || !newReview.comment.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      productId,
      userName: newReview.name,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split("T")[0],
      helpful: 0,
    };

    setReviews([review, ...reviews]);
    setNewReview({ name: "", rating: 5, comment: "" });
    setShowForm(false);
    toast.success("Review submitted successfully!");
  };

  const handleHelpful = (reviewId: string) => {
    setReviews(reviews.map(r => 
      r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
    ));
    toast.success("Thanks for your feedback!");
  };

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: displayReviews.filter(r => Math.floor(r.rating) === star).length,
    percentage: displayReviews.length > 0 
      ? (displayReviews.filter(r => Math.floor(r.rating) === star).length / displayReviews.length) * 100 
      : 0,
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Rating Summary */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary">{productRating.toFixed(1)}</p>
              <StarRating rating={productRating} size="lg" />
              <p className="text-sm text-muted-foreground mt-1">
                Based on {reviewCount} reviews
              </p>
            </div>
            
            <div className="space-y-2">
              {ratingBreakdown.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm w-8">{star} ★</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
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
          {showForm && (
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
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Submit Review</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {displayReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{review.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString("en-US", {
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
                  onClick={() => handleHelpful(review.id)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Helpful ({review.helpful})
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
