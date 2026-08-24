import React, { createContext, useContext, useState, useEffect } from "react";

interface AppContextType {
  apartmentName: string;
  setApartmentName: (name: string) => void;
  caretakerCodes: string[];
  landlordCodes: string[];
  managementCode: string;
  addCaretakerCode: (code: string) => void;
  addLandlordCode: (code: string) => void;
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "date" | "read">) => void;
  markNotificationRead: (id: string) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apartmentName, setApartmentName] = useState("Amani Apartments");
  const [caretakerCodes, setCaretakerCodes] = useState<string[]>(["344577"]);
  const [landlordCodes, setLandlordCodes] = useState<string[]>(["6747"]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted state after hydration (localStorage is browser-only).
  useEffect(() => {
    const name = localStorage.getItem("nyumba_apartment_name");
    if (name) setApartmentName(name);
    const caretaker = localStorage.getItem("nyumba_caretaker_codes");
    if (caretaker) setCaretakerCodes(JSON.parse(caretaker));
    const landlord = localStorage.getItem("nyumba_landlord_codes");
    if (landlord) setLandlordCodes(JSON.parse(landlord));
    const notifs = localStorage.getItem("nyumba_notifications");
    if (notifs) setNotifications(JSON.parse(notifs));
    setHydrated(true);
  }, []);

  const managementCode = "0404";

  useEffect(() => { if (hydrated) localStorage.setItem("nyumba_apartment_name", apartmentName); }, [apartmentName, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("nyumba_caretaker_codes", JSON.stringify(caretakerCodes)); }, [caretakerCodes, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("nyumba_landlord_codes", JSON.stringify(landlordCodes)); }, [landlordCodes, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("nyumba_notifications", JSON.stringify(notifications)); }, [notifications, hydrated]);

  const addCaretakerCode = (code: string) => {
    if (!caretakerCodes.includes(code)) setCaretakerCodes(prev => [...prev, code]);
  };
  const addLandlordCode = (code: string) => {
    if (!landlordCodes.includes(code)) setLandlordCodes(prev => [...prev, code]);
  };
  const addNotification = (n: Omit<Notification, "id" | "date" | "read">) => {
    setNotifications(prev => [{
      ...n, id: crypto.randomUUID(), date: new Date().toISOString(), read: false
    }, ...prev]);
  };
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <AppContext.Provider value={{
      apartmentName, setApartmentName,
      caretakerCodes, landlordCodes, managementCode,
      addCaretakerCode, addLandlordCode,
      notifications, addNotification, markNotificationRead,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
