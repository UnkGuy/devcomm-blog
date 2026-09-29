'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addCommentAction(
  postId: string,
  content: string,
  postSlug: string,
  parentId: string | null = null,
  skillCheck?: { skill: string } | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to comment.' };
  }

  let finalContent = content.trim();
  if (!finalContent) {
    return { error: 'Comment cannot be empty.' };
  }

  let rollValue: number | undefined;

  // Inject a server-verified pure 1d20 dice roll
  if (skillCheck) {
    rollValue = Math.floor(Math.random() * 20) + 1;
    const rollType =
      rollValue === 20
        ? ' **(Critical Success!)**'
        : rollValue === 1
        ? ' **(Critical Fail!)**'
        : '';

    finalContent += `\n\n> 🎲 **${skillCheck.skill} Check**: Rolled **${rollValue}**${rollType}`;
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      parent_id: parentId,
      content: finalContent,
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
  return { data, rollResult: rollValue };
}

export async function deleteCommentAction(commentId: string, postSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please sign in.' };
  }

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