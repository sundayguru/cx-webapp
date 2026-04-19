import type { Route } from './+types/$id.community';
import { data, useFetcher } from 'react-router';
import { motion } from 'motion/react';
import { MessageSquare, Reply, Smile, Trash2, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ConfirmModal } from '~/components/WarningModal';
import { getUserFromRequest } from '~/utils/session.server';
import { isUserEnrolled } from '~/db/enrollments';
import { getCourseById } from '~/db/courses';
import {
  createCommunityPost,
  getAllCommunityPostsForCourse,
  toggleCommunityReaction,
  deleteCommunityPost,
  editCommunityPost,
} from '~/db/community';

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const courseId = params.id;
  if (!courseId) {
    return data({ error: 'Course ID missing' }, { status: 400 });
  }

  const courseData = await getCourseById(courseId);
  if (!courseData) {
    return data({ error: 'Course not found' }, { status: 404 });
  }

  const enrolled = await isUserEnrolled(courseId, user.id);
  if (!enrolled && courseData.course.createdBy !== user.id) {
    return {
      enrolled: false,
      courseId,
      currentUser: user,
      posts: [],
      reactions: [],
    };
  }

  const communityData = await getAllCommunityPostsForCourse(courseId);

  return {
    enrolled: true,
    courseId,
    currentUser: user,
    posts: communityData?.allPosts || [],
    reactions: communityData?.reactions || [],
  };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const courseId = params.id;
  if (!courseId) {
    return data({ error: 'Course ID missing' }, { status: 400 });
  }

  const enrolled = await isUserEnrolled(courseId, user.id);
  const courseData = await getCourseById(courseId);
  if (!enrolled && courseData?.course.createdBy !== user.id) {
    return data(
      { error: 'Must be enrolled to perform this action' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'createPost') {
    const content = formData.get('content') as string;
    const parentId = formData.get('parentId') as string | null;

    if (!content || content.trim().length === 0) {
      return data({ error: 'Content is required' }, { status: 400 });
    }

    await createCommunityPost({
      courseId,
      userId: user.id,
      content: content.trim(),
      parentId: parentId || null,
    });

    return data({ success: true });
  }

  if (intent === 'toggleReaction') {
    const postId = formData.get('postId') as string;
    const emoji = formData.get('emoji') as string;

    if (!postId || !emoji) {
      return data({ error: 'Invalid reaction data' }, { status: 400 });
    }

    await toggleCommunityReaction(postId, user.id, emoji);
    return data({ success: true });
  }

  if (intent === 'deletePost') {
    const postId = formData.get('postId') as string;
    if (!postId) {
      return data({ error: 'Post ID is required' }, { status: 400 });
    }

    await deleteCommunityPost(postId, user.id);
    return data({ success: true });
  }

  if (intent === 'editPost') {
    const postId = formData.get('postId') as string;
    const content = formData.get('content') as string;

    if (!postId || !content || content.trim().length === 0) {
      return data({ error: 'Post ID and content are required' }, { status: 400 });
    }

    await editCommunityPost(postId, user.id, content.trim());
    return data({ success: true });
  }

  return data({ error: 'Invalid intent' }, { status: 400 });
};

// Available emojis for reaction
const ALLOWED_EMOJIS = ['👍', '❤️', '😄', '🎉', '👀'];

export default function CourseCommunity({ loaderData }: Route.ComponentProps) {
  if ('error' in loaderData) {
    return (
      <div className='p-8 text-center text-red-500'>{loaderData.error}</div>
    );
  }

  if (!loaderData.enrolled) {
    return (
      <div className='flex flex-col items-center justify-center p-16 text-center'>
        <MessageSquare size={48} className='mb-4 text-black/20' />
        <h2 className='mb-2 font-serif text-2xl font-medium text-[#1a1a1a]'>
          Join the Community
        </h2>
        <p className='mb-6 text-black/60'>
          Enroll in this course to start posting questions and interacting with
          other students.
        </p>
      </div>
    );
  }

  const posts = loaderData.posts || [];
  const reactions = loaderData.reactions || [];
  const currentUser = loaderData.currentUser;
  const topLevelPosts = posts.filter((p: any) => !p.post.parentId);

  return (
    <div className='mx-auto max-w-4xl px-4 py-8'>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className='mb-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm'
      >
        <h3 className='mb-4 font-serif text-xl font-medium'>Ask a Question</h3>
        <PostForm
          intent='createPost'
          parentId={null}
          placeholder="What's on your mind?"
        />
      </motion.div>

      <div className='space-y-6'>
        {topLevelPosts.length === 0 ? (
          <div className='py-12 text-center text-black/40'>
            No posts yet. Be the first to start a conversation!
          </div>
        ) : (
          topLevelPosts.map((postData) => (
            <PostThread
              key={postData.post.id}
              postData={postData}
              allPosts={posts}
              allReactions={reactions}
              currentUser={currentUser}
            />
          ))
        )}
      </div>
    </div>
  );
}

// A generic form component for posting questions or replies
function PostForm({
  intent,
  parentId,
  placeholder,
}: {
  intent: string;
  parentId: string | null;
  placeholder: string;
}) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const formRef = React.useRef<HTMLFormElement>(null);

  // Clear form on success
  React.useEffect(() => {
    if (
      fetcher.state === 'idle' &&
      fetcher.data &&
      'success' in (fetcher.data as any)
    ) {
      formRef.current?.reset();
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <fetcher.Form ref={formRef} method='post' className='flex flex-col gap-3'>
      <input type='hidden' name='intent' value={intent} />
      {parentId && <input type='hidden' name='parentId' value={parentId} />}
      <textarea
        name='content'
        rows={3}
        placeholder={placeholder}
        className='w-full resize-none rounded-xl border border-black/10 p-3 text-sm focus:border-[#5A5A40] focus:outline-none'
        required
      />
      <div className='flex justify-end'>
        <button
          type='submit'
          disabled={isSubmitting}
          className='rounded-lg bg-[#5A5A40] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4a35] disabled:opacity-50'
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </fetcher.Form>
  );
}

// Renders a post and its nested replies
function PostThread({
  postData,
  allPosts,
  allReactions,
  currentUser,
  depth = 0,
}: any) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const checkEditWindow = () => {
    // SQLite CURRENT_TIMESTAMP returns "YYYY-MM-DD HH:MM:SS" which parses as local time.
    // Convert to ISO 8601 UTC format by replacing space and appending Z.
    const utcString = postData.post.createdAt.replace(' ', 'T') + 'Z';
    const ageMs = Date.now() - new Date(utcString).getTime();
    return ageMs < 1000 * 60 * 10;
  };

  const canEdit = checkEditWindow();


  const replies = allPosts.filter(
    (p: any) => p.post.parentId === postData.post.id,
  );
  const postReactions = allReactions.filter(
    (r: any) => r.reaction.postId === postData.post.id,
  );

  // Group reactions by emoji
  const groupedReactions = postReactions.reduce((acc: any, curr: any) => {
    acc[curr.reaction.emoji] = acc[curr.reaction.emoji] || [];
    acc[curr.reaction.emoji].push(curr.user);
    return acc;
  }, {});

  const fetcher = useFetcher();

  const handleReaction = (emoji: string) => {
    fetcher.submit(
      { intent: 'toggleReaction', postId: postData.post.id, emoji },
      { method: 'post' },
    );
  };

  const authorName = `${postData.user.firstName} ${postData.user.lastName}`;
  const avatarUrl = postData.profile?.avatarUrl;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${depth > 0 ? 'mt-4 ml-8 border-l-2 border-black/5 pl-4' : 'rounded-2xl border border-black/5 bg-white p-5 shadow-sm'}`}
    >
      <div className='flex gap-3'>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={authorName}
            className='h-10 w-10 shrink-0 rounded-full object-cover'
          />
        ) : (
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5A5A40]/10 font-bold text-[#5A5A40]'>
            {authorName.charAt(0)}
          </div>
        )}
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-[#1a1a1a]'>{authorName}</span>
            <span className='text-xs text-black/40'>
              {new Date(postData.post.createdAt.replace(' ', 'T') + 'Z').toLocaleDateString()}
            </span>
            {postData.post.userId === currentUser.id && !postData.post.isDeleted && (
              <div className='ml-auto flex items-center gap-2'>
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className='text-black/30 hover:text-[#5A5A40] transition-colors'
                    title='Edit post'
                  >
                    <Pencil size={14} />
                  </button>
                )}
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className='text-black/30 hover:text-red-500 transition-colors'
                  title='Delete post'
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {postData.post.isDeleted ? (
            <p className='mt-1 text-sm italic text-black/40'>
              [This message was deleted]
            </p>
          ) : isEditing ? (
            <div className='mt-3'>
              <fetcher.Form method='post' className='flex flex-col gap-3' onSubmit={() => setTimeout(() => setIsEditing(false), 100)}>
                <input type='hidden' name='intent' value='editPost' />
                <input type='hidden' name='postId' value={postData.post.id} />
                <textarea
                  name='content'
                  rows={3}
                  defaultValue={postData.post.content}
                  className='w-full resize-none rounded-xl border border-black/10 p-3 text-sm focus:border-[#5A5A40] focus:outline-none'
                  required
                />
                <div className='flex justify-end gap-2'>
                  <button
                    type='button'
                    onClick={() => setIsEditing(false)}
                    className='rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-black/60 transition-colors hover:bg-black/5'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={fetcher.state !== 'idle'}
                    className='rounded-lg bg-[#5A5A40] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4a35] disabled:opacity-50'
                  >
                    Save
                  </button>
                </div>
              </fetcher.Form>
            </div>
          ) : (
            <>
              <p className='mt-1 text-sm whitespace-pre-wrap text-black/80'>
                {postData.post.content}
                {postData.post.updatedAt !== postData.post.createdAt && (
                  <span className='ml-2 text-xs italic text-black/40'>(edited)</span>
                )}
              </p>

              <div className='mt-3 flex flex-wrap items-center gap-2'>
                {/* Display grouped reactions */}
                {Object.entries(groupedReactions).map(
                  ([emoji, usersArr]: [string, any]) => {
                    const hasReacted = usersArr.some(
                      (u: any) => u.id === currentUser.id,
                    );
                    const tooltipNames = usersArr
                      .map((u: any) => `${u.firstName} ${u.lastName}`)
                      .join(', ');

                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        title={tooltipNames}
                        className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors ${hasReacted
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-black/5 text-black/60 hover:bg-black/10'
                          }`}
                      >
                        <span>{emoji}</span>
                        <span className='font-medium'>{usersArr.length}</span>
                      </button>
                    );
                  },
                )}

                {/* Reaction picker trigger */}
                <div className='group relative'>
                  <button className='flex h-6 w-6 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/60'>
                    <Smile size={14} />
                  </button>
                  <div className='absolute bottom-full left-0 z-10 hidden pb-1 group-hover:block'>
                    <div className='flex rounded-lg border border-black/5 bg-white p-1 shadow-md'>
                      {ALLOWED_EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => handleReaction(e)}
                          className='flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-black/5'
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className='ml-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-black/50 transition-colors hover:bg-black/5 hover:text-black/80'
                >
                  <Reply size={14} /> Reply
                </button>
              </div>

              {showReplyForm && (
                <div className='mt-4'>
                  <PostForm
                    intent='createPost'
                    parentId={postData.post.id}
                    placeholder='Write a reply...'
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className='mt-4'>
          {replies.map((replyPost: any) => (
            <PostThread
              key={replyPost.post.id}
              postData={replyPost}
              allPosts={allPosts}
              allReactions={allReactions}
              currentUser={currentUser}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title='Delete Post'
        description='Are you sure you want to delete this post? This action cannot be undone.'
        confirmVariant='danger'
        isLoading={fetcher.state !== 'idle'}
        onConfirm={() => {
          fetcher.submit(
            { intent: 'deletePost', postId: postData.post.id },
            { method: 'post' },
          );
          setIsDeleteModalOpen(false);
        }}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </motion.div>
  );
}

// Adding React import which is needed for React.useRef and React.useEffect since we didn't specify above
import * as React from 'react';
