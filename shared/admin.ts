export type PageInfo = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ServiceUsage = {
  apiCalls: number;
  mailboxesCreated: number;
  emailsReceived: number;
  keysCreated: number;
};

export type ServiceDay = ServiceUsage & {
  date: string;
  registrations: number;
  sent: number;
  failed: number;
  pending: number;
};

export type ServiceQuota = {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: number;
};

export type AdminOverview = {
  generatedAt: number;
  today: string;
  statisticsDelaySeconds: number;
  logDelaySeconds: number;
  users: {
    total: number;
    admins: number;
    banned: number;
    verified: number;
    registeredToday: number;
    registered7Days: number;
    registered30Days: number;
    active30Days: number;
  };
  mailboxes: {
    total: number;
    active: number;
    activeOwned: number;
    activeAnonymous: number;
    expired: number;
  };
  keys: { total: number; active: number; disabled: number; expired: number };
  retainedEmails: number;
  totals: ServiceUsage;
  days: ServiceDay[];
  outgoing: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    senders: number;
    channels: {
      channel: string;
      total: number;
      sent: number;
      failed: number;
      pending: number;
    }[];
  };
  apiLogs: {
    total: number;
    successful: number;
    clientErrors: number;
    serverErrors: number;
    users: number;
    averageDurationMs: number | null;
    routes: { method: string; route: string; total: number; errors: number }[];
  };
  domains: { domain: string; total: number; active: number }[];
  topUsers: {
    id: string;
    name: string;
    email: string;
    apiCalls: number;
    mailboxesCreated: number;
    emailsReceived: number;
  }[];
  recoveries: { action: string; status: string; count: number }[];
  quotas: { http: ServiceQuota; inbound: ServiceQuota; outbound: ServiceQuota };
  services: {
    version: string;
    openApi: boolean;
    outbound: boolean;
    sendChannel: string;
    turnstile: boolean;
  };
};
