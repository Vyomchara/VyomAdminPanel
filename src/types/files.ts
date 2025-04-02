// src/types/files.ts
export type MissionFile = {
  name: string;
  url: string;
  path: string;
  extension: string;
  createdAt: Date;
  sizeFormatted: string;
  bucketName: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  };
  // Other fields from Supabase
  id?: string;
  bucket_id?: string;
  owner?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
};