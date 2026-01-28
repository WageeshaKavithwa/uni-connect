import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/marketplace.css";
import "../styles/events.css";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { showError, showSuccess } from "../components/Toast";
import { createEvent, deleteEvent, getEvents, getEventsByUser } from "../services/events-api";

type ApiByteArray = string | number[];

interface ApiEvent {
  Id?: number;
  id?: number;
  EventName?: string | null;
  eventName?: string | null;
  EventDescription?: string | null;
  eventDescription?: string | null;
  EventLocation?: string | null;
  eventLocation?: string | null;
  EventDate?: string | null;
  eventDate?: string | null;
  EventThumbnail?: unknown;
  eventThumbnail?: unknown;
  SpecialNote?: string | null;
  specialNote?: string | null;
  CreatedBy?: number | null;
  createdBy?: number | null;
}

interface EventItem {
  id: number;
  name: string;
  description: string;
  location: string;
  date: string | null;
  thumbnail?: unknown;
  specialNote?: string | null;
  createdBy?: number | null;
}

function safeArrayFromDotNet<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as any).$values)) {
    return (value as any).$values as T[];
  }
  return [];
}

function safeSingleByteArrayFromDotNet(value: unknown): ApiByteArray | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((x) => typeof x === "number")) return value as number[];
  if (value && typeof value === "object" && Array.isArray((value as any).$values)) {
    const inner = (value as any).$values;
    if (Array.isArray(inner) && inner.every((x: unknown) => typeof x === "number")) return inner as number[];
  }
  return null;
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

function normalizeEvent(raw: ApiEvent): EventItem | null {
  const id = (raw.Id ?? raw.id) as number | undefined;
  if (!id) return null;

  const name = (raw.EventName ?? raw.eventName ?? "").toString();
  const description = (raw.EventDescription ?? raw.eventDescription ?? "").toString();
  const location = (raw.EventLocation ?? raw.eventLocation ?? "").toString();
  const date = (raw.EventDate ?? raw.eventDate ?? null) as string | null;
  const thumbnail = raw.EventThumbnail ?? raw.eventThumbnail;
  const specialNote = (raw.SpecialNote ?? raw.specialNote ?? null) as string | null;
  const createdBy = (raw.CreatedBy ?? raw.createdBy ?? null) as number | null;

  return {
    id,
    name,
    description,
    location,
    date,
    thumbnail,
    specialNote,
    createdBy,
  };
}

function formatEventDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export default function Events() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "myItems">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSpecialNote, setCreateSpecialNote] = useState("");
  const [createThumbnail, setCreateThumbnail] = useState<File | null>(null);
  const [createThumbnailPreviewUrl, setCreateThumbnailPreviewUrl] = useState<string>("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuItemId, setMenuItemId] = useState<number | null>(null);
  const [imageModal, setImageModal] = useState<{ open: boolean; itemId: number | null; images: string[]; index: number; zoom: number }>
    ({ open: false, itemId: null, images: [], index: 0, zoom: 1 });

  const token = sessionStorage.getItem("jwtToken") || "";
  const userId = parseInt(sessionStorage.getItem("userId") || "0");
  const mountedRef = useRef(true);
  const createThumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const THUMBNAIL_WIDTH = 1280;
  const THUMBNAIL_HEIGHT = 720;

  const handleGetItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEvents(token);

      const list = safeArrayFromDotNet<ApiEvent>(response.data)
        .map(normalizeEvent)
        .filter((x): x is EventItem => x !== null);

      setItems(list);
    } catch (err) {
      console.error("Error fetching events:", err);
      setItems([]);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleGetMyItems = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!userId || userId === 0) {
        setItems([]);
        setError("User not found");
        return;
      }

      const response = await getEventsByUser(userId, token);

      const list = safeArrayFromDotNet<ApiEvent>(response.data)
        .map(normalizeEvent)
        .filter((x): x is EventItem => x !== null);

      setItems(list);
    } catch (err) {
      console.error("Error fetching my events:", err);
      setItems([]);
      setError("Failed to load your events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (viewMode === "myItems") {
      handleGetMyItems();
    } else {
      handleGetItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const visibleItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      const name = (item.name ?? "").toLowerCase();
      const desc = (item.description ?? "").toLowerCase();
      const loc = (item.location ?? "").toLowerCase();
      const note = (item.specialNote ?? "").toLowerCase();
      return name.includes(term) || desc.includes(term) || loc.includes(term) || note.includes(term);
    });
  }, [items, searchTerm]);

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
    setCreateDate("");
    setCreateLocation("");
    setCreateDescription("");
    setCreateSpecialNote("");
    setCreateThumbnail(null);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (createSubmitting) return;
    setCreateOpen(false);
  };

  useEffect(() => {
    if (!createThumbnail) {
      setCreateThumbnailPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(createThumbnail);
    setCreateThumbnailPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [createThumbnail]);

  const validateThumbnailSize = async (file: File): Promise<boolean> => {
    if (!file.type.startsWith("image/")) {
      showError("Thumbnail must be an image file");
      return false;
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      const loaded = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = objectUrl;
      });

      if (!loaded) {
        showError("Unable to read the selected image");
        return false;
      }

      const w = (img as any).naturalWidth ?? img.width;
      const h = (img as any).naturalHeight ?? img.height;

      if (w !== THUMBNAIL_WIDTH || h !== THUMBNAIL_HEIGHT) {
        showError(`Thumbnail must be exactly ${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT} (YouTube thumbnail size)`);
        return false;
      }

      return true;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handlePickThumbnail = async (files: FileList | null) => {
    const file = files?.[0] ?? null;
    if (!file) return;

    const ok = await validateThumbnailSize(file);
    if (!ok) {
      setCreateThumbnail(null);
    } else {
      setCreateThumbnail(file);
    }

    if (createThumbnailInputRef.current) {
      createThumbnailInputRef.current.value = "";
    }
  };

  const removeThumbnail = () => {
    setCreateThumbnail(null);
  };

  const handleSubmitCreate = async () => {
    if (!createName.trim()) {
      showError("Event name is required");
      return;
    }

    if (!createThumbnail) {
      showError(`Thumbnail is required (${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT})`);
      return;
    }

    if (!userId || userId === 0) {
      showError("Please login again to create events");
      return;
    }

    try {
      setCreateSubmitting(true);

      const payload = {
        EventName: createName.trim(),
        EventDate: createDate ? new Date(createDate).toISOString() : null,
        Description: createDescription.trim() || null,
        Location: createLocation.trim() || null,
        UserId: userId,
        SpecialNote: createSpecialNote.trim() || null,
        Thumbnail: createThumbnail,
      };

      await createEvent(payload, token);
      showSuccess("Event created successfully!");

      if (!mountedRef.current) return;
      setCreateOpen(false);
      setCreateName("");
      setCreateDate("");
      setCreateLocation("");
      setCreateDescription("");
      setCreateSpecialNote("");
            setCreateThumbnail(null);

      setTimeout(() => {
        if (viewMode === "myItems") handleGetMyItems();
        else handleGetItems();
      }, 300);
    } catch (err) {
      console.error("Create event failed", err);
      showError("Failed to create event");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDeleteItem = async (eventId: number) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      setLoading(true);
      await deleteEvent(eventId, userId, token);
      showSuccess("Event deleted");
      setMenuItemId(null);
      if (viewMode === "myItems") {
        await handleGetMyItems();
      } else {
        await handleGetItems();
      }
    } catch (err) {
      console.error("Delete event failed", err);
      showError("Failed to delete event");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageModal.open]);

  return (
    <div className="marketPlacePage eventsPage">
      <div className="marketPlaceHeader">
        <h2 className="marketPlaceTitle">Events</h2>
        <div className="marketPlaceSearch">
          <input
            type="search"
            className="marketPlaceSearchInput"
            placeholder="Search by name, location, description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search events"
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
              All Events
            </button>
            <button
              type="button"
              className={`marketPlaceViewBtn ${viewMode === "myItems" ? "active" : ""}`}
              onClick={() => setViewMode("myItems")}
            >
              My Events
            </button>
          </div>
          <button
            type="button"
            className="marketPlaceCreateButton"
            onClick={openCreate}
          >
            <AddIcon fontSize="small" />
            Add Event
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
          <div className="marketPlaceMuted">Loading events...</div>
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="marketPlaceCard marketPlaceCardCenter">
          <div className="marketPlaceMuted">No events yet.</div>
        </div>
      )}

      {!loading && (
        <div className="marketPlaceList">
          {visibleItems.map((item) => {
            const thumb = safeSingleByteArrayFromDotNet(item.thumbnail);
            const displayImages = thumb ? [toImageSrc(thumb)] : [];
            const description = item.description ?? "";
            const descriptionLimit = 170;
            const shouldTruncateDesc = description.length > descriptionLimit;
            const descriptionText = shouldTruncateDesc ? `${description.slice(0, descriptionLimit)}…` : description;
            const dateText = formatEventDate(item.date);
            const isMine = viewMode === "myItems" && item.createdBy === userId;

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
                    <div className="itemImagePlaceholder">No Thumbnail</div>
                  </div>
                )}

                <div className="itemContent">
                  <div className="itemHeader">
                    <div>
                      <h3 className="itemName">{item.name}</h3>
                      <div className="itemSellerInfo">
                        <span className="itemSeller">{item.location || ""}</span>
                      </div>
                    </div>

                    <div className="itemHeaderRight">
                      {dateText && <div className="itemPrice">{dateText}</div>}
                      {isMine && (
                        <div className="itemMenuWrapper">
                          <button
                            type="button"
                            className="itemMenuButton"
                            onClick={() => setMenuItemId((prev) => (prev === item.id ? null : item.id))}
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

                  {item.specialNote && (
                    <div className="itemDescription">
                      <p className="descriptionText"><strong>Note:</strong> {item.specialNote}</p>
                    </div>
                  )}
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
              <h3 className="createModalTitle">Add New Event</h3>
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
                <label className="formLabel">Event Name *</label>
                <input
                  type="text"
                  className="formInput"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g., Career Fair"
                  disabled={createSubmitting}
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Event Date</label>
                <input
                  type="date"
                  className="formInput"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  disabled={createSubmitting}
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Location</label>
                <input
                  type="text"
                  className="formInput"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  placeholder="e.g., Main Auditorium"
                  disabled={createSubmitting}
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Description</label>
                <textarea
                  className="formTextarea"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Describe the event..."
                  rows={4}
                  disabled={createSubmitting}
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Special Note</label>
                <textarea
                  className="formTextarea"
                  value={createSpecialNote}
                  onChange={(e) => setCreateSpecialNote(e.target.value)}
                  placeholder="Any special note for attendees..."
                  rows={3}
                  disabled={createSubmitting}
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Thumbnail (Required: 1280x720)</label>
                <div className="fileInputWrapper">
                  <input
                    ref={createThumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePickThumbnail(e.target.files)}
                    disabled={createSubmitting}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="filePickerButton"
                    onClick={() => createThumbnailInputRef.current?.click()}
                    disabled={createSubmitting}
                  >
                    <AddIcon fontSize="small" />
                    Pick Thumbnail
                  </button>
                  <div className="filePickerHint">
                    {createThumbnail ? "1 thumbnail selected" : `Upload ${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT} image`}
                  </div>
                </div>

                {createThumbnailPreviewUrl && (
                  <div className="previewGrid">
                    <div className="previewItem">
                      <img src={createThumbnailPreviewUrl} alt="Thumbnail preview" className="previewImage" />
                      <button
                        type="button"
                        className="removePreviewBtn"
                        onClick={removeThumbnail}
                        disabled={createSubmitting}
                        aria-label="Remove thumbnail"
                      >
                        <CloseIcon fontSize="small" />
                      </button>
                    </div>
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
                {createSubmitting ? "Adding..." : "Add Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}