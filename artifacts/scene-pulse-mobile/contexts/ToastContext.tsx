import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    (msg: string) => {
      // Cancel any in-flight animation/clear.
      if (animRef.current) animRef.current.stop();
      if (clearRef.current) clearTimeout(clearRef.current);

      setMessage(msg);
      opacity.setValue(0);

      animRef.current = Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]);
      animRef.current.start();

      // Clean up message text after the fade-out completes.
      clearRef.current = setTimeout(() => setMessage(''), 3800);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <Animated.View
          style={[styles.toast, { bottom: insets.bottom + 88, opacity }]}
          pointerEvents="none"
        >
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 200, 180, 0.18)',
    borderColor: 'rgba(0, 200, 180, 0.45)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  text: {
    color: '#e0fdf9',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
