import { createContext, useContext } from "react";

export const SECRET_PATTERN = /speakeas|password|secret|knock|sesame|hidden door/;

type SpeakeasyContextValue = {
  unlocked: boolean;
  unlock: (opts?: { celebrate?: boolean }) => void;
};

const SpeakeasyContext = createContext<SpeakeasyContextValue>({
  unlocked: true,
  unlock: () => {},
});

export function useSpeakeasy() {
  return useContext(SpeakeasyContext);
}

export function SpeakeasyProvider({ children }: { children: React.ReactNode }) {
  return (
    <SpeakeasyContext.Provider value={{ unlocked: true, unlock: () => {} }}>
      {children}
    </SpeakeasyContext.Provider>
  );
}
