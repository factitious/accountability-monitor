import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SettingsModalProps {
  open: boolean;
  onClose: (saved: boolean) => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>About</DialogTitle>
          <DialogDescription>
            API keys are configured server-side as Supabase secrets. GDELT requires no key.
            To update keys, run:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <pre className="rounded bg-muted px-3 py-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
            supabase secrets set NEWSAPI_KEY=your_key{'\n'}
            supabase secrets set SERPAPI_KEY=your_key
          </pre>
        </div>
        <DialogFooter>
          <Button onClick={() => onClose(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
