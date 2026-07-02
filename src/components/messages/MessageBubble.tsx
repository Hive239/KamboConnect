import React from 'react';
import { format } from 'date-fns';
import { CheckCheck, Check, FileText, Info } from '@/lib/icons';
import { cn } from '@/lib/utils';

const timeOf = (d) => format(new Date(d), 'p');
const isImage = (url = '') => /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url);

const SystemMessage = ({ content }) => (
  <div className="my-3 flex justify-center">
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
      <Info className="h-3 w-3" /> {content}
    </span>
  </div>
);

function Attachment({ url, name, isSender }) {
  if (isImage(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
        <img src={url} alt={name} loading="lazy" className="max-h-64 w-full object-cover" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm", isSender ? "bg-white/15 text-primary-foreground" : "bg-primary/5 text-primary")}>
      <FileText className="h-5 w-5 shrink-0" /><span className="truncate font-medium">{name}</span>
    </a>
  );
}

export default function MessageBubble({ message, isSender, senderName, senderImage, showAvatar }) {
  if (message.message_type === 'system') return <SystemMessage content={message.content} />;

  const initial = senderName ? senderName.charAt(0).toUpperCase() : '?';
  const isFile = message.message_type === 'file';
  const imageBubble = isFile && isImage(message.file_url);

  return (
    <div className={cn("flex w-full items-end gap-2", isSender ? "justify-end" : "justify-start")}>
      {!isSender && (
        <div className="h-8 w-8 shrink-0">
          {showAvatar && (senderImage
            ? <img src={senderImage} alt={senderName} className="h-8 w-8 rounded-full object-cover" />
            : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-clay/25 text-xs font-semibold text-primary">{initial}</span>)}
        </div>
      )}
      <div className={cn("flex max-w-[78%] flex-col", isSender ? "items-end" : "items-start")}>
        {!isSender && showAvatar && <span className="mb-0.5 px-1 text-xs font-medium text-muted-foreground">{senderName}</span>}
        <div className={cn(
          "text-sm shadow-sm transition-colors",
          imageBubble ? "overflow-hidden rounded-2xl p-1" : "rounded-2xl px-3.5 py-2",
          isSender
            ? "rounded-br-md bg-gradient-to-br from-primary to-[hsl(var(--primary)/0.82)] text-primary-foreground"
            : "rounded-bl-md border border-border bg-card text-foreground",
        )}>
          {isFile
            ? <Attachment url={message.file_url} name={message.content} isSender={isSender} />
            : <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>}
        </div>
        <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
          <span>{timeOf(message.created_date)}</span>
          {isSender && (message.is_read
            ? <span className="inline-flex items-center gap-0.5 text-info"><CheckCheck className="h-3.5 w-3.5" /> Seen</span>
            : <Check className="h-3.5 w-3.5" />)}
        </div>
      </div>
    </div>
  );
}
