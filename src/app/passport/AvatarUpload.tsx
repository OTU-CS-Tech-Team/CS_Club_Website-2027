'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { saveAvatarUrl } from './actions';
import styles from './passport.module.css';

// Phone photos are 2-5 MB; the passport shows the avatar in a small circle and
// a 280px frame. Downscaling in the browser before upload keeps both Storage
// and bandwidth tiny (~50 KB per member instead of megabytes) and means one
// file per member — always avatar.webp.
const AVATAR_PX = 512;
const WEBP_QUALITY = 0.82;
const MAX_INPUT_BYTES = 15 * 1024 * 1024; // guard against decoding something absurd
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const STALE_PATHS = ['avatar.jpg', 'avatar.png'];

// Square centre-crop, since every place it renders is square or circular.
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(AVATAR_PX, side);
  canvas.height = canvas.width;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not process that image.');
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process that image.'))),
      'image/webp',
      WEBP_QUALITY,
    );
  });
}

export default function AvatarUpload() {
  const supabase = createClient();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      setStatus('Use a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setStatus('That image is enormous — pick one under 15 MB.');
      return;
    }

    setStatus('');
    setPending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Your session expired — sign in again.');

      const image = await downscale(file);
      const path = `${user.id}/avatar.webp`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, image, { upsert: true, contentType: 'image/webp' });
      if (uploadError) throw new Error(uploadError.message);

      // Clear photos from before the webp switch so each member keeps one file.
      await supabase.storage.from('avatars').remove(STALE_PATHS.map((name) => `${user.id}/${name}`));

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(path);

      // Cache-buster, otherwise a replaced photo keeps showing the old image.
      await saveAvatarUrl(`${publicUrl}?v=${Date.now()}`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not upload that photo.');
    }
    setPending(false);
  }

  return (
    <div className={styles.avatarUpload}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void handleFile(file);
        }}
      />
      <button
        className={styles.pillButton}
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
      >
        {pending ? 'uploading...' : '⬆ change photo'}
      </button>
      {status ? <p className={styles.avatarUploadError}>{status}</p> : null}
    </div>
  );
}
