import { useEffect, useMemo, useRef, useState } from "react";
import { createPost, getSavedPostsByUser, savePost } from "../services/post-api";
import "../styles/posts.css";
import CloseIcon from "@mui/icons-material/Close";
import { showError, showSuccess } from "../components/Toast";

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

type FilterType = "announcement" | "notes" | "events" | null;
type CreateCategoryType = "Announcement" | "Notes" | "Events" | "";

interface ModalState {
    open: boolean;
    postId: number | null;
    images: string[];
    index: number;
}

const MAX_IMAGES = 5;
const CAPTION_LIMIT = 220;
const EMPTY_MODAL: ModalState = {
    open: false,
    postId: null,
    images: [],
    index: 0,
};

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

            if (Array.isArray(item) && item.every((x) => typeof x === "number")) {
                return item as number[];
            }

            if (item && typeof item === "object" && Array.isArray((item as any).$values)) {
                const inner = (item as any).$values;
                if (Array.isArray(inner) && inner.every((x: unknown) => typeof x === "number")) {
                    return inner as number[];
                }
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

    const base64 = bytesToBase64(value);
    return `data:${mimeType};base64,${base64}`;
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function getFilterLabel(filter: FilterType): string {
    if (!filter) return "Filter";
    if (filter === "announcement") return "Filter: Announcement";
    if (filter === "notes") return "Filter: Notes";
    return "Filter: Events";
}

export default function FavouritePosts() {
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCaptionIds, setExpandedCaptionIds] = useState<number[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<FilterType>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [createCaption, setCreateCaption] = useState("");
    const [createCategory, setCreateCategory] = useState<CreateCategoryType>("");
    const [createFiles, setCreateFiles] = useState<File[]>([]);
    const [createPreviewUrls, setCreatePreviewUrls] = useState<string[]>([]);
    const [createSubmitting, setCreateSubmitting] = useState(false);

    const [modal, setModal] = useState<ModalState>(EMPTY_MODAL);

    const filterRef = useRef<HTMLDivElement | null>(null);
    const createFileInputRef = useRef<HTMLInputElement | null>(null);

    const token = sessionStorage.getItem("jwtToken") || "";
    const userId = Number(sessionStorage.getItem("userId"));

    const expandedSet = useMemo(() => new Set(expandedCaptionIds), [expandedCaptionIds]);

    const visiblePosts = useMemo(() => {
        if (!selectedFilter) return posts;
        const expected = selectedFilter.toLowerCase();
        return posts.filter((post) => (post.category ?? "").toLowerCase() === expected);
    }, [posts, selectedFilter]);

    const selectedFilterLabel = useMemo(() => getFilterLabel(selectedFilter), [selectedFilter]);

    const handleGetSavedPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getSavedPostsByUser(userId, token);
            const list = safeArrayFromDotNet<PostResponse>(response.data);
            setPosts(list);
        } catch (error) {
            setPosts([]);
            setError("Failed to load posts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleGetSavedPosts();
    }, []);

    useEffect(() => {
        if (!filterOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (!target) return;

            if (filterRef.current && !filterRef.current.contains(target)) {
                setFilterOpen(false);
            }
        };

        window.addEventListener("mousedown", handleClickOutside);
        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, [filterOpen]);

    useEffect(() => {
        if (!modal.open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeModal();
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [modal.open]);

    useEffect(() => {
        const urls = createFiles.map((file) => URL.createObjectURL(file));
        setCreatePreviewUrls(urls);

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [createFiles]);

    const toggleCaption = (postId: number) => {
        setExpandedCaptionIds((prev) =>
            prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
        );
    };

    const openModal = (postId: number | null, rawImages: ApiByteArray[] | string[], index: number) => {
        const urls =
            typeof rawImages[0] === "string" && String(rawImages[0]).startsWith("data:")
                ? (rawImages as string[])
                : (rawImages as ApiByteArray[]).map((img) => toImageSrc(img));

        setModal({
            open: true,
            postId,
            images: urls,
            index,
        });
    };

    const closeModal = () => setModal(EMPTY_MODAL);

    const goPrev = () => {
        setModal((prev) => {
            if (!prev.open || prev.images.length === 0) return prev;
            return {
                ...prev,
                index: (prev.index - 1 + prev.images.length) % prev.images.length,
            };
        });
    };

    const goNext = () => {
        setModal((prev) => {
            if (!prev.open || prev.images.length === 0) return prev;
            return {
                ...prev,
                index: (prev.index + 1) % prev.images.length,
            };
        });
    };

    const closeCreate = () => {
        if (createSubmitting) return;
        setCreateOpen(false);
    };

    const handleCreateFiles = (files: FileList | null) => {
        const pickedFiles = files ? Array.from(files) : [];
        if (pickedFiles.length === 0) return;

        setCreateFiles((prev) => {
            const remainingSlots = Math.max(0, MAX_IMAGES - prev.length);
            const filesToAdd = pickedFiles.slice(0, remainingSlots);

            if (pickedFiles.length > remainingSlots) {
                showError("Only 5 images allowed");
            }

            return [...prev, ...filesToAdd];
        });

        if (createFileInputRef.current) {
            createFileInputRef.current.value = "";
        }
    };

    const removeCreateFile = (index: number) => {
        setCreateFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const openCreatePreview = (index: number) => {
        if (createPreviewUrls.length === 0) return;
        setModal({
            open: true,
            postId: null,
            images: createPreviewUrls,
            index,
        });
    };

    const submitCreate = async () => {
        if (createSubmitting) return;

        if (!createCategory) {
            showError("Please select a category");
            return;
        }

        try {
            setCreateSubmitting(true);

            const rawUserId = sessionStorage.getItem("userId") || "";

            await createPost(
                {
                    caption: createCaption.trim() || undefined,
                    category: createCategory,
                    userId: Number.isFinite(Number(rawUserId)) ? Number(rawUserId) : undefined,
                    images: createFiles,
                },
                token
            );

            showSuccess("Post created");
            setCreateOpen(false);
            await handleGetSavedPosts();
        } catch (e: any) {
            const message = e?.response?.data?.Message || e?.message || "Failed to create post";
            showError(message);
        } finally {
            setCreateSubmitting(false);
        }
    };

    const handleUnsavePost = async (postId: number) => {
        if (!window.confirm("Are you sure you want to unsave this post?")) return;

        try {
            setLoading(true);
            await savePost(postId, userId, "Remove", token);
            showSuccess("Post unsaved");
            await handleGetSavedPosts();
        } catch (error) {
            showError("Failed to unsave post");
        } finally {
            setLoading(false);
        }
    };

    const renderFilterMenu = () => (
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
    );

    return (
        <div className="postsPage">
            <div className="postsHeader">
                <h2 className="postsTitle">Favourite Posts</h2>

                <div className="postsToolbarActions">
                    <div className="postsFilterWrap" ref={filterRef}>
                        <button
                            type="button"
                            className="postsButton"
                            aria-haspopup="menu"
                            aria-expanded={filterOpen}
                            onClick={() => setFilterOpen((prev) => !prev)}
                            disabled={loading}
                        >
                            {selectedFilterLabel}
                        </button>

                        {filterOpen && renderFilterMenu()}
                    </div>
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
                    const isCaptionExpanded = expandedSet.has(post.id);

                    const caption = post.caption ?? "";
                    const shouldTruncateCaption = caption.length > CAPTION_LIMIT;
                    const captionText =
                        shouldTruncateCaption && !isCaptionExpanded
                            ? `${caption.slice(0, CAPTION_LIMIT)}…`
                            : caption;

                    const imagesGridClass =
                        displayImages.length === 1 ? "imagesGrid imagesGridOne" : "imagesGrid";

                    return (
                        <div key={post.id} className="postsCard">
                            <div className="postTopRow">
                                <div>
                                    <div className="postUserName">{post.userName ?? "Unknown"}</div>
                                    <div className="postsMuted">{formatDate(post.createdAt)}</div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleUnsavePost(post.id)}
                                    className="deleteBtn"
                                >
                                    Unsave
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
                                        <button
                                            type="button"
                                            onClick={() => toggleCaption(post.id)}
                                            className="captionToggle"
                                        >
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

                                                {showExtraOverlay && (
                                                    <div className="extraOverlay">+{extraCount}</div>
                                                )}
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
                                    <button
                                        type="button"
                                        onClick={goPrev}
                                        aria-label="Previous image"
                                        className="modalNav modalNavPrev"
                                    >
                                        Prev
                                    </button>

                                    <button
                                        type="button"
                                        onClick={goNext}
                                        aria-label="Next image"
                                        className="modalNav modalNavNext"
                                    >
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

                            <button
                                type="button"
                                onClick={closeCreate}
                                className="modalClose"
                                disabled={createSubmitting}
                            >
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
                                onChange={(e) => setCreateCategory(e.target.value as CreateCategoryType)}
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
                                            <img
                                                className="createPreviewImg"
                                                src={src}
                                                alt={`Selected ${idx + 1}`}
                                            />

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
                            <button
                                type="button"
                                className="postsButton"
                                onClick={closeCreate}
                                disabled={createSubmitting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="postsCreateButton"
                                onClick={submitCreate}
                                disabled={createSubmitting}
                            >
                                {createSubmitting ? "Creating…" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}