import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { IconClose } from './Icons';

type ButtonVariant = 'primary' | 'soft' | 'ghost' | 'gold' | 'success' | 'danger';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-royal text-white hover:brightness-110 shadow-sm',
  soft: 'bg-soft text-royal hover:brightness-95',
  ghost: 'bg-white text-ink border border-line hover:bg-page',
  gold: 'bg-gold text-white hover:brightness-105 shadow-sm',
  success: 'bg-ok text-green-800 border border-green-200 hover:brightness-95',
  danger: 'bg-err text-red-700 border border-red-200 hover:brightness-95',
};

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-white p-5 shadow-card ${className}`}>
      {children}
    </div>
  );
}

type BadgeTone = 'blue' | 'green' | 'red' | 'gold' | 'gray';

const BADGE_TONES: Record<BadgeTone, string> = {
  blue: 'bg-soft text-royal',
  green: 'bg-ok text-green-800',
  red: 'bg-err text-red-700',
  gold: 'bg-amber-50 text-amber-700 border border-amber-200',
  gray: 'bg-page text-mute border border-line',
};

export function Badge({
  tone = 'blue',
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
        <div className="mt-2 h-1 w-16 rounded-full bg-gold" />
        {subtitle && <p className="mt-2 text-mute">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </header>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-mute">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none focus:border-royal focus:ring-2 focus:ring-soft disabled:bg-page disabled:text-mute';

export function Notice({
  tone = 'blue',
  children,
}: {
  tone?: 'blue' | 'red' | 'green';
  children: ReactNode;
}) {
  const toneClass =
    tone === 'red'
      ? 'bg-err text-red-800'
      : tone === 'green'
        ? 'bg-ok text-green-800'
        : 'bg-soft text-ink';

  return (
    <div role="status" className={`rounded-xl px-4 py-3 font-medium ${toneClass}`}>
      {children}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-300/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fade-in w-full max-w-xl rounded-3xl border border-line bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button
            type="button"
            aria-label="إغلاق"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 hover:bg-page"
          >
            <IconClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title = 'تأكيد الإجراء',
  message,
  confirmLabel = 'نعم، متابعة',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="mb-5 text-lg font-medium text-ink">{message}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          إلغاء
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Credits({ className = '' }: { className?: string }) {
  return (
    <p className={`text-sm font-bold text-mute ${className}`}>
      برمجة: <span className="text-royal">وسيم قيمري</span>
      <span className="mx-2 text-gold">•</span>
      إعداد الأسئلة: <span className="text-royal">أكرم عواد</span>
    </p>
  );
}
