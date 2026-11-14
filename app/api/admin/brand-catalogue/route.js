import { queueDraftHero } from "../../../../lib/draft-hero";
import { isStaff } from "../../../../lib/sign-in.mjs";
import { accountContext } from "../../../../lib/supabase/server";
import {
  readJson,
  privateJson,
  errorJson,
  HttpError,
} from "../../../../lib/http.mjs";
import { runtimeConfigs, integrationRpc } from "../../../../lib/runtime-config";
import { extractCataloguePage } from "../../../../lib/brand-catalogue.mjs";
import {
  renderCataloguePage,
  cropCatalogueImage,
} from "../../../../lib/catalogue-media.mjs";
export const maxDuration = 180;
export async function POST(request) {
  let page, aiJob;
  try {
    const p = await readJson(request, 10000),
      { client, user, profile, staffVerified } = await accountContext();
    if (
      !user ||
      profile?.status !== "active" ||
      profile.must_change_password ||
      (!isStaff(profile) || !staffVerified)
    )
      throw new HttpError("Staff sign-in required", 403);
    async function rpc(payload) {
      const { data, error } = await client.rpc("ig_brand_catalogue", {
        p: payload,
      });
      if (error)
        throw new HttpError(error.message, error.code === "42501" ? 403 : 409);
      return data;
    }
    if (p.action === "prepare") {
      if (
        !/\.pdf$/i.test(p.name || "") ||
        !Number.isSafeInteger(p.size) ||
        p.size < 1
      )
        throw new HttpError("Select a non-empty PDF catalogue");
      const catalogue = await rpc(p);
      if (catalogue.uploaded) return privateJson({ catalogue });
      const { data, error } = await client.storage
        .from("ig-brand-catalogues")
        .createSignedUploadUrl(catalogue.path);
      if (error)
        throw new HttpError("Catalogue upload could not be authorised", 503);
      return privateJson({
        catalogue,
        upload: { path: data.path, token: data.token },
      });
    }
    if (p.action === "image") {
      if (p.approved !== true) throw new HttpError("Image generation requires approval.");
      const { data: pageRow, error: pageError } = await client.from("ig_catalogue_pages")
        .select("id").eq("catalogue_id",p.id).eq("page_number",p.page).eq("status","ready").maybeSingle();
      if (pageError || !pageRow) throw new HttpError("The completed catalogue page is unavailable.",404);
      const { data: links, error: linkError } = await client.from("ig_catalogue_items")
        .select("media_id,ig_source_media(state)").eq("page_id",pageRow.id).eq("content_id",p.product);
      if (linkError || !links?.length) throw new HttpError("This product is unavailable on the selected page.",404);
      if (links.some(row=>row.ig_source_media?.state === "ready")) return privateJson({status:"existing"});
      const {data: record,error: recordError} = await client.from("ig_content")
        .select("id,kind,practice,title,body,summary,public_data,status,published_version").eq("id",p.product).eq("kind","product").single();
      if (recordError || !record) throw new HttpError("Product draft unavailable.",404);
      if (record.status !== "draft" || record.published_version) return privateJson({status:"existing"});
      try { return privateJson({status:await queueDraftHero(client,record)}); }
      catch (e) {
        if (/wait 30 seconds/i.test(e.message)) return privateJson({status:"wait",seconds:31});
        throw new HttpError(e.message,409);
      }
    }
    if (
      p.action !== "process" ||
      !Number.isInteger(p.page) ||
      p.page < 1 ||
      p.page > 500
    )
      throw new HttpError("Choose a catalogue page");
    const config = (await runtimeConfigs()).openai;
    if (config.mode !== "enabled" || !config.secrets.api_key)
      throw new HttpError("Enable OpenAI in integration settings", 503);
    const claim = await rpc({ action: "claim", id: p.id, page: p.page });
    page = claim.page;
    const catalogue = claim.catalogue;
    if (page.status !== "ready") {
      const { data: source, error } = await client.storage
        .from("ig-brand-catalogues")
        .download(catalogue.path);
      if (error) throw new HttpError("Catalogue PDF is unavailable", 503);
      const rendered = await renderCataloguePage(
        Buffer.from(await source.arrayBuffer()),
        p.page,
      );
      const prepared = await client.rpc("ig_ai_prepare", {
        p: {
          practice: "horeca",
          context: {
            kind: "brand_catalogue",
            catalogue_id: catalogue.id,
            name: catalogue.name,
            brand: catalogue.brand,
            page: p.page,
            sha256: catalogue.sha256,
          },
        },
      });
      if (prepared.error) throw new HttpError(prepared.error.message, 429);
      aiJob = prepared.data;
      const extraction = await extractCataloguePage(config, {
        brand: catalogue.brand,
        name: catalogue.name,
        page: p.page,
        ...rendered,
      });
      await integrationRpc("ig_ai_finish", {
        id: aiJob.id,
        status: "ready",
        draft: extraction.result,
        provider_id: extraction.provider_id,
        usage: extraction.usage,
      });
      aiJob = null;
      for (let i = 0; i < extraction.result.products.length; i++) {
        const product = extraction.result.products[i];
        if (!product.image_id) continue;
        try {
          const bytes = await cropCatalogueImage(
            rendered.candidates.find((c) => c.id === product.image_id).image,
            [0, 0, 1000, 1000],
          );
          if (!bytes) {
            product.review_notes +=
              " Image crop was too small; upload an original image.";
            continue;
          }
          const media = await rpc({
            action: "asset",
            id: p.id,
            page: p.page,
            lease_token: page.lease_token,
            item_no: i,
            alt: (product.title + " · catalogue image").slice(0, 250),
          });
          if (media.state !== "ready") {
            const upload = await client.storage
              .from("ig-source-media")
              .upload(media.path, bytes, {
                contentType: "image/jpeg",
                upsert: false,
                cacheControl: "0",
              });
            if (upload.error && String(upload.error.statusCode) !== "409")
              throw new Error("Image upload failed");
            const done = await client.rpc("ig_source_media_manage", {
              p: { action: "complete", id: media.id },
            });
            if (done.error) throw new Error(done.error.message);
          }
        } catch {
          product.review_notes +=
            " The source image needs a manual upload or replacement.";
        }
      }
      await integrationRpc("ig_catalogue_finish", {
        page_id: page.id,
        lease_token: page.lease_token,
        status: "ready",
        result: extraction.result,
        page_count: rendered.page_count,
      });
      page.result = extraction.result;
      page.status = "ready";
      catalogue.page_count = rendered.page_count;
    }
    const drafts = await rpc({ action: "drafts", id: p.id, page: p.page });
    // Keep hand-edited or published products intact when a page is processed again.
    if (drafts.ids?.length) {
      const {data:records,error}=await client.from("ig_content").select("id,kind,practice,slug,title,summary,body,public_data,status,version,published_version,seo_title,seo_description")
        .in("id",drafts.ids).eq("kind","product").eq("status","draft").eq("version",1).is("published_version",null);
      if(error) throw new HttpError("Product drafts were saved. Resume this page to complete search metadata.",503);
      for(const row of records || []) {
        if(row.seo_title || row.seo_description || row.public_data.seo_keywords) continue;
        const item=page.result?.products?.[drafts.ids.indexOf(row.id)];
        const phrases=[item?.search_phrases,row.title,row.public_data.category,row.public_data.brand,row.public_data.reference].filter(Boolean);
        const {error:saveError}=await client.rpc("ig_save_content",{p:{...row,seo_title:[row.title,row.public_data.brand].filter(Boolean).join(" | ").slice(0,90),
          seo_description:(row.summary||row.title).slice(0,200),public_data:{...row.public_data,seo_keywords:phrases.join(", ").slice(0,500)}}});
        if(saveError && saveError.code!=="40001") throw new HttpError("Product drafts were saved. Resume this page to complete search metadata.",503);
      }
    }
    return privateJson({
      ok: true,
      page_count: catalogue.page_count,
      ...drafts,
    });
  } catch (e) {
    if (aiJob)
      await integrationRpc("ig_ai_finish", {
        id: aiJob.id,
        status: "failed",
      }).catch(() => {});
    if (page?.status === "processing")
      await integrationRpc("ig_catalogue_finish", {
        page_id: page.id,
        lease_token: page.lease_token,
        status: "failed",
        note: e.message,
      }).catch(() => {});
    return errorJson(
      e instanceof HttpError
        ? e
        : new HttpError(e.message || "Catalogue processing unavailable", 503),
    );
  }
}
