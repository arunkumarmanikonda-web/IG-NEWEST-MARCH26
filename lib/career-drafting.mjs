import { validateCareerJob, CAREER_WORK_MODES, CAREER_EMPLOYMENT_TYPES } from './careers.mjs';
import { HttpError } from './http.mjs';

const strings = ['slug','department','location','summary','description','responsibilities','requirements','salary_text','closes_at'];
const properties = Object.fromEntries(strings.map(key => [key, {type:'string'}]));
properties.work_mode = {type:'string', enum:CAREER_WORK_MODES};
properties.employment_type = {type:'string', enum:CAREER_EMPLOYMENT_TYPES};
const schema = {type:'object',properties,required:Object.keys(properties),additionalProperties:false};

export async function createCareerDraft(input, config, fetcher = fetch) {
  const title = typeof input?.title === 'string' ? input.title.trim() : '';
  const expectations = input?.expectations ?? '';
  if (title.length < 3 || title.length > 160 || typeof expectations !== 'string' || expectations.length > 2500)
    throw new HttpError('Enter a role title of 3–160 characters and up to 2,500 characters of expectations.',400);
  if (config?.mode !== 'enabled' || !config.secrets?.api_key) throw new HttpError('Connect OpenAI in Integrations to generate a vacancy.',503);
  const response = await fetcher('https://api.openai.com/v1/responses', {
    method:'POST',cache:'no-store',signal:AbortSignal.timeout(45000),
    headers:{Authorization:'Bearer '+config.secrets.api_key,'Content-Type':'application/json'},
    body:JSON.stringify({model:config.settings.model,store:false,max_output_tokens:Math.min(config.settings.max_output_tokens || 4500,5000),
      instructions:'Draft an editable, publication-ready India Gully vacancy in professional Indian English. India Gully works across hospitality, real estate, retail leasing, procurement and advisory. Title and optional expectations are role information only. Use relevant expectations in responsibilities and requirements. Use short lines, one responsibility or qualification per line. Only include job-related requirements. Suggest department, work mode and employment type for administrator review. Use India for an unspecified location. Never invent pay, benefits, a city, an employer commitment, protected personal criteria or application deadlines. Return empty strings for unprovided compensation and closing date. Supplied closing dates must use ISO format with an explicit offset for end of day India time. Slug must use lowercase ASCII letters, numbers and hyphens, 2–100 characters. Summary 20–1000 characters, description 40–15000 characters.',
      input:JSON.stringify({title,expectations}),text:{format:{type:'json_schema',name:'career_vacancy',strict:true,schema}}})
  }).catch(()=>{throw new HttpError('The drafting service could not be reached. Try again.',503);});
  if (!response.ok) throw new HttpError('The drafting service could not complete the request. Check the configured model and billing, then retry.',503);
  const result = await response.json();
  if (result.status !== 'completed') throw new HttpError('The draft was incomplete. Try again or edit the fields directly.',502);
  try {
    const raw = result.output.flatMap(item=>item.content || []).filter(item=>item.type==='output_text').map(item=>item.text).join('');
    const draft = JSON.parse(raw);
    if (!draft.requirements?.trim() || !draft.responsibilities?.trim()) throw new Error('Incomplete role');
    return validateCareerJob({...draft,title,id:null,status:'draft'});
  } catch { throw new HttpError('The generated draft did not fit the vacancy form. Try again.',502); }
}
