import { useState, type ChangeEvent } from 'react';
import { Film, Trash2 } from 'lucide-react';
import { adminApi } from './api';
import { MAX_VIDEO_MB } from '../data/storage';

// Uploads straight away and hands back the public video address; the content still needs saving to go live.
export default function VideoUpload({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const uploading = progress !== null;

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setProgress(0);
    setError('');
    try {
      onChange(await adminApi.uploadVideo(file, setProgress));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="admin-upload">
      <span className="admin-upload-label">Video</span>
      <div className="admin-upload-row">
        <div className="admin-upload-preview">
          {value ? <video src={value} muted loop playsInline autoPlay /> : <Film size={22} />}
        </div>
        <div className="admin-upload-actions">
          <label className="admin-button admin-button-ghost admin-upload-button">
            <Film size={14} /> {uploading ? `Uploading ${progress}%` : value ? 'Replace video' : 'Upload video'}
            <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={pick} disabled={uploading} hidden />
          </label>
          {value && !uploading && (
            <button type="button" className="admin-delete" onClick={() => onChange('')}>
              <Trash2 size={13} /> Remove video
            </button>
          )}
          {error && <span className="admin-error">{error}</span>}
          <small className="admin-hint">MP4 works on every phone. Landscape (16:9), up to {MAX_VIDEO_MB} MB. Short screen recordings of 10–30 seconds look best.</small>
        </div>
      </div>
    </div>
  );
}
