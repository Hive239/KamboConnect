
import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { User, Conversation, Message, Practitioner } from "@/entities/all";
import { subscribe } from "@/data/store";
import { Button } from "@/components/ui/button";
import { Loader2, User as UserIcon, MessageSquarePlus } from "@/lib/icons";
import ConversationList from "../components/messages/ConversationList";
import MessageThread from "../components/messages/MessageThread";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationService } from "../components/notifications/NotificationService";

const NewConversationModal = ({ open, onOpenChange, practitioners, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredPractitioners = practitioners.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a New Conversation</DialogTitle>
          <DialogDescription>Select a practitioner to message.</DialogDescription>
        </DialogHeader>
        <Input 
          placeholder="Search practitioners..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="my-4"
        />
        <ScrollArea className="h-72">
          <div className="space-y-2">
            {filteredPractitioners.map(p => (
              <div 
                key={p.id} 
                onClick={() => onSelect(p.id, p.full_name)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
              >
                <UserIcon className="w-5 h-5 text-muted-foreground"/>
                <span className="font-medium">{p.full_name}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default function Messages() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
  const [practitioners, setPractitioners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLoadAttempted, setDataLoadAttempted] = useState(false); // Prevent multiple load attempts

  const loadConversations = useCallback(async (currentUser) => {
    try {
      // Add a small delay to prevent rapid-fire API calls
      
      // The `queryData` method is not available. We'll achieve the OR query by doing two separate filters and merging them.
      // Fetch conversations where the current user is participant 1
      const convosAsP1 = await Conversation.filter({ participant_1_id: currentUser.id });
      
      // Add another small delay before the second call
      
      // Fetch conversations where the current user is participant 2
      const convosAsP2 = await Conversation.filter({ participant_2_id: currentUser.id });

      // Merge the two arrays and remove duplicates using a Map
      const allConversations = [...convosAsP1, ...convosAsP2];
      const uniqueConversations = Array.from(new Map(allConversations.map(c => [c.id, c])).values());

      // Sort the merged list by the last message date in descending order
      uniqueConversations.sort((a, b) => new Date(b.last_message_date) - new Date(a.last_message_date));
      
      setConversations(uniqueConversations);
      return uniqueConversations;
    } catch (error) {
      console.error("Failed to load conversations:", error);
      return [];
    }
  }, []);
  
  const loadMessages = useCallback(async (conversation) => {
    if (!conversation || !user || isMessagesLoading) return; // Prevent concurrent calls
    
    setIsMessagesLoading(true);
    try {
      // Add delay to prevent rate limiting
      
      const fetchedMessages = await Message.filter(
        { conversation_id: conversation.id },
        "created_date" // oldest first
      );
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    } finally {
      setIsMessagesLoading(false);
    }
  }, [user, isMessagesLoading]);

  const handleConversationSelect = useCallback((conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation);
  }, [loadMessages]);

  // Load initial data only once on mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (dataLoadAttempted) return; // Prevent multiple attempts
      
      setIsLoading(true);
      setDataLoadAttempted(true);
      
      try {
        // Load user first
        const currentUser = await User.me();
        setUser(currentUser);
        
        // Add delay before next API call
        
        // Load conversations
        await loadConversations(currentUser);
        
        // Add delay before final API call
        
        // Load practitioners
        const allPractitioners = await Practitioner.list();
        setPractitioners(allPractitioners.filter(p => p.id !== currentUser.id));
        
      } catch (error) {
        console.error("Failed to load initial data:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [dataLoadAttempted, loadConversations]); // Fixed dependencies for useEffect

  // This effect handles selecting a conversation from the URL
  useEffect(() => {
    if (conversations.length > 0 && !isLoading) {
      const searchParams = new URLSearchParams(location.search);
      const conversationIdFromUrl = searchParams.get('conversation_id');
      
      if (conversationIdFromUrl) {
        const conversationToSelect = conversations.find(c => c.id === conversationIdFromUrl);
        if (conversationToSelect && selectedConversation?.id !== conversationToSelect.id) {
          handleConversationSelect(conversationToSelect);
        }
      } else if (!selectedConversation && conversations.length > 0) {
        // If no ID in URL and none selected, default to the first one
        handleConversationSelect(conversations[0]);
      }
    }
  }, [conversations, isLoading, location.search, selectedConversation, handleConversationSelect]); // Fixed dependencies for useEffect

  const sendMessage = async (messageData) => {
    if (!selectedConversation || !user) return;

    try {
      const otherId = selectedConversation.participant_1_id === user.id
        ? selectedConversation.participant_2_id
        : selectedConversation.participant_1_id;
      // 1. Create the new message (correct schema fields so bubbles align + read state works)
      const newMessage = await Message.create({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        receiver_id: otherId,
        sender_name: user.full_name,
        content: messageData.content,
        message_type: messageData.type === 'file' ? 'file' : 'user',
        file_url: messageData.url,
        is_read: false,
      });

      // 2. Optimistically add to UI
      setMessages(prev => [...prev, newMessage]);

      // 3. Update conversation's last message in the background (with delay to avoid rate limiting)
      setTimeout(() => {
        Conversation.update(selectedConversation.id, {
          last_message: messageData.content,
          last_message_date: new Date().toISOString(),
        });
      }, 100);
      
      // 4. Notify the other participant (with delay)
      setTimeout(() => {
        const otherParticipantId = selectedConversation.participant_1_id === user.id 
            ? selectedConversation.participant_2_id 
            : selectedConversation.participant_1_id;
        
        if (otherParticipantId) {
          NotificationService.createMessageNotification(otherParticipantId, {
            sender_name: user.full_name,
            content: messageData.content,
            conversation_id: selectedConversation.id
          });
        }
      }, 200);

    } catch (error) {
      console.error("Failed to send message:", error);
      // Optional: handle UI reversal on failure
    }
  };
  
  // Real-time: live-update the open thread + conversation list on data changes (incl. cross-tab)
  useEffect(() => {
    const unsub = subscribe((c) => {
      if (c.entity === 'Message' && selectedConversation && c.record?.conversation_id === selectedConversation.id) {
        Message.filter({ conversation_id: selectedConversation.id }, 'created_date').then(setMessages);
      }
      if ((c.entity === 'Conversation' || c.entity === '*') && user) {
        loadConversations(user);
      }
    });
    return unsub;
  }, [selectedConversation, user, loadConversations]);

  const startNewConversation = async (practitionerId, practitionerName) => {
    setIsNewConvoModalOpen(false);
    if (!user) return;
    
    try {
      // Check if conversation already exists with delays to prevent rate limiting
      const existingConvo1 = await Conversation.filter({
          participant_1_id: user.id,
          participant_2_id: practitionerId
      });
      
      
      const existingConvo2 = await Conversation.filter({
          participant_1_id: practitionerId,
          participant_2_id: user.id
      });
      
      const existingConvo = [...existingConvo1, ...existingConvo2];

      if (existingConvo.length > 0) {
        handleConversationSelect(existingConvo[0]);
        return;
      }

      // Create a new one if it doesn't exist
      const newConversation = await Conversation.create({
          participant_1_id: user.id,
          participant_2_id: practitionerId,
          participant_1_name: user.full_name,
          participant_2_name: practitionerName,
          last_message: "Conversation started.",
          last_message_date: new Date().toISOString()
      });
      
      setConversations(prev => [newConversation, ...prev]);
      handleConversationSelect(newConversation);
    } catch (error) {
        console.error("Failed to start new conversation:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-6 bg-muted">
        <UserIcon className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Please Log In</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          You need to be logged in to view your messages.
        </p>
        <Button onClick={() => User.login()} className="bg-primary hover:bg-primary/90">
          Log In
        </Button>
      </div>
    );
  }
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showConversationList = isMobile ? !selectedConversation : true;
  const showMessageThread = isMobile ? !!selectedConversation : true;

  return (
    <>
      <NewConversationModal 
        open={isNewConvoModalOpen}
        onOpenChange={setIsNewConvoModalOpen}
        practitioners={practitioners}
        onSelect={startNewConversation}
      />
      <div className="h-screen flex bg-card">
        {/* Sidebar */}
        {showConversationList && (
            <aside className="w-full md:w-80 lg:w-96 flex-col border-r border-border h-full flex">
              <ConversationList
                conversations={conversations}
                selectedConversation={selectedConversation}
                onConversationSelect={handleConversationSelect}
                currentUser={user}
                onNewConversation={() => setIsNewConvoModalOpen(true)}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </aside>
        )}
        
        {/* Main Content */}
        {showMessageThread && (
            <main className="flex-1 flex flex-col h-full">
                {selectedConversation ? (
                    <MessageThread 
                        conversation={selectedConversation}
                        messages={messages}
                        currentUser={user}
                        onSendMessage={sendMessage}
                        isSending={isMessagesLoading}
                        onBack={() => setSelectedConversation(null)}
                    />
                ) : conversations.length > 0 ? (
                     <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
                        <MessageSquarePlus className="w-16 h-16 mb-4 text-muted-foreground/40" />
                        <h2 className="text-xl font-semibold">Select a conversation</h2>
                        <p>Choose a conversation from the left to start chatting.</p>
                    </div>
                ) : (
                     <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
                        <MessageSquarePlus className="w-16 h-16 mb-4 text-muted-foreground/40" />
                        <h2 className="text-xl font-semibold">No conversations yet</h2>
                        <p className="mb-4">Start a new conversation with a practitioner.</p>
                        <Button onClick={() => setIsNewConvoModalOpen(true)}>
                            Start a new conversation
                        </Button>
                    </div>
                )}
            </main>
        )}
      </div>
    </>
  );
}
