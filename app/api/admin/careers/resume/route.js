import { careersAdminContext, careersAdminRpc } from '../../../../../lib/careers-admin';
import { careerUuid } from '../../../../../lib/careers.mjs';
import { errorJson } from '../../../../../lib/http.mjs';

export async function GET(request) {
  try {
    const id = careerUuid(new URL(request.url).searchParams.get('id'));
    const { client } = await careersAdminContext();
    const resume = await careersAdminRpc(client, { action: 'resume', id });
    const name = resume.name.replace(/[^a-zA-Z0-9 ._-]/g, '_');
    return new Response(Buffer.from(resume.base64, 'base64'), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'" } });
  } catch (error) { return errorJson(error); }
}
