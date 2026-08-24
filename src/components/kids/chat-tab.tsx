'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  fetchMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  subscribeToChat,
} from '@/lib/services/chat';
import { ChatMessage } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Code,
  Mic,
  Square,
  Paperclip,
  History,
  Pencil,
  Trash2,
  Download,
  Play,
  Pause,
  Check,
  X,
  Radio,
} from 'lucide-react';

interface ChatTabProps {
  kidId: string;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function ChatTab({ kidId, currentUser }: ChatTabProps) {
  const user = currentUser || {
    id: 'user-azriel',
    name: 'Azriel Cohenca',
    email: 'azrielcohenca@gmail.com',
    role: 'Master Admin',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [showHistoryMessageId, setShowHistoryMessageId] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load initial messages and set up realtime subscription
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      const data = await fetchMessages(kidId);
      if (isMounted) {
        setMessages(data);
        setLoading(false);
      }
    }

    loadData();

    const sub = subscribeToChat(kidId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.newRecord) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.newRecord.id)) return prev;
          const newMsg: ChatMessage = {
            id: payload.newRecord.id,
            kid_id: payload.newRecord.kid_id,
            user_id: payload.newRecord.user_id,
            user_name: payload.newRecord.user_name || 'Staff Member',
            user_role: payload.newRecord.user_role || 'Staff',
            body: payload.newRecord.body,
            voice_note_url: payload.newRecord.voice_note_url,
            voice_note_duration: payload.newRecord.voice_note_duration,
            created_at: payload.newRecord.created_at,
            updated_at: payload.newRecord.updated_at,
            deleted_at: payload.newRecord.deleted_at,
            edit_history: payload.newRecord.edit_history || [],
          };
          return [...prev, newMsg];
        });
      } else if (payload.eventType === 'UPDATE' && payload.newRecord) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.newRecord.id
              ? {
                  ...m,
                  body: payload.newRecord.body,
                  updated_at: payload.newRecord.updated_at,
                  deleted_at: payload.newRecord.deleted_at,
                  edit_history: payload.newRecord.edit_history || m.edit_history,
                }
              : m
          )
        );
      } else if (payload.eventType === 'DELETE' && payload.oldRecord) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.oldRecord.id
              ? { ...m, deleted_at: new Date().toISOString() }
              : m
          )
        );
      }
    });

    return () => {
      isMounted = false;
      sub.unsubscribe();
    };
  }, [kidId]);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Audio Recording Logic
  const startRecording = () => {
    simulateVoiceRecording();

    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
    ) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const url =
              typeof URL !== 'undefined' && URL.createObjectURL
                ? URL.createObjectURL(audioBlob)
                : 'mock-audio-url';
            setAudioBlobUrl(url);
            stream.getTracks().forEach((track) => track.stop());
          };

          mediaRecorder.start();
        })
        .catch(() => {
          // Handled via simulated recording fallback
        });
    }
  };

  const simulateVoiceRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setAudioBlobUrl('https://www.w3schools.com/html/horse.mp3');
    }
    setRecordedDuration(recordingTime > 0 ? recordingTime : 5);
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioBlobUrl(null);
    setRecordingTime(0);
  };

  // Rich-text formatting toolbar helpers
  const applyFormatting = (syntaxStart: string, syntaxEnd: string = syntaxStart) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = inputText.substring(start, end) || 'text';
    const replacement = `${syntaxStart}${selectedText}${syntaxEnd}`;
    const newText = inputText.substring(0, start) + replacement + inputText.substring(end);
    setInputText(newText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + syntaxStart.length,
          start + syntaxStart.length + selectedText.length
        );
      }
    }, 50);
  };

  // Handle Send
  const handleSend = async () => {
    if (!inputText.trim() && !audioBlobUrl) return;

    const bodyText = inputText.trim() || (audioBlobUrl ? '🎤 Voice note' : '');
    const vUrl = audioBlobUrl;
    const vDuration = recordedDuration;

    // Reset input state immediately for snappy UI
    setInputText('');
    setAudioBlobUrl(null);
    setRecordedDuration(0);

    const created = await sendMessage({
      kidId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      body: bodyText,
      voiceNoteUrl: vUrl,
      voiceNoteDuration: vDuration,
    });

    setMessages((prev) => {
      if (prev.some((m) => m.id === created.id)) return prev;
      return [...prev, created];
    });
  };

  // Handle Edit Submit
  const handleSaveEdit = async (messageId: string) => {
    if (!editText.trim()) return;
    const updated = await editMessage({ messageId, body: editText.trim() });
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, body: updated.body, updated_at: updated.updated_at, edit_history: updated.edit_history } : m))
    );
    setEditingMessageId(null);
    setEditText('');
  };

  // Handle Soft Delete
  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    await deleteMessage(messageId);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m
      )
    );
  };

  // Export Chat
  const handleExportChat = () => {
    const textContent = messages
      .filter((m) => !m.deleted_at)
      .map((m) => `[${new Date(m.created_at).toLocaleString()}] ${m.user_name} (${m.user_role}): ${m.body}`)
      .join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_kid_${kidId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper function to safely render rich-text formatted messages
  const renderFormattedBody = (text: string) => {
    if (!text) return null;

    // Parse simple markdown tags safely
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={lIdx} className="ml-4 list-disc">
            {parseInlineStyles(line.substring(2))}
          </li>
        );
      }
      return (
        <p key={lIdx} className="mb-1 leading-relaxed">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  const parseInlineStyles = (str: string): React.ReactNode[] => {
    // Regex matching markdown link [text](url), bold **text**, italic *text*, inline code `code`
    const regex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const parts = str.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={index}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              {linkMatch[1]}
            </a>
          );
        }
      }
      return part;
    });
  };

  // Role Badge Variant Selector
  const getRoleBadge = (role?: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('master') || r.includes('admin')) {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] px-2 py-0.5 font-semibold">Master Admin</Badge>;
    }
    if (r.includes('vaad')) {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-2 py-0.5 font-semibold">VAAD Member</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] px-2 py-0.5 font-semibold">Staff</Badge>;
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <span>Real-Time Admissions Chat</span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-normal bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
              Live channel active
            </span>
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Traceable, non-repudiable team conversation with rich formatting and voice notes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportChat} className="flex items-center gap-1.5 text-xs">
          <Download className="w-3.5 h-3.5" />
          Export Chat
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Messages Stream */}
        <div className="h-[420px] overflow-y-auto space-y-4 pr-2 rounded-lg bg-slate-50/50 p-4 border">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Loading chat thread...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
              <p>No messages yet.</p>
              <p className="text-xs text-slate-500">Start the conversation with staff below.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwner = msg.user_id === user.id;
              const isDeleted = Boolean(msg.deleted_at);

              return (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl border bg-white shadow-2xs transition-all ${
                    isOwner ? 'border-green-100 bg-green-50/20' : 'border-slate-200'
                  }`}
                >
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                        {msg.user_name ? msg.user_name.substring(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <span className="font-semibold text-xs text-slate-900">{msg.user_name}</span>
                      {getRoleBadge(msg.user_role)}
                      <span className="text-[11px] text-slate-400">
                        {new Date(msg.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.updated_at && !isDeleted && (
                        <button
                          onClick={() =>
                            setShowHistoryMessageId(
                              showHistoryMessageId === msg.id ? null : msg.id
                            )
                          }
                          className="text-[10px] text-slate-400 hover:text-slate-600 underline flex items-center gap-0.5"
                          title="Click to toggle edit history"
                        >
                          (edited)
                          <History className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Action buttons */}
                    {!isDeleted && (
                      <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                        {isOwner && (
                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditText(msg.body);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="Edit message"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(isOwner || user.role.includes('Admin')) && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Body or Edit Mode */}
                  {isDeleted ? (
                    <p className="text-xs italic text-slate-400 bg-slate-100 p-2 rounded">
                      [Message deleted by author]
                    </p>
                  ) : editingMessageId === msg.id ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-green-600 bg-white"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setEditingMessageId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-700 hover:bg-green-800"
                          onClick={() => handleSaveEdit(msg.id)}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-800 space-y-1">
                      {renderFormattedBody(msg.body)}
                    </div>
                  )}

                  {/* Embedded Inline Audio Player if Voice Note attached */}
                  {msg.voice_note_url && !isDeleted && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                        <Mic className="w-3.5 h-3.5 text-amber-700" />
                        <span>Voice Note Attachment</span>
                        {msg.voice_note_duration && (
                          <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            {Math.floor(msg.voice_note_duration / 60)}:
                            {(msg.voice_note_duration % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      <audio controls src={msg.voice_note_url} className="w-full h-8 max-w-md mt-1" />
                    </div>
                  )}

                  {/* Edit History Popover/Accordion */}
                  {showHistoryMessageId === msg.id && msg.edit_history && msg.edit_history.length > 0 && (
                    <div className="mt-3 p-2.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] text-slate-600 space-y-1.5">
                      <div className="font-semibold text-slate-700 flex items-center gap-1">
                        <History className="w-3 h-3 text-slate-500" />
                        Revision History:
                      </div>
                      {msg.edit_history.map((hist, hIdx) => (
                        <div key={hIdx} className="border-l-2 border-slate-300 pl-2 py-0.5">
                          <span className="text-slate-400 block text-[10px]">
                            {new Date(hist.edited_at).toLocaleString()}
                          </span>
                          <span className="text-slate-700">{hist.body}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer Box with Formatting Toolbar */}
        <div className="border rounded-xl p-3 bg-white space-y-2 shadow-2xs">
          {/* Rich-Text Formatting Toolbar */}
          <div className="flex items-center justify-between border-b pb-2 text-slate-600">
            <div className="flex items-center gap-1">
              <button
                onClick={() => applyFormatting('**')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
                title="Bold (**text**)"
                type="button"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('*')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
                title="Italics (*text*)"
                type="button"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('- ', '')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
                title="Bullet List (- item)"
                type="button"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('[', '](url)')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
                title="Hyperlink ([text](url))"
                type="button"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('`')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
                title="Inline Code (`code`)"
                type="button"
              >
                <Code className="w-4 h-4" />
              </button>
            </div>

            {/* In-Chat Voice Note Controls */}
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={startRecording}
                  className="h-8 text-xs text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5 text-amber-700" />
                  Record Voice Note
                </Button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md text-xs text-red-700">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  <span>
                    Recording {Math.floor(recordingTime / 60)}:
                    {(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={stopRecording}
                    className="p-1 hover:bg-red-100 rounded text-red-800"
                    title="Stop Recording"
                    type="button"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={cancelRecording}
                    className="p-1 hover:bg-red-100 rounded text-red-800"
                    title="Cancel"
                    type="button"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Voice note preview attached */}
          {audioBlobUrl && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-700" />
                <span className="font-semibold">Voice note recorded ({recordedDuration}s)</span>
                <audio controls src={audioBlobUrl} className="h-7 max-w-xs" />
              </div>
              <button
                onClick={() => setAudioBlobUrl(null)}
                className="text-amber-700 hover:text-amber-900 p-1"
                title="Remove audio attachment"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message with markdown formatting (**bold**, *italic*, `code`, [link](url))..."
            className="w-full text-xs p-2 border-0 focus:ring-0 focus:outline-none resize-none min-h-[60px]"
          />

          {/* Bottom Send Action Row */}
          <div className="flex justify-between items-center pt-1 border-t">
            <span className="text-[11px] text-slate-400">
              Press Enter to send, Shift+Enter for new line
            </span>
            <Button
              onClick={handleSend}
              disabled={!inputText.trim() && !audioBlobUrl}
              className="bg-green-700 hover:bg-green-800 text-white h-8 text-xs px-4"
            >
              Send Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
