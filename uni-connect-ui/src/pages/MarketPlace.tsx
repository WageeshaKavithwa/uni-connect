import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/marketplace.css"
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { showError, showSuccess } from "../components/Toast";
import { createItem, deleteItem, getAllItems, getItemsByUser } from "../services/marketplace-api";
import { checkChatExists, createChat } from "../services/chats-api";

type ApiByteArray = string | number[];

interface MarketplaceItem {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    images?: unknown;
    userId?: number | null;
    userName?: string | null;
    createdAt: string;
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

    const base64 = bytesToBase64(value);
    return `data:${mimeType};base64,${base64}`;
}

export default function MarketPlace() {
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"all" | "myItems">("all");
    const [createOpen, setCreateOpen] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createDescription, setCreateDescription] = useState("");
    const [createPrice, setCreatePrice] = useState("");
    const [createFiles, setCreateFiles] = useState<File[]>([]);
    const [createPreviewUrls, setCreatePreviewUrls] = useState<string[]>([]);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const createFileInputRef = useRef<HTMLInputElement | null>(null);
    const [menuItemId, setMenuItemId] = useState<number | null>(null);
    const [imageModal, setImageModal] = useState<{ open: boolean; itemId: number | null; images: string[]; index: number; zoom: number }>
        ({ open: false, itemId: null, images: [], index: 0, zoom: 1 });

    const token = sessionStorage.getItem('jwtToken') || '';
    const userId = parseInt(sessionStorage.getItem('userId') || '0');
    const navigate = useNavigate();

    const handleGetItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllItems(token);
            
            // Handle both direct array and .NET $values wrapper
            let list: MarketplaceItem[] = [];
            if (Array.isArray(response.data)) {
                list = response.data;
            } else if (response.data && typeof response.data === 'object' && Array.isArray((response.data as any).$values)) {
                list = (response.data as any).$values;
            } else {
                list = safeArrayFromDotNet<MarketplaceItem>(response.data);
            }
            
            setItems(list || []);
        } catch (err) {
            console.error("Error fetching items:", err);
            setItems([]);
            setError("Failed to load marketplace items");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        handleGetItems();
    }, []);

    const handleGetMyItems = async () => {
        try {
            setLoading(true);
            setError(null);
            if (userId === 0) {
                setError("User not found");
                setItems([]);
                setLoading(false);
                return;
            }
            
            const response = await getItemsByUser(userId, token);
            
            // Handle both direct array and .NET $values wrapper
            let list: MarketplaceItem[] = [];
            if (Array.isArray(response.data)) {
                list = response.data;
            } else if (response.data && typeof response.data === 'object' && Array.isArray((response.data as any).$values)) {
                list = (response.data as any).$values;
            } else {
                list = safeArrayFromDotNet<MarketplaceItem>(response.data);
            }
            
            setItems(list || []);
        } catch (err) {
            console.error("Error fetching my items:", err);
            setItems([]);
            setError("Failed to load your items");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (viewMode === "myItems") {
            handleGetMyItems();
        } else {
            handleGetItems();
        }
    }, [viewMode]);

    const visibleItems = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return items;

        return items.filter((item) => {
            const name = (item.name ?? "").toLowerCase();
            const desc = (item.description ?? "").toLowerCase();
            return name.includes(term) || desc.includes(term);
        });
    }, [items, searchTerm]);

    useEffect(() => {
        const urls = createFiles.map((file) => URL.createObjectURL(file));
        setCreatePreviewUrls(urls);
        return () => {
            for (const url of urls) URL.revokeObjectURL(url);
        };
    }, [createFiles]);

    useEffect(() => {
        if (menuItemId === null) return;
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            const menu = target.closest(".itemMenuWrapper");
            if (!menu) setMenuItemId(null);
        };
        window.addEventListener("mousedown", onMouseDown);
        return () => window.removeEventListener("mousedown", onMouseDown);
    }, [menuItemId]);

    const openCreate = () => {
        setCreateName("");
        setCreateDescription("");
        setCreatePrice("");
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

        if (createFileInputRef.current) {
            createFileInputRef.current.value = "";
        }
    };

    const removeCreateFile = (index: number) => {
        setCreateFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmitCreate = async () => {
        if (!createName.trim()) {
            showError("Item name is required");
            return;
        }
        if (!createPrice.trim() || isNaN(parseFloat(createPrice))) {
            showError("Valid price is required");
            return;
        }

        try {
            setCreateSubmitting(true);
            const userId = parseInt(sessionStorage.getItem('userId') || '0');
            
            const itemData = {
                title: createName,
                description: createDescription,
                price: parseFloat(createPrice),
                userId: userId,
                images: createFiles
            };

            await createItem(itemData, token);
            showSuccess("Item added successfully!");
            
            // Reset form and close modal
            setCreateName("");
            setCreateDescription("");
            setCreatePrice("");
            setCreateFiles([]);
            setCreateOpen(false);
            
            // Refresh items list
            setTimeout(() => {
                handleGetItems();
            }, 500);
        } catch (err) {
            showError("Failed to add item");
            console.error(err);
            setCreateSubmitting(false);
        }
    };

    const handleChatWithSeller = async (itemId: number, sellerId?: number | null) => {
        if (!sellerId) {
            showError("Seller information not available");
            return;
        }

        if (!userId || userId === 0) {
            showError("Please login again to start a chat");
            return;
        }

        const item = items.find((i) => i.id === itemId);
        const initialMessage = item
            ? `Hi, I'm interested in "${item.name}" (Price: $${item.price}). Is this available?`
            : "Hi, is this available?";

        try {
            const res = await checkChatExists(token, userId, Number(sellerId));
            if (res.data === true) {
                // Chat exists already; Chats page will resolve the conversationId from participants.
                navigate("/app/chats", {
                    state: {
                        openWithUserId: Number(sellerId),
                        initialMessage,
                    },
                });
            } else {
                try {
                    const created = await createChat(token, { user1: userId, user2: Number(sellerId) });
                    const conversationId = (created.data?.id ?? created.data?.Id) as number | undefined;
                    navigate("/app/chats", {
                        state: {
                            openConversationId: conversationId,
                            openWithUserId: Number(sellerId),
                            initialMessage,
                        },
                    });
                } catch (error) {
                    showError("Failed to create chat with seller");
                }
            }
        } catch (error) {
            showError("Failed to initiate chat with seller");
        }
    };

    const handleDeleteItem = async (itemId: number) => {

        if(!window.confirm("Are you sure you want to delete this item?")) {
            return;
        }

        try {
            setLoading(true);
            await deleteItem(itemId, token);
            showSuccess("Item deleted");
            setMenuItemId(null);
            if (viewMode === "myItems") {
                handleGetMyItems();
            } else {
                handleGetItems();
            }
        } catch (err) {
            console.error("Delete item failed", err);
            showError("Failed to delete item");
        } finally {
            setLoading(false);
        }
    };

    const openImageModal = (itemId: number, images: string[]) => {
        if (images.length === 0) return;
        setImageModal({ open: true, itemId, images, index: 0, zoom: 1 });
    };

    const closeImageModal = () => {
        setImageModal({ open: false, itemId: null, images: [], index: 0, zoom: 1 });
    };

    const prevImage = () => {
        setImageModal((m) => {
            if (!m.open || m.images.length === 0) return m;
            return { ...m, index: (m.index - 1 + m.images.length) % m.images.length, zoom: 1 };
        });
    };

    const nextImage = () => {
        setImageModal((m) => {
            if (!m.open || m.images.length === 0) return m;
            return { ...m, index: (m.index + 1) % m.images.length, zoom: 1 };
        });
    };

    const zoomIn = () => {
        setImageModal((m) => {
            if (!m.open) return m;
            return { ...m, zoom: Math.min(m.zoom + 0.2, 3) };
        });
    };

    const zoomOut = () => {
        setImageModal((m) => {
            if (!m.open) return m;
            return { ...m, zoom: Math.max(m.zoom - 0.2, 0.5) };
        });
    };

    const resetZoom = () => {
        setImageModal((m) => {
            if (!m.open) return m;
            return { ...m, zoom: 1 };
        });
    };

    useEffect(() => {
        if (!imageModal.open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeImageModal();
            if (e.key === "ArrowLeft") prevImage();
            if (e.key === "ArrowRight") nextImage();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [imageModal.open]);

    return (
        <div className="marketPlacePage">
            <div className="marketPlaceHeader">
                <h2 className="marketPlaceTitle">MarketPlace</h2>
                <div className="marketPlaceSearch">
                    <input
                        type="search"
                        className="marketPlaceSearchInput"
                        placeholder="Search by name or description"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search marketplace items"
                        disabled={loading}
                    />
                </div>
                <div className="marketPlaceToolbarActions">
                    <div className="marketPlaceViewToggle">
                        <button
                            type="button"
                            className={`marketPlaceViewBtn ${viewMode === "all" ? "active" : ""}`}
                            onClick={() => setViewMode("all")}
                        >
                            All Items
                        </button>
                        <button
                            type="button"
                            className={`marketPlaceViewBtn ${viewMode === "myItems" ? "active" : ""}`}
                            onClick={() => setViewMode("myItems")}
                        >
                            My Items
                        </button>
                    </div>
                    <button
                        type="button"
                        className="marketPlaceCreateButton"
                        onClick={openCreate}
                    >
                        <AddIcon fontSize="small" />
                        Add Item
                    </button>
                </div>
            </div>

            {error && (
                <div className="marketPlaceCard marketPlaceError">
                    <div className="marketPlaceMuted">{error}</div>
                </div>
            )}

            {loading && (
                <div className="marketPlaceCard marketPlaceCardCenter">
                    <div className="marketPlaceMuted">Loading items...</div>
                </div>
            )}

            {!loading && items.length === 0 && !error && (
                <div className="marketPlaceCard marketPlaceCardCenter">
                    <div className="marketPlaceMuted">No items yet.</div>
                </div>
            )}

            {!loading && (
                <div className="marketPlaceList">
                    {visibleItems.map((item) => {
                    const rawImages = safeByteArrayFromDotNet(item.images);
                    const displayImages = rawImages.map((img) => toImageSrc(img));
                    const description = item.description ?? "";
                    const descriptionLimit = 150;
                    const shouldTruncateDesc = description.length > descriptionLimit;
                    const descriptionText = shouldTruncateDesc ? `${description.slice(0, descriptionLimit)}…` : description;

                    return (
                        <div key={item.id} className="marketPlaceCard">
                            {displayImages.length > 0 ? (
                                <div className="itemImagesWrapper">
                                    <button
                                        type="button"
                                        className="itemImageButton"
                                        onClick={() => openImageModal(item.id, displayImages)}
                                    >
                                        <img src={displayImages[0]} alt={item.name} className="itemImage" />
                                        {displayImages.length > 1 && (
                                            <div className="itemImageCount">{displayImages.length} images</div>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="itemImageWrapper">
                                    <div className="itemImagePlaceholder">No Image</div>
                                </div>
                            )}
                            
                            <div className="itemContent">
                                <div className="itemHeader">
                                    <div>
                                        <h3 className="itemName">{item.name}</h3>
                                        <div className="itemSellerInfo">
                                            <span className="itemSeller">{item.userName ?? ""}</span>
                                            <span className="itemDate">{item.createdAt.slice(0, 10)}</span>
                                        </div>
                                    </div>
                                    <div className="itemHeaderRight">
                                        <div className="itemPrice">${item.price}</div>
                                        {viewMode === "myItems" && item.userId === userId && (
                                            <div className="itemMenuWrapper">
                                                <button
                                                    type="button"
                                                    className="itemMenuButton"
                                                    onClick={() => setMenuItemId((prev) => prev === item.id ? null : item.id)}
                                                    aria-haspopup="menu"
                                                    aria-expanded={menuItemId === item.id}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </button>
                                                {menuItemId === item.id && (
                                                    <div className="itemMenu" role="menu">
                                                        <button
                                                            type="button"
                                                            className="itemMenuItem itemMenuDelete"
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            role="menuitem"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {description && (
                                    <div className="itemDescription">
                                        <p className="descriptionText">{descriptionText}</p>
                                    </div>
                                )}

                                {
                                    item.userId !== userId && (
                                        <div className="itemActions">
                                    <button
                                        type="button"
                                        className="chatButton"
                                        onClick={() => handleChatWithSeller(item.id, item.userId)}
                                    >
                                        Chat with Seller
                                    </button>
                                </div>
                                    )
                                }

                                
                            </div>
                        </div>
                    );
                })}
                </div>
            )}

            {imageModal.open && imageModal.images.length > 0 && (
                <div className="imageModal" onClick={closeImageModal}>
                    <div className="imageModalContent" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="imageModalCloseBtn"
                            onClick={closeImageModal}
                            aria-label="Close image viewer"
                        >
                            <CloseIcon />
                        </button>

                        <div className="imageModalViewer">
                            <div className="imageContainer" style={{ transform: `scale(${imageModal.zoom})` }}>
                                <img
                                    src={imageModal.images[imageModal.index]}
                                    alt={`Image ${imageModal.index + 1}`}
                                    className="modalImage"
                                />
                            </div>

                            <div className="imageModalControls">
                                <button
                                    type="button"
                                    className="zoomButton"
                                    onClick={zoomOut}
                                    title="Zoom out"
                                    aria-label="Zoom out"
                                >
                                    <ZoomOutIcon />
                                </button>
                                <span className="zoomLevel">{(imageModal.zoom * 100).toFixed(0)}%</span>
                                <button
                                    type="button"
                                    className="zoomButton"
                                    onClick={zoomIn}
                                    title="Zoom in"
                                    aria-label="Zoom in"
                                >
                                    <ZoomInIcon />
                                </button>
                                <button
                                    type="button"
                                    className="zoomButton"
                                    onClick={resetZoom}
                                    title="Reset zoom"
                                    aria-label="Reset zoom"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {imageModal.images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className="imagePrevBtn"
                                    onClick={prevImage}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeftIcon />
                                </button>
                                <button
                                    type="button"
                                    className="imageNextBtn"
                                    onClick={nextImage}
                                    aria-label="Next image"
                                >
                                    <ChevronRightIcon />
                                </button>

                                <div className="imageCounter">
                                    {imageModal.index + 1} / {imageModal.images.length}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {createOpen && (
                <div className="createModal">
                    <div className="createModalContent">
                        <div className="createModalHeader">
                            <h3 className="createModalTitle">Add New Item</h3>
                            <button
                                type="button"
                                className="closeButton"
                                onClick={closeCreate}
                                disabled={createSubmitting}
                                aria-label="Close modal"
                            >
                                <CloseIcon fontSize="small" />
                            </button>
                        </div>

                        <div className="createModalBody">
                            <div className="formGroup">
                                <label className="formLabel">Item Name *</label>
                                <input
                                    type="text"
                                    className="formInput"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    placeholder="e.g., Used Textbook"
                                    disabled={createSubmitting}
                                />
                            </div>

                            <div className="formGroup">
                                <label className="formLabel">Description</label>
                                <textarea
                                    className="formTextarea"
                                    value={createDescription}
                                    onChange={(e) => setCreateDescription(e.target.value)}
                                    placeholder="Describe your item..."
                                    rows={4}
                                    disabled={createSubmitting}
                                />
                            </div>

                            <div className="formGroup">
                                <label className="formLabel">Price (USD) *</label>
                                <input
                                    type="number"
                                    className="formInput"
                                    value={createPrice}
                                    onChange={(e) => setCreatePrice(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    disabled={createSubmitting}
                                />
                            </div>

                            <div className="formGroup">
                                <label className="formLabel">Images</label>
                                <div className="fileInputWrapper">
                                    <input
                                        ref={createFileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => handleCreateFiles(e.target.files)}
                                        disabled={createSubmitting}
                                        style={{ display: "none" }}
                                    />
                                    <button
                                        type="button"
                                        className="filePickerButton"
                                        onClick={() => createFileInputRef.current?.click()}
                                        disabled={createSubmitting}
                                    >
                                        <AddIcon fontSize="small" />
                                        Pick Images
                                    </button>
                                    <div className="filePickerHint">
                                        {createFiles.length > 0 ? `${createFiles.length} image(s) selected` : "Select up to 5 images"}
                                    </div>
                                </div>

                                {createPreviewUrls.length > 0 && (
                                    <div className="previewGrid">
                                        {createPreviewUrls.map((url, index) => (
                                            <div key={index} className="previewItem">
                                                <img src={url} alt={`Preview ${index}`} className="previewImage" />
                                                <button
                                                    type="button"
                                                    className="removePreviewBtn"
                                                    onClick={() => removeCreateFile(index)}
                                                    disabled={createSubmitting}
                                                    aria-label={`Remove image ${index + 1}`}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="createModalFooter">
                            <button
                                type="button"
                                className="cancelButton"
                                onClick={closeCreate}
                                disabled={createSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="submitButton"
                                onClick={handleSubmitCreate}
                                disabled={createSubmitting}
                            >
                                {createSubmitting ? "Adding..." : "Add Item"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}