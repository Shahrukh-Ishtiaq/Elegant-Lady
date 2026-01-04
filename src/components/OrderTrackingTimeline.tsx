import { CheckCircle2, Circle, Package, Truck, Home, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTrackingTimelineProps {
  status: string;
  createdAt: string;
}

const steps = [
  { key: "pending", label: "Order Placed", icon: Clock, description: "Your order has been received" },
  { key: "approved", label: "Approved", icon: CheckCircle2, description: "Order confirmed by seller" },
  { key: "processing", label: "Processing", icon: Package, description: "Preparing your items" },
  { key: "shipped", label: "Shipped", icon: Truck, description: "On the way to you" },
  { key: "delivered", label: "Delivered", icon: Home, description: "Order delivered successfully" },
];

const getStepIndex = (status: string) => {
  if (status === "cancelled") return -1;
  const index = steps.findIndex((s) => s.key === status);
  return index === -1 ? 0 : index;
};

export const OrderTrackingTimeline = ({ status, createdAt }: OrderTrackingTimelineProps) => {
  const currentStepIndex = getStepIndex(status);
  const isCancelled = status === "cancelled";

  return (
    <div className="py-4">
      {isCancelled ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <Circle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-destructive">Order Cancelled</h3>
          <p className="text-muted-foreground text-sm mt-1">This order has been cancelled</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />
          
          {/* Progress line */}
          <div 
            className="absolute left-6 top-6 w-0.5 bg-primary transition-all duration-500"
            style={{ height: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />

          <div className="space-y-6">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.key} className="relative flex items-start gap-4 pl-0">
                  {/* Icon */}
                  <div
                    className={cn(
                      "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isCurrent && "animate-pulse")} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-2">
                    <h4
                      className={cn(
                        "font-semibold text-sm",
                        isCompleted ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                        Current Status
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};