import React, { useEffect, useRef, useCallback } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import logo from "../assets/uni-connect-sm.png";
import {
    AssignmentInd,
    Event,
    Favorite,
    Forum,
    Notifications,
    PostAdd,
    PowerSettingsNew,
    Storefront,
} from "@mui/icons-material";
import { checkChatExists, createChat, getUnreadChatCount } from "../services/chats-api";
import { getUsers } from "../services/auth-api";

type NavbarProps = {
    children?: React.ReactNode;
};

type NavLeaf = {
    to: string;
    icon: React.ReactNode;
    label: string;
};

type NavGroup = {
    id: string;
    label: string;
    icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
    children: NavLeaf[];
};

type ApiUser = {
    id?: number;
    Id?: number;
    username?: string | null;
    Username?: string | null;
};

type NavbarUser = {
    id: number;
    username: string;
};

function safeArrayFromDotNet<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === "object" && Array.isArray((value as any).$values)) {
        return (value as any).$values as T[];
    }
    return [];
}

function normalizeUser(raw: ApiUser): NavbarUser | null {
    const id = (raw.Id ?? raw.id) as number | undefined;
    if (!id) return null;
    const username = (raw.Username ?? raw.username ?? "").toString().trim();
    if (!username) return { id, username: "Unknown" };
    return { id, username };
}

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M4 6a1 1 0 1 1 0-2h16a1 1 0 1 1 0 2H4Zm0 7a1 1 0 1 1 0-2h16a1 1 0 1 1 0 2H4Zm0 7a1 1 0 1 1 0-2h16a1 1 0 1 1 0 2H4Z"
            />
        </svg>
    );
}

function IconChevronLeft(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M15.7 5.3a1 1 0 0 1 0 1.4L10.4 12l5.3 5.3a1 1 0 1 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0Z"
            />
        </svg>
    );
}

function IconChevronRight(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M8.3 18.7a1 1 0 0 1 0-1.4l5.3-5.3-5.3-5.3a1 1 0 0 1 1.4-1.4l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0Z"
            />
        </svg>
    );
}

function IconChevronDown(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M6.3 8.3a1 1 0 0 1 1.4 0l4.3 4.3 4.3-4.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 0 1 0-1.4Z"
            />
        </svg>
    );
}

const NAV_ROOT: NavLeaf[] = [
    { to: "/app/posts", icon: <PostAdd />, label: "Posts" },
    { to: "/app/myposts", icon: <AssignmentInd />, label: "My Posts" },
    { to: "/app/favouriteposts", icon: <Favorite />, label: "Favourite Posts" },
    {to: "/app/marketplace", icon: <Storefront />, label: "Market Place" },
    {to: "/app/chats", icon: <Forum />, label: "Chats" },
    {to: "/app/events", icon: <Event />, label: "Events" },
];

const NAV_GROUPS: NavGroup[] = [
];

function isPathInGroup(pathname: string, group: NavGroup) {
    return group.children.some((c) => pathname === c.to || pathname.startsWith(c.to + "/"));
}

