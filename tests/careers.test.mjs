import test from 'node:test';
import assert from 'node:assert/strict';
import { CAREER_RESUME_MAX_BYTES, careerPortfolioUrl, validateCareerApplication, validateCareerResume, validateCareerJob, validateCareerSettings, validateCareerAdminAction } from '../lib/careers.mjs';
const request = { request_id: '4e802416-4392-438c-8ea9-f6372c5be37d', job_id: 'd313fbb6-7eba-40ee-9e32-bd23230c2aa9', name: 'Sample Candidate', email: 'sample@example.com', message: 'I am interested in this role and bring relevant experience.', portfolio_url: 'https://example.com/cv', privacy: true };
const job = { slug: 'sample-role', title: 'Sample Role', department: 'Hospitality', location: 'New Delhi', work_mode: 'onsite', employment_type: 'full-time', summary: 'This is a synthetic role summary.', description: 'This is a synthetic role description used for validation.', status: 'draft' };

test('application input keeps only recruitment fields and normalises contacts', () => {
 const actual = validateCareerApplication({ ...request, email: '  Person@Example.COM ', status: 'hired', notes: 'inject', website: '' });
 assert.equal(actual.email, 'person@example.com'); assert.equal(actual.status, undefined); assert.equal(actual.notes, undefined);
 assert.equal(actual.phone, ''); assert.equal(actual.current_location, '');
});
test('consent, bot field, unique reference and CV/profile are required', () => {
 for (const extra of [{ privacy: false }, { website: 'bot.example' }, { request_id: 'bad' }, { job_id: 'bad' }, { portfolio_url: '' }, { name: 'x' }, { message: 'too short' }, { email: 'not-email' }, { phone: 'go away' }]) assert.throws(() => validateCareerApplication({ ...request, ...extra }));
});
test('profile URLs cannot include credentials, local addresses, non-HTTPS or unusual ports', () => {
 for (const value of ['javascript:alert(1)', 'http://example.com/cv', 'https://person:password@example.com/cv', 'https://localhost/x', 'https://127.0.0.1/x', 'https://[::1]/x', 'https://host.internal/x', 'https://example.com:8443/x']) assert.throws(() => careerPortfolioUrl(value), value);
 assert.equal(careerPortfolioUrl('https://www.linkedin.com/in/example'), 'https://www.linkedin.com/in/example');
});
test('resume accepts bounded original PDF bytes and rejects disguised or truncated files', () => {
 const pdf = Buffer.from('%PDF-1.7\nSynthetic fixture\n%%EOF\n');
 const resume = { name: 'Sample CV.pdf', type: 'application/pdf', base64: pdf.toString('base64') };
 assert.equal(validateCareerResume(resume).bytes, pdf.length);
 assert.equal(validateCareerApplication({ ...request, portfolio_url: '', resume }).resume.name, 'Sample CV.pdf');
 for (const changed of [{ name: '../cv.pdf' }, { name: 'cv.pdf.exe' }, { type: 'text/html' }, { base64: Buffer.from('<html>PDF</html>').toString('base64') }, { base64: Buffer.from('%PDF-1.7\ntruncated').toString('base64') }, { base64: resume.base64 + '!!!!' }, { base64: '=AAA' }]) assert.throws(() => validateCareerResume({ ...resume, ...changed }));
});
test('2 MB resume validation is linear and respects exact upload limit', () => {
 const pdf = Buffer.alloc(CAREER_RESUME_MAX_BYTES, 32); pdf.write('%PDF-1.7'); pdf.write('%%EOF', pdf.length - 5);
 assert.equal(validateCareerResume({ name: 'maximum.pdf', type: 'application/pdf', base64: pdf.toString('base64') }).bytes, CAREER_RESUME_MAX_BYTES);
 assert.throws(() => validateCareerResume({ name: 'oversized.pdf', base64: Buffer.concat([pdf, Buffer.from(' ')]).toString('base64') }));
});
test('vacancy edits validate all publication fields and concurrency version', () => {
 assert.equal(validateCareerJob(job).id, null);
 for (const changed of [{ slug: '../bad' }, { status: 'live' }, { work_mode: 'anywhere' }, { closes_at: 'not a date' }, { id: request.job_id }]) assert.throws(() => validateCareerJob({ ...job, ...changed }));
 assert.equal(validateCareerJob({ ...job, id: request.job_id, version: 2, closes_at: '2027-01-10T23:59:59+05:30' }).closes_at, '2027-01-10T18:29:59.000Z');
});
test('settings and candidate updates use explicit allowlists and stale-version guard', () => {
 assert.throws(() => validateCareerSettings({ enabled: true, version: 0 }));
 assert.deepEqual(validateCareerAdminAction({ action: 'update_application', id: request.job_id, status: 'reviewing', notes: 'For interview', version: 2, email: 'overwrite@example.com' }), { action: 'update_application', id: request.job_id, status: 'reviewing', notes: 'For interview', version: 2 });
 assert.throws(() => validateCareerAdminAction({ action: 'update_application', id: request.job_id, status: 'reviewing', notes: 'For interview' }));
 assert.throws(() => validateCareerAdminAction({ action: 'resume', id: request.job_id }));
});
