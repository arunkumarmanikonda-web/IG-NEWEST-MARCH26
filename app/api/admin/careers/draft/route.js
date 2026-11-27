import { careersAdminContext } from '../../../../../lib/careers-admin';
import { createCareerDraft } from '../../../../../lib/career-drafting.mjs';
import { runtimeConfigs } from '../../../../../lib/runtime-config';
import { readJson, privateJson, errorJson } from '../../../../../lib/http.mjs';

export const maxDuration = 60;
export async function POST(request) {
  try {
    await careersAdminContext();
    const input = await readJson(request, 14000);
    const { openai } = await runtimeConfigs('openai');
    return privateJson({ job: await createCareerDraft(input, openai) });
  } catch (error) { return errorJson(error); }
}
