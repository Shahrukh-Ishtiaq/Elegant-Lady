import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_NUMBER = "923001234567"; // Replace with actual admin number

export const WhatsAppButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hi! I'm interested in your products at Elegant Lady.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="absolute bottom-16 right-0 w-72 bg-card border border-border rounded-2xl shadow-elegant overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#25D366] p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Elegant Lady</h3>
                  <p className="text-xs opacity-90">Typically replies within minutes</p>
                </div>
              </div>
            </div>

            {/* Chat Preview */}
            <div className="p-4 bg-[#ECE5DD] min-h-[120px]">
              <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%]">
                <p className="text-sm text-foreground">
                  Hello! 👋 How can we help you today?
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  Just now
                </p>
              </div>
            </div>

            {/* Action */}
            <div className="p-4 bg-card">
              <Button
                onClick={handleWhatsAppClick}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isOpen ? "bg-muted" : "bg-[#25D366]"
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-foreground" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </motion.button>

      {/* Pulse Animation */}
      {!isOpen && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#25D366]"></span>
        </span>
      )}
    </div>
  );
};
