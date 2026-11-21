import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, X, Pencil, Plus, MapPin } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { TextField, SelectField } from '../components/ui/Field';
import { PageLoader, ErrorState } from '../components/ui/States';
import { purchaseApi } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { timeAgo } from '../utils/format';

const REFRESH_MS = 30_000;
const collator = new Intl.Collator('gu', { sensitivity: 'base' });

/** Loads the shared purchase list and keeps it fresh (open, return to app, every 30s). */
function usePurchaseList() {
  const [data, setData] = useState({ sources: [], items: [] });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setData(await purchaseApi.list());
      setStatus('ready');
      setError(null);
    } catch (err) {
      setError(err);
      setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    const t = setInterval(onVisible, REFRESH_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(t);
    };
  }, [refresh]);

  const putItem = useCallback(
    (item) => setData((d) => ({ ...d, items: d.items.some((i) => i._id === item._id) ? d.items.map((i) => (i._id === item._id ? item : i)) : [...d.items, item] })),
    []
  );
  const putSource = useCallback(
    (src) => setData((d) => ({ ...d, sources: d.sources.some((s) => s._id === src._id) ? d.sources.map((s) => (s._id === src._id ? src : s)) : [...d.sources, src] })),
    []
  );

  return { ...data, status, error, refresh, putItem, putSource };
}

function ItemRow({ item, onSetNeeded, onEdit }) {
  const needed = item.needed;
  return (
    <li className={`flex items-center gap-2 px-4 py-2.5 ${needed ? '' : 'bg-surface-2/60'}`}>
      <div className="min-w-0 flex-1">
        <p className={`text-[16px] leading-snug ${needed ? 'font-semibold text-ink' : 'text-muted'}`}>{item.name}</p>
        <p className="truncate text-[12px] text-subtle">
          {timeAgo(item.updatedAt)}
          {item.lastUpdatedBy && ` · ${item.lastUpdatedBy}`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => !needed && onSetNeeded(item, true)}
        aria-pressed={needed}
        aria-label={`${item.name}: લેવાનું છે`}
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
          needed ? 'border-ok bg-ok text-white' : 'border-line-strong text-muted hover:bg-surface-2'
        }`}
      >
        <Check className="size-5" strokeWidth={2.75} />
      </button>
      <button
        type="button"
        onClick={() => needed && onSetNeeded(item, false)}
        aria-pressed={!needed}
        aria-label={`${item.name}: નથી લેવાનું`}
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
          !needed ? 'border-danger bg-danger text-white' : 'border-line-strong text-muted hover:bg-surface-2'
        }`}
      >
        <X className="size-5" strokeWidth={2.75} />
      </button>
      <button
        type="button"
        onClick={() => onEdit(item)}
        aria-label={`${item.name}: ફેરફાર કરો`}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
      >
        <Pencil className="size-[17px]" />
      </button>
    </li>
  );
}

function QuickAdd({ source, onAdd }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return inputRef.current?.focus();
    setBusy(true);
    const okAdded = await onAdd(name.trim(), source._id);
    setBusy(false);
    if (okAdded) {
      setName('');
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2 border-t border-line px-4 py-2.5">
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        enterKeyHint="done"
        placeholder={`${source.name}માંથી લેવાની વસ્તુ…`}
        aria-label={`${source.name}માં નવી વસ્તુ`}
        className="h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-[15px] placeholder:text-subtle focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30"
      />
      <Button type="submit" size="sm" icon={Plus} loading={busy} className="!h-10">
        ઉમેરો
      </Button>
    </form>
  );
}

function ItemModal({ item, sources, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', sourceId: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastId, setLastId] = useState(null);
  if ((item?._id || null) !== lastId) {
    setLastId(item?._id || null);
    setForm({ name: item?.name || '', sourceId: item?.sourceId || '' });
    setError('');
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('વસ્તુનું નામ લખો.');
    setSaving(true);
    const okSaved = await onSave(item, { name: form.name.trim(), sourceId: form.sourceId });
    setSaving(false);
    if (okSaved) onClose();
  };

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title="વસ્તુમાં ફેરફાર"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            રદ કરો
          </Button>
          <Button type="submit" form="purchase-item-form" className="flex-1" loading={saving}>
            સાચવો
          </Button>
        </>
      }
    >
      <form id="purchase-item-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="વસ્તુ"
          value={form.name}
          onChange={(e) => {
            setForm((f) => ({ ...f, name: e.target.value }));
            setError('');
          }}
          error={error}
          maxLength={80}
          hint="જથ્થો પણ લખી શકો: જેમ કે “10 કિલો બટાકા”"
          autoFocus
        />
        <SelectField label="ક્યાંથી લેવાનું" value={form.sourceId} onChange={(e) => setForm((f) => ({ ...f, sourceId: e.target.value }))}>
          {sources.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </SelectField>
      </form>
    </Modal>
  );
}

