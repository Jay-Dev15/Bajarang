import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';

export default function LoginPage() {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('ઓછામાં ઓછા 4 અંકનો PIN લખો.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(pin);
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-5 py-10">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1>
            <Logo className="h-auto w-56" />
          </h1>        </div>

        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <label htmlFor="pin" className="flex items-center gap-2 text-[15px] font-semibold">
            <Lock className="size-4 text-muted" />
            દુકાનનો PIN દાખલ કરો
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={8}
            autoFocus
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            className={`num mt-3 h-14 w-full rounded-[var(--radius-control)] border bg-surface text-center text-[26px] tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-focus/30 ${
              error ? 'border-danger' : 'border-line-strong focus:border-focus'
            }`}
            aria-invalid={Boolean(error)}
            aria-describedby="pin-help"
          />
          <p id="pin-help" className={`mt-2 min-h-5 text-[13px] ${error ? 'text-danger' : 'text-muted'}`} role={error ? 'alert' : undefined}>
            {error || 'PIN ફક્ત ઘરના સભ્યો પાસે છે. એક વાર દાખલ કર્યા પછી આ ફોન યાદ રાખશે.'}
          </p>
          <Button type="submit" size="lg" className="mt-4 w-full" loading={loading}>
            ખોલો
          </Button>
        </div>
      </form>
    </div>
  );
}
