import type { FileType } from '../models/File'
import type { Tone } from './tones'

const EXT_MAP: Record<string, FileType> = {
  pdf: 'pdf',
  doc: 'doc', docx: 'doc', txt: 'doc', rtf: 'doc', md: 'doc',
  xls: 'sheet', xlsx: 'sheet', csv: 'sheet',
  ppt: 'slide', pptx: 'slide', key: 'slide',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', avif: 'image', heic: 'image',
  mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
  mp3: 'audio', wav: 'audio', m4a: 'audio', aac: 'audio', flac: 'audio', ogg: 'audio',
  js: 'code', ts: 'code', tsx: 'code', jsx: 'code', py: 'code', java: 'code', go: 'code', rs: 'code', c: 'code', cpp: 'code', json: 'code', html: 'code', css: 'code',
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  note: 'note',
}

/** Suy ra loại file từ phần mở rộng / mime type. */
export function inferFileType(name: string, mime?: string): FileType {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (EXT_MAP[ext]) return EXT_MAP[ext]
  if (mime?.startsWith('image/')) return 'image'
  if (mime?.startsWith('video/')) return 'video'
  if (mime?.startsWith('audio/')) return 'audio'
  if (mime === 'application/pdf') return 'pdf'
  return 'doc'
}

const TONE_BY_TYPE: Record<FileType, Tone> = {
  pdf: 'rose', doc: 'blue', sheet: 'emerald', slide: 'amber', image: 'violet',
  video: 'blue', audio: 'emerald', code: 'indigo', archive: 'amber', note: 'violet',
}

export function toneForType(type: FileType): Tone {
  return TONE_BY_TYPE[type] ?? 'indigo'
}
