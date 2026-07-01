import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Paperclip } from "@/lib/icons";
import { UploadFile } from "@/integrations/Core";

export default function MessageInput({ onSendMessage, isSending }) {
    const [newMessage, setNewMessage] = useState("");
    const fileInputRef = useRef(null);

    const handleSend = () => {
        if (!newMessage.trim()) return;
        onSendMessage({ type: 'text', content: newMessage.trim() });
        setNewMessage("");
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const { file_url } = await UploadFile({ file });
            onSendMessage({ type: 'file', content: file.name, url: file_url });
        } catch (error) {
            console.error("File upload failed:", error);
            // Optionally, show an error toast to the user
        } finally {
            // Reset file input
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-start gap-2 p-4 border-t bg-card">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <Button
                variant="ghost"
                size="icon"
                aria-label="Attach file"
                className="text-muted-foreground h-10 w-10 flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
            >
                <Paperclip className="w-5 h-5" />
            </Button>
            <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={1}
                onKeyPress={handleKeyPress}
                className="resize-none pr-4 min-h-[40px] max-h-32"
                style={{ overflowY: 'auto' }}
            />
            <Button
                onClick={handleSend}
                disabled={isSending || !newMessage.trim()}
                className="bg-primary hover:bg-primary/90 self-end h-10"
            >
                {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Send className="w-5 h-5" />
                )}
            </Button>
        </div>
    );
}