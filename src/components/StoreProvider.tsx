"use client";

import { useEffect, useState } from "react";
import { initStore } from "@/lib/storage";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(true);

    useEffect(() => {
        initStore().catch((err) => {
            console.warn("Store background sync:", err);
        });
    }, []);

    return <>{children}</>;
}
