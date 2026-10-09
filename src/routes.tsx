import { createBrowserRouter, Navigate } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Games from './pages/Games'
import GameDetail from './pages/GameDetail'
import CategoryDetail from './pages/CategoryDetail'
import Tournaments from './pages/Tournaments'
import TournamentDetail from './pages/TournamentDetail'
import Matches from './pages/Matches'
import MatchDetail from './pages/MatchDetail'
import Leaderboard from './pages/Leaderboard'
import Teams from './pages/Teams'
import CreateTeam from './pages/CreateTeam'
import JoinTeam from './pages/JoinTeam'
import Wallet from './pages/Wallet'
import Transactions from './pages/Transactions'
import Profile from './pages/Profile'
import MyRegistrations from './pages/MyRegistrations'
import MyMatches from './pages/MyMatches'
import Notifications from './pages/Notifications'
import Support from './pages/Support'
import Reviews from './pages/Reviews'
import About from './pages/About'
import Settings from './pages/Settings'
import Rules from './pages/Rules'
import Admin from './pages/Admin'
import Organizer from './pages/Organizer'
import Auth from './pages/Auth'
import ErrorPage from './pages/ErrorPage'
import States from './pages/States'
import { RequireAuth, RequireOrganizer, RequireSuperAdmin } from './components/RouteGuards'

export const router = createBrowserRouter([
  { path: '/login', Component: Auth },
  { path: '/login/*', Component: Auth },
  { path: '/sign-in', Component: Auth },
  { path: '/sign-in/*', Component: Auth },
  { path: '/signup', Component: Auth },
  { path: '/signup/*', Component: Auth },
  { path: '/signup/continue', Component: Auth },
  { path: '/sign-up', Component: Auth },
  { path: '/sign-up/*', Component: Auth },
  { path: '/sign-up/continue', Component: Auth },
  { path: '/unauthorized-sign-in', Component: Auth },
  { path: '/unauthorized', Component: Auth },
  { path: '/user/security', element: <Navigate to="/settings?tab=Security" replace /> },
  { path: '/user', element: <Navigate to="/settings" replace /> },
  { path: '/user/*', element: <Navigate to="/settings" replace /> },
  { path: '/setup', Component: Auth },
  { path: '/onboarding', Component: Auth },
  { path: '/sso-callback', Component: Auth },
  { path: '/forgot-password', Component: Auth },
  { path: '/verify', Component: Auth },
  {
    path: '/',
    Component: Layout,
    ErrorBoundary: ErrorPage,
    children: [
      { index: true, Component: Home },
      { path: 'games', Component: Games },
      { path: 'games/category/:slug', Component: CategoryDetail },
      { path: 'games/:slug', Component: GameDetail },
      { path: 'joiners', Component: Games },
      { path: 'joiners/category/:slug', Component: CategoryDetail },
      { path: 'tournaments', Component: Tournaments },
      { path: 'tournaments/:id', Component: TournamentDetail },
      { path: 'matches', Component: Matches },
      { path: 'matches/:id', Component: MatchDetail },
      { path: 'leaderboard', Component: Leaderboard },
      { path: 'teams', Component: Teams },
      {
        path: 'teams/create',
        element: (
          <RequireAuth>
            <CreateTeam />
          </RequireAuth>
        ),
      },
      {
        path: 'teams/join',
        element: (
          <RequireAuth>
            <JoinTeam />
          </RequireAuth>
        ),
      },
      {
        path: 'wallet',
        element: (
          <RequireAuth>
            <Wallet />
          </RequireAuth>
        ),
      },
      {
        path: 'transactions',
        element: (
          <RequireAuth>
            <Transactions />
          </RequireAuth>
        ),
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
      {
        path: 'my/registrations',
        element: (
          <RequireAuth>
            <MyRegistrations />
          </RequireAuth>
        ),
      },
      {
        path: 'my/matches',
        element: (
          <RequireAuth>
            <MyMatches />
          </RequireAuth>
        ),
      },
      {
        path: 'notifications',
        element: (
          <RequireAuth>
            <Notifications />
          </RequireAuth>
        ),
      },
      { path: 'support', Component: Support },
      { path: 'help', Component: Support },
      { path: 'reviews', Component: Reviews },
      { path: 'rules', Component: Rules },
      {
        path: 'admin',
        element: (
          <RequireSuperAdmin>
            <Admin />
          </RequireSuperAdmin>
        ),
      },
      {
        path: 'organizer',
        element: (
          <RequireOrganizer>
            <Organizer />
          </RequireOrganizer>
        ),
      },
      { path: 'about', Component: About },
      {
        path: 'settings',
        element: (
          <RequireAuth>
            <Settings />
          </RequireAuth>
        ),
      },
      { path: 'states', Component: States },
      { path: '*', Component: ErrorPage },
    ],
  },
])
