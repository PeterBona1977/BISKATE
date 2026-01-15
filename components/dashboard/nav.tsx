"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  type LucideIcon,
  Home,
  Briefcase,
  PlusCircle,
  MessageSquare,
  Bell,
  User,
  Settings,
  HardHat,
  PenToolIcon as Tool,
  Shield,
  Users,
  Tag,
  Flag,
  BarChart,
  X,
  CreditCard,
  ClipboardList,
  Megaphone,
  FileText,
  ImageIcon,
  DollarSign,
  Zap,
  Globe,
  Database,
  Bug,
  LogIn,
  UserPlus,
} from "lucide-react"
import { SheetClose } from "@/components/ui/sheet"

interface NavItem {
  title: string
  href: string
  icon: keyof typeof iconMap // Use keyof typeof iconMap
  roles: ("client" | "provider" | "admin")[]
}

interface DashboardNavProps {
  items: NavItem[]
  isMobile?: boolean
  onMobileMenuClose?: () => void
}

const iconMap: { [key: string]: LucideIcon } = {
  home: Home,
  briefcase: Briefcase,
  plusCircle: PlusCircle,
  messageSquare: MessageSquare,
  bell: Bell,
  user: User,
  settings: Settings,
  hardHat: HardHat,
  tool: Tool,
  shield: Shield,
  users: Users,
  tag: Tag,
  flag: Flag,
  barChart: BarChart,
  x: X,
  creditCard: CreditCard,
  clipboardList: ClipboardList,
  megaphone: Megaphone,
  fileText: FileText,
  imageIcon: ImageIcon,
  dollarSign: DollarSign,
  zap: Zap,
  globe: Globe,
  database: Database,
  bug: Bug,
  logIn: LogIn,
  userPlus: UserPlus,
}

export function DashboardNav({ items, isMobile = false, onMobileMenuClose }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {items.map((item, index) => {
        const Icon = iconMap[item.icon]
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

        return (
          <Link key={index} href={item.href} passHref>
            {isMobile ? (
              <SheetClose asChild>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary",
                  )}
                  onClick={onMobileMenuClose}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </a>
              </SheetClose>
            ) : (
              <a
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </a>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
