import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import "../styles/chats.css";
import { getAllChats, getMessagesByChat, sendMessage, markMessagesAsRead } from "../services/chats-api";
import { Divider } from "@mui/material";
import { showError } from "../components/Toast";

type ChatItem = {
    id: number;
    user1: number;
    user2: number;
    createdAt?: string;
    lastMessage?: string;
    receiverName: string;
    unreadCount?: number;
};
type Message = {
    conversationId: number;
    sender: number;
    message: string;
    fileName: string | string[] | null;
    fileType: string | string[] | null;
    fileData: number[] | number[][] | string | string[] | null;
    sentAt: string;
    isRead: boolean;
    readAt: string | null;
    id: number;
};

type ChatsNavState = {
    openConversationId?: number;
    openWithUserId?: number;
    initialMessage?: string;
};

type NormalizedFile = {
    fileName: string | null;
    fileType: string | null;
    fileData: number[] | string | null;
};

export default function Chats() {
    const location = useLocation();
    const navState = (location.state as ChatsNavState | null) ?? null;

    const [query, setQuery] = useState("");
    const [activeId, setActiveId] = useState<number | null>(null);
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [attachmentPreviews, setAttachmentPreviews] = useState<
        { file: File; url: string | null }[]
    >([]);

    const [imageViewer, setImageViewer] = useState<{
        open: boolean;
        src: string;
        alt: string;
        zoom: number;
    }>({ open: false, src: "", alt: "", zoom: 100 });

    const token = sessionStorage.getItem('jwtToken') || '';
    const userId = sessionStorage.getItem("userId") || "";

    useEffect(() => {
        const previews = attachments.map((file) => ({
            file,
            url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        }));

        setAttachmentPreviews(previews);

        return () => {
            for (const p of previews) {
                if (p.url) URL.revokeObjectURL(p.url);
            }
        };
    }, [attachments]);

    useEffect(() => {
        if (!imageViewer.open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setImageViewer({ open: false, src: "", alt: "", zoom: 100 });
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [imageViewer.open]);

    const openImageViewer = (src: string, alt: string) => {
        setImageViewer({ open: true, src, alt, zoom: 100 });
    };

    const clampZoom = (value: number) => Math.max(50, Math.min(400, value));

    const fetchChats = async () => {
        try {
            const response = await getAllChats(token, Number(userId));
            setChats(response.data);
        } catch (error) {
            setChats([]);
        }
    }

    useEffect(() => {
        fetchChats();
    }, []);

    // Prefill composer draft when coming from e.g. Marketplace
    useEffect(() => {
        if (navState?.initialMessage && !draft) {
            setDraft(navState.initialMessage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navState?.initialMessage]);

    // Auto-open the intended conversation (by id, or by participant match)
    useEffect(() => {
        if (!chats || chats.length === 0) return;
        if (activeId) return;

        if (navState?.openConversationId) {
            setActiveId(navState.openConversationId);
            return;
        }

        if (navState?.openWithUserId) {
            const me = Number(userId);
            const other = Number(navState.openWithUserId);
            const found = chats.find(
                (c) => (c.user1 === me && c.user2 === other) || (c.user2 === me && c.user1 === other)
            );
            if (found) setActiveId(found.id);
        }
    }, [chats, navState?.openConversationId, navState?.openWithUserId, activeId, userId]);

    const displayChats = useMemo(() => {
        if (chats && chats.length > 0) {
            return chats.map((c) => ({
                id: c.id,
                name: c.receiverName,
                receiverName: c.receiverName,
                lastMessage: c.lastMessage,
                unreadCount: c.unreadCount,
            }));
        }
        return [];
    }, [chats]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return displayChats;
        return displayChats.filter((u) => {
            const target = (u as any).receiverName ? (u as any).receiverName : (u as any).name;
            return target.toLowerCase().includes(q);
        });
    }, [query, displayChats]);

    // Fetch messages when activeId changes
    useEffect(() => {
        const fetchMessages = async () => {
            if (activeId) {
                try {
                    const response = await getMessagesByChat(token, activeId);
                    setMessages(response.data);
                    // mark messages as read on open
                    try {
                        await markMessagesAsRead(token, { conversationId: activeId, userId: Number(userId) });
                        setChats((prev) => prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c)));
                    } catch {
                        // ignore mark-as-read errors
                    }
                } catch {
                    setMessages([]);
                }
            }
        };
        fetchMessages();
    }, [activeId]);

    const clickTimer = useRef<number | null>(null);

    // refresh conversations + messages on any click (debounced)
    useEffect(() => {
        const handler = () => {
            if (clickTimer.current) {
                clearTimeout(clickTimer.current);
            }
            clickTimer.current = window.setTimeout(async () => {
                try {
                    await fetchChats();
                    if (activeId) {
                        try {
                            const resp = await getMessagesByChat(token, activeId);
                            setMessages(resp.data);
                            try {
                                await markMessagesAsRead(token, { conversationId: activeId, userId: Number(userId) });
                                setChats((prev) => prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c)));
                            } catch {
                                // ignore
                            }
                        } catch {
                            // ignore
                        }
                    }
                } catch {
                    // ignore
                }
            }, 250);
        };

        document.addEventListener("click", handler);
        return () => {
            document.removeEventListener("click", handler);
            if (clickTimer.current) clearTimeout(clickTimer.current);
        };
    }, [activeId, token, userId]);

    function normalizeFiles(msg: Message): NormalizedFile[] {
        const names = Array.isArray(msg.fileName) ? msg.fileName : msg.fileName ? [msg.fileName] : [];
        const types = Array.isArray(msg.fileType) ? msg.fileType : msg.fileType ? [msg.fileType] : [];

        const dataArr =
            Array.isArray(msg.fileData) && Array.isArray((msg.fileData as any)[0])
                ? (msg.fileData as number[][])
                : Array.isArray(msg.fileData)
                ? (msg.fileData as (number[] | string)[])
                : msg.fileData
                ? [msg.fileData as number[] | string]
                : [];

        const max = Math.max(names.length, types.length, dataArr.length);
        const files: NormalizedFile[] = [];
        for (let i = 0; i < max; i++) {
            files.push({
                fileName: names[i] ?? null,
                fileType: types[i] ?? null,
                fileData: dataArr[i] ?? null,
            });
        }
        return files;
    }

    function inferMime(fileName: string | null): string {
        const name = (fileName || "").toLowerCase();
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".gif")) return "image/gif";
        if (name.endsWith(".webp")) return "image/webp";
        return "image/png"; // fallback
    }

    function renderFile(file: NormalizedFile) {
        if (!file.fileData) return null;

        const mime = inferMime(file.fileName);
        if (!mime.startsWith("image/")) return null;

        let url = "";
        if (typeof file.fileData === "string") {
            url = file.fileData.startsWith("data:")
                ? file.fileData
                : `data:${mime};base64,${file.fileData}`;
        } else {
            const byteArray = new Uint8Array(file.fileData);
            const blob = new Blob([byteArray], { type: mime });
            url = URL.createObjectURL(blob);
        }

        const alt = file.fileName || "attachment";

        return (
            <img
                src={url}
                alt={alt}
                className="chatImg"
                onClick={(e) => {
                    const src = (e.currentTarget as HTMLImageElement).src;
                    openImageViewer(src, alt);
                }}
                role="button"
            />
        );
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!activeId) return;

        const form = new FormData();
        form.append("ConversationId", String(activeId));
        form.append("Sender", String(Number(userId)));
        form.append("Message", draft);

        attachments.forEach((file) => {
            form.append("Attachments", file);
        });

        try {
            await sendMessage(token, form);
            setDraft("");
            setAttachments([]);
            const response = await getMessagesByChat(token, activeId);
            setMessages(response.data);
        } catch {
            showError("Failed to send message");
        }
    }

    return (
        <div className="chatsPage">
            {imageViewer.open ? (
                <div
                    className="chatImageModalOverlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image viewer"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setImageViewer({ open: false, src: "", alt: "", zoom: 100 });
                        }
                    }}
                >
                    <div className="chatImageModal">
                        <div className="chatImageModalToolbar">
                            <button
                                type="button"
                                className="chatImageModalBtn"
                                onClick={() =>
                                    setImageViewer((v) => ({ ...v, zoom: clampZoom(v.zoom - 25) }))
                                }
                                aria-label="Zoom out"
                            >
                                −
                            </button>
                            <div className="chatImageModalZoom" aria-label="Zoom level">
                                {imageViewer.zoom}%
                            </div>
                            <button
                                type="button"
                                className="chatImageModalBtn"
                                onClick={() =>
                                    setImageViewer((v) => ({ ...v, zoom: clampZoom(v.zoom + 25) }))
                                }
                                aria-label="Zoom in"
                            >
                                +
                            </button>
                            <button
                                type="button"
                                className="chatImageModalBtn chatImageModalBtnClose"
                                onClick={() => setImageViewer({ open: false, src: "", alt: "", zoom: 100 })}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div
                            className="chatImageModalBody"
                            onWheel={(e) => {
                                e.preventDefault();
                                const delta = e.deltaY < 0 ? 25 : -25;
                                setImageViewer((v) => ({ ...v, zoom: clampZoom(v.zoom + delta) }));
                            }}
                        >
                            <img
                                className="chatImageModalImg"
                                src={imageViewer.src}
                                alt={imageViewer.alt}
                                style={{ width: `${imageViewer.zoom}%` }}
                                draggable={false}
                            />
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="postsHeader">
                <h2 className="postsTitle">Chats</h2>
            </div>

            <div className="chatsSearchWrap">
                <input
                    className="chatsSearch"
                    placeholder="Search chats..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search chats"
                />
            </div>

            <div className="chatsGrid">
                <aside className="chatsList" aria-label="Chats list">
                    {filtered.length === 0 ? (
                        <div className="chatsEmpty">No users found</div>
                    ) : (
                        filtered.map((u) => (
                            <button
                                key={u.id}
                                className={"chatItem " + (u.id === activeId ? "active" : "")}
                                onClick={() => setActiveId(u.id)}
                                style={{ position: "relative" }}
                            >
                                <div className="chatAvatar" aria-hidden>
                                    {u.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                                </div>
                                <div className="chatMeta">
                                    <div className="chatName">{u.name}</div>
                                    <div className="chatLast">{u.lastMessage}</div>
                                </div>
                                {u.unreadCount && u.unreadCount > 0 ? (
                                    <span
                                        className="unreadBadge"
                                        aria-label={`${u.unreadCount} unread messages`}
                                        style={{
                                            position: "absolute",
                                            top: 10,
                                            right: 10,
                                            background: "#e53935",
                                            color: "#fff",
                                            borderRadius: 12,
                                            padding: "2px 6px",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            minWidth: 20,
                                            textAlign: "center",
                                            lineHeight: "16px",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                        }}
                                    >
                                        {u.unreadCount > 99 ? "99+" : u.unreadCount}
                                    </span>
                                ) : null}
                            </button>
                        ))
                    )}
                </aside>

                <main className="chatPane" aria-label="Chat pane">
                    {activeId === null ? (
                        <div className="chatPlaceholder">
                            
                            Please click a chat to open
                            </div>
                    ) : (
                        <div className="chatWindow">
                            <div className="chatHeader">
                                {displayChats.find((u) => u.id === activeId)?.name}
                            </div>

                            <Divider />

                            <div className="chatBody">
                                {messages.length === 0 ? (
                                    <div className="chatPlaceholder">No messages yet</div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={
                                                "chatMsg " +
                                                (msg.sender === Number(userId) ? "right" : "left")
                                            }
                                        >
                                            <div className="chatMsgBubble">
                                                <div className="chatMsgText">{msg.message}</div>
                                                <div className="chatFiles">
                                                    {normalizeFiles(msg).map((f, idx) => (
                                                        <div key={idx} className="chatFileItem">
                                                            {renderFile(f)}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="chatMsgTime">
                                                    {new Date(msg.sentAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form className="chatComposer" onSubmit={handleSend}>
                                <label className="attachBtn" title="Attach file">
                                    📎
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                                        className="attachInput"
                                        onChange={(e) => {
                                            const picked = Array.from(e.target.files || []);
                                            const allowed = picked.filter((f) => {
                                                const t = (f.type || "").toLowerCase();
                                                if (t === "image/jpeg" || t === "image/png") return true;
                                                const name = (f.name || "").toLowerCase();
                                                return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
                                            });

                                            if (allowed.length !== picked.length) {
                                                showError("Only JPG/JPEG/PNG images are allowed");
                                            }

                                            setAttachments(allowed);
                                            // allow re-selecting the same file(s)
                                            e.currentTarget.value = "";
                                        }}
                                    />
                                </label>
                                <input
                                    className="chatComposerInput"
                                    placeholder="Type a message..."
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                />
                                <button className="chatComposerBtn" type="submit" disabled={!draft.trim() && attachments.length === 0}>
                                    Send
                                </button>
                            </form>

                            {attachmentPreviews.length > 0 ? (
                                <div className="chatAttachPreview" aria-label="Attachments">
                                    {attachmentPreviews.map((p, idx) => (
                                        <div key={`${p.file.name}-${p.file.size}-${idx}`} className="chatAttachItem">
                                            {p.url ? (
                                                <img src={p.url} alt={p.file.name} />
                                            ) : (
                                                <div className="chatAttachFile" title={p.file.name}>
                                                    <div className="chatAttachFileExt">
                                                        {(p.file.name.split(".").pop() || "FILE").toUpperCase()}
                                                    </div>
                                                    <div className="chatAttachFileName">{p.file.name}</div>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                className="chatAttachRemove"
                                                aria-label={`Remove ${p.file.name}`}
                                                title="Remove"
                                                onClick={() =>
                                                    setAttachments((prev) => prev.filter((_, i) => i !== idx))
                                                }
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}