function SourceModal({ source, onClose, onSave }) {
  // source: object (rename), 'new' (add) or null (closed)
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const key = source === 'new' ? 'new' : source?._id || null;
  const [lastKey, setLastKey] = useState(null);
  if (key !== lastKey) {
    setLastKey(key);
    setName(source && source !== 'new' ? source.name : '');
    setError('');
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('જગ્યાનું નામ લખો.');
    setSaving(true);
    const result = await onSave(source === 'new' ? null : source, name.trim());
    setSaving(false);
    if (result === true) onClose();
    else if (result) setError(result);
  };

  return (
    <Modal
      open={Boolean(source)}
      onClose={onClose}
      title={source === 'new' ? 'ખરીદીની નવી જગ્યા' : 'જગ્યાનું નામ બદલો'}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            રદ કરો
          </Button>
          <Button type="submit" form="purchase-source-form" className="flex-1" loading={saving}>
            સાચવો
          </Button>
        </>
      }
    >
      <form id="purchase-source-form" onSubmit={submit} noValidate>
        <TextField
          label="ક્યાંથી ખરીદવાનું"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={error}
          maxLength={40}
          placeholder="જેમ કે: માર્કેટ"
          autoFocus
        />
      </form>
    </Modal>
  );
}

export default function PurchasePage() {
  const { sources, items, status, error, refresh, putItem, putSource } = usePurchaseList();
  const { operator } = useSettings();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [sourceModal, setSourceModal] = useState(null);

  const groups = useMemo(
    () =>
      sources.map((s) => {
        const list = items.filter((i) => i.sourceId === s._id);
        const byName = (a, b) => collator.compare(a.name, b.name);
        return { source: s, needed: list.filter((i) => i.needed).sort(byName), notNeeded: list.filter((i) => !i.needed).sort(byName) };
      }),
    [sources, items]
  );
  const neededCount = items.filter((i) => i.needed).length;

  // ✓ / ✗ update instantly; undone if the server rejects it.
  const setNeeded = async (item, needed) => {
    putItem({ ...item, needed, lastUpdatedBy: operator, updatedAt: new Date().toISOString() });
    try {
      putItem(await purchaseApi.setNeeded(item._id, needed, operator));
    } catch (err) {
      putItem(item);
      toast.error(err.message);
    }
  };

  const addItem = async (name, sourceId) => {
    try {
      putItem(await purchaseApi.createItem({ name, sourceId, updatedBy: operator }));
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const saveItem = async (item, data) => {
    try {
      putItem(await purchaseApi.updateItem(item._id, { ...data, updatedBy: operator }));
      toast.success('ફેરફાર સચવાયો');
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const saveSource = async (source, name) => {
    try {
      putSource(source ? await purchaseApi.renameSource(source._id, name) : await purchaseApi.createSource(name));
      toast.success(source ? 'નામ બદલાયું' : `${name} ઉમેરાયું`);
      return true;
    } catch (err) {
      return err.fields?.name || err.message;
    }
  };

  return (
    <>
      <PageHeader
        title="ખરીદી યાદી"
        subtitle={status === 'ready' ? (neededCount ? `${neededCount} વસ્તુ લેવાની છે` : 'હમણાં કંઈ લેવાનું નથી') : undefined}
        actions={
          <Button variant="secondary" size="sm" icon={MapPin} onClick={() => setSourceModal('new')}>
            જગ્યા ઉમેરો
          </Button>
        }
      />

      {status === 'loading' && <PageLoader label="ખરીદી યાદી લોડ થઈ રહી છે…" />}
      {status === 'error' && <ErrorState message={error?.message} onRetry={refresh} />}

      {status === 'ready' && (
        <div className="flex flex-col gap-4">
          {groups.map(({ source, needed, notNeeded }) => (
            <section key={source._id} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              <header className="flex items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-2.5">
                <h2 className="text-[17px] font-bold">{source.name}</h2>
                {needed.length > 0 && (
                  <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[12px] font-semibold text-ok">
                    <span className="num">{needed.length}</span> લેવાની
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSourceModal(source)}
                  className="ml-auto flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
                  aria-label={`${source.name}નું નામ બદલો`}
                >
                  <Pencil className="size-[17px]" />
                </button>
              </header>

              {needed.length + notNeeded.length === 0 ? (
                <p className="px-4 py-3 text-[14px] text-muted">હજી કોઈ વસ્તુ નથી. નીચે ઉમેરો.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {needed.map((item) => (
                    <ItemRow key={item._id} item={item} onSetNeeded={setNeeded} onEdit={setEditing} />
                  ))}
                  {notNeeded.length > 0 && (
                    <li className="bg-surface-2 px-4 py-1 text-[12px] font-semibold text-muted">
                      નથી લેવાનું (<span className="num">{notNeeded.length}</span>)
                    </li>
                  )}
                  {notNeeded.map((item) => (
                    <ItemRow key={item._id} item={item} onSetNeeded={setNeeded} onEdit={setEditing} />
                  ))}
                </ul>
              )}
              <QuickAdd source={source} onAdd={addItem} />
            </section>
          ))}
        </div>
      )}

      <ItemModal item={editing} sources={sources} onClose={() => setEditing(null)} onSave={saveItem} />
      <SourceModal source={sourceModal} onClose={() => setSourceModal(null)} onSave={saveSource} />
    </>
  );
}
