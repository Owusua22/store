// components/admin/BlogPostForm.tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Eye, ImagePlus, Loader2, Save, Send, X } from 'lucide-react';

import {
  AdminButton,
  AdminCard,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/admin/ui';
import { BLOG_CATEGORIES, renderBlogHtml } from '@/lib/skin-types';
import type { SkinTypeRow } from '@/lib/data/skin-types';

export interface BlogFormValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  tags: string;
  skin_types: string[];
  author_name: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
}

export const emptyBlogValues: BlogFormValues = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  category: BLOG_CATEGORIES[0],
  tags: '',
  skin_types: [],
  author_name: 'Sally Skin Care',
  status: 'draft',
  is_featured: false,
  seo_title: '',
  seo_description: '',
};

export default function BlogPostForm({
  mode,
  postId,
  initialValues,
  skinTypes,
  demoMode,
}: {
  mode: 'create' | 'edit';
  postId?: string;
  initialValues?: Partial<BlogFormValues>;
  skinTypes: SkinTypeRow[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);

  const { register, handleSubmit, control, watch, setValue } = useForm<BlogFormValues>({
    defaultValues: { ...emptyBlogValues, ...initialValues },
  });

  const cover = watch('cover_image');
  const content = watch('content');
  const title = watch('title');

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image');
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error ?? 'Upload failed');
      setValue('cover_image', payload.data?.url ?? payload.url, { shouldDirty: true });
      toast.success('Cover image uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (values: BlogFormValues, status?: BlogFormValues['status']) => {
    if (!values.title.trim()) {
      toast.error('Add a title first');
      return;
    }

    if (demoMode) {
      toast.info('Demo mode: connect Supabase to publish blog posts.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: values.title,
        slug: values.slug || undefined,
        excerpt: values.excerpt || null,
        content: values.content,
        cover_image: values.cover_image || null,
        category: values.category || null,
        tags: values.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        skin_types: values.skin_types,
        author_name: values.author_name || 'Sally Skin Care',
        status: status ?? values.status,
        is_featured: values.is_featured,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
      };

      const response = await fetch(
        mode === 'create' ? '/api/admin/blog' : `/api/admin/blog/${postId}`,
        {
          method: mode === 'create' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? 'Could not save post');

      toast.success(
        (status ?? values.status) === 'published' ? 'Post published' : 'Draft saved'
      );
      router.push('/admin/blog');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit((values) => submit(values))}
      className="pb-16"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-gray-900">
            {mode === 'create' ? 'New article' : 'Edit article'}
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Markdown supported: <code>## heading</code>, <code>**bold**</code>, lists, links.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton variant="secondary" onClick={() => setPreview((value) => !value)}>
            <Eye className="h-4 w-4" /> {preview ? 'Write' : 'Preview'}
          </AdminButton>
          <AdminButton variant="secondary" disabled={saving} onClick={handleSubmit((values) => submit(values, 'draft'))}>
            Save draft
          </AdminButton>
          <AdminButton disabled={saving} onClick={handleSubmit((values) => submit(values, 'published'))}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish
          </AdminButton>
        </div>
      </div>

      {demoMode ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
          <strong>Demo mode.</strong> Add your Supabase keys to <code>.env.local</code> to publish
          articles.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <AdminCard>
            <div className="grid gap-4">
              <Field label="Title">
                <Input
                  {...register('title', { required: true })}
                  placeholder="A simple skin care routine for harmattan"
                />
              </Field>
              <Field label="Slug" hint="Leave empty to generate from the title.">
                <Input {...register('slug')} placeholder={title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) : 'harmattan-routine'} />
              </Field>
              <Field label="Excerpt" hint="Shown on the blog index and in search results.">
                <Textarea {...register('excerpt')} rows={3} />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold text-gray-900">Article body</h2>
              <span className="text-[11px] text-gray-400">
                {(content ?? '').split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            {preview ? (
              <div
                className="min-h-[420px] rounded-lg border border-gray-100 bg-gray-50/50 p-5 text-[14.5px] leading-[1.8] text-gray-700 [&_blockquote]:my-4 [&_h2]:mt-6 [&_h2]:text-[20px] [&_h2]:font-black [&_h3]:mt-4 [&_h3]:font-extrabold [&_li]:mb-1 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-3 [&_ul]:list-disc"
                dangerouslySetInnerHTML={{ __html: renderBlogHtml(content ?? '') }}
              />
            ) : (
              <Textarea
                {...register('content')}
                rows={22}
                className="font-mono text-[13px] leading-relaxed"
                placeholder={'## Why harmattan wrecks your skin\n\nHarmattan air is dry…\n\n1. Cleanse with a gentle foam wash\n2. Apply a hydrating serum'}
              />
            )}
          </AdminCard>

          <AdminCard>
            <h2 className="mb-4 text-[15px] font-extrabold text-gray-900">SEO</h2>
            <div className="grid gap-4">
              <Field label="SEO title">
                <Input {...register('seo_title')} />
              </Field>
              <Field label="SEO description">
                <Textarea {...register('seo_description')} rows={2} />
              </Field>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard>
            <h2 className="mb-4 text-[15px] font-extrabold text-gray-900">Publishing</h2>
            <div className="grid gap-4">
              <Field label="Status">
                <Select {...register('status')}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Select>
              </Field>
              <Field label="Category">
                <Select {...register('category')}>
                  {BLOG_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Author">
                <Input {...register('author_name')} />
              </Field>
              <label className="flex items-center gap-2.5 text-[13px] font-semibold text-gray-700">
                <input
                  type="checkbox"
                  {...register('is_featured')}
                  className="h-4 w-4 accent-red-600"
                />
                Feature at the top of the journal
              </label>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-4 text-[15px] font-extrabold text-gray-900">Cover image</h2>
            {cover ? (
              <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-lg border border-gray-200">
                <Image src={cover} alt="Cover" fill sizes="288px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setValue('cover_image', '', { shouldDirty: true })}
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white"
                  aria-label="Remove cover"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => upload(event.target.files?.[0])}
            />
            <AdminButton
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {cover ? 'Replace cover' : 'Upload cover'}
            </AdminButton>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-3 text-[15px] font-extrabold text-gray-900">Best for skin types</h2>
            <Controller
              control={control}
              name="skin_types"
              render={({ field }) => (
                <div className="flex flex-wrap gap-1.5">
                  {skinTypes.map((type) => {
                    const active = field.value.includes(type.slug);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            active
                              ? field.value.filter((value) => value !== type.slug)
                              : [...field.value, type.slug]
                          )
                        }
                        className={`rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition-colors ${
                          active
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {type.emoji} {type.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            <div className="mt-4">
              <Field label="Tags" hint="Comma separated.">
                <Input {...register('tags')} placeholder="harmattan, routine, dry skin" />
              </Field>
            </div>
          </AdminCard>

          <AdminButton type="submit" variant="secondary" className="w-full">
            <Save className="h-4 w-4" /> Save
          </AdminButton>
        </div>
      </div>
    </form>
  );
}
