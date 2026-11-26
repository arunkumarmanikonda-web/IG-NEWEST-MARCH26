import { createHash } from 'node:crypto';
import { HttpError } from './http.mjs';
import { roomFileType, validFileSignature } from './data-room-formats.mjs';

export const CAREER_RESUME_MAX_BYTES = 2 * 1024 * 1024;
export const CAREER_JOB_STATUSES = ['draft', 'published', 'closed', 'archived'];
export const CAREER_APPLICATION_STATUSES = ['new', 'reviewing', 'shortlisted', 'interview', 'hired', 'declined', 'withdrawn'];
export const CAREER_WORK_MODES = ['onsite', 'hybrid', 'remote'];
export const CAREER_EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship'];
export const CAREER_SETTINGS_DEFAULTS = {
  enabled: true,
  headline: 'Build your next chapter with India Gully.',
  intro: 'Bring your perspective to a team working across real estate, hospitality, retail and commercial advisory.',
  empty_message: 'There are no open roles at the moment. Please check back for future opportunities.',
  application_intro: 'Tell us about your experience and the work you would like to do with us.',
  version: 1,
};
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function careerUuid(value, label = 'reference') {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new HttpError(`Invalid ${label}.`);
  return value.toLowerCase();
}
function text(value, label, max, min = 0) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new HttpError(`Check ${label}.`);
  value = value.trim();
  if (value.length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new HttpError(`Check ${label} (${min ? `${min}–` : 'up to '}${max} characters).`);
  return value;
}
function version(value) {
  if (!Number.isSafeInteger(value) || value < 1) throw new HttpError('Refresh this record before saving.', 409);
  return value;
}
export function careerPortfolioUrl(value) {
  const input = text(value, 'the professional profile or CV link', 1000);
  if (!input) return '';
  let url;
  try { url = new URL(input); } catch { throw new HttpError('Use a complete HTTPS link for your professional profile or CV.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !url.hostname.includes('.') || /^\d+(?:\.\d+){3}$/.test(url.hostname) || url.hostname.startsWith('[') || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(url.hostname)) throw new HttpError('Use a public HTTPS link for your professional profile or CV.');
  // Links are saved for a human reviewer. The server never fetches them.
  return url.href;
}
export function validateCareerResume(resume) {
  if (resume === undefined || resume === null) return null;
  if (typeof resume !== 'object' || Array.isArray(resume)) throw new HttpError('Choose a PDF CV.');
  const name = text(resume.name, 'the CV filename', 180, 1);
  if (roomFileType(name)?.mime !== 'application/pdf' || !/\.pdf$/i.test(name) || !['', 'application/pdf'].includes(resume.type || '')) throw new HttpError('Upload your CV as a PDF, up to 2 MB.');
  if (typeof resume.base64 !== 'string' || resume.base64.length > Math.ceil(CAREER_RESUME_MAX_BYTES / 3) * 4 || resume.base64.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(resume.base64)) throw new HttpError('Upload a valid PDF, up to 2 MB.');
  const bytes = Buffer.from(resume.base64, 'base64');
  if (bytes.toString('base64') !== resume.base64 || !bytes.length || bytes.length > CAREER_RESUME_MAX_BYTES || !validFileSignature(name, bytes) || !bytes.subarray(Math.max(0, bytes.length - 2048)).toString('latin1').includes('%%EOF')) throw new HttpError('The CV does not appear to be a complete PDF. Upload the original PDF.');
  return { name, type: 'application/pdf', base64: bytes.toString('base64'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}
export function validateCareerApplication(p) {
  if (p.website) throw new HttpError('Unable to accept this application.');
  if (p.privacy !== true) throw new HttpError('Please consent to processing your application.');
  const email = text(p.email, 'your email address', 254, 3).toLowerCase();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new HttpError('Enter a valid email address.');
  const phone = text(p.phone, 'your phone number', 30);
  if (phone && (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15)) throw new HttpError('Enter a valid phone number.');
  const resume = validateCareerResume(p.resume), portfolio_url = careerPortfolioUrl(p.portfolio_url);
  if (!resume && !portfolio_url) throw new HttpError('Add a PDF CV or a public HTTPS link to your professional profile or CV.');
  return { request_id: careerUuid(p.request_id), job_id: careerUuid(p.job_id, 'role'), name: text(p.name, 'your name', 120, 2), email, phone, current_location: text(p.current_location, 'your location', 160), message: text(p.message, 'your introduction', 5000, 20), portfolio_url, privacy: true, ...(resume ? { resume } : {}) };
}
export function validateCareerSettings(p) {
  if (!p || typeof p.enabled !== 'boolean') throw new HttpError('Choose whether the careers page is open.');
  return { enabled: p.enabled, headline: text(p.headline, 'the headline', 160, 5), intro: text(p.intro, 'the introduction', 3000, 20), empty_message: text(p.empty_message, 'the empty-state message', 1000, 10), application_intro: text(p.application_intro, 'the application introduction', 1200, 10), version: version(p.version) };
}
export function validateCareerJob(p) {
  if (!p || typeof p !== 'object') throw new HttpError('Check the role details.');
  const slug = text(p.slug, 'the URL slug', 100, 2);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new HttpError('Use lowercase letters, numbers and single hyphens in the URL slug.');
  if (!CAREER_JOB_STATUSES.includes(p.status) || !CAREER_WORK_MODES.includes(p.work_mode) || !CAREER_EMPLOYMENT_TYPES.includes(p.employment_type)) throw new HttpError('Check the role status, work mode and employment type.');
  let closes_at = null;
  if (p.closes_at) { if (typeof p.closes_at !== 'string' || !Number.isFinite(Date.parse(p.closes_at))) throw new HttpError('Choose a valid closing date.'); closes_at = new Date(p.closes_at).toISOString(); }
  const job = { id: p.id ? careerUuid(p.id, 'role') : null, slug, title: text(p.title, 'the role title', 160, 3), department: text(p.department, 'the department', 120, 2), location: text(p.location, 'the work location', 160, 2), work_mode: p.work_mode, employment_type: p.employment_type, summary: text(p.summary, 'the summary', 1000, 20), description: text(p.description, 'the role description', 15000, 40), responsibilities: text(p.responsibilities, 'the responsibilities', 10000), requirements: text(p.requirements, 'the requirements', 10000), salary_text: text(p.salary_text, 'the compensation information', 250), closes_at, status: p.status };
  if (job.id) job.version = version(p.version);
  return job;
}
export function validateCareerAdminAction(p) {
  if (p.action === 'save_settings') return { action: p.action, settings: validateCareerSettings(p.settings) };
  if (p.action === 'save_job') return { action: p.action, job: validateCareerJob(p.job) };
  if (p.action === 'update_application') {
    if (!CAREER_APPLICATION_STATUSES.includes(p.status)) throw new HttpError('Choose a valid application status.');
    return { action: p.action, id: careerUuid(p.id), version: version(p.version), status: p.status, notes: text(p.notes, 'the internal notes', 5000) };
  }
  throw new HttpError('Choose a careers action.');
}
