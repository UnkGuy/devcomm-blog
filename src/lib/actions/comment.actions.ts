'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addCommentAction(
  postId: string,
  content: string,
  postSlug: string,
  parentId: string | null = null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to comment.' };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { error: 'Comment cannot be empty.' };
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      parent_id: parentId,
      content: trimmed,
    })
    .select(
      `
      *,
      profiles:author_id (
        id,
        username,
        avatar_url,
        role
      )
    `
    )
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/post/${postSlug}`);
  revalidatePath('/');
  return { data };
}

export async function deleteCommentAction(commentId: string, postSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please sign in.' };
  }

  // RLS enforces that only the comment author, the post owner (Req #5), or an admin can delete
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/post/${postSlug}`);
  revalidatePath('/');
  return { success: true };
}