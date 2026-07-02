import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Send, Loader2, Paperclip } from "@/lib/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UploadFile } from "@/integrations/Core";

const EMOJIS = ["😊", "🙏", "❤️", "🔥", "✨", "🐸", "🌿", "💚", "😂", "👍", "🎉", "🕊️", "🙌", "😌", "💫", "🌀", "☀️", "🌙"];

export default function MessageInput({ onSendMessage, isSending }) {
  const [newMessage, setNewMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage({ type: 'text', content: newMessage.trim() });
    setNewMessage("");
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await UploadFile({ file });
      onSendMessage({ type: 'file', content: file.name, url: file_url });
    } catch (error) {
      console.error("File upload failed:", error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card/80 p-3 backdrop-blur">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <div className="flex items-end gap-1 rounded-2xl border border-border bg-background px-2 py-1.5 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary/40">
        <Button variant="ghost" size="icon" aria-label="Attach file" className="h-9 w-9 shrink-0 text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
          <Paperclip className="h-5 w-5" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Insert emoji" className="h-9 w-9 shrink-0 text-base">🙂</Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-6 gap-1">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => setNewMessage((m) => m + e)} className="rounded-md p-1.5 text-lg transition-colors hover:bg-accent">{e}</button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message…"
          rows={1}
          className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Button onClick={handleSend} disabled={isSending || !newMessage.trim()} size="icon" aria-label="Send message" className="h-9 w-9 shrink-0 rounded-full">
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" weight="fill" />}
        </Button>
      </div>
    </div>
  );
}
