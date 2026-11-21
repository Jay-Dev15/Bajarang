import { MapPinOff } from 'lucide-react';
import { EmptyState } from '../components/ui/States';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={MapPinOff}
      title="આ પેજ મળ્યું નથી"
      message="લિંક ખોટી હોઈ શકે છે."
      action={<Button to="/">મુખ્ય પેજ પર જાઓ</Button>}
    />
  );
}
