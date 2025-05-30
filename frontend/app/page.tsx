"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Send, Settings, Volume2, VolumeX } from "lucide-react";
import { useChat } from "@/lib/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { EmptyState } from "@/components/chat/empty-state";
import { VoiceControls } from "@/components/chat/voice-controls";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatFooter } from "@/components/chat/chat-footer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Message, MessageRole } from "@/lib/types";

export default function ChatPage() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("default");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Chat state from our custom hook
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    resetChat,
    apiKey,
    setApiKey,
    isApiKeyValid,
  } = useChat();

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }
    };
  }, [currentAudio]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsInputExpanded(false);

    try {
      await sendMessage(userMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const playTTS = async (text: string) => {
    if (!ttsEnabled) return;

    try {
      setIsSpeaking(true);
      
      // Call the TTS API
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioSrc(url);

      // Play the audio
      const audio = new Audio(url);
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(url);
        toast({
          title: "Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        });
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
      toast({
        title: "TTS Error",
        description: "Failed to generate or play speech.",
        variant: "destructive",
      });
    }
  };

  const stopTTS = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
      setCurrentAudio(null);
    }
    setIsSpeaking(false);
  };

  const handleVoiceRecording = async () => {
    // This would be implemented with browser's Web Speech API or a similar solution
    setIsRecording(!isRecording);
    
    // Placeholder for voice recording functionality
    if (!isRecording) {
      toast({
        title: "Voice Recording",
        description: "Voice recording feature is coming soon!",
      });
    }
  };

  // Determine if we should show the empty state
  const showEmptyState = messages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Header */}
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">LLM Chat with TTS</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTtsEnabled(!ttsEnabled)}
                    className="relative"
                  >
                    {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {ttsEnabled ? "Disable TTS" : "Enable TTS"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <Tabs defaultValue="general">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="voice">Voice</TabsTrigger>
                      <TabsTrigger value="api">API Keys</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general" className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="tts-toggle">Text-to-Speech</Label>
                        <Switch
                          id="tts-toggle"
                          checked={ttsEnabled}
                          onCheckedChange={setTtsEnabled}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <Select
                          value={theme || "system"}
                          onValueChange={(value) => {
                            document.documentElement.classList.add("theme-transition");
                            document.documentElement.setAttribute("data-theme", value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Button
                          variant="outline"
                          onClick={resetChat}
                          className="w-full"
                        >
                          Clear Conversation
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="voice" className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Voice</Label>
                        <Select
                          value={selectedVoice}
                          onValueChange={setSelectedVoice}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select voice" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="robot">Robot</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Voice Speed</Label>
                          <span className="text-sm text-muted-foreground">1.0x</span>
                        </div>
                        <Slider
                          defaultValue={[1.0]}
                          min={0.5}
                          max={2.0}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Exaggeration</Label>
                          <span className="text-sm text-muted-foreground">0.5</span>
                        </div>
                        <Slider
                          defaultValue={[0.5]}
                          min={0.0}
                          max={1.0}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="api" className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <div className="space-y-2">
                          <Input
                            id="api-key"
                            type="password"
                            placeholder="Enter your API key"
                            value={apiKey || ""}
                            onChange={(e) => setApiKey(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">
                            {isApiKeyValid
                              ? "API key is valid"
                              : "Enter your API key to use the chat"}
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden">
        <div className="container h-full mx-auto flex flex-col">
          {showEmptyState ? (
            <EmptyState />
          ) : (
            <ScrollArea className="flex-1 p-4 chat-scroll-area">
              <div className="space-y-4 max-w-3xl mx-auto">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChatMessage
                        message={message}
                        onPlayTTS={() => playTTS(message.content)}
                        isSpeaking={isSpeaking && message === messages[messages.length - 1]}
                        ttsEnabled={ttsEnabled}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-center py-10"
                  >
                    <LoadingSpinner />
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
          
          {/* Input Area */}
          <div className="border-t bg-background p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  {isInputExpanded ? (
                    <Textarea
                      placeholder="Type your message here..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[80px] resize-none pr-12"
                    />
                  ) : (
                    <Input
                      placeholder="Type your message here..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsInputExpanded(true)}
                      className="pr-12"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 bottom-2"
                    onClick={handleVoiceRecording}
                    disabled={isLoading}
                  >
                    <Mic className={`h-5 w-5 ${isRecording ? "text-red-500 animate-pulse" : ""}`} />
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              
              {isSpeaking && (
                <div className="mt-2 flex items-center justify-center">
                  <VoiceControls
                    isSpeaking={isSpeaking}
                    onStop={stopTTS}
                  />
                </div>
              )}
              
              <div className="mt-2 text-center">
                <p className="text-xs text-muted-foreground">
                  Powered by Chatterbox TTS and OpenAI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
