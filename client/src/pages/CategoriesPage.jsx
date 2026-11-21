import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Tags, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { TextField } from '../components/ui/Field';
import { PageLoader, ErrorState, EmptyState } from '../components/ui/States';
import { categoryApi } from '../services/api';
import { useShopData } from '../context/ShopDataContext';
import { useToast } from '../context/ToastContext';

function CategoryFormModal({ category, open, onClose }) {
  const { upsertCategory, removeCategory } = useShopData();
  const toast = useToast();
  const [form, setForm] = useState({ nameGujarati: '', nameEnglish: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lastOpenKey, setLastOpenKey] = useState(null);

  // Reset the form each time the modal opens for a different category.
  const openKey = open ? category?._id || 'new' : null;
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    setForm({ nameGujarati: category?.nameGujarati || '', nameEnglish: category?.nameEnglish || '' });
    setErrors({});
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nameGujarati.trim()) {
      setErrors({ nameGujarati: 'કેટેગરીનું ગુજરાતી નામ લખો.' });
      return;
    }
    setSaving(true);
    try {
      const saved = category ? await categoryApi.update(category._id, form) : await categoryApi.create(form);
      upsertCategory(saved);
      toast.success(category ? 'કેટેગરી અપડેટ થઈ' : `${saved.nameGujarati} કેટેગરી ઉમેરાઈ`);
      onClose();
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      else toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    try {
      await categoryApi.remove(category._id);
      removeCategory(category._id);
      toast.success('કેટેગરી કાઢી નાખી');
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      toast.error(err.message);
      setConfirmDelete(false);
    }
  };

  const canDelete = category && category.productCount === 0;

  return (
    <>
      <Modal
        open={open && !confirmDelete}
        onClose={onClose}
        title={category ? 'કેટેગરીમાં ફેરફાર' : 'કેટેગરી ઉમેરો'}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              રદ કરો
            </Button>
            <Button type="submit" form="category-form" className="flex-1" loading={saving}>
              સાચવો
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <TextField
            label="કેટેગરીનું નામ (ગુજરાતી)"
            value={form.nameGujarati}
            onChange={(e) => {
              setForm((f) => ({ ...f, nameGujarati: e.target.value }));
              setErrors({});
            }}
            error={errors.nameGujarati}
            placeholder="જેમ કે: શાકભાજી"
            maxLength={60}
            autoFocus
          />
          <TextField
            label="અંગ્રેજી નામ"
            optional
            value={form.nameEnglish}
            onChange={(e) => setForm((f) => ({ ...f, nameEnglish: e.target.value }))}
            placeholder="Vegetables"
            maxLength={60}
          />
          {category && (
            <div className="border-t border-line pt-4">
              {canDelete ? (
                <Button variant="danger-outline" size="sm" icon={Trash2} onClick={() => setConfirmDelete(true)}>
                  કેટેગરી કાઢી નાખો
                </Button>
              ) : (
                <p className="text-[13px] text-muted">
                  આ કેટેગરીમાં {category.productCount} વસ્તુ છે, તેથી કાઢી શકાય નહીં. જરૂર ન હોય તો યાદીમાંથી “બંધ” કરો.
                </p>
              )}
            </div>
          )}
        </form>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={doDelete}
        danger
        title="કેટેગરી કાઢી નાખવી છે?"
        message={`“${category?.nameGujarati}” કેટેગરી કાઢી નાખવામાં આવશે.`}
        confirmLabel="કાઢી નાખો"
      />
    </>
  );
}

export default function CategoriesPage() {
  const { categories, status, error, refresh, upsertCategory } = useShopData();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // category object, 'new', or null
  const [pendingId, setPendingId] = useState(null);

  const toggleActive = async (category, isActive) => {
    setPendingId(category._id);
    try {
      const saved = await categoryApi.setStatus(category._id, isActive);
      upsertCategory(saved);
      toast.success(isActive ? `${saved.nameGujarati} ચાલુ કરી` : `${saved.nameGujarati} બંધ કરી`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="કેટેગરી"
        subtitle="બંધ કરેલી કેટેગરી નવી વસ્તુ ઉમેરતી વખતે દેખાશે નહીં."
        actions={
          <Button icon={Plus} onClick={() => setEditing('new')}>
            ઉમેરો
          </Button>
        }
      />

      {status === 'loading' && <PageLoader label="કેટેગરી લોડ થઈ રહી છે…" />}
      {status === 'error' && <ErrorState message={error?.message} onRetry={() => refresh().catch(() => {})} />}
      {status === 'ready' && categories.length === 0 && (
        <EmptyState
          icon={Tags}
          title="હજી કોઈ કેટેગરી નથી"
          message="શાકભાજી, કરિયાણા જેવી કેટેગરી ઉમેરો."
          action={<Button icon={Plus} onClick={() => setEditing('new')}>કેટેગરી ઉમેરો</Button>}
        />
      )}

      {status === 'ready' && categories.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          {categories.map((c) => (
            <li key={c._id} className={`flex items-center gap-3 px-4 py-3 ${c.isActive ? '' : 'bg-surface-2/60'}`}>
              <Link to={`/products?category=${c._id}`} className="min-w-0 flex-1">
                <p className={`text-[16px] font-semibold ${c.isActive ? '' : 'text-muted'}`}>
                  {c.nameGujarati}
                  {!c.isActive && (
                    <span className="ml-2 rounded bg-surface-2 px-1.5 py-px text-[12px] font-medium text-muted ring-1 ring-line">બંધ</span>
                  )}
                </p>
                <p className="text-[13px] text-muted">
                  {c.nameEnglish && <span>{c.nameEnglish} · </span>}
                  <span className="num">{c.productCount}</span> વસ્તુ
                </p>
              </Link>
              <Toggle
                size="sm"
                checked={c.isActive}
                disabled={pendingId === c._id}
                onChange={(v) => toggleActive(c, v)}
                label={c.isActive ? `${c.nameGujarati} બંધ કરો` : `${c.nameGujarati} ચાલુ કરો`}
              />
              <button
                type="button"
                onClick={() => setEditing(c)}
                className="ml-1 flex size-10 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
                aria-label={`${c.nameGujarati}માં ફેરફાર`}
              >
                <Pencil className="size-[18px]" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <CategoryFormModal
        open={Boolean(editing)}
        category={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
