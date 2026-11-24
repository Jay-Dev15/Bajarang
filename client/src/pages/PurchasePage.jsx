import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, X, Pencil, Plus, MapPin, Share2, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { TextField } from '../components/ui/Field';
import { ErrorState } from '../components/ui/States';
import { RowsSkeleton, ChipsSkeleton } from '../components/ui/Skeleton';
import { purchaseApi } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { cache } from '../utils/cache';

const REFRESH_MS = 30_000;
const collator = new Intl.Collator('gu', { sensitivity: 'base' });

/** Loads the shared purchase list and keeps it fresh (open, return to app, every 30s). */
function usePurchaseList() {
  // Show the copy saved on this device straight away; the fresh one follows.
  const [saved] = useState(() => cache.get('purchase'));
  const [data, setData] = useState(() => saved?.data || { sources: [], items: [] });
  const [status, setStatus] = useState(saved ? 'ready' : 'loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'ready') cache.set('purchase', data);
  }, [data, status]);

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

  const dropItem = useCallback((id) => setData((d) => ({ ...d, items: d.items.filter((i) => i._id !== id) })), []);

  return { ...data, status, error, refresh, putItem, dropItem, putSource };
}

const iconBtn = 'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-surface-2 disabled:opacity-50';

// Inline edit: ✓ saves (and puts the item in "to buy"), 🗑 deletes it, Esc cancels.
function EditRow({ item, onSave, onDelete, onCancel }) {
  const [name, setName] = useState(item.name);
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const done = await onSave(item, name.trim());
    if (!done) setBusy(false);
  };
  const remove = () => onDelete(item); // asks for confirmation first

  return (
    <li className="bg-brand-soft/40 px-4 py-1">
      <form onSubmit={save} className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          maxLength={80}
          enterKeyHint="done"
          aria-label="વસ્તુનું નામ"
          className="h-8 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-2.5 text-[14px] focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30"
        />
        <button type="submit" disabled={busy} aria-label="સાચવો" className={`${iconBtn} text-ok`}>
          <Check className="size-4" strokeWidth={2.75} />
        </button>
        <button type="button" onClick={remove} disabled={busy} aria-label={`${item.name} કાઢી નાખો`} className={`${iconBtn} text-danger`}>
          <Trash2 className="size-[15px]" />
        </button>
      </form>
    </li>
  );
}

// Needed items only offer ✗ (remove); not-needed items only offer ✓ (add back).
function ItemRow({ item, onSetNeeded, onEdit, editing, onSave, onDelete, onCancelEdit }) {
  if (editing) return <EditRow item={item} onSave={onSave} onDelete={onDelete} onCancel={onCancelEdit} />;
  const needed = item.needed;
  const Icon = needed ? X : Check;
  return (
    <li className={`flex items-center gap-2 px-4 py-1 ${needed ? '' : 'bg-surface-2/60'}`}>
      <p className={`min-w-0 flex-1 text-[14px] leading-snug ${needed ? 'font-semibold text-ink' : 'text-muted'}`}>{item.name}</p>
      <button
        type="button"
        onClick={() => onSetNeeded(item, !needed)}
        aria-label={`${item.name}: ${needed ? 'નથી લેવાનું' : 'લેવાનું છે'}`}
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-surface-2 ${
          needed ? 'text-danger' : 'text-ok'
        }`}
      >
        <Icon className="size-4" strokeWidth={2.75} />
      </button>
      <button
        type="button"
        onClick={() => onEdit(item)}
        aria-label={`${item.name}: ફેરફાર કરો`}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
      >
        <Pencil className="size-[15px]" />
      </button>
    </li>
  );
}

function SourceTabs({ groups, selectedId, onSelect }) {
  // Scroll the tab row sideways (never the page) so the selected tab is visible.
  const keepInView = (el) => {
    const row = el?.parentElement;
    if (!row) return;
    const left = el.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + el.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollLeft = left - 16;
  };
  return (
    <div role="tablist" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {groups.map(({ source, needed }) => {
        const active = source._id === selectedId;
        return (
          <button
            key={source._id}
            type="button"
            role="tab"
            aria-selected={active}
            ref={active ? keepInView : undefined}
            onClick={() => onSelect(source._id)}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border px-3.5 text-[14px] font-medium transition-colors ${
              active ? 'border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface text-ink hover:bg-surface-2'
            }`}
          >
            {source.name}
            {needed.length > 0 && <span className={`num text-[12px] ${active ? 'opacity-85' : 'text-ok'}`}>{needed.length}</span>}
          </button>
        );
      })}
    </div>
  );
}

