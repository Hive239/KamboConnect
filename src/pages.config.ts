import { lazy } from 'react';
import __Layout from './Layout';

// Pages are lazy-loaded so each route is its own chunk (keeps the initial
// bundle small; heavy libs like recharts/leaflet/react-quill/pdf-lib only load
// on the routes that use them). The Layout shell stays eager.
export const PAGES = {
    "ForYou": lazy(() => import('./pages/ForYou')),
    "Guide": lazy(() => import('./pages/Guide')),
    "Journal": lazy(() => import('./pages/Journal')),
    "Directory": lazy(() => import('./pages/Directory')),
    "Matchmaking": lazy(() => import('./pages/Matchmaking')),
    "Education": lazy(() => import('./pages/Education')),
    "Verification": lazy(() => import('./pages/Verification')),
    "Community": lazy(() => import('./pages/Community')),
    "Events": lazy(() => import('./pages/Events')),
    "Market": lazy(() => import('./pages/Market')),
    "Disclaimer": lazy(() => import('./pages/Disclaimer')),
    "NewPost": lazy(() => import('./pages/NewPost')),
    "Post": lazy(() => import('./pages/Post')),
    "Bookings": lazy(() => import('./pages/Bookings')),
    "Profile": lazy(() => import('./pages/Profile')),
    "MyAccount": lazy(() => import('./pages/MyAccount')),
    "PractitionerDashboard": lazy(() => import('./pages/PractitionerDashboard')),
    "PractitionerProfile": lazy(() => import('./pages/PractitionerProfile')),
    "Messages": lazy(() => import('./pages/Messages')),
    "BookingRequest": lazy(() => import('./pages/BookingRequest')),
    "Favorites": lazy(() => import('./pages/Favorites')),
    "PractitionerApplication": lazy(() => import('./pages/PractitionerApplication')),
    "AdminDashboard": lazy(() => import('./pages/AdminDashboard')),
    "TrustSafety": lazy(() => import('./pages/TrustSafety')),
    "Billing": lazy(() => import('./pages/Billing')),
    "Auth": lazy(() => import('./pages/Auth')),
    "Landing": lazy(() => import('./pages/Landing')),
    "Map": lazy(() => import('./pages/Map')),
    "Orders": lazy(() => import('./pages/Orders')),
    "GroupDetail": lazy(() => import('./pages/GroupDetail')),
    "UserProfile": lazy(() => import('./pages/UserProfile')),
    "EventDetail": lazy(() => import('./pages/EventDetail')),
    "Privacy": lazy(() => import('./pages/Privacy')),
    "Terms": lazy(() => import('./pages/Terms')),
    "ResetPassword": lazy(() => import('./pages/ResetPassword')),
    "Welcome": lazy(() => import('./pages/Welcome')),
}

export const pagesConfig = {
    mainPage: "ForYou",
    Pages: PAGES,
    Layout: __Layout,
};
