import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface SettingsModalProps {
  open: boolean;
  onClose: (saved: boolean) => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [newsapiKey, setNewsapiKey] = useState('');
  const [serpapiKey, setSerpapiKey] = useState('');

  useEffect(() => {
    if (open) {
      setNewsapiKey(localStorage.getItem('newsapi_key') || '');
      setSerpapiKey(localStorage.getItem('serpapi_key') || '');
    }
  }, [open]);

  const handleSave = () => {
    if (newsapiKey.trim()) localStorage.setItem('newsapi_key', newsapiKey.trim());
    else localStorage.removeItem('newsapi_key');
    if (serpapiKey.trim()) localStorage.setItem('serpapi_key', serpapiKey.trim());
    else localStorage.removeItem('serpapi_key');
    onClose(true);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Configuration</DialogTitle>
          <DialogDescription>
            Enter your API keys to fetch data. GDELT requires no key.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newsapi">NewsAPI Key</Label>
            <Input
              id="newsapi"
              type="password"
              placeholder="Paste your NewsAPI key"
              value={newsapiKey}
              onChange={(e) => setNewsapiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get one at{' '}
              <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                newsapi.org
              </a>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serpapi">SerpAPI Key</Label>
            <Input
              id="serpapi"
              type="password"
              placeholder="Paste your SerpAPI key"
              value={serpapiKey}
              onChange={(e) => setSerpapiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get one at{' '}
              <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                serpapi.com
              </a>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save & Fetch</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
