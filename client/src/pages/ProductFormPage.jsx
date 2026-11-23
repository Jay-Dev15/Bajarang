import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Modal';
import { TextField, PriceField, SelectField } from '../components/ui/Field';
import { ErrorState } from '../components/ui/States';
import { FormSkeleton } from '../components/ui/Skeleton';
import { productApi } from '../services/api';
import { useShopData } from '../context/ShopDataContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { PRICE_FIELDS, WEIGHT_PRICES, PIECE_PRICE } from '../utils/constants';
import { applyWeightAutofill, autoFilledKeys } from '../utils/priceAutofill';
import { normalize } from '../utils/products';
import { toInput, formatDateTime } from '../utils/format';

const PRICE_KEYS = ['purchasePricePerKg', ...PRICE_FIELDS.map((f) => f.key)];
const AT_LEAST_ONE_PRICE = 'ઓછામાં ઓછો એક વેચાણ ભાવ લખો (ગ્રામ, કિલો કે નંગ).';
const AT_LEAST_ONE_VISIBLE = 'ઓછામાં ઓછો એક ભાવ ભાવ યાદીમાં બતાવવો જરૂરી છે.';

const EMPTY = {
  nameGujarati: '',
  nameEnglish: '',
  categoryId: '',
  ...Object.fromEntries(PRICE_KEYS.map((k) => [k, ''])),
  hiddenPrices: [],
  isAvailable: true,
};

const fromProduct = (p) => ({
  nameGujarati: p.nameGujarati,
  nameEnglish: p.nameEnglish || '',
  categoryId: p.categoryId || '',
  ...Object.fromEntries(PRICE_KEYS.map((k) => [k, toInput(p[k])])),
  hiddenPrices: p.hiddenPrices || [],
  isAvailable: p.isAvailable,
});

const num = (v) => (v === '' ? null : Number(v));

