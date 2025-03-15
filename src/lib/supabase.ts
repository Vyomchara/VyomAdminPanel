import { createClient } from '@supabase/supabase-js'

// Initialize the Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

/**
 * Upload a file to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param path Optional folder path within the bucket
 * @returns Object with the file URL and any error
 */
export async function uploadFileToSupabase(
  file: File,
  bucket: string,
  path: string = ''
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = path ? `${path}/${fileName}` : fileName

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Get the public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading file to Supabase:', error)
    return { url: null, error: error as Error }
  }
}

/**
 * Upload multiple files to Supabase Storage
 * @param files Array of files to upload
 * @param bucket The storage bucket name
 * @param path Optional folder path within the bucket
 * @returns Array of objects with file URLs and any errors
 */
export async function uploadFilesToSupabase(
  files: File[],
  bucket: string,
  path: string = ''
): Promise<{ urls: string[]; errors: Error[] }> {
  const uploadResults = await Promise.all(
    files.map(file => uploadFileToSupabase(file, bucket, path))
  )

  const urls = uploadResults
    .filter(result => result.url !== null)
    .map(result => result.url as string)

  const errors = uploadResults
    .filter(result => result.error !== null)
    .map(result => result.error as Error)

  return { urls, errors }
}