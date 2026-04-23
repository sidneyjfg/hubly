export type WhatsAppProvider = "evolution";

export type IntegrationSummary = {
  id: "whatsapp";
  provider: WhatsAppProvider;
  enabled: boolean;
  phoneNumber?: string | null;
  status?: string | null;
};

export type WhatsAppConnectionStatus = {
  phoneNumber?: string | null;
  state: string;
};

export type WhatsAppConnectCode = {
  pairingCode?: string;
  code?: string;
  count?: number;
};

export type WhatsAppSessionStartInput = {
  phoneNumber: string;
};

export type WhatsAppSessionConnectResult = {
  state: string;
  phoneNumber: string;
  pairingCode?: string;
  code?: string;
  count?: number;
};

export type WhatsAppDisconnectResult = {
  state: string;
};

export type WhatsAppTextMessageInput = {
  number: string;
  text: string;
};

export type WhatsAppTextMessageResult = {
  key?: {
    remoteJid?: string;
    fromMe?: boolean;
    id?: string;
  };
  message?: Record<string, unknown>;
  messageTimestamp?: string;
  status?: string;
};

export type WhatsAppInstanceCreateResult = {
  instance?: {
    instanceName?: string;
    instanceId?: string;
    status?: string;
  };
  hash?: {
    apikey?: string;
  };
  settings?: Record<string, unknown>;
};
