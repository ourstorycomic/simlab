"use client";

import React from "react";
import UnifiedNavbar, { NavSubject } from "./UnifiedNavbar";

export type LabSubject = "chemistry" | "physics" | "biology";

interface LabHeaderProps {
    currentSubject: LabSubject;
    centerContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    onTourOpen?: () => void;
}

export default function LabHeader({
    currentSubject,
    centerContent,
    rightContent,
    onTourOpen,
}: LabHeaderProps) {
    return (
        <UnifiedNavbar
            currentSubject={currentSubject as NavSubject}
            centerContent={centerContent}
            rightContent={rightContent}
            onTourOpen={onTourOpen}
        />
    );
}
