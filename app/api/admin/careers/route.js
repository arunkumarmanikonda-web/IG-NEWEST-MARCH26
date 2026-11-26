import { careersAdminContext, careersAdminRpc } from '../../../../lib/careers-admin';
import { validateCareerAdminAction } from '../../../../lib/careers.mjs';
import { readJson, privateJson, errorJson } from '../../../../lib/http.mjs';

export async function GET() {
  try { const { client } = await careersAdminContext(); return privateJson(await careersAdminRpc(client, { action: 'status' })); } catch (error) { return errorJson(error); }
}
export async function POST(request) {
  try {
    const p = validateCareerAdminAction(await readJson(request, 60000));
    const { client } = await careersAdminContext();
    return privateJson(await careersAdminRpc(client, p));
  } catch (error) { return errorJson(error); }
}
