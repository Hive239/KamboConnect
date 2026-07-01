import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, CheckCheck, FileText, Info } from '@/lib/icons';
import { cn } from '@/lib/utils';

const formatDate = (date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'p');
    if (isYesterday(d)) return `Yesterday at ${format(d, 'p')}`;
    return format(d, 'MMM d, yyyy');
};

const SystemMessage = ({ content }) => (
    <div className="flex items-center justify-center my-4">
        <div className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1 flex items-center gap-2">
            <Info className="w-3 h-3" />
            <span>{content}</span>
        </div>
    </div>
);

const FileMessage = ({ fileUrl, content }) => (
    <a 
        href={fileUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-primary/5 text-primary p-2 rounded-lg hover:bg-primary/10 transition-colors"
    >
        <FileText className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium underline truncate">{content}</span>
    </a>
);

export default function MessageBubble({ message, isSender, senderName, showAvatar }) {
    if (message.message_type === 'system') {
        return <SystemMessage content={message.content} />;
    }

    const senderInitial = senderName ? senderName.charAt(0).toUpperCase() : '?';

    return (
        <div className={cn("flex items-start gap-3 w-full", isSender ? 'justify-end' : 'justify-start')}>
            {!isSender && (
                <div className="w-8 h-8 flex-shrink-0">
                    {showAvatar && (
                        <Avatar className="w-8 h-8">
                            <AvatarFallback>{senderInitial}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            )}
            <div className={cn("flex flex-col max-w-sm md:max-w-md", isSender ? 'items-end' : 'items-start')}>
                <div
                    className={cn(
                        "rounded-lg p-3",
                        isSender ? 'bg-primary text-white rounded-br-none' : 'bg-muted text-foreground rounded-bl-none'
                    )}
                >
                    {!isSender && showAvatar && <p className="text-xs font-bold mb-1">{senderName}</p>}

                    {message.message_type === 'file' ? (
                        <FileMessage fileUrl={message.file_url} content={message.content} />
                    ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 px-1 flex items-center gap-1">
                    <span>{formatDate(message.created_date)}</span>
                    {isSender && (
                        message.is_read ? <CheckCheck className="w-4 h-4 text-blue-500" /> : <Check className="w-4 h-4" />
                    )}
                </div>
            </div>
        </div>
    );
}