export default function Navbar({ children }: NavbarProps) {
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [unreadChatCount, setUnreadChatCount] = React.useState(0);
    const [users, setUsers] = React.useState<NavbarUser[]>([]);
    const [userSearch, setUserSearch] = React.useState("");
    const [userSearchOpen, setUserSearchOpen] = React.useState(false);
    const [userSearchLoading, setUserSearchLoading] = React.useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const userSearchRef = useRef<HTMLDivElement | null>(null);

    const username = sessionStorage.getItem('userName') || 'User';
    const userType = sessionStorage.getItem('userType') || 'User';
    const token = sessionStorage.getItem('jwtToken') || '';
    const me = Number(sessionStorage.getItem("userId") || "0");

    const handleGetUsers = async () => {
        try {
            setUserSearchLoading(true);
            const res = await getUsers();
            const list = safeArrayFromDotNet<ApiUser>(res.data)
                .map(normalizeUser)
                .filter((x): x is NavbarUser => x !== null);
            setUsers(list || []);
        } catch (error) {
            setUsers([]);
        } finally {
            setUserSearchLoading(false);
        }
    }

    const handleGetUnreadChatCount = useCallback(async () => {
        try {
            const res = await getUnreadChatCount(sessionStorage.getItem('jwtToken') || '', Number(sessionStorage.getItem('userId')));
            setUnreadChatCount(res.data || 0);
        } catch {
            setUnreadChatCount(0);
        }
    }, []);

    useEffect(() => {
        handleGetUnreadChatCount();
        handleGetUsers();
    }, []);

    // call unread-count on any click (debounced)
    const clickTimerRef = useRef<number | null>(null);
    useEffect(() => {
        const onClick = () => {
            if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
            clickTimerRef.current = window.setTimeout(() => {
                handleGetUnreadChatCount();
            }, 250) as unknown as number;
        };
        document.addEventListener("click", onClick);
        return () => {
            document.removeEventListener("click", onClick);
            if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
        };
    }, [handleGetUnreadChatCount]);

    const initialOpenGroups = React.useMemo(() => {
        const open = new Set<string>();
        for (const group of NAV_GROUPS) {
            if (isPathInGroup(location.pathname, group)) open.add(group.id);
        }
        return open;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [openGroups, setOpenGroups] = React.useState<Set<string>>(initialOpenGroups);

    React.useEffect(() => {
        if (!token) {
            navigate("/");
        }
    }, [token]);

    React.useEffect(() => {
        if (!userSearchOpen) return;
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (userSearchRef.current && !userSearchRef.current.contains(target)) {
                setUserSearchOpen(false);
            }
        };
        window.addEventListener("mousedown", onMouseDown);
        return () => window.removeEventListener("mousedown", onMouseDown);
    }, [userSearchOpen]);

    React.useEffect(() => {
        if (!userSearchOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setUserSearchOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [userSearchOpen]);

    const filteredUsers = React.useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        const list = users.filter((u) => u.id !== me);
        if (!q) return list;
        return list.filter((u) => u.username.toLowerCase().includes(q));
    }, [users, userSearch, me]);

    const openChatWithUser = useCallback(
        async (otherUserId: number, otherUsername: string) => {
            if (!otherUserId || otherUserId === 0) return;
            if (!me || me === 0) return;
            if (!token) return;

            const initialMessage = `Hi ${otherUsername}, can we chat?`;

            try {
                const res = await checkChatExists(token, me, otherUserId);
                if (res.data === true) {
                    navigate("/app/chats", {
                        state: {
                            openWithUserId: otherUserId,
                            initialMessage,
                        },
                    });
                    return;
                }

                const created = await createChat(token, { user1: me, user2: otherUserId });
                const conversationId = (created.data?.id ?? created.data?.Id) as number | undefined;
                navigate("/app/chats", {
                    state: {
                        openConversationId: conversationId,
                        openWithUserId: otherUserId,
                        initialMessage,
                    },
                });
            } finally {
                setUserSearchOpen(false);
                setUserSearch("");
            }
        },
        [me, navigate, token]
    );

    React.useEffect(() => {
        if (!isMobileOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsMobileOpen(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isMobileOpen]);

    React.useEffect(() => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            for (const group of NAV_GROUPS) {
                if (isPathInGroup(location.pathname, group)) next.add(group.id);
            }
            return next;
        });
    }, [location.pathname]);

    const toggleGroup = (groupId: string) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const content = children ?? <Outlet />;

    const handleLogout = () => {

        if(!window.confirm("Are you sure you want to logout?")) {
            return;
        }

        sessionStorage.clear();
        navigate("/");
    };

    return (
        <div className="appFrame">
            <div
                className={"appOverlay" + (isMobileOpen ? " appOverlayOpen" : "")}
                onClick={() => setIsMobileOpen(false)}
                aria-hidden={!isMobileOpen}
            />

            <aside
                className={
                    "appSidebar" +
                    (isCollapsed ? " appSidebarCollapsed" : "") +
                    (isMobileOpen ? " appSidebarMobileOpen" : "")
                }
                aria-label="Sidebar"
            >
                <div className="appSidebarHeader">
                    <button
                        type="button"
                        className="appLogoBtn"
                        onClick={() => {
                            setIsMobileOpen(false);
                            navigate("/app");
                        }}
                        aria-label="Go to Dashboard"
                    >
                        <img className="appLogo" src={logo} alt="UniConnect" />
                    </button>

                    <button
                        type="button"
                        className="appIconBtn appCollapseBtn"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        aria-pressed={isCollapsed}
                        onClick={() => setIsCollapsed((v) => !v)}
                    >
                        {isCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
                    </button>
                </div>

                <nav className="appNav" aria-label="Primary">
                    <div className="appNavSection">
                        {NAV_ROOT.map((leaf) => (
                            <NavLink
                                key={leaf.to}
                                to={leaf.to}
                                end
                                className={({ isActive }) =>
                                    "appNavLink" + (isActive ? " appNavLinkActive" : "")
                                }
                                title={leaf.label}
                                onClick={() => setIsMobileOpen(false)}
                            >
                                <span className="appNavIcon" aria-hidden="true">
                                    {leaf.icon}
                                </span>
                                <span className="appNavLabel">{leaf.label}</span>

                               {leaf.to === "/app/chats" && unreadChatCount > 0 ? (
                                   <span
                                       className="unreadBadge"
                                       aria-label={`${unreadChatCount} unread messages`}
                                   >
                                       {unreadChatCount > 99 ? "99+" : unreadChatCount}
                                   </span>
                               ) : null}
                            </NavLink>
                        ))}
                    </div>

                    {NAV_GROUPS.map((group) => {
                        const isOpen = openGroups.has(group.id);
                        const isActive = isPathInGroup(location.pathname, group);

                        return (
                            <div key={group.id} className="appNavGroup">
                                <button
                                    type="button"
                                    className={
                                        "appNavGroupBtn" +
                                        (isActive ? " appNavGroupBtnActive" : "")
                                    }
                                    onClick={() => toggleGroup(group.id)}
                                    aria-expanded={isOpen}
                                    title={group.label}
                                >
                                    <span className="appNavIcon" aria-hidden="true">
                                        {group.icon({})}
                                    </span>
                                    <span className="appNavLabel">{group.label}</span>
                                    <span className="appNavChevron" aria-hidden="true">
                                        <IconChevronDown
                                            className={
                                                "appChevron" + (isOpen ? " appChevronOpen" : "")
                                            }
                                        />
                                    </span>
                                </button>

                                <div
                                    className={
                                        "appNavChildren" +
                                        (isOpen && !isCollapsed ? " appNavChildrenOpen" : "")
                                    }
                                >
                                    {group.children.map((child) => (
                                        <NavLink
                                            key={child.to}
                                            to={child.to}
                                            className={({ isActive }) =>
                                                "appNavChild" + (isActive ? " appNavChildActive" : "")
                                            }
                                            title={child.label}
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            <span className="appNavChildDot" aria-hidden="true" />
                                            <span className="appNavChildLabel">{child.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                <div className="appSidebarFooter" aria-label="Sidebar footer">
                    <div className="appSidebarFooterLeft">
                        <div className="appAvatar" aria-hidden="true">
                            <span className="appAvatarText">{username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="appUserMeta">
                            <div className="appUserName">{username}</div>
                            <div className="appUserRole">{userType}</div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="appIconBtn appLogoutBtn"
                        aria-label="Logout"
                        title="Logout"
                        onClick={handleLogout}
                    >
                        <PowerSettingsNew />
                    </button>
                </div>
            </aside>

            <div className="appMain">
                <header className="appTopbar" aria-label="Top navigation">
                    <button
                        type="button"
                        className="appIconBtn appMobileMenuBtn"
                        aria-label="Open menu"
                        onClick={() => setIsMobileOpen(true)}
                    >
                        <IconMenu />
                    </button>

                    <div className="appTopbarSearch" ref={userSearchRef}>
                        <div className="appUserSearchWrap">
                            <input
                                className="appSearchInput"
                                type="search"
                                placeholder="Search users..."
                                value={userSearch}
                                onFocus={() => {
                                    setUserSearchOpen(true);
                                    if (users.length === 0 && !userSearchLoading) handleGetUsers();
                                }}
                                onChange={(e) => {
                                    setUserSearch(e.target.value);
                                    setUserSearchOpen(true);
                                }}
                                aria-label="Search users"
                            />

                            {userSearchOpen && (
                                <div className="appUserSearchDropdown" role="listbox" aria-label="Users">
                                    {userSearchLoading && (
                                        <div className="appUserSearchEmpty">Loading users...</div>
                                    )}

                                    {!userSearchLoading && filteredUsers.length === 0 && (
                                        <div className="appUserSearchEmpty">No users found</div>
                                    )}

                                    {!userSearchLoading && filteredUsers.length > 0 &&
                                        filteredUsers.map((u) => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                className="appUserSearchItem"
                                                role="option"
                                                onClick={() => openChatWithUser(u.id, u.username)}
                                            >
                                                <span className="appUserSearchAvatar" aria-hidden="true">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </span>
                                                <span className="appUserSearchName">{u.username}</span>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="appTopbarGrow" />

                    <NavLink
                        to="/app/chats"
                        className="appIconBtn appTopbarNotifBtn"
                        aria-label={
                            unreadChatCount > 0
                                ? `${unreadChatCount} unread notifications`
                                : "Notifications"
                        }
                        title="Notifications"
                    >
                        <Notifications />
                        {unreadChatCount > 0 ? (
                            <span className="appTopbarNotifBadge" aria-hidden="true">
                                {unreadChatCount > 99 ? "99+" : unreadChatCount}
                            </span>
                        ) : null}
                    </NavLink>

                    <button type="button" className="appTopbarAvatarBtn" aria-label="Account">
                        <div className="appAvatar" aria-hidden="true">
                            <span className="appAvatarText">{username.charAt(0).toUpperCase()}</span>
                        </div>
                    </button>
                </header>

                <main className="appContent" aria-label="Page content">
                    {content}
                </main>
            </div>
        </div>
    );
}