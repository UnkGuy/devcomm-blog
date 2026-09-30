'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { slugify, extractFirstMediaUrl, normalizeUrl } from '@/lib/utils';

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

  const supabase = await createClient();

  // Sign up with email confirmation redirect
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If Supabase has email confirmation turned on, data.session will be null
  if (data.user && !data.session) {
    return {
      success: true,
      needsConfirmation: true,
      message: 'A guild confirmation courier has been dispatched to your email address! Please click the ink-stamped link to verify your identity.',
    };
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

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to update your profile.' };
  }

  const username = (formData.get('username') as string)?.trim();
  const bio = (formData.get('bio') as string)?.trim() || null;
  const avatarUrl = (formData.get('avatar_url') as string)?.trim() || null;

  if (!username || username.length < 3 || username.length > 24) {
    return { error: 'Adventurer name must be between 3 and 24 characters.' };
  }

  const { data: conflict } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle();

  if (conflict) {
    return { error: 'That Adventurer name is already claimed.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      bio,
      avatar_url: avatarUrl,
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

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
  const rawCoverUrl = (formData.get('cover_image_url') as string)?.trim() || '';
  const rawTags = (formData.get('tags') as string) || '';

  if (!title || !description) {
    return { error: 'Both a title and description are required.' };
  }

  // Ensure the author has a profile record so foreign key constraints never fail
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingProfile) {
    const fallbackUsername =
      (user.user_metadata?.username as string) ||
      user.email?.split('@')[0] ||
      `adventurer_${user.id.slice(0, 6)}`;
    await supabase.from('profiles').insert({
      id: user.id,
      username: fallbackUsername.slice(0, 24),
    });
  }

  const coverImageUrl = rawCoverUrl
    ? normalizeUrl(rawCoverUrl)
    : extractFirstMediaUrl(description);

  const slug = slugify(title);

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      title,
      slug,
      description,
      cover_image_url: coverImageUrl || null,
      is_published: true,
    })
    .select('id, slug')
    .single();

  if (postError || !post) {
    return { error: postError?.message || 'Failed to create post.' };
  }

  const tagNames = rawTags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
    .slice(0, 5);

  const seenSlugs = new Set<string>();

  for (const tagName of tagNames) {
    const tagSlug = tagName.replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    if (!tagSlug || seenSlugs.has(tagSlug)) continue;
    seenSlugs.add(tagSlug);

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
        .maybeSingle();
      if (newTag) tagId = newTag.id;
    }

    if (tagId) {
      await supabase
        .from('post_tags')
        .upsert(
          { post_id: post.id, tag_id: tagId },
          { onConflict: 'post_id,tag_id', ignoreDuplicates: true }
        );
    }
  }

  revalidatePath('/');
  return { success: true, slug: post.slug };
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

export async function togglePostLikeAction(
  postId: string,
  pathToRevalidate: string
) {
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