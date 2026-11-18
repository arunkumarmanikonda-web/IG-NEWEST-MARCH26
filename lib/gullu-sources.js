import "server-only";
import { anonymousServerClient } from "./runtime-config";
import { currentPolicies } from "./policies";
import { publishedWithTags } from "./cms";
import { livePractices } from "./website";
import {publicDocuments} from "./gullu.mjs";
import {retrieveGulluRows} from "./gullu-retrieval.mjs";

export async function liveGulluDocuments(question,history,page) {
  const [records,practices,policies]=await Promise.all([retrieveGulluRows(anonymousServerClient(),(client,columns)=>publishedWithTags(client,"opportunity",columns),question,history,page),livePractices(),currentPolicies()]);
  return publicDocuments({records,practices,policies});
}
