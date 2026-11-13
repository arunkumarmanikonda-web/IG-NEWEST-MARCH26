insert into public.ig_taxonomy(dimension,slug,label) values('opportunity-context','strategic-investment','Strategic investment') on conflict(dimension,slug) do nothing;
insert into public.ig_taxonomy(dimension,slug,label) values('opportunity-context','cirp','CIRP') on conflict(dimension,slug) do nothing;
insert into public.ig_taxonomy(dimension,slug,label) values('opportunity-context','distressed','Distressed asset') on conflict(dimension,slug) do nothing;
insert into public.ig_taxonomy(dimension,slug,label) values('opportunity-context','special-situation','Special situation') on conflict(dimension,slug) do nothing;
insert into public.ig_taxonomy(dimension,slug,label) values('opportunity-context','turnaround','Turnaround / repositioning') on conflict(dimension,slug) do nothing;
insert into public.ig_taxonomy(dimension,slug,label) values('opportunity-context','income-producing','Income-producing asset') on conflict(dimension,slug) do nothing;
insert into public.ig_taxonomy(dimension,slug,label) values('opportunity-context','development','Development opportunity') on conflict(dimension,slug) do nothing;
insert into public.ig_taxonomy(dimension,slug,label) values('opportunity-context','growth-capital','Growth capital') on conflict(dimension,slug) do nothing;
insert into public.ig_taxonomy(dimension,slug,label) values('opportunity-context','refinancing','Refinancing') on conflict(dimension,slug) do nothing;
insert into public.ig_taxonomy(dimension,slug,label) values('opportunity-context','joint-venture','Joint venture / JDA') on conflict(dimension,slug) do nothing;
insert into public.ig_content(kind,slug,title,summary,body,seo_title,seo_description,public_data,status,published_version) values('opportunity','prism-tower-gurgaon','Prism Tower','A commercial and hospitality asset featured in India Gully’s existing opportunity portfolio.','A commercial and hospitality asset featured in India Gully’s existing opportunity portfolio.

This reference is carried forward from the existing India Gully portfolio. Please contact our team to verify current availability and mandate status.','Prism Tower','A commercial and hospitality asset featured in India Gully’s existing opportunity portfolio.','{"city":"Gurugram","sector":"Commercial","asset_class":"Mixed-use commercial & hospitality","image":"/images/prism.jpg","image_alt":"Prism Tower","reference":"Portfolio reference"}'::jsonb,'published',1) on conflict(kind,slug) do nothing;
insert into public.ig_content(kind,slug,title,summary,body,seo_title,seo_description,public_data,status,published_version) values('opportunity','hotel-rajshree-chandigarh','Hotel Rajshree & Spa','A hotel and spa opportunity featured in India Gully’s existing hospitality portfolio.','A hotel and spa opportunity featured in India Gully’s existing hospitality portfolio.

This reference is carried forward from the existing India Gully portfolio. Please contact our team to verify current availability and mandate status.','Hotel Rajshree & Spa','A hotel and spa opportunity featured in India Gully’s existing hospitality portfolio.','{"city":"Chandigarh","sector":"Hospitality","asset_class":"Hotel & wellness","image":"/images/rajshree.webp","image_alt":"Hotel Rajshree & Spa","reference":"Portfolio reference"}'::jsonb,'published',1) on conflict(kind,slug) do nothing;
insert into public.ig_content(kind,slug,title,summary,body,seo_title,seo_description,public_data,status,published_version) values('opportunity','heritage-hotel-jaipur','Heritage Hotel Structure','A hospitality structure featured in India Gully’s existing portfolio, with development and fit-out considerations to review.','A hospitality structure featured in India Gully’s existing portfolio, with development and fit-out considerations to review.

This reference is carried forward from the existing India Gully portfolio. Please contact our team to verify current availability and mandate status.','Heritage Hotel Structure','A hospitality structure featured in India Gully’s existing portfolio, with development and fit-out considerations to review.','{"city":"Jaipur","sector":"Hospitality","asset_class":"Hospitality development","image":"/images/jaipur.jpg","image_alt":"Heritage Hotel Structure","reference":"Portfolio reference"}'::jsonb,'published',1) on conflict(kind,slug) do nothing;
insert into public.ig_content(kind,slug,title,summary,body,seo_title,seo_description,public_data,status,published_version) values('opportunity','welcomheritage-santa-roza-kasauli','Santa Roza, Kasauli','A resort asset featured in India Gully’s existing hospitality opportunity portfolio.','A resort asset featured in India Gully’s existing hospitality opportunity portfolio.

This reference is carried forward from the existing India Gully portfolio. Please contact our team to verify current availability and mandate status.','Santa Roza, Kasauli','A resort asset featured in India Gully’s existing hospitality opportunity portfolio.','{"city":"Kasauli","sector":"Hospitality","asset_class":"Hill resort","image":"/images/kasauli.jpg","image_alt":"Santa Roza, Kasauli","reference":"Portfolio reference"}'::jsonb,'published',1) on conflict(kind,slug) do nothing;
insert into public.ig_content(kind,slug,title,summary,body,seo_title,seo_description,public_data,status,published_version) values('article','transaction-ready','What makes an asset ready for a serious conversation?','A clear brief and a consistent fact base give the transaction process a stronger starting point.','## Start with the decision

An owner considering a sale, a development partnership or refinancing is asking three different questions. Define the intended outcome, the time available and the constraints before preparing a presentation or beginning counterparty outreach.

## Build one consistent fact base

Bring the asset description, area measurements, ownership information, approvals, leases and financial records into a controlled information set. Separate a documented fact from a management estimate and an adviser’s assumption. Record the date and source of each important figure.

## Make the commercial case inspectable

Show how revenue, costs, capital expenditure and timing support the proposed transaction. Explain sensitivities and information gaps. A polished memorandum is most useful when the underlying assumptions can be followed.

## Sequence disclosure

An introductory teaser and a detailed diligence room serve different purposes. Agree what can be disclosed at each stage, who can receive it and how questions will be tracked. Specialist advisers should review matters within their respective scopes.','What makes an asset ready for a serious conversation?','A clear brief and a consistent fact base give the transaction process a stronger starting point.','{"sector":"TRANSACTION ADVISORY","image":"/images/prism.jpg","image_alt":"What makes an asset ready for a serious conversation?"}'::jsonb,'published',1) on conflict(kind,slug) do nothing;
insert into public.ig_content(kind,slug,title,summary,body,seo_title,seo_description,public_data,status,published_version) values('article','hospitality-project-brief','A hospitality project starts with a better brief.','Connect the guest proposition, operating requirements and project budget before design decisions harden.','## Define the guest and the occasion

A hotel serving business travel, a leisure resort and a banquet-led property have different operating requirements. Set out the intended guest, stay pattern and role of rooms, food and beverage, events and other facilities.

## Bring operations into design

The design brief should address guest movement, service circulation, storage, kitchens, housekeeping and maintenance alongside the visible experience. Review these interfaces with the relevant design and operating professionals.

## Connect the budget to the programme

Separate building works, interiors, equipment, operating supplies and pre-opening requirements. Track responsibilities, dependencies and decision dates so that a late specification or approval does not become a surprise at handover.

## Treat opening as a workstream

Opening readiness includes staffing, training, operating procedures, supplies, systems and testing. Define acceptance criteria and the handover evidence required from each appointed party.','A hospitality project starts with a better brief.','Connect the guest proposition, operating requirements and project budget before design decisions harden.','{"sector":"HOSPITALITY & PROJECTS","image":"/images/dining.jpg","image_alt":"A hospitality project starts with a better brief."}'::jsonb,'published',1) on conflict(kind,slug) do nothing;
insert into public.ig_content(kind,slug,title,summary,body,seo_title,seo_description,public_data,status,published_version) values('article','procurement-comparison','Compare specifications before comparing prices.','A useful procurement comparison makes inclusions, quantities and commercial terms visible.','## Keep the requirement identifiable

Assign each requirement a stable line reference. Record the intended use, specification, unit of measure and quantity. Preserve that reference through vendor responses, substitutions, approvals and orders.

## Distinguish a match from a substitution

A similar description does not necessarily represent the same product. Compare material, dimensions, capacity, finish, accessories, warranty and service scope. Identify deviations explicitly and obtain approval before treating alternatives as equivalent.

## Compare the complete commercial basis

Keep base price, taxes, freight, installation and other charges separately visible. Compare minimum quantities, lead times, payment terms and delivery locations alongside price. Mark unquoted lines rather than assigning assumed rates.

## Close the loop with an approval record

Record the selected specification, sample approval, commercial terms and delivery requirement. A change after selection should create a new version so the project team can identify what was ordered and why.','Compare specifications before comparing prices.','A useful procurement comparison makes inclusions, quantities and commercial terms visible.','{"sector":"HORECA PROCUREMENT","image":"/images/courtyard.jpg","image_alt":"Compare specifications before comparing prices."}'::jsonb,'published',1) on conflict(kind,slug) do nothing;
insert into public.ig_public_content(id,kind,slug,title,summary,body,seo_title,seo_description,public_data,version) select id,kind,slug,title,summary,body,seo_title,seo_description,public_data,version from public.ig_content where published_version=1 on conflict(id) do nothing;
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(c) from public.ig_content c on conflict(content_id,version) do nothing;