function SourcePanel({ group: { source, needed, notNeeded }, rowProps, onRename, onAdd, onShare }) {
  const empty = needed.length + notNeeded.length === 0;
  const [adding, setAdding] = useState(false);
  // Empty list: the add box is always shown. Otherwise it opens from the + button.
  const showAdd = empty || adding;
  return (
    <section role="tabpanel" className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      <header className="flex items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-2">
        <h2 className="text-[16px] font-bold">{source.name}</h2>
        {needed.length > 0 && (
          <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[12px] font-semibold text-ok">
            <span className="num">{needed.length}</span> લેવાની
          </span>
        )}
        {needed.length > 0 && (
          <button
            type="button"
            onClick={() => onShare(source, needed)}
            className="ml-auto flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
            aria-label={`${source.name}ની લેવાની વસ્તુઓ મોકલો`}
          >
            <Share2 className="size-[16px]" />
          </button>
        )}
        {!empty && (
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            aria-expanded={adding}
            className={`${needed.length ? '' : 'ml-auto'} flex size-8 items-center justify-center rounded-lg transition-colors ${
              adding ? 'bg-brand text-on-brand' : 'text-muted hover:bg-surface-2 hover:text-ink'
            }`}
            aria-label={`${source.name}માં નવી વસ્તુ ઉમેરો`}
          >
            <Plus className="size-[17px]" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onRename(source)}
          className={`${empty ? 'ml-auto' : ''} flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink`}
          aria-label={`${source.name}નું નામ બદલો`}
        >
          <Pencil className="size-[15px]" />
        </button>
      </header>

      {showAdd && <QuickAdd source={source} onAdd={onAdd} autoFocus={adding} />}

      {empty ? (
        <p className="px-4 py-3 text-[14px] text-muted">હજી કોઈ વસ્તુ નથી. ઉપર ઉમેરો.</p>
      ) : (
        <ul className="divide-y divide-line">
          {needed.map((item) => (
            <ItemRow key={item._id} item={item} {...rowProps(item)} />
          ))}
          {notNeeded.length > 0 && (
            <li className="bg-surface-2 px-4 py-1 text-[12px] font-semibold text-muted">
              નથી લેવાનું (<span className="num">{notNeeded.length}</span>)
            </li>
          )}
          {notNeeded.map((item) => (
            <ItemRow key={item._id} item={item} {...rowProps(item)} />
          ))}
        </ul>
      )}
    </section>
  );
}

// Remember the last opened tab on this device (best effort).
const TAB_KEY = 'bajarang.purchaseTab';
function readTab() {
  try {
    return localStorage.getItem(TAB_KEY) || '';
  } catch {
    return '';
  }
}
function writeTab(id) {
  try {
    localStorage.setItem(TAB_KEY, id);
  } catch {
    /* ignore */
  }
}

function QuickAdd({ source, onAdd, autoFocus = false }) {
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
    <form onSubmit={submit} className="flex gap-2 border-b border-line px-4 py-2.5">
      <input
        ref={inputRef}
        autoFocus={autoFocus}
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
  const { sources, items, status, error, refresh, putItem, dropItem, putSource } = usePurchaseList();
  const { operator } = useSettings();
  const toast = useToast();
  const [editingId, setEditingId] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sourceModal, setSourceModal] = useState(null);
  const [tabId, setTabId] = useState(readTab);
  const selectTab = (id) => {
    setTabId(id);
    writeTab(id);
  };

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
  const current = groups.find((g) => g.source._id === tabId) || groups[0];

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

  // Share the "to buy" list as plain text (WhatsApp, notes, SMS…); copy it if sharing isn't available.
  const shareList = async (source, list) => {
    const text = [`ખરીદી યાદી – ${source.name}`, '', ...list.map((i, n) => `${n + 1}. ${i.name}`)].join('\n');
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // user closed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('યાદી કૉપી થઈ. હવે ગમે ત્યાં પેસ્ટ કરો.');
    } catch {
      toast.error('યાદી મોકલી શકાઈ નહીં.');
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

  // Inline edit ✓: save the name and put the item back in "to buy".
  const saveItem = async (item, name) => {
    if (!name) {
      toast.error('વસ્તુનું નામ લખો.');
      return false;
    }
    try {
      if (name !== item.name || !item.needed) {
        putItem(await purchaseApi.updateItem(item._id, { name, needed: true, updatedBy: operator }));
      }
      setEditingId(null);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const deleteItem = async () => {
    const item = confirmItem;
    setDeleting(true);
    try {
      await purchaseApi.deleteItem(item._id);
      dropItem(item._id);
      setEditingId(null);
      setConfirmItem(null);
      toast.success(`${item.name} કાઢી નાખી`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const rowProps = (item) => ({
    editing: item._id === editingId,
    onSetNeeded: setNeeded,
    onEdit: (it) => setEditingId(it._id),
    onCancelEdit: () => setEditingId(null),
    onSave: saveItem,
    onDelete: setConfirmItem,
  });

  const saveSource = async (source, name) => {
    try {
      const saved = source ? await purchaseApi.renameSource(source._id, name) : await purchaseApi.createSource(name);
      putSource(saved);
      if (!source) selectTab(saved._id);
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

      {status === 'loading' && (
        <div className="flex flex-col gap-3">
          <ChipsSkeleton count={4} />
          <RowsSkeleton rows={6} label="ખરીદી યાદી લોડ થઈ રહી છે" />
        </div>
      )}
      {status === 'error' && <ErrorState message={error?.message} onRetry={refresh} />}
      {status === 'ready' && error && (
        <p className="mb-3 rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn" role="status">
          {error.message} દેખાતી યાદી જૂની હોઈ શકે છે.{' '}
          <button type="button" onClick={refresh} className="font-semibold underline">
            ફરી પ્રયાસ કરો
          </button>
        </p>
      )}

      {status === 'ready' && !current && (
        <p className="py-8 text-center text-[14px] text-muted">હજી કોઈ જગ્યા નથી. ઉપર “જગ્યા ઉમેરો” દબાવો.</p>
      )}

      {status === 'ready' && current && (
        <div className="flex flex-col gap-3">
          <SourceTabs
            groups={groups}
            selectedId={current.source._id}
            onSelect={(id) => {
              setEditingId(null);
              selectTab(id);
            }}
          />
          <SourcePanel key={current.source._id} group={current} rowProps={rowProps} onRename={setSourceModal} onAdd={addItem} onShare={shareList} />
        </div>
      )}

      <SourceModal source={sourceModal} onClose={() => setSourceModal(null)} onSave={saveSource} />
      <ConfirmDialog
        open={Boolean(confirmItem)}
        onClose={() => !deleting && setConfirmItem(null)}
        onConfirm={deleteItem}
        loading={deleting}
        danger
        title="વસ્તુ કાઢી નાખવી છે?"
        message={`“${confirmItem?.name}” ખરીદી યાદીમાંથી હંમેશ માટે કાઢી નાખવામાં આવશે.`}
        confirmLabel="કાઢી નાખો"
      />
    </>
  );
}
