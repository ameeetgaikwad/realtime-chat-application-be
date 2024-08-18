import { Socket, Server } from "socket.io";
import { db } from "./drizzle/db";
import { users, conversations, messages, typing } from "./drizzle/schema";
import { eq, and, or, desc, lt, ne, asc, inArray, sql } from "drizzle-orm";

export const setupSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("A user connected");
    let USER_ID: number;
    socket.on(
      "join",
      async (email: string, firstName: string, lastName: string) => {
        console.log("join", email);
        try {
          const existingUsers = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
          let user;

          if (existingUsers.length === 0) {
            const newUsers = await db
              .insert(users)
              .values({
                email,
                isOnline: true,
                firstName: firstName,
                lastName: lastName,
              })
              .returning();
            user = newUsers[0];
          } else {
            user = existingUsers[0];
            await db
              .update(users)
              .set({ isOnline: true })
              .where(eq(users.id, user.id));
          }

          io.emit("userOnline", true, user.id);

          USER_ID = user.id;
          console.log("user id", user.id);
          socket.emit("joined", user);

          const userConversations = await getUserConversations(user.id);
          socket.emit("conversationList", userConversations);
          console.log("fetching users");
          // Fetch all users except the current user
          const allUsers = await db.select().from(users);

          io.emit("userList", allUsers);
        } catch (error) {
          console.error("Error joining:", error);
        }
      }
    );

    socket.on("getConversation", async (conversationId: number) => {
      try {
        console.log("getConversation", conversationId);
        const recentMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversationId))
          .orderBy(desc(messages.createdAt))
          .limit(20);
        socket.emit("conversationReady", conversationId, recentMessages);
      } catch (error) {
        console.error("Error getting conversation:", error);
      }
    });

    socket.on("getLatestMessages", async (userId: number) => {
      try {
        const userConversations = await getUserConversations(userId);
        const recentMessagesPromises = userConversations.map(
          async (conversation) => {
            const recentMessages = await db
              .select()
              .from(messages)
              .where(eq(messages.conversationId, conversation.id))
              .orderBy(desc(messages.createdAt))
              .limit(1);

            return {
              conversationId: conversation.id,
              recentMessage: recentMessages[0],
            };
          }
        );
        const resolvedRecentMessages = await Promise.all(
          recentMessagesPromises
        );

        io.emit("recentMessages", resolvedRecentMessages);
      } catch (error) {
        console.error("Error getting all conversations:", error);
      }
    });

    socket.on(
      "getOrCreateConversation",
      async (otherUserId: number, userId: number) => {
        try {
          let conversation;

          const existingConversations = await db
            .select()
            .from(conversations)
            .where(
              or(
                and(
                  eq(conversations.user1Id, userId),
                  eq(conversations.user2Id, otherUserId)
                ),
                and(
                  eq(conversations.user1Id, otherUserId),
                  eq(conversations.user2Id, userId)
                )
              )
            );

          if (existingConversations.length === 0) {
            const newConversations = await db
              .insert(conversations)
              .values({ user1Id: userId, user2Id: otherUserId })
              .returning();
            conversation = newConversations[0];
          } else {
            conversation = existingConversations[0];
          }

          const recentMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conversation.id))
            .orderBy(asc(messages.createdAt))
            .limit(20);
          let conversationId = conversation.id;
          socket.emit("conversationReady", { conversationId, recentMessages });
        } catch (error) {
          console.error("Error getting or creating conversation:", error);
        }
      }
    );

    socket.on(
      "message",
      async (
        content: string,
        conversationId: number,
        senderId: number,
        mediaUrl?: string,
        mediaType?: string
      ) => {
        try {
          const message = await db
            .insert(messages)
            .values({
              senderId,
              conversationId,
              content,
              isRead: false,
              mediaUrl,
              mediaType,
            })
            .returning();
          socket.emit("messageSent", message[0]);
          await db
            .update(conversations)
            .set({ lastMessageAt: new Date() })
            .where(eq(conversations.id, conversationId));

          const conversation = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, conversationId));

          if (conversation.length > 0) {
            const recipientId =
              conversation[0].user1Id === senderId
                ? conversation[0].user2Id
                : conversation[0].user1Id;
            console.log(recipientId.toString(), "messange sent to this");
            io.emit(recipientId.toString(), message[0]);

            // Emit an event for unread message count
            // const unreadCount = await getUnreadMessageCount(
            //   conversationId,
            //   recipientId
            // );
            // io.emit("unreadMessageCount", {
            //   conversationId,
            //   count: unreadCount,
            // });

            const senderConversations = await getUserConversations(senderId);
            const recipientConversations = await getUserConversations(
              recipientId
            );
            socket.emit("conversationListUpdate", senderConversations);
            socket
              .to(recipientId.toString())
              .emit("conversationListUpdate", recipientConversations);
          }
        } catch (error) {
          console.error("Error sending message:", error);
        }
      }
    );

    socket.on(
      "loadMoreMessages",
      async (conversationId: number, limit: number) => {
        try {
          const moreMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conversationId))
            .orderBy(desc(messages.createdAt))
            .limit(limit);
          console.log("more messages", moreMessages);
          socket.emit("moreMessages", {
            conversationId,
            messages: moreMessages,
          });
        } catch (error) {
          console.error("Error loading more messages:", error);
        }
      }
    );

    socket.on(
      "typing",
      async (isTyping: boolean, conversationId: number, userId: number) => {
        try {
          io.emit("userTyping", isTyping, conversationId, userId);
        } catch (error) {
          console.error("Error handling typing event:", error);
        }
      }
    );

    socket.on("readMessages", async (messageId: number) => {
      try {
        const message = await db
          .update(messages)
          .set({ isRead: true })
          .where(eq(messages.id, messageId))
          .returning();

        socket.emit("messagesRead", messageId, message[0].conversationId);

        // Update unread count for the reader
        // const unreadCount = await getUnreadMessageCount(
        //   conversationId,
        //   socket.data.userId
        // );
        // socket.emit("unreadMessageCount", {
        //   conversationId,
        //   count: unreadCount,
        // });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // socket.on(
    //   "loadMoreMessages",
    //   async (conversationId: number, lastMessageId: number, limit: number) => {
    //     try {
    //       const moreMessages = await db
    //         .select()
    //         .from(messages)
    //         .where(
    //           and(
    //             eq(messages.conversationId, conversationId),
    //             messages.id.lt(lastMessageId)
    //           )
    //         )
    //         .orderBy(desc(messages.createdAt))
    //         .limit(limit);

    //       socket.emit("moreMessages", {
    //         conversationId,
    //         messages: moreMessages,
    //       });
    //     } catch (error) {
    //       console.error("Error loading more messages:", error);
    //     }
    //   }
    // );

    socket.on("disconnect", async () => {
      try {
        console.log(USER_ID, "disconnected");
        if (USER_ID) {
          await db
            .update(users)
            .set({ isOnline: false, lastSeen: new Date() })
            .where(eq(users.id, USER_ID));
          io.emit("userOnline", false, USER_ID);
        }
      } catch (error) {
        console.error("Error updating user status on disconnect:", error);
      }
    });
  });
};

async function getUserConversations(userId: number) {
  return db
    .select()
    .from(conversations)
    .where(
      or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId))
    )
    .orderBy(desc(conversations.lastMessageAt));
}

async function getUnreadMessageCount(conversationId: number, userId: number) {
  const result = await db
    .select({ count: sql`count(*)` })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false),
        ne(messages.senderId, userId)
      )
    );
  return Number(result[0].count);
}
