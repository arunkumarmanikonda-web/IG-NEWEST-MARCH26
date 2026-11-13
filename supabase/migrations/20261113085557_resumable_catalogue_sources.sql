-- The storage account controls capacity. Do not add a smaller website-specific
-- file-size limit to privately uploaded brand catalogues.
update storage.buckets set file_size_limit=null where id='ig-brand-catalogues';
