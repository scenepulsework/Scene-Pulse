import { createContext, useCallback, useContext, useState } from "react";
import { Link } from "wouter";
import { KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "scenepulse.speakeasy.unlocked";

export const SECRET_PATTERN = /speakeas|password|secret|knock|sesame|hidden door/;

type SpeakeasyContextValue = {
  unlocked: boolean;
  unlock: (opts?: { celebrate?: boolean }) => void;
};

const SpeakeasyContext = createContext<SpeakeasyContextValue>({
  unlocked: false,
  unlock: () => {},
});

export function useSpeakeasy() {
  return useContext(SpeakeasyContext);
}

export function SpeakeasyProvider({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [revealOpen, setRevealOpen] = useState(false);

  const unlock = useCallback(
    (opts?: { celebrate?: boolean }) => {
      if (!unlocked && opts?.celebrate) setRevealOpen(true);
      setUnlocked(true);
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // localStorage unavailable — unlock still applies for this session
      }
    },
    [unlocked],
  );

  return (
    <SpeakeasyContext.Provider value={{ unlocked, unlock }}>
      {children}
      <Dialog open={revealOpen} onOpenChange={setRevealOpen}>
        <DialogContent
          className="border-secondary/40 bg-background/95 backdrop-blur max-w-md"
          data-testid="speakeasy-reveal-dialog"
        >
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-secondary/40 bg-secondary/10">
              <KeyRound className="h-6 w-6 text-secondary" />
            </div>
            <DialogTitle className="text-center text-2xl font-black uppercase tracking-tighter">
              You found the door.
            </DialogTitle>
            <DialogDescription className="text-center font-mono text-sm leading-relaxed">
              Every city keeps a few rooms off the map. The Speakeasy Files are
              open to you now — hidden doors and password bars across all 13
              markets.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              asChild
              className="w-full bg-secondary text-secondary-foreground hover:opacity-90 font-mono"
              data-testid="button-enter-files"
              onClick={() => setRevealOpen(false)}
            >
              <Link href="/speakeasies">Enter the files</Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full font-mono text-muted-foreground"
              data-testid="button-keep-quiet"
              onClick={() => setRevealOpen(false)}
            >
              Keep it quiet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SpeakeasyContext.Provider>
  );
}
