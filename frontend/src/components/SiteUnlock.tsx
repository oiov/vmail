import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SiteUnlockProps {
  onUnlock: (password: string) => Promise<void>;
  isUnlocking: boolean;
  error: string | null;
}

export function SiteUnlock({ onUnlock, isUnlocking, error }: SiteUnlockProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      return;
    }
    await onUnlock(password);
  };

  return (
    <div className="min-h-screen bg-[#1f2023] flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-cyan-100/20 bg-neutral-800 p-6 text-white">
        <h1 className="text-xl font-semibold mb-3">{t('Site locked')}</h1>
        <p className="text-sm text-zinc-300 mb-5">
          {t('Enter site password to continue')}
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('Password')}
          className="w-full rounded-md bg-white/10 border border-cyan-100/20 px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-cyan-500"
        />

        {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={isUnlocking || !password.trim()}
          className="w-full rounded-md bg-cyan-600 py-2.5 font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed">
          {isUnlocking ? t('Unlocking...') : t('Unlock')}
        </button>
      </form>
    </div>
  );
}
