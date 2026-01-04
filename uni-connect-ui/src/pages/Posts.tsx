import { useEffect, useMemo, useRef, useState } from "react";
import { createPost, getAllPosts, savePost } from "../services/post-api";
import "../styles/posts.css";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { showError, showSuccess } from "../components/Toast";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type ApiByteArray = string | number[];

interface PostResponse {
    id: number;
    caption?: string | null;
    category?: string | null;
    images?: unknown;
    userId?: number | null;
    createdAt: string;
    userName?: string | null;
}


function safeArrayFromDotNet<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === "object" && Array.isArray((value as any).$values)) {
        return (value as any).$values as T[];
    }
    return [];
}

function safeByteArrayFromDotNet(value: unknown): ApiByteArray[] {
    const list = safeArrayFromDotNet<unknown>(value);
    return list
        .map((item) => {
            if (typeof item === "string") return item;
            if (Array.isArray(item) && item.every((x) => typeof x === "number")) return item as number[];
            if (item && typeof item === "object" && Array.isArray((item as any).$values)) {
                const inner = (item as any).$values;
                if (Array.isArray(inner) && inner.every((x: unknown) => typeof x === "number")) return inner as number[];
            }
            return null;
        })
        .filter((x): x is ApiByteArray => x !== null);
}

function bytesToBase64(bytes: number[]): string {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}

