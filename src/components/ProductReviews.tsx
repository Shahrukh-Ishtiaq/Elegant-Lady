import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { StarRating } from "./StarRating";
import { Review } from "../types/product";
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
    comment: "Absolutely love this! The quality is amazing and it fits perfectly. The fabric is so soft and comfortable. Highly recommend!",
    date: "2024-01-15",
    helpful: 12,
  },
  {
    id: "2",
    productId: "1",
    userName: "Aisha K.",
    rating: 4,
    comment: "Great product, very comfortable. Shipping was fast. Only giving 4 stars because the color was slightly different from the picture.",
    date: "2024-01-10",
    helpful: 8,
  },
  {
    id: "3",
    productId: "1",
    userName: "Fatima R.",
    rating: 5,
    comment: "This is exactly what I was looking for! The lace detail is beautiful and the fit is true to size. Will definitely order more.",
    date: "2024-01-05",
    helpful: 15,
  },
];

export const ProductReviews = ({ productId, productRating, reviewCount }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
    userName: "",
  });
  const [helpfulClicked, setHelpfulClicked] = useState<string[]>([]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newReview.rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!newReview.comment.trim()) {
      toast.error("Please write a review");
      return;
    }
    if (!newReview.userName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      productId,
      userName: newReview.userName,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split("T")[0],
      helpful: 0,
    };

    setReviews([review, ...reviews]);
    setNewReview({ rating: 0, comment: "", userName: "" });
    setShowReviewForm(false);
    toast.success("Review submitted successfully!");
  };

  const handleHelpful = (reviewId: string) => {
    if (helpfulClicked.includes(reviewId)) {
      toast.error("You've already marked this review as helpful");
      return;
    }
    
    setReviews(reviews.map(r => 
      r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
    ));
    setHelpfulClicked([...helpfulClicked, reviewId]);
    toast.success("Marked as helpful");
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const distribution = getRatingDistribution();

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div className="text-center md:text-left">
              <div className="text-5xl font-bold mb-2">{productRating.toFixed(1)}</div>
              <StarRating rating={productRating} size="lg" />
              <p className="text-muted-foreground mt-2">Based on {reviewCount} reviews</p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-12 text-sm">{star} stars</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{
                        width: `${reviews.length > 0 ? (distribution[star as keyof typeof distribution] / reviews.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-sm text-muted-foreground">
                    {distribution[star as keyof typeof distribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Customer Reviews ({reviews.length})</h3>
        <Button onClick={() => setShowReviewForm(!showReviewForm)}>
          {showReviewForm ? "Cancel" : "Write a Review"}
        </Button>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Write Your Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Rating</label>
                <StarRating
                  rating={newReview.rating}
                  size="lg"
                  interactive
                  onRatingChange={(rating) => setNewReview({ ...newReview, rating })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <Input
                  value={newReview.userName}
                  onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <Textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Share your experience with this product..."
                  rows={4}
                />
              </div>
              <Button type="submit">Submit Review</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{review.userName}</p>
                    <p className="text-sm text-muted-foreground">{review.date}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>
              <p className="text-muted-foreground mb-4">{review.comment}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleHelpful(review.id)}
                disabled={helpfulClicked.includes(review.id)}
                className="text-muted-foreground"
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Helpful ({review.helpful})
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
