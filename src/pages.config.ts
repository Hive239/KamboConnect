import Directory from './pages/Directory';
import Education from './pages/Education';
import Verification from './pages/Verification';
import Community from './pages/Community';
import Events from './pages/Events';
import Market from './pages/Market';
import Disclaimer from './pages/Disclaimer';
import NewPost from './pages/NewPost';
import Post from './pages/Post';
import Bookings from './pages/Bookings';
import Profile from './pages/Profile';
import MyAccount from './pages/MyAccount';
import PractitionerDashboard from './pages/PractitionerDashboard';
import PractitionerProfile from './pages/PractitionerProfile';
import Messages from './pages/Messages';
import BookingRequest from './pages/BookingRequest';
import Favorites from './pages/Favorites';
import PractitionerApplication from './pages/PractitionerApplication';
import AdminDashboard from './pages/AdminDashboard';
import Matchmaking from './pages/Matchmaking';
import TrustSafety from './pages/TrustSafety';
import Billing from './pages/Billing';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import MapPage from './pages/Map';
import Orders from './pages/Orders';
import GroupDetail from './pages/GroupDetail';
import __Layout from './Layout';


export const PAGES = {
    "Directory": Directory,
    "Matchmaking": Matchmaking,
    "Education": Education,
    "Verification": Verification,
    "Community": Community,
    "Events": Events,
    "Market": Market,
    "Disclaimer": Disclaimer,
    "NewPost": NewPost,
    "Post": Post,
    "Bookings": Bookings,
    "Profile": Profile,
    "MyAccount": MyAccount,
    "PractitionerDashboard": PractitionerDashboard,
    "PractitionerProfile": PractitionerProfile,
    "Messages": Messages,
    "BookingRequest": BookingRequest,
    "Favorites": Favorites,
    "PractitionerApplication": PractitionerApplication,
    "AdminDashboard": AdminDashboard,
    "TrustSafety": TrustSafety,
    "Billing": Billing,
    "Auth": Auth,
    "Landing": Landing,
    "Map": MapPage,
    "Orders": Orders,
    "GroupDetail": GroupDetail,
}

export const pagesConfig = {
    mainPage: "Directory",
    Pages: PAGES,
    Layout: __Layout,
};