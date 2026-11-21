import { useCallback, useState } from 'react';
import { productApi } from '../services/api';
import { useShopData } from '../context/ShopDataContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

/** Toggle a product in/out of stock, with an "undo" action in the toast. */
export function useAvailabilityToggle() {
  const { upsertProduct } = useShopData();
  const { operator } = useSettings();
  const toast = useToast();
  const [pendingId, setPendingId] = useState(null);

  const setAvailability = useCallback(
    async (product, isAvailable, { silent } = {}) => {
      setPendingId(product._id);
      try {
        const updated = await productApi.setAvailability(product._id, isAvailable, operator);
        upsertProduct(updated);
        if (!silent) {
          toast.success(isAvailable ? `${product.nameGujarati} ફરી સ્ટોકમાં` : `${product.nameGujarati} સ્ટોક બહાર કરી`, {
            action: { label: 'પાછું કરો', onClick: () => setAvailability(updated, !isAvailable, { silent: true }) },
          });
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setPendingId(null);
      }
    },
    [operator, toast, upsertProduct]
  );

  return { setAvailability, pendingId };
}
