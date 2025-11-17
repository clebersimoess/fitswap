import Layout from "./Layout.jsx";

import Home from "./Home";

import CreateStory from "./CreateStory";

import ViewStories from "./ViewStories";

import CreatePost from "./CreatePost";

import Profile from "./Profile";

import Notifications from "./Notifications";

import Explore from "./Explore";

import EditProfile from "./EditProfile";

import Settings from "./Settings";

import UserProfile from "./UserProfile";

import Followers from "./Followers";

import BusinessSetup from "./BusinessSetup";

import BecomeInstructor from "./BecomeInstructor";

import InstructorDashboard from "./InstructorDashboard";

import MarketplacePlans from "./MarketplacePlans";

import Challenges from "./Challenges";

import CreatePlan from "./CreatePlan";

import PlanDetails from "./PlanDetails";

import CreateChallenge from "./CreateChallenge";

import StudentChat from "./StudentChat";

import MySubscriptions from "./MySubscriptions";

import LogWorkout from "./LogWorkout";

import WorkoutHistory from "./WorkoutHistory";

import ChallengeProof from "./ChallengeProof";

import InstructorAnalytics from "./InstructorAnalytics";

import Communities from "./Communities";

import ManageAds from "./ManageAds";

import PrivacyPolicy from "./PrivacyPolicy";

import PermissionsHelp from "./PermissionsHelp";

import CommunityView from "./CommunityView";

import AccountTypeSelector from "./AccountTypeSelector";

import InstructorPanel from "./InstructorPanel";

import TermsOfService from "./TermsOfService";

import DirectMessages from "./DirectMessages";

import ManageCommunityMembers from "./ManageCommunityMembers";

import EditCommunity from "./EditCommunity";

import InstructorChat from "./InstructorChat";

import CreateWorkoutPlan from "./CreateWorkoutPlan";

import WelcomeScreen from "./WelcomeScreen";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    CreateStory: CreateStory,
    
    ViewStories: ViewStories,
    
    CreatePost: CreatePost,
    
    Profile: Profile,
    
    Notifications: Notifications,
    
    Explore: Explore,
    
    EditProfile: EditProfile,
    
    Settings: Settings,
    
    UserProfile: UserProfile,
    
    Followers: Followers,
    
    BusinessSetup: BusinessSetup,
    
    BecomeInstructor: BecomeInstructor,
    
    InstructorDashboard: InstructorDashboard,
    
    MarketplacePlans: MarketplacePlans,
    
    Challenges: Challenges,
    
    CreatePlan: CreatePlan,
    
    PlanDetails: PlanDetails,
    
    CreateChallenge: CreateChallenge,
    
    StudentChat: StudentChat,
    
    MySubscriptions: MySubscriptions,
    
    LogWorkout: LogWorkout,
    
    WorkoutHistory: WorkoutHistory,
    
    ChallengeProof: ChallengeProof,
    
    InstructorAnalytics: InstructorAnalytics,
    
    Communities: Communities,
    
    ManageAds: ManageAds,
    
    PrivacyPolicy: PrivacyPolicy,
    
    PermissionsHelp: PermissionsHelp,
    
    CommunityView: CommunityView,
    
    AccountTypeSelector: AccountTypeSelector,
    
    InstructorPanel: InstructorPanel,
    
    TermsOfService: TermsOfService,
    
    DirectMessages: DirectMessages,
    
    ManageCommunityMembers: ManageCommunityMembers,
    
    EditCommunity: EditCommunity,
    
    InstructorChat: InstructorChat,
    
    CreateWorkoutPlan: CreateWorkoutPlan,
    
    WelcomeScreen: WelcomeScreen,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/CreateStory" element={<CreateStory />} />
                
                <Route path="/ViewStories" element={<ViewStories />} />
                
                <Route path="/CreatePost" element={<CreatePost />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Notifications" element={<Notifications />} />
                
                <Route path="/Explore" element={<Explore />} />
                
                <Route path="/EditProfile" element={<EditProfile />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/UserProfile" element={<UserProfile />} />
                
                <Route path="/Followers" element={<Followers />} />
                
                <Route path="/BusinessSetup" element={<BusinessSetup />} />
                
                <Route path="/BecomeInstructor" element={<BecomeInstructor />} />
                
                <Route path="/InstructorDashboard" element={<InstructorDashboard />} />
                
                <Route path="/MarketplacePlans" element={<MarketplacePlans />} />
                
                <Route path="/Challenges" element={<Challenges />} />
                
                <Route path="/CreatePlan" element={<CreatePlan />} />
                
                <Route path="/PlanDetails" element={<PlanDetails />} />
                
                <Route path="/CreateChallenge" element={<CreateChallenge />} />
                
                <Route path="/StudentChat" element={<StudentChat />} />
                
                <Route path="/MySubscriptions" element={<MySubscriptions />} />
                
                <Route path="/LogWorkout" element={<LogWorkout />} />
                
                <Route path="/WorkoutHistory" element={<WorkoutHistory />} />
                
                <Route path="/ChallengeProof" element={<ChallengeProof />} />
                
                <Route path="/InstructorAnalytics" element={<InstructorAnalytics />} />
                
                <Route path="/Communities" element={<Communities />} />
                
                <Route path="/ManageAds" element={<ManageAds />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                
                <Route path="/PermissionsHelp" element={<PermissionsHelp />} />
                
                <Route path="/CommunityView" element={<CommunityView />} />
                
                <Route path="/AccountTypeSelector" element={<AccountTypeSelector />} />
                
                <Route path="/InstructorPanel" element={<InstructorPanel />} />
                
                <Route path="/TermsOfService" element={<TermsOfService />} />
                
                <Route path="/DirectMessages" element={<DirectMessages />} />
                
                <Route path="/ManageCommunityMembers" element={<ManageCommunityMembers />} />
                
                <Route path="/EditCommunity" element={<EditCommunity />} />
                
                <Route path="/InstructorChat" element={<InstructorChat />} />
                
                <Route path="/CreateWorkoutPlan" element={<CreateWorkoutPlan />} />
                
                <Route path="/WelcomeScreen" element={<WelcomeScreen />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}