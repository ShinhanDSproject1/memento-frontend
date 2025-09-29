import { useAuth } from "@/entities/auth";
import RecommendChatPage from "@/pages/chat/RecommendChatPage";
import DelayedFallback from "@/shared/ui/DelayedFallBack";
import LoadingBar from "@/shared/ui/LoadingBar";
import { CommonHeader } from "@/widgets/common";
import { MainHeader } from "@/widgets/main";
import React, { Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  useMatches,
} from "react-router-dom";
const Error400 = React.lazy(() => import("@/pages/home/Error400"));
const Error404 = React.lazy(() => import("@/pages/home/Error404"));
const Error500 = React.lazy(() => import("@/pages/home/Error500"));
const Home = React.lazy(() => import("@/pages/home/Home2"));
const Login = React.lazy(() => import("@/pages/login/Login"));
const SignupSelect = React.lazy(() => import("@/pages/login/SignupSelect"));
const MentorSignup = React.lazy(() => import("@/pages/login/MentorSignup"));
const MenteeSignup = React.lazy(() => import("@/pages/login/MenteeSignup"));
const SignupComplete = React.lazy(() => import("@/pages/login/SignupComplete"));
const MentosList = React.lazy(() => import("@/pages/mentos/MentosList"));
const MentosDetail = React.lazy(() => import("@/pages/mentos/MentosDetail"));
const MyMentosList = React.lazy(() => import("@/pages/my-profile/MyMentosList"));
const MentorProfile = React.lazy(() => import("@/pages/my-profile/MentoProfile"));
const MyProfile = React.lazy(() => import("@/pages/my-profile/MyProfile"));
const CreateMentos = React.lazy(() => import("@/pages/mentor/CreateMentos"));
const EditMentos = React.lazy(() => import("@/pages/mentor/EditMentos"));
const CertificationRegister = React.lazy(() => import("@/pages/mentos/CertificationRegister"));
const CertificationPage = React.lazy(() => import("@/pages/mentos/CertificationPage"));
const MentoIntroduce = React.lazy(() => import("@/pages/login/MentoIntroduce"));
const Reviews = React.lazy(() => import("@/pages/mentor/Review"));
const Ready = React.lazy(() => import("@/pages/home/Ready"));
const ChatListPage = React.lazy(() => import("@/pages/chat/ChatListPage"));
const ChatRoomPage = React.lazy(() => import("@/pages/chat/ChatRoomPage"));
const AnalyticsPage = React.lazy(() => import("@/pages/chat/AnalyticsPage"));
const MemberReport = React.lazy(() => import("@/pages/admin/MemberReport"));
const ReportList = React.lazy(() => import("@/pages/admin/ReportList"));
const HomeVideo = React.lazy(() => import("@/pages/home/HomeVideo"));
const BookingPage = React.lazy(() => import("@/pages/book/Booking"));
const BookingConfirm = React.lazy(() => import("@/pages/book/BookingConfirm"));
const MentoIntroduce2 = React.lazy(() => import("@/pages/book/MentoIntroduce2"));
const PaySuccess = React.lazy(() => import("@/pages/book/PaySuccess"));
const MentorMapNearbyPage = React.lazy(() => import("@/pages/mentos/MentorMapNearbyPage"));
const CertificationFailPage = React.lazy(() => import("@/pages/mentos/CertificationFailPage"));
const ChatBot = React.lazy(() => import("@/pages/chat/ChatBot"));
const RecommendPage = React.lazy(() => import("@/pages/chat/RecommendPage"));

const withSuspense = (el: React.ReactNode) => (
  <Suspense
    fallback={
      <DelayedFallback delay={1000}>
        <LoadingBar variant="inline" label="페이지 로딩 중…" />
      </DelayedFallback>
    }>
    {el}
  </Suspense>
);

const HeaderSwitch = () => {
  const matches = useMatches();
  const headerType: "main" | "common" =
    (matches[matches.length - 1]?.handle as any)?.header === "main" ? "main" : "common";

  return (
    <div className="flex min-h-dvh flex-col">
      {headerType === "main" ? <MainHeader /> : <CommonHeader />}
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: withSuspense(<HeaderSwitch />),
    errorElement: withSuspense(<Error404 />),
    children: [
      // ----- 공개 라우트 그룹 -----
      { index: true, element: withSuspense(<Home />), handle: { header: "main" as const } },
      { path: "/400", element: withSuspense(<Error400 />) },
      { path: "/500", element: withSuspense(<Error500 />) },
      { path: "/recommend", element: withSuspense(<RecommendChatPage />) },
      { path: "/login", element: withSuspense(<Login />) },
      { path: "/signup", element: withSuspense(<SignupSelect />) },
      { path: "/signup/mentor", element: withSuspense(<MentorSignup />) },
      { path: "/signup/mentee", element: withSuspense(<MenteeSignup />) },
      { path: "/signup-complete", element: withSuspense(<SignupComplete />) },
      { path: "/mento/introduce", element: withSuspense(<MentoIntroduce />) },
      { path: "/mento/introduce2", element: withSuspense(<MentoIntroduce2 />) },
      { path: "/menti/:category", element: withSuspense(<MentosList />) },
      { path: "/menti/mentos-detail/:id", element: withSuspense(<MentosDetail />) },
      { path: "/video", element: withSuspense(<HomeVideo />) },
      { path: "/ready", element: withSuspense(<Ready />) },

      // ----- 보호 라우트 그룹 -----
      {
        element: withSuspense(<RequireAuth />),
        children: [
          /* 멘티 페이지 */
          { path: "/menti/mymentos", element: withSuspense(<MyMentosList role="menti" />) },
          { path: "/menti/myprofile", element: withSuspense(<MyProfile />) },

          /* 멘토 페이지 */
          { path: "/mento/my-list", element: withSuspense(<MyMentosList role="mento" />) },
          { path: "/mento", element: withSuspense(<MentorProfile />) },
          { path: "/mento/nearby", element: withSuspense(<MentorMapNearbyPage />) },
          { path: "/create-mentos", element: withSuspense(<CreateMentos />) },
          { path: "/edit/:id", element: withSuspense(<EditMentos />) },
          { path: "/mento/certification", element: withSuspense(<CertificationRegister />) },
          {
            path: "/mento/certification/:result",
            element: withSuspense(<CertificationPage />),
          },
          {
            path: "/mento/certification/fail",
            element: withSuspense(<CertificationFailPage />),
          },

          /* 채팅 페이지*/
          { path: "/chat", element: withSuspense(<ChatListPage />) },
          { path: "/chat/:roomId", element: withSuspense(<ChatRoomPage />) },
          { path: "/analytics", element: withSuspense(<AnalyticsPage />) },

          /* 예약/결제 페이지*/
          { path: "/booking", element: withSuspense(<BookingPage />) },
          { path: "/booking/confirm", element: withSuspense(<BookingConfirm />) },
          { path: "/payments/success", element: withSuspense(<PaySuccess />) },
          { path: "/booking/success", element: withSuspense(<PaySuccess />) },
          { path: "/reviews", element: withSuspense(<Reviews />) },

          /* AI 페이지*/
          { path: "/ai/chatBot", element: withSuspense(<ChatBot />) },
          { path: "/ai/recommend", element: withSuspense(<RecommendPage />) },

          /* 관리자 페이지 */
          { path: "/admin/report", element: withSuspense(<MemberReport />) },
          { path: "/admin/declaration", element: withSuspense(<ReportList />) },
        ],
      },
    ],
  },
  { path: "*", element: withSuspense(<Error404 />) },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
