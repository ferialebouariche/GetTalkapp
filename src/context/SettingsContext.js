import  React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "gettalk_settings_v1";

const DEFAULTS = {
  cameraGuidance: true,
  lightingWarning: true,
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  // Load once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings({ ...DEFAULTS, ...parsed });
        } else {
          setSettings(DEFAULTS);
        }
      } catch (e) {
        // If storage fails, don't hold the app hostage
        setSettings(DEFAULTS);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setSetting = async (key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      // Save in background (best effort)
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const value = useMemo(
    () => ({ settings, setSetting, loaded }),
    [settings, loaded]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside <SettingsProvider>");
  }
  return ctx;
}
