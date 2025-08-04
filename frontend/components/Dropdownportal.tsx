// components/DropdownPortal.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
    children: ReactNode;
};

const DropdownPortal = ({ children }: Props) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (typeof window === "undefined") return null;
    const portalRoot = document.getElementById("portal-root");
    if (!portalRoot || !mounted) return null;

    return createPortal(children, portalRoot);
};

export default DropdownPortal;