function toImageSrc(value: ApiByteArray, mimeType = "image/jpeg"): string {
    if (typeof value === "string") {
        if (value.startsWith("data:")) return value;
        return `data:${mimeType};base64,${value}`;
    }

    // If the API ever returns a numeric byte array instead of base64
    const base64 = bytesToBase64(value);
    return `data:${mimeType};base64,${base64}`;
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function readSavedIds(): number[] {
    try {
        const raw = localStorage.getItem("uni-connect:savedPostIds");
        if (!raw) return [];
        const parsed = JSON.parse(raw) as JsonValue;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((x) => (typeof x === "number" ? x : Number.NaN))
            .filter((x) => Number.isFinite(x));
    } catch {
        return [];
    }
}

function writeSavedIds(ids: number[]) {
    localStorage.setItem("uni-connect:savedPostIds", JSON.stringify(ids));
}

export default function Posts() {
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedIds, setSavedIds] = useState<number[]>(() => readSavedIds());
    const [expandedCaptionIds, setExpandedCaptionIds] = useState<number[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<"announcement" | "notes" | "events" | null>(null);
    const filterRef = useRef<HTMLDivElement | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [createCaption, setCreateCaption] = useState("");
    const [createCategory, setCreateCategory] = useState<"Announcement" | "Notes" | "Events" | "">("");
    const [createFiles, setCreateFiles] = useState<File[]>([]);
    const [createPreviewUrls, setCreatePreviewUrls] = useState<string[]>([]);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const createFileInputRef = useRef<HTMLInputElement | null>(null);
    const [modal, setModal] = useState<{ open: boolean; postId: number | null; images: string[]; index: number }>(
        { open: false, postId: null, images: [], index: 0 }
    );

    const token = sessionStorage.getItem('jwtToken') || '';

    const handleGetPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllPosts(token);
            const list = safeArrayFromDotNet<PostResponse>(response.data);
            setPosts(list);
        } catch (error) {
            setPosts([]);
            setError("Failed to load posts");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        handleGetPosts();
    }, []);

    const savedSet = useMemo(() => new Set(savedIds), [savedIds]);
    const expandedSet = useMemo(() => new Set(expandedCaptionIds), [expandedCaptionIds]);

    const visiblePosts = useMemo(() => {
        if (!selectedFilter) return posts;
        const expected = selectedFilter.toLowerCase();
        return posts.filter((p) => (p.category ?? "").toLowerCase() === expected);
    }, [posts, selectedFilter]);

    const selectedFilterLabel = useMemo(() => {
        if (!selectedFilter) return "Filter";
        if (selectedFilter === "announcement") return "Filter: Announcement";
        if (selectedFilter === "notes") return "Filter: Notes";
        return "Filter: Events";
    }, [selectedFilter]);

    useEffect(() => {
        if (!filterOpen) return;
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (filterRef.current && !filterRef.current.contains(target)) {
                setFilterOpen(false);
            }
        };
        window.addEventListener("mousedown", onMouseDown);
        return () => window.removeEventListener("mousedown", onMouseDown);
    }, [filterOpen]);

    const toggleSave = (postId: number) => {
        setSavedIds((prev) => {
            const next = prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId];
            writeSavedIds(next);
            return next;
        });
    };

    const toggleCaption = (postId: number) => {
        setExpandedCaptionIds((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]));
    };

    const openModal = (postId: number, rawImages: ApiByteArray[], index: number) => {
        const urls = rawImages.map((img) => toImageSrc(img));
        setModal({ open: true, postId, images: urls, index });
    };

    const closeModal = () => setModal({ open: false, postId: null, images: [], index: 0 });

    const goPrev = () =>
        setModal((m) => {
            if (!m.open || m.images.length === 0) return m;
            return { ...m, index: (m.index - 1 + m.images.length) % m.images.length };
        });

    const goNext = () =>
        setModal((m) => {
            if (!m.open || m.images.length === 0) return m;
            return { ...m, index: (m.index + 1) % m.images.length };
        });

    useEffect(() => {
        if (!modal.open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeModal();
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [modal.open]);

    useEffect(() => {
        const urls = createFiles.map((file) => URL.createObjectURL(file));
        setCreatePreviewUrls(urls);
        return () => {
            for (const url of urls) URL.revokeObjectURL(url);
        };
    }, [createFiles]);

    const openCreate = () => {
        setCreateCaption("");
        setCreateCategory("");
        setCreateFiles([]);
        setCreateOpen(true);
    };

    const closeCreate = () => {
        if (createSubmitting) return;
        setCreateOpen(false);
    };

    const handleCreateFiles = (files: FileList | null) => {
        const picked = files ? Array.from(files) : [];
        if (picked.length === 0) return;

        setCreateFiles((prev) => {
            const remainingSlots = Math.max(0, 5 - prev.length);
            const toAdd = picked.slice(0, remainingSlots);

            if (picked.length > remainingSlots) {
                showError("Only 5 images allowed");
            }

            return [...prev, ...toAdd];
        });

        // Allow picking the same file again
        if (createFileInputRef.current) {
            createFileInputRef.current.value = "";
        }
    };

    const removeCreateFile = (index: number) => {
        setCreateFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const openCreatePreview = (index: number) => {
        if (createPreviewUrls.length === 0) return;
        setModal({ open: true, postId: null, images: createPreviewUrls, index });
    };

    const submitCreate = async () => {
        if (createSubmitting) return;

        if (!createCategory) {
            showError("Please select a category");
            return;
        }

        try {
            setCreateSubmitting(true);

            const userId = sessionStorage.getItem("userId") || ""

            await createPost({
                caption: createCaption.trim() || undefined,
                category: createCategory,
                userId: Number.isFinite(Number(userId)) ? Number(userId) : undefined,
                images: createFiles,
            }, token);

            showSuccess("Post created");
            setCreateOpen(false);
            await handleGetPosts();
        } catch (e: any) {
            const message = e?.response?.data?.Message || e?.message || "Failed to create post";
            showError(message);
        } finally {
            setCreateSubmitting(false);
        }
    };

    const handleSavePost = async (postId: number) => {
        try {
            const userId = sessionStorage.getItem("userId") || "";
            await savePost(postId, Number(userId), "Add", token);
            showSuccess("Post saved");
        } catch (e: any) {
            const message = e?.response?.data?.Message || e?.message || "Failed to save post";
            showError(message);
        }
    };

  return (
    <div className="postsPage">
        <div className="postsHeader">
            <h2 className="postsTitle">Posts</h2>
            <div className="postsToolbarActions">
                <div className="postsFilterWrap" ref={filterRef}>
                    <button
                        type="button"
                        className="postsButton"
                        aria-haspopup="menu"
                        aria-expanded={filterOpen}
                        onClick={() => setFilterOpen((v) => !v)}
                        disabled={loading}
                    >
                        {selectedFilterLabel}
                    </button>

                    {filterOpen && (
                        <div className="postsFilterMenu" role="menu">
                            <button
                                type="button"
                                role="menuitem"
                                className="postsFilterItem"
                                onClick={() => {
                                    setSelectedFilter("announcement");
                                    setFilterOpen(false);
                                }}
                            >
                                Announcement
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className="postsFilterItem"
                                onClick={() => {
                                    setSelectedFilter("notes");
                                    setFilterOpen(false);
                                }}
                            >
                                Notes
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className="postsFilterItem"
                                onClick={() => {
                                    setSelectedFilter("events");
                                    setFilterOpen(false);
                                }}
                            >
                                Events
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className="postsCreateButton"
                    onClick={() => {
                        openCreate();
                    }}
                >
                    <AddIcon fontSize="small" />
                    Create Post
                </button>
            </div>
        </div>

        {error && (
            <div className="postsCard postsError">
                <div className="postsMuted">{error}</div>
            </div>
        )}

        {!loading && posts.length === 0 && !error && (
            <div className="postsCard postsCardCenter">
                <div className="postsMuted">No posts yet.</div>
            </div>
        )}

        <div className="postsList">
            {visiblePosts.map((post) => {
                const rawImages = safeByteArrayFromDotNet(post.images);
                const displayImages = rawImages.slice(0, 4);
                const extraCount = Math.max(0, rawImages.length - 4);
                const isSaved = savedSet.has(post.id);
                const isCaptionExpanded = expandedSet.has(post.id);
                const caption = post.caption ?? "";
                const captionLimit = 220;
                const shouldTruncateCaption = caption.length > captionLimit;
                const captionText = shouldTruncateCaption && !isCaptionExpanded ? `${caption.slice(0, captionLimit)}…` : caption;

                const imagesGridClass = displayImages.length === 1 ? "imagesGrid imagesGridOne" : "imagesGrid";

                return (
                    <div key={post.id} className="postsCard">
                        <div className="postTopRow">
                            <div>
                                <div className="postUserName">{post.userName ?? "Unknown"}</div>
                                <div className="postsMuted">{formatDate(post.createdAt)}</div>
                            </div>

                            <button type="button" onClick={() => handleSavePost(post.id)} className="saveBtn" aria-pressed={isSaved}>
                                Save to Favourites
                            </button>
                        </div>

                        {post.category && (
                            <div className="categoryRow">
                                <span className="categoryPill">#{post.category}</span>
                            </div>
                        )}

                        {caption.length > 0 && (
                            <div className="captionRow">
                                <div className="captionText">{captionText}</div>
                                {shouldTruncateCaption && (
                                    <button type="button" onClick={() => toggleCaption(post.id)} className="captionToggle">
                                        {isCaptionExpanded ? "See less" : "See more"}
                                    </button>
                                )}
                            </div>
                        )}

                        {displayImages.length > 0 && (
                            <div className={imagesGridClass}>
                                {displayImages.map((img, idx) => {
                                    const showExtraOverlay = idx === 3 && extraCount > 0;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => openModal(post.id, rawImages, idx)}
                                            className="thumbButton"
                                            aria-label={`Open image ${idx + 1} of ${rawImages.length}`}
                                        >
                                            <img
                                                src={toImageSrc(img)}
                                                alt={`Post ${post.id} image ${idx + 1}`}
                                                loading="lazy"
                                                className="thumbImage"
                                            />

                                            {showExtraOverlay && <div className="extraOverlay">+{extraCount}</div>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {modal.open && (
            <div
                role="dialog"
                aria-modal="true"
                className="modalBackdrop"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeModal();
                }}
            >
                <div className="modalPanel">
                    <div className="modalHeader">
                        <div className="postsMuted">
                            Image {modal.images.length === 0 ? 0 : modal.index + 1} of {modal.images.length}
                        </div>
                        <button type="button" onClick={closeModal} className="modalClose">
                            x
                        </button>
                    </div>

                    <div className="modalStage">
                        {modal.images.length > 0 && (
                            <img src={modal.images[modal.index]} alt="Selected" className="modalImage" />
                        )}

                        {modal.images.length > 1 && (
                            <>
                                <button type="button" onClick={goPrev} aria-label="Previous image" className="modalNav modalNavPrev">
                                    Prev
                                </button>
                                <button type="button" onClick={goNext} aria-label="Next image" className="modalNav modalNavNext">
                                    Next
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}

        {createOpen && (
            <div
                role="dialog"
                aria-modal="true"
                className="modalBackdrop"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeCreate();
                }}
            >
                <div className="createModalPanel">
                    <div className="modalHeader">
                        <div className="createModalTitle">Create Post</div>
                        <button type="button" onClick={closeCreate} className="modalClose" disabled={createSubmitting}>
                            x
                        </button>
                    </div>

                    <div className="createModalBody">
                        <label className="createLabel" htmlFor="postCategory">
                            Category
                        </label>
                        <select
                            id="postCategory"
                            className="createSelect"
                            value={createCategory}
                            onChange={(e) => setCreateCategory(e.target.value as any)}
                            disabled={createSubmitting}
                        >
                            <option value="">Select</option>
                            <option value="Announcement">Announcement</option>
                            <option value="Notes">Notes</option>
                            <option value="Events">Events</option>
                        </select>

                        <label className="createLabel" htmlFor="postCaption">
                            Caption
                        </label>
                        <textarea
                            id="postCaption"
                            className="createTextarea"
                            value={createCaption}
                            onChange={(e) => setCreateCaption(e.target.value)}
                            placeholder="Write something…"
                            rows={4}
                            disabled={createSubmitting}
                        />

                        <label className="createLabel" htmlFor="postImages">
                            Images (max 5)
                        </label>
                        <input
                            id="postImages"
                            className="createFile"
                            ref={createFileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleCreateFiles(e.target.files)}
                            disabled={createSubmitting}
                        />

                        {createFiles.length > 0 && (
                            <div className="createHint">Selected: {createFiles.length} file(s)</div>
                        )}

                        {createPreviewUrls.length > 0 && (
                            <div className="createPreviewGrid" aria-label="Selected images">
                                {createPreviewUrls.map((src, idx) => (
                                    <button
                                        key={src}
                                        type="button"
                                        className="createPreviewItem"
                                        onClick={() => openCreatePreview(idx)}
                                        disabled={createSubmitting}
                                        aria-label={`Preview image ${idx + 1}`}
                                    >
                                        <img className="createPreviewImg" src={src} alt={`Selected ${idx + 1}`} />
                                        <button
                                            type="button"
                                            className="createPreviewRemove"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeCreateFile(idx);
                                            }}
                                            aria-label={`Remove image ${idx + 1}`}
                                            disabled={createSubmitting}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </button>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="createModalFooter">
                        <button type="button" className="postsButton" onClick={closeCreate} disabled={createSubmitting}>
                            Cancel
                        </button>
                        <button type="button" className="postsCreateButton" onClick={submitCreate} disabled={createSubmitting}>
                            {createSubmitting ? "Creating…" : "Create"}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}