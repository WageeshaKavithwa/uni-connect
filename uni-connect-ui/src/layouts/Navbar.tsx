import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import logo from "../assets/uni-connect-sm.png";
import { Home, PostAdd, PowerSettingsNew } from "@mui/icons-material";

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
    { to: "/app", icon: <Home />, label: "Dashboard" },
    { to: "/app/posts", icon: <PostAdd />, label: "Posts" }
];

const NAV_GROUPS: NavGroup[] = [
    // {
    //     id: "courses",
    //     label: "Courses",
    //     icon: (p) => <IconBooks {...p} />,
    //     children: [
    //         { to: "/app/courses/manage", label: "Manage Course" },
    //         { to: "/app/courses/new", label: "Add New Course" },
    //         { to: "/app/courses/category", label: "Course Category" },
    //         { to: "/app/courses/coupons", label: "Coupons" },
    //         { to: "/app/courses/bundle", label: "Course Bundle" },
    //         { to: "/app/courses/subscriptions", label: "Subscription Reports" },
    //     ],
    // },
    // {
    //     id: "users",
    //     label: "Users",
    //     icon: (p) => <IconUsers {...p} />,
    //     children: [{ to: "/app/users", label: "Users" }],
    // },
];

function isPathInGroup(pathname: string, group: NavGroup) {
    return group.children.some((c) => pathname === c.to || pathname.startsWith(c.to + "/"));
}

export default function Navbar({ children }: NavbarProps) {
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const username = sessionStorage.getItem('userName') || 'User';
    const userType = sessionStorage.getItem('userType') || 'User';

    const initialOpenGroups = React.useMemo(() => {
        const open = new Set<string>();
        for (const group of NAV_GROUPS) {
            if (isPathInGroup(location.pathname, group)) open.add(group.id);
        }
        return open;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [openGroups, setOpenGroups] = React.useState<Set<string>>(initialOpenGroups);

    const token = sessionStorage.getItem('jwtToken') || '';

    React.useEffect(() => {
        if (!token) {
            navigate("/");
        }
    }, [token]);

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

                    <div className="appTopbarGrow" />

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