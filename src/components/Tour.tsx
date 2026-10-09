"use client";

import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export type TourStep = {
    target: string;
    title: string;
    description: string;
    tabId?: string;
};

interface TourProps {
    steps: TourStep[];
    isOpen: boolean;
    onClose: () => void;
}

export function Tour({ steps, isOpen, onClose }: TourProps) {
    const hasStarted = useRef(false);

    useEffect(() => {
        if (isOpen && !hasStarted.current) {
            hasStarted.current = true;
            
            setTimeout(() => {
                const driverObj = driver({
                    showProgress: true,
                    nextBtnText: 'Tiếp tục',
                    prevBtnText: 'Quay lại',
                    doneBtnText: 'Hoàn thành',
                    popoverClass: 'dark:bg-gray-800 dark:text-gray-100',
                    onDestroyed: () => {
                        hasStarted.current = false;
                        onClose();
                    },
                    onPopoverRender: (popover) => {
                        // Workaround to ensure element is rendered
                        // if tab was just clicked
                    },
                    steps: steps.map(s => ({
                        element: s.target,
                        popover: {
                            title: s.title,
                            description: s.description,
                            side: "bottom",
                            align: "start",
                            onPopoverRender: () => {
                                if (s.tabId) {
                                    const tabBtn = document.getElementById(s.tabId);
                                    if (tabBtn) tabBtn.click();
                                }
                            }
                        },
                        onHighlightStarted: () => {
                            if (s.tabId) {
                                const tabBtn = document.getElementById(s.tabId);
                                if (tabBtn) tabBtn.click();
                            }
                        }
                    }))
                });
                driverObj.drive();
            }, 100);
        }
    }, [isOpen, steps, onClose]);

    return null;
}