/** Gentle, non-blocking checks that catch common typing mistakes. */
function priceWarnings(f) {
  const w = [];
  const set = WEIGHT_PRICES.filter((x) => f[x.key] !== '');
  for (let i = 1; i < set.length; i++) {
    if (num(f[set[i - 1].key]) > num(f[set[i].key])) {
      w.push(`${set[i - 1].label}નો ભાવ ${set[i].label} કરતાં વધારે છે.`);
    }
  }
  const buy = num(f.purchasePricePerKg);
  const kg = num(f.sellingPrice1kg);
  if (buy !== null && kg !== null && kg < buy) w.push('1 કિલોનો વેચાણ ભાવ ખરીદ ભાવ કરતાં ઓછો છે.');
  return w;
}

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { products, categories, upsertProduct, removeProduct } = useShopData();
  const settings = useSettings();

  const [form, setForm] = useState(() => ({ ...EMPTY, nameGujarati: searchParams.get('name') || '' }));
  // Weight fields the user typed into (see utils/priceAutofill.js).
  const [manualOrder, setManualOrder] = useState([]);
  const [original, setOriginal] = useState(null);
  const [loadState, setLoadState] = useState(isEdit ? 'loading' : 'ready');
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // True once the user changes anything, so a late server copy never wipes their typing.
  const touched = useRef(false);

  // Open instantly from the copy already in the list, then load the latest copy
  // from the server and use it if the user hasn't started editing yet.
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    const apply = (p) => {
      setOriginal(p);
      setForm(fromProduct(p));
      // Saved weight prices are treated as typed by hand, so editing one never
      // overwrites another saved price (keeps discounts). Empty weights still auto-fill.
      setManualOrder(WEIGHT_PRICES.filter((w) => p[w.key] !== null && p[w.key] !== undefined).map((w) => w.key));
      setLoadState('ready');
    };
    const listCopy = products.find((p) => p._id === id);
    if (listCopy) apply(listCopy);
    productApi
      .get(id)
      .then((p) => {
        if (cancelled) return;
        if (!touched.current) apply(p);
        else setOriginal(p);
      })
      .catch((err) => {
        if (cancelled || listCopy) return; // the list copy is still usable
        setLoadError(err);
        setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
    // Only on open: later list refreshes must not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const set = (key) => (value) => {
    touched.current = true;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key] || errors.sellingPrices) setErrors((e) => ({ ...e, [key]: undefined, sellingPrices: undefined }));
  };

  const setWeight = (key) => (value) => {
    touched.current = true;
    const order = manualOrder.includes(key) ? manualOrder : [...manualOrder, key];
    setManualOrder(order);
    setForm((f) => applyWeightAutofill({ ...f, [key]: value }, order));
    if (errors[key] || errors.sellingPrices) setErrors((e) => ({ ...e, [key]: undefined, sellingPrices: undefined }));
  };
  const autoKeys = autoFilledKeys(form, manualOrder);

  // Show / hide a price in the price list (the value stays saved).
  const isHidden = (key) => form.hiddenPrices.includes(key);
  const toggleHidden = (key) => {
    touched.current = true;
    setForm((f) => ({
      ...f,
      hiddenPrices: f.hiddenPrices.includes(key) ? f.hiddenPrices.filter((k) => k !== key) : [...f.hiddenPrices, key],
    }));
    if (errors.sellingPrices) setErrors((e) => ({ ...e, sellingPrices: undefined }));
  };
  const filledPrices = PRICE_FIELDS.filter(({ key }) => form[key] !== '');

  const duplicate = useMemo(() => {
    const name = normalize(form.nameGujarati);
    if (!name) return null;
    return products.find((p) => p._id !== id && normalize(p.nameGujarati) === name) || null;
  }, [form.nameGujarati, products, id]);

  const warnings = priceWarnings(form);

  // Active categories, plus the product's current one even if it was deactivated.
  const categoryOptions = categories.filter((c) => c.isActive || c._id === form.categoryId);

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/products'));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nameGujarati.trim()) {
      setErrors({ nameGujarati: 'વસ્તુનું ગુજરાતી નામ લખો.' });
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    const noneVisible = filledPrices.length > 0 && filledPrices.every(({ key }) => isHidden(key));
    if (filledPrices.length === 0 || noneVisible) {
      setErrors({ sellingPrices: noneVisible ? AT_LEAST_ONE_VISIBLE : AT_LEAST_ONE_PRICE });
      document.getElementById('selling-prices')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      categoryId: form.categoryId || null,
      ...Object.fromEntries(PRICE_KEYS.map((k) => [k, num(form[k])])),
      hiddenPrices: form.hiddenPrices.filter((k) => form[k] !== ''),
      updatedBy: settings.operator || '',
    };
    try {
      if (isEdit) {
        const { product, priceHistoryRecorded } = await productApi.update(id, payload);
        upsertProduct(product);
        toast.success(priceHistoryRecorded ? `${product.nameGujarati}ના ભાવ અપડેટ થયા` : `${product.nameGujarati} અપડેટ થઈ`);
      } else {
        const product = await productApi.create(payload);
        upsertProduct(product);
        toast.success(`${product.nameGujarati} ઉમેરાઈ ગઈ`);
      }
      goBack();
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await productApi.remove(id);
      removeProduct(id);
      toast.success(`${original.nameGujarati} કાઢી નાખી`);
      navigate('/products', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const title = isEdit ? 'વસ્તુમાં ફેરફાર કરો' : 'નવી વસ્તુ ઉમેરો';

  if (loadState === 'loading') {
    return (
      <>
        <PageHeader title={title} back="/products" />
        <FormSkeleton />
      </>
    );
  }
  if (loadState === 'error') {
    return (
      <>
        <PageHeader title={title} back="/products" />
        <ErrorState message={loadError?.message} onRetry={() => window.location.reload()} />
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={original ? `છેલ્લે અપડેટ: ${formatDateTime(original.updatedAt)}${original.lastUpdatedBy ? ` · ${original.lastUpdatedBy}` : ''}` : undefined}
        back="/products"
        actions={
          isEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmDelete(true)}
              aria-label="વસ્તુ કાઢી નાખો"
              title="વસ્તુ કાઢી નાખો"
              className="!text-danger hover:!bg-danger-soft"
            >
              <Trash2 className="size-5" />
            </Button>
          )
        }
      />

      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <TextField
            label="વસ્તુનું નામ (ગુજરાતી)"
            value={form.nameGujarati}
            onChange={(e) => set('nameGujarati')(e.target.value)}
            error={errors.nameGujarati}
            placeholder="જેમ કે: ટામેટાં"
            maxLength={80}
            enterKeyHint="next"
            autoFocus={!isEdit && !form.nameGujarati}
          />
          {duplicate && (
            <p className="-mt-2 flex items-start gap-2 rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                “{duplicate.nameGujarati}” પહેલેથી યાદીમાં છે.{' '}
                <Link to={`/products/${duplicate._id}/edit`} replace className="font-semibold underline">
                  તેમાં ફેરફાર કરો
                </Link>
              </span>
            </p>
          )}
          <SelectField
            label="કેટેગરી"
            value={form.categoryId}
            onChange={(e) => set('categoryId')(e.target.value)}
            error={errors.categoryId}
          >
            <option value="">કેટેગરી પસંદ કરો</option>
            {categoryOptions.map((c) => (
              <option key={c._id} value={c._id}>
                {c.nameGujarati}
                {c.isActive ? '' : ' (બંધ)'}
              </option>
            ))}
          </SelectField>
        </section>

        <section id="selling-prices" className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <h2 className="text-[16px] font-semibold">વેચાણ ભાવ (વજન પ્રમાણે)</h2>
          <p className="mb-3 text-[13px] text-muted">
            એક ભાવ લખશો તો તેનાથી મોટા વજનના ભાવ આપોઆપ ભરાશે. જરૂર હોય તો દરેક ભાવ જાતે બદલી શકો છો. જે ભાવની જરૂર ન હોય તે ખાલી રાખો.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {WEIGHT_PRICES.map(({ key, label }) => (
              <PriceField
                key={key}
                label={label}
                value={form[key]}
                onChange={setWeight(key)}
                error={errors[key]}
                auto={autoKeys.includes(key)}
                hidden={isHidden(key) && form[key] !== ''}
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <PriceField
              large
              label={`${PIECE_PRICE.label} (પીસ)`}
              value={form[PIECE_PRICE.key]}
              onChange={set(PIECE_PRICE.key)}
              error={errors[PIECE_PRICE.key]}
              hidden={isHidden(PIECE_PRICE.key) && form[PIECE_PRICE.key] !== ''}
            />
            <PriceField
              label="ખરીદ ભાવ (1 કિલો)"
              value={form.purchasePricePerKg}
              onChange={set('purchasePricePerKg')}
              error={errors.purchasePricePerKg}
              enterKeyHint="done"
            />
          </div>

          {filledPrices.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-[14px] font-semibold">ભાવ યાદીમાં બતાવો</p>
              <p className="mb-2.5 text-[13px] text-muted">જે ભાવ બંધ કરશો તે સચવાયેલો રહેશે, ફક્ત ભાવ યાદીમાં દેખાશે નહીં.</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="ભાવ યાદીમાં બતાવો">
                {filledPrices.map(({ key, label }) => {
                  const shown = !isHidden(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleHidden(key)}
                      aria-pressed={shown}
                      className={`flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-medium transition-colors ${
                        shown ? 'border-brand bg-brand-soft text-brand-text' : 'border-line-strong text-subtle line-through decoration-1'
                      }`}
                    >
                      {shown ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {errors.sellingPrices && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger" role="alert">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {errors.sellingPrices}
            </p>
          )}

          {warnings.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1 rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn">
              {warnings.map((w) => (
                <li key={w} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {w} ફરી તપાસો.
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-10 -mx-4 flex gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
          <Button variant="secondary" size="lg" className="flex-1" onClick={goBack}>
            રદ કરો
          </Button>
          <Button type="submit" size="lg" className="flex-[2]" loading={saving}>
            {isEdit ? 'અપડેટ કરો' : 'સાચવો'}
          </Button>
        </div>

      </form>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={doDelete}
        loading={deleting}
        danger
        title="વસ્તુ કાઢી નાખવી છે?"
        message={`“${original?.nameGujarati}” અને તેના ભાવનો ઇતિહાસ હંમેશ માટે કાઢી નાખવામાં આવશે. આ પાછું નહીં થાય.`}
        confirmLabel="કાઢી નાખો"
      />
    </div>
  );
}
