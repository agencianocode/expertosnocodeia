import { useState, useEffect } from "react";

export type ViewMode = "student" | "admin";

export function useRoleSwitch() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem("viewMode");
    return (stored as ViewMode) || "student";
  });

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  const switchToStudent = () => setViewMode("student");
  const switchToAdmin = () => setViewMode("admin");
  const toggleView = () => setViewMode(prev => prev === "student" ? "admin" : "student");

  return {
    viewMode,
    isStudentView: viewMode === "student",
    isAdminView: viewMode === "admin",
    switchToStudent,
    switchToAdmin,
    toggleView
  };
}