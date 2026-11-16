import 'server-only';
import { integrationRpc, runtimeConfigs } from './runtime-config';
import { livePractices } from './website';
import { generatePerspective } from './perspectives-engine.mjs';

export async function dispatchPerspective() {
  const run = await integrationRpc('ig_perspective_worker', {action:'claim'});
  if (!run) return;
  try {
    const [configs, practices] = await Promise.all([runtimeConfigs('openai'), livePractices()]);
    const titles = practices.map(practice => practice.title);
    const interests = (run.popular_practices || []).filter(interest => titles.includes(interest));
    const article = await generatePerspective({
      config: configs.openai, practices, recentTitles: run.recent_titles,
      preferredTopic: run.preferred_topic, cadenceDays: run.cadence_days, audienceInterests: interests,
    });
    const image = practices.find(practice => practice.title === article.practice)?.image;
    await integrationRpc('ig_perspective_worker', {action:'publish', run_id:run.run_id, article, image});
  } catch (error) {
    const message = String(error.message || 'Research could not finish').slice(0,350);
    await integrationRpc('ig_perspective_worker', {action:'hold', run_id:run.run_id, error:message});
  }
}
