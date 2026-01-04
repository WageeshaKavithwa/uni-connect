import { useEffect, useState } from "react";
import loader from "../assets/load.svg";
import React from "react";

interface SpinnerProps {
    isLoading: boolean;
}

export default function Spinner({ isLoading }: SpinnerProps) {
    const [showImg, setShowImg] = useState(isLoading);

    useEffect(() => {
        if (isLoading) {
            setShowImg(true);
            const timer = setTimeout(() => {
                setShowImg(false);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShowImg(false);
        }
    }, [isLoading]);

    if (!showImg) return null;

    return (
        <div style={overlayStyle}>
            {/* Animated Yellow Line */}
            <div style={progressBarContainer}>
                <div style={progressBar}></div>
            </div>
            {/* Centered Loader */}
            <img src={loader} alt="Loading..." style={imageStyle} />
        </div>
    );
}

const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(6, 6, 6, 0.51)", // Semi-transparent overlay
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999999, // Ensure it's above all layers
    flexDirection: "column", // Align elements vertically
};

const progressBarContainer: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "2px", // Thickness of the line
    backgroundColor: "transparent",
};

const progressBar: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFEC00", // Yellow color
    animation: "slideRight 3s ease-in-out",
};

const imageStyle: React.CSSProperties = {
    width: "80px",
    height: "80px",
};

const styleTag = document.createElement("style");
styleTag.innerHTML = `
@keyframes slideRight {
    from {
        width: 0%;
    }
    to {
        width: 100%;
    }
}`;
document.head.appendChild(styleTag);