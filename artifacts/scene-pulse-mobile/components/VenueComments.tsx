import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useUser } from '@clerk/expo';
import {
  Comment,
  getListVenueCommentsQueryKey,
  useCreateVenueComment,
  useDislikeComment,
  useLikeComment,
  useListVenueComments,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { timeAgo } from '@/lib/venue-ui';
import { getVoterId } from '@/lib/voter-id';

export function VenueComments({ venueId }: { venueId: number }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const userDisplayName = user?.fullName || user?.firstName || '';

  const [voterId, setVoterId] = useState<string | null>(null);
  useEffect(() => {
    getVoterId().then(setVoterId);
  }, []);

  const { data: comments = [], isLoading } = useListVenueComments(venueId, {
    query: {
      enabled: !!venueId,
      queryKey: getListVenueCommentsQueryKey(venueId),
      refetchInterval: 10_000,
    },
  });

  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Pre-fill name from account when signed in
  useEffect(() => {
    if (userDisplayName && !authorName) {
      setAuthorName(userDisplayName);
    }
  }, [userDisplayName]);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<number>>(new Set());

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListVenueCommentsQueryKey(venueId) });

  const createComment = useCreateVenueComment({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessage('');
        setError(null);
        invalidate();
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError("Couldn't post your comment. Try again.");
      },
    },
  });

  const voterHeaders = voterId ? { headers: { 'X-Voter-ID': voterId } } : undefined;

  const likeMutation = useLikeComment({
    request: voterHeaders,
    mutation: { onSuccess: invalidate },
  });
  const dislikeMutation = useDislikeComment({
    request: voterHeaders,
    mutation: { onSuccess: invalidate },
  });

  const submit = () => {
    setError(null);
    if (!authorName.trim()) return setError('Add a name so people know who you are.');
    if (!message.trim()) return setError('Write something first.');
    createComment.mutate({
      venueId,
      data: { authorName: authorName.trim(), message: message.trim() },
    });
  };

  const reacted = (id: number) => likedIds.has(id) || dislikedIds.has(id);

  const handleLike = (commentId: number) => {
    if (reacted(commentId) || !voterId) return;
    Haptics.selectionAsync();
    setLikedIds((prev) => new Set([...prev, commentId]));
    likeMutation.mutate(
      { venueId, commentId },
      {
        onError: () =>
          setLikedIds((prev) => {
            const n = new Set(prev);
            n.delete(commentId);
            return n;
          }),
      },
    );
  };

  const handleDislike = (commentId: number) => {
    if (reacted(commentId) || !voterId) return;
    Haptics.selectionAsync();
    setDislikedIds((prev) => new Set([...prev, commentId]));
    dislikeMutation.mutate(
      { venueId, commentId },
      {
        onError: () =>
          setDislikedIds((prev) => {
            const n = new Set(prev);
            n.delete(commentId);
            return n;
          }),
      },
    );
  };

  const { topLevel, repliesByParent } = useMemo(() => {
    const map = new Map<number, Comment[]>();
    const top: Comment[] = [];
    for (const c of comments) {
      if (c.parentCommentId != null) {
        const list = map.get(c.parentCommentId) ?? [];
        list.push(c);
        map.set(c.parentCommentId, list);
      } else {
        top.push(c);
      }
    }
    top.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return { topLevel: top, repliesByParent: map };
  }, [comments]);

  const renderReactions = (c: Comment) => {
    const liked = likedIds.has(c.id);
    const disliked = dislikedIds.has(c.id);
    const disabled = reacted(c.id) || !voterId;
    return (
      <View style={styles.reactionRow}>
        <Pressable
          testID={`like-comment-${c.id}`}
          onPress={() => handleLike(c.id)}
          disabled={disabled}
          hitSlop={8}
          style={({ pressed }) => [
            styles.reactionBtn,
            {
              backgroundColor: liked ? `${colors.success}22` : 'transparent',
              opacity: pressed ? 0.7 : disabled && !liked ? 0.5 : 1,
            },
          ]}
        >
          <Feather
            name="thumbs-up"
            size={13}
            color={liked ? colors.success : colors.mutedForeground}
          />
          <Text
            style={[
              styles.reactionCount,
              { color: liked ? colors.success : colors.mutedForeground },
            ]}
          >
            {c.likes + (liked ? 1 : 0)}
          </Text>
        </Pressable>
        <Pressable
          testID={`dislike-comment-${c.id}`}
          onPress={() => handleDislike(c.id)}
          disabled={disabled}
          hitSlop={8}
          style={({ pressed }) => [
            styles.reactionBtn,
            {
              backgroundColor: disliked ? `${colors.destructive}22` : 'transparent',
              opacity: pressed ? 0.7 : disabled && !disliked ? 0.5 : 1,
            },
          ]}
        >
          <Feather
            name="thumbs-down"
            size={13}
            color={disliked ? colors.destructive : colors.mutedForeground}
          />
          <Text
            style={[
              styles.reactionCount,
              { color: disliked ? colors.destructive : colors.mutedForeground },
            ]}
          >
            {c.dislikes + (disliked ? 1 : 0)}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
      ]}
      testID="venue-comments"
    >
      <View style={styles.panelHeader}>
        <Feather name="message-square" size={14} color={colors.accent} />
        <Text style={[styles.panelTitle, { color: colors.mutedForeground }]}>
          SCENE TALK ({comments.length})
        </Text>
      </View>

      {/* Composer */}
      {userDisplayName ? (
        <View style={[styles.nameDisplay, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="user-check" size={13} color={colors.primary} />
          <Text style={[styles.nameDisplayText, { color: colors.foreground }]}>{userDisplayName}</Text>
        </View>
      ) : (
        <TextInput
          testID="comment-name-input"
          value={authorName}
          onChangeText={setAuthorName}
          placeholder="Your name"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
              borderRadius: colors.radius,
            },
          ]}
        />
      )}
      <View style={styles.composerRow}>
        <TextInput
          testID="comment-message-input"
          value={message}
          onChangeText={setMessage}
          placeholder="What's the scene like?"
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={200}
          style={[
            styles.input,
            styles.messageInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
              borderRadius: colors.radius,
            },
          ]}
        />
        <Pressable
          testID="post-comment"
          onPress={submit}
          disabled={createComment.isPending}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: colors.primary,
              opacity: createComment.isPending ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {createComment.isPending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Feather name="send" size={16} color={colors.primaryForeground} />
          )}
        </Pressable>
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]} testID="comment-error">
          {error}
        </Text>
      )}

      {/* Feed */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 14 }} />
      ) : topLevel.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          No comments yet. Start the conversation.
        </Text>
      ) : (
        topLevel.map((c) => {
          const replies = repliesByParent.get(c.id) ?? [];
          return (
            <View
              key={c.id}
              style={[styles.commentRow, { borderTopColor: colors.border }]}
              testID={`comment-${c.id}`}
            >
              <View style={styles.commentHeader}>
                <Text style={[styles.commentName, { color: colors.foreground }]}>
                  {c.authorName}
                </Text>
                <Text style={[styles.updated, { color: colors.mutedForeground }]}>
                  {timeAgo(c.createdAt)}
                </Text>
              </View>
              <Text style={[styles.commentText, { color: colors.mutedForeground }]}>
                {c.message}
              </Text>
              {renderReactions(c)}
              {replies.length > 0 && (
                <View style={[styles.replies, { borderLeftColor: colors.border }]}>
                  {replies.map((r) => (
                    <View key={r.id} style={{ marginBottom: 8 }} testID={`comment-${r.id}`}>
                      <View style={styles.commentHeader}>
                        <Text style={[styles.commentName, { color: colors.foreground }]}>
                          {r.authorName}
                        </Text>
                        <Text style={[styles.updated, { color: colors.mutedForeground }]}>
                          {timeAgo(r.createdAt)}
                        </Text>
                      </View>
                      <Text style={[styles.commentText, { color: colors.mutedForeground }]}>
                        {r.message}
                      </Text>
                      {renderReactions(r)}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, padding: 14, marginHorizontal: 16, marginBottom: 12 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  panelTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, flex: 1 },
  updated: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  composerRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  messageInput: { flex: 1, minHeight: 40, maxHeight: 100, textAlignVertical: 'top', marginBottom: 0 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 8 },
  nameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    marginBottom: 8,
  },
  nameDisplayText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 14, lineHeight: 19 },
  commentRow: { paddingTop: 10, marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  commentName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  commentText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  reactionRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reactionCount: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  replies: {
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
});
