// components/icons.tsx
import {
  type LucideIcon,
  type LucideProps,
  ShoppingBag,
  Search,
  Menu,
  X,
  User,
  Package,
  LogOut,
  LayoutDashboard,
  Heart,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Truck,
  Star,
  Mail,
  Check,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Upload,
  Loader2,
} from 'lucide-react';

// ✅ Brand icons from react-icons (Font Awesome 6 Brands)
import {
  FaInstagram,
  FaXTwitter,
  FaFacebookF,
  FaYoutube,
  FaGithub,
  FaLinkedinIn,
  FaTiktok,
  FaPinterestP,
  FaWhatsapp,
  FaDiscord,
} from 'react-icons/fa6';

import type { ComponentType, SVGProps } from 'react';

// ─── Type definitions ───────────────────────────────────────────────────────
// Generic icon type that covers BOTH lucide and react-icons
export type Icon = ComponentType<SVGProps<SVGSVGElement>>;
export type IconProps = LucideProps;

// ─── Single source of truth for ALL icons ──────────────────────────────────
export const Icons = {
  // Brand / Logo
  logo: ShoppingBag,

  // Navigation
  menu: Menu,
  close: X,
  search: Search,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,

  // Commerce
  cart: ShoppingCart,
  bag: ShoppingBag,
  heart: Heart,
  package: Package,
  truck: Truck,

  // User / Account
  user: User,
  logout: LogOut,
  dashboard: LayoutDashboard,

  // Actions
  add: Plus,
  remove: Minus,
  delete: Trash2,
  upload: Upload,
  check: Check,
  spinner: Loader2,

  // Marketing / Trust
  sparkles: Sparkles,
  shield: ShieldCheck,
  star: Star,
  mail: Mail,

  // ✅ Social — branded icons from react-icons
  instagram: FaInstagram,
  twitter: FaXTwitter,        // The new X logo
  facebook: FaFacebookF,
  youtube: FaYoutube,
  github: FaGithub,
  linkedin: FaLinkedinIn,
  tiktok: FaTiktok,
  pinterest: FaPinterestP,
  whatsapp: FaWhatsapp,
  discord: FaDiscord,
} as const satisfies Record<string, Icon>;

// Re-export Lucide types for backward compatibility
export type { LucideIcon, LucideProps } from 'lucide-react';