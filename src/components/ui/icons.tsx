import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Barcode,
  Bike,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  Download,
  Eye,
  File,
  FileText,
  HelpCircle,
  Image,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Trash,
  Undo2,
  User,
  Users,
  X,
  type LucideIcon,
  type LucideProps,
  CheckCircle2,
  XCircle,
} from "lucide-react"

export type Icon = LucideIcon

export const Icons = {
  add: Plus,
  arrowDown: ArrowDown,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowUpDown: ArrowUpDown,
  barcode: Barcode,
  bike: Bike,
  check: Check,
  checkCircle: CheckCircle2,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  clock: Clock,
  close: X,
  copy: Copy,
  creditCard: CreditCard,
  download: Download,
  edit: Pencil,
  error: AlertTriangle,
  eye: Eye,
  file: File,
  fileText: FileText,
  help: HelpCircle,
  image: Image,
  loader: Loader2,
  moreHorizontal: MoreHorizontal,
  refresh: RefreshCcw,
  search: Search,
  settings: Settings,
  spinner: Loader2,
  trash: Trash,
  undo: Undo2,
  user: User,
  users: Users,
  warning: AlertTriangle,
  xCircle: XCircle,
  logo: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M7 12l5 -5l5 5" />
      <path d="M7 12l5 5l5 -5" />
    </svg>
  ),
}
