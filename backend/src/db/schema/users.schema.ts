import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { authProviderEnum, userRoleEnum } from './enums';

// Mã mời = users.id (uuid). Auth tự viết — §11.
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email'),
    phone: text('phone'),
    passwordHash: text('password_hash'), // nullable — user GOOGLE không có
    authProvider: authProviderEnum('auth_provider').notNull().default('LOCAL'),
    googleSub: text('google_sub'),
    username: text('username'), // handle duy nhất — dùng làm mã mời (thay UUID)
    displayName: text('display_name').notNull(),
    fandom: text('fandom'),
    avatarUrl: text('avatar_url'),
    role: userRoleEnum('role').notNull().default('USER'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    signupIp: text('signup_ip'),
    deviceFingerprint: text('device_fingerprint'),
    isFlagged: boolean('is_flagged').notNull().default(false), // gian lận / Gold âm
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_uq').on(t.email),
    phoneIdx: uniqueIndex('users_phone_uq').on(t.phone),
    googleSubIdx: uniqueIndex('users_google_sub_uq').on(t.googleSub),
    usernameIdx: uniqueIndex('users_username_uq').on(t.username),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
