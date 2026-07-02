/**
 * Icon shim. The app imports every icon from "@/lib/icons".
 *
 * The bespoke KamboGuide set (src/components/ui/icons/set.tsx) is the primary
 * source — those names win via `export *`. Any icon not yet hand-drawn falls back
 * to @phosphor-icons/react below (same weight= API), so the app is never broken
 * mid-migration; the Phosphor list shrinks to zero as the custom set completes.
 */
export type { Icon, IconProps, IconWeight } from '@phosphor-icons/react';
export { IconContext } from '@phosphor-icons/react';

// ---- Bespoke custom icons (primary) ----
export * from '@/components/ui/icons/set';

// ---- Phosphor fallback (long-tail, not yet custom-drawn) ----
export {
  GoogleLogo,
  GithubLogo,
  Copy,
  DownloadSimple as Download,
  Warning as AlertTriangle,
  WarningCircle as AlertCircle,
  ChartBar as BarChart3,
  BookBookmark as BookMarked,
  Brain,
  CalendarDots as CalendarDays,
  Crosshair,
  PencilSimple as Edit,
  ArrowSquareOut as ExternalLink,
  Eye,
  EyeSlash,
  EyeSlash as EyeOff,
  Globe,
  TrendUp as TrendingUp,
  UploadSimple as Upload,
  Prohibit as Ban,
  BellRinging as BellPlus,
  Book,
  BookOpen,
  BookOpenText as BookText,
  Briefcase,
  CalendarCheck,
  CalendarCheck as CalendarCheck2,
  Camera,
  CurrencyDollar as DollarSign,
  FileText,
  Flag,
  DotsSixVertical as GripVertical,
  Hourglass,
  Leaf,
  LinkSimple as Link,
  ClipboardText,
  ShareNetwork as ShareIcon,
  ListBullets as List,
  CircleNotch as Loader2,
  SignIn as LogIn,
  SignOut as LogOut,
  Envelope as Mail,
  List as Menu,
  ChatDots as MessageSquarePlus,
  DotsThree as MoreHorizontal,
  Sidebar as PanelLeft,
  Paperclip,
  Phone,
  PushPin as Pin,
  PlusCircle,
  ArrowsClockwise as RefreshCw,
  FloppyDisk as Save,
  GearSix as Settings,
  ShoppingCart,
  Lock,
  Tag,
  Package,
  Trophy,
  ChartLine,
  UsersThree,
  Globe as GlobeIcon,
  Bookmark,
  Warning as WarningIcon,
  SlidersHorizontal,
  Storefront as Store,
  Storefront,
  Trash as Trash2,
  VideoCamera as Video,
} from '@phosphor-icons/react';
