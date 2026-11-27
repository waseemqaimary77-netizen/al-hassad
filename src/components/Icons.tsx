import type { SVGProps } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Atom,
  BookOpen,
  Building2,
  Check,
  Clock,
  Crown,
  Dna,
  Download,
  Eye,
  FlaskConical,
  Home,
  Layers,
  LayoutDashboard,
  Lock,
  PartyPopper,
  Pause,
  Pencil,
  Play,
  Plus,
  Rewind,
  RotateCcw,
  Settings,
  Shapes,
  Star,
  Swords,
  Trash2,
  Trophy,
  Upload,
  Users,
  X,
} from 'lucide-react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

const withEm = (Icon: typeof Trophy) =>
  function EmIcon({ size = '1em', ...props }: IconProps) {
    return <Icon size={size} {...props} />;
  };

export const IconClose = withEm(X);
export const IconUsers = withEm(Users);
export const IconUpload = withEm(Upload);
export const IconTrophy = withEm(Trophy);
export const IconTrash = withEm(Trash2);
export const IconClock = withEm(Clock);
export const IconSwords = withEm(Swords);
export const IconStar = withEm(Star);
export const IconShapes = withEm(Shapes);
export const IconSettings = withEm(Settings);
export const IconSchool = withEm(Building2);
export const IconReset = withEm(RotateCcw);
export const IconRewind = withEm(Rewind);
export const IconPlus = withEm(Plus);
export const IconPlay = withEm(Play);
export const IconPencil = withEm(Pencil);
export const IconPause = withEm(Pause);
export const IconParty = withEm(PartyPopper);
export const IconLock = withEm(Lock);
export const IconDashboard = withEm(LayoutDashboard);
export const IconLayers = withEm(Layers);
export const IconHome = withEm(Home);
export const IconChemistry = withEm(FlaskConical);
export const IconEye = withEm(Eye);
export const IconDownload = withEm(Download);
export const IconBiology = withEm(Dna);
export const IconCrown = withEm(Crown);
export const IconCheck = withEm(Check);
export const IconBank = withEm(BookOpen);
export const IconPhysics = withEm(Atom);
export const IconArrowUp = withEm(ArrowUp);
export const IconArrowLeft = withEm(ArrowLeft);
export const IconArrowDown = withEm(ArrowDown);
