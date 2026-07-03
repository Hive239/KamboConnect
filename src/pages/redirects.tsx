import { Navigate } from "react-router-dom";

/**
 * The old standalone learning routes now live under the unified /Learn hub.
 * These keep existing links/bookmarks working by redirecting to the right tab.
 * (Learn.tsx still imports the real Education/Coursework/Courses modules directly
 * for its tab panels — only the standalone routes redirect.)
 */
export function EducationRedirect() { return <Navigate to="/Learn?tab=guides" replace />; }
export function CourseworkRedirect() { return <Navigate to="/Learn?tab=courses" replace />; }
export function CoursesRedirect() { return <Navigate to="/Learn?tab=programs" replace />; }
