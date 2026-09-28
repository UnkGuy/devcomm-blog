'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

// ==========================================
// AUTHENTICATION & CUSTOM AUDIT LOGGING
// ==========================================

export async function signInAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase.from('audit_logs').insert({
      actor_id: data.user.id,
      action: 'USER_LOGIN',
      table_name: 'auth.session',
      record_id: data.user.id,
      metadata: { email: data.user.email },
    });
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signUpAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !username || !password) {
    return { error: 'All fields are required.' };
  }

  if (username.length < 3) {
    return { error: 'Username must be at least 3 characters.' };
  }

  const supabase = await createClient();

  // Check if username is already taken
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existingUser) {
    return { error: 'Username is already taken. Please choose another.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase.from('audit_logs').insert({
      actor_id: data.user.id,
      action: 'USER_SIGNUP',
      table_name: 'auth.users',
      record_id: data.user.id,
      metadata: { email, username },
    });
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signOutAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'USER_LOGOUT',
      table_name: 'auth.session',
      record_id: user.id,
      metadata: { email: user.email },
    });
  }

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// ==========================================
// POST ACTIONS (CREATE, DELETE, LIKE)
// ==========================================

export async function createPostAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to create a post.' };
  }

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const coverImageUrl = (formData.get('cover_image_url') as string)?.trim() || null;
  const rawTags = (formData.get('tags') as string) || '';

  if (!title || !description) {
    return { error: 'Both a title and description are required.' };
  }

  const slug = slugify(title);

  // 1. Insert the Post (DB trigger automatically logs this INSERT in audit_logs)
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      title,
      slug,
      description,
      cover_image_url: coverImageUrl,
      is_published: true,
    })
    .select('id, slug')
    .single();

  if (postError || !post) {
    return { error: postError?.message || 'Failed to create post.' };
  }

  // 2. Process Optional Tags (M:N relationship via tags & post_tags)
  const tagNames = rawTags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
    .slice(0, 5);

  for (const tagName of tagNames) {
    const tagSlug = tagName.replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    if (!tagSlug) continue;

    // Upsert or fetch existing tag
    let tagId: string | null = null;
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', tagSlug)
      .maybeSingle();

    if (existingTag) {
      tagId = existingTag.id;
    } else {
      const { data: newTag } = await supabase
        .from('tags')
        .insert({ name: tagName, slug: tagSlug })
        .select('id')
        .single();
      if (newTag) tagId = newTag.id;
    }

    if (tagId) {
      await supabase.from('post_tags').insert({
        post_id: post.id,
        tag_id: tagId,
      });
    }
  }

  revalidatePath('/');
  redirect(`/post/${post.slug}`);
}

export async function deletePostAction(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase.from('posts').delete().eq('id', postId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  redirect('/');
}

export async function togglePostLikeAction(postId: string, pathToRevalidate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Please sign in to like posts.' };
  }

  const { data: existingLike } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingLike) {
    await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);
  } else {
    await supabase.from('post_likes').insert({
      post_id: postId,
      user_id: user.id,
    });
  }

  revalidatePath(pathToRevalidate);
  revalidatePath('/');
  return { success: true };
}