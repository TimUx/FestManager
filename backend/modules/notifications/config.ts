import { z } from 'zod';

const channelEnabledSchema = z.object({
  enabled: z.boolean().default(false),
});

export const notificationsConfigSchema = z.object({
  events: z.object({
    orderCreated: z.object({
      email: z.boolean().default(true),
      ntfy: z.boolean().default(false),
      discord: z.boolean().default(false),
      slack: z.boolean().default(false),
      teams: z.boolean().default(false),
    }).default({}),
    orderCancelled: z.object({
      email: z.boolean().default(true),
      ntfy: z.boolean().default(false),
      discord: z.boolean().default(false),
      slack: z.boolean().default(false),
      teams: z.boolean().default(false),
    }).default({}),
    orderPaid: z.object({
      email: z.boolean().default(true),
      ntfy: z.boolean().default(false),
      discord: z.boolean().default(false),
      slack: z.boolean().default(false),
      teams: z.boolean().default(false),
    }).default({}),
    kitchenCompleted: z.object({
      email: z.boolean().default(false),
      ntfy: z.boolean().default(true),
      discord: z.boolean().default(false),
      slack: z.boolean().default(false),
      teams: z.boolean().default(false),
    }).default({}),
  }).default({}),
  smtp: channelEnabledSchema.extend({
    host: z.string().optional(),
    port: z.number().default(587),
    user: z.string().optional(),
    pass: z.string().optional(),
    from: z.string().optional(),
  }).default({ enabled: false, port: 587 }),
  emailCustomText: z.string().optional(),
  ntfy: channelEnabledSchema.extend({
    serverUrl: z.string().default('https://ntfy.sh'),
    topic: z.string().optional(),
    token: z.string().optional(),
  }).default({ enabled: false, serverUrl: 'https://ntfy.sh' }),
  discord: channelEnabledSchema.extend({
    webhookUrl: z.string().optional(),
  }).default({ enabled: false }),
  slack: channelEnabledSchema.extend({
    webhookUrl: z.string().optional(),
  }).default({ enabled: false }),
  teams: channelEnabledSchema.extend({
    webhookUrl: z.string().optional(),
  }).default({ enabled: false }),
});

export type NotificationConfig = z.infer<typeof notificationsConfigSchema>;

export const defaultNotificationConfig: NotificationConfig = {
  events: {
    orderCreated: { email: true, ntfy: false, discord: false, slack: false, teams: false },
    orderCancelled: { email: true, ntfy: false, discord: false, slack: false, teams: false },
    orderPaid: { email: false, ntfy: false, discord: false, slack: false, teams: false },
    kitchenCompleted: { email: false, ntfy: true, discord: false, slack: false, teams: false },
  },
  smtp: { enabled: false, port: 587 },
  ntfy: { enabled: false, serverUrl: 'https://ntfy.sh' },
  discord: { enabled: false },
  slack: { enabled: false },
  teams: { enabled: false },
};

export type NotificationEventType =
  | 'orderCreated'
  | 'orderCancelled'
  | 'orderPaid'
  | 'kitchenCompleted';

export type NotificationChannelId = 'email' | 'ntfy' | 'discord' | 'slack' | 'teams';
