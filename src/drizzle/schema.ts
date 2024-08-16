import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  isOnline: boolean("is_online").default(false).notNull(),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id")
    .references(() => users.id)
    .notNull(),
  user2Id: integer("user2_id")
    .references(() => users.id)
    .notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .references(() => users.id)
    .notNull(),
  conversationId: integer("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  mediaUrl: text("media_url"),
  mediaType: varchar("media_type", { length: 50 }),
});

export const typing = pgTable("typing", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  conversationId: integer("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  isTyping: boolean("is_typing").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
