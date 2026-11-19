import "server-only";
import { anonymousServerClient } from "./runtime-config";
import { currentPolicies } from "./policies";
import { publishedWithTags } from "./cms";
import { livePractices, siteSection } from "./website";
import {publicDocuments} from "./gullu.mjs";
import {retrieveGulluRows} from "./gullu-retrieval.mjs";
import {needsInventory,readPublicInventory} from "./gullu-inventory.mjs";

export async function liveGulluDocuments(question,history,page) {
  const client=anonymousServerClient();
  const [records,practices,policies,inventory,residencesConfig]=await Promise.all([retrieveGulluRows(client,(client,columns)=>publishedWithTags(client,"opportunity",columns),question,history,page),livePractices(),currentPolicies(),needsInventory(question,history)?readPublicInventory(client):null,siteSection("residences-launch")]);
  return {documents:publicDocuments({records,practices,policies,residencesConfig}),inventory};
}
