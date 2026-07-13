import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { commentsTable } from "./comments";

export const commentVotesTable = pgTable(
  "comment_votes",
  {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id")
      .notNull()
      .references(() => commentsTable.id, { onDelete: "cascade" }),
    voterId: text("voter_id").notNull(),
    voterIp: text("voter_ip"),
    voteType: text("vote_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("comment_votes_comment_voter_uniq").on(t.commentId, t.voterId),
    unique("comment_votes_comment_ip_uniq").on(t.commentId, t.voterIp),
  ],
);

export type CommentVote = typeof commentVotesTable.$inferSelect;
