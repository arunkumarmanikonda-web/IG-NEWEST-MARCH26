begin;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('person','arun-manikonda','Arun Manikonda','Founder and Managing Director, bringing over two decades of experience across real estate, hospitality, entertainment and complex commercial transactions.','Arun founded India Gully to bring commercial advisory and hands-on execution into one practice. His work spans asset strategy, transactions, hospitality development and the operating decisions that determine long-term value.

## Experience and perspective

With more than 20 years of experience across real estate, hospitality and entertainment, Arun brings a promoter’s understanding of business priorities alongside an adviser’s discipline in preparing and executing transactions. His leadership experience includes Entertainment City Limited, Noida, home to The Great India Place, Gardens Galleria and Worlds of Wonder.

## At India Gully

Arun leads the firm’s strategy, senior client relationships and complex mandates. He works with promoters, asset owners, investors and operating partners to assess opportunities, structure the commercial approach and coordinate the work required to move from an initial brief to a considered decision.

His focus includes real estate transactions, hospitality feasibility and operator strategy, development partnerships, debt advisory and special situations.','{"image":"/images/arun.jpg","image_alt":"Arun Manikonda","job_title":"Founder & Managing Director","sort_order":"1","expertise":"Corporate strategy;Transaction advisory;Hospitality;Special situations"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('person','pavan-manikonda','Pavan Manikonda','Executive Director with more than 18 years of experience in hotel operations, brand engagement and the procurement requirements behind a successful hospitality project.','Pavan connects hospitality operations with project delivery and procurement. He brings more than 18 years of sector experience to the practical questions of operating standards, brand requirements, equipment selection and opening readiness.

## Hospitality experience

His experience includes work across hospitality environments associated with Mahindra Holidays, Accor, CGH Earth and WelcomHeritage. This operating perspective informs the way India Gully approaches hotel briefs, vendor coordination and the detail of guest-facing delivery.

## At India Gully

Pavan leads hospitality operations and HORECA engagement, working with owners, operators and suppliers to align specifications, budgets and delivery requirements. His remit includes brand onboarding support, furniture, fixtures and equipment, operating supplies and project procurement.

He helps clients translate a hospitality concept into an actionable sourcing and delivery programme, with attention to quality, suitability and coordination.','{"image":"/images/pavan.jpg","image_alt":"Pavan Manikonda","job_title":"Executive Director","sort_order":"2","expertise":"Hotel operations;Brand engagement;HORECA procurement;Project delivery"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('person','amit-jhingan','Amit Jhingan','President, Real Estate, with more than 15 years of experience in real estate transactions, retail leasing, investments and asset management across India.','Amit leads India Gully’s real estate practice, combining transaction experience with a detailed understanding of retail destinations, leasing economics and asset positioning.

## Market experience

With more than 15 years of experience, his work spans acquisitions, investments, leasing and asset management. His professional experience includes engagements associated with Gardens Galleria, Hyatt Andaz, AIPL Joy Street and Entertainment City Limited.

## At India Gully

Amit works with property owners, developers, investors and occupiers to define the commercial brief, identify suitable counterparties and coordinate negotiations. He brings particular focus to retail and commercial assets, tenant mix, income potential and the practical requirements of execution.

His role connects market intelligence with active mandate delivery, from initial opportunity assessment through commercial discussions and transaction coordination.','{"image":"/images/amit.png","image_alt":"Amit Jhingan","job_title":"President · Real Estate","sort_order":"3","expertise":"Real estate transactions;Retail leasing;Investment advisory;Asset management"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('page','company-story','An Indian perspective. A broader commercial view.','Independent thinking across real estate, hospitality, capital and execution.','India Gully is a brand of Vivacious Entertainment and Hospitality Private Limited, incorporated in 2017. We work with owners, promoters, investors and operators at the intersection of real estate, hospitality and business.

Our work begins with the commercial question: what should an asset become, who is the right partner, how should a transaction be prepared, and what will it take to deliver? We bring together advisory, market engagement and execution support to answer those questions in context.

“Celebrating Desiness” reflects our Indian roots and the entrepreneurial spirit of the businesses we serve. It sits alongside a disciplined approach to information, accountability and delivery.','{}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('page','company-vision','Our vision','To be a trusted Indian partner for considered investment, distinctive destinations and commercially sound growth.','We seek to connect local understanding with professional execution, helping clients make better decisions about assets, capital and the businesses they build.','{}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('page','company-mission','Our mission','Turn a clear commercial brief into coordinated action.','Bring the right expertise, market intelligence and counterparties to each assignment. Prepare information carefully, protect confidentiality and remain accountable for the work entrusted to us.','{}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','entertainment-city','Entertainment City, Noida','Joint transaction advisory engagement alongside EY across a significant retail and entertainment destination.','The assignment brought together commercial preparation, stakeholder coordination and transaction engagement for a complex destination asset.

## Scope of involvement

Transaction preparation. Stakeholder coordination.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"Transaction advisory","city":"Noida","expertise":"Transaction preparation;Stakeholder coordination","sort_order":"1"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','anand-lok','Anand Lok','Acquisition and strata-sale advisory for a commercial real estate assignment.','The engagement connected acquisition assessment with a subsequent strata-sale strategy and commercial execution support.

## Scope of involvement

Acquisition advisory. Strata-sale strategy.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"Real estate","city":"Delhi NCR","expertise":"Acquisition advisory;Strata-sale strategy","sort_order":"2"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','khubani-andaz','Khubani at Andaz','Leasing engagement for a hospitality-led dining and entertainment concept.','India Gully’s involvement connected the occupier requirement with the commercial leasing process within the Andaz hospitality environment.

## Scope of involvement

F&B leasing. Commercial coordination.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"Retail & F&B","city":"New Delhi","expertise":"F&B leasing;Commercial coordination","sort_order":"3"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','gardens-galleria','Gardens Galleria','F&B leasing work across a destination-led retail environment.','Engagements included concepts such as Dearie, Impulse and Maricham, connecting brand requirements with the destination’s leasing opportunity.

## Scope of involvement

Brand engagement. Destination leasing.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"Retail & F&B","city":"Noida","expertise":"Brand engagement;Destination leasing","sort_order":"4"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','fern-residency','The Fern Residency','Project management consultancy for a hotel development.','An owner-focused project coordination assignment, connecting project priorities, consultant interfaces and delivery requirements.

## Scope of involvement

Project coordination. PMC.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"Hospitality / PMC","city":"Noida","expertise":"Project coordination;PMC","sort_order":"5"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','regenta-central','Regenta Central','Hospitality project management and delivery coordination.','Project management consultancy supported the coordination needed to progress a hotel brief through its delivery stages.

## Scope of involvement

PMC. Delivery coordination.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"Hospitality / PMC","city":"Noida","expertise":"PMC;Delivery coordination","sort_order":"6"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','cygnett-inn-corbett','Cygnett Inn','Project coordination in a resort and leisure hospitality setting.','The assignment brought hospitality operating considerations into project coordination and delivery planning.

## Scope of involvement

Hospitality planning. PMC.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"Hospitality / PMC","city":"Corbett","expertise":"Hospitality planning;PMC","sort_order":"7"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','grand-hyatt','Grand Hyatt','Signage-related procurement and coordination for a hospitality environment.','A specialist procurement assignment requiring attention to specification, presentation and project interfaces.

## Scope of involvement

Signage. Procurement coordination.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"Hospitality procurement","city":"Gurugram","expertise":"Signage;Procurement coordination","sort_order":"8"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','mahindra-holidays','Mahindra Holidays','Hospitality supplies and procurement engagement.','A HORECA engagement focused on the supplies and specifications required in operating hospitality properties.

## Scope of involvement

Operating supplies. HORECA.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"HORECA","city":"India","expertise":"Operating supplies;HORECA","sort_order":"9"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','cgh-earth','CGH Earth','Procurement engagement for experience-led hospitality.','Hospitality sourcing work connected product requirements with the operating context of the property.

## Scope of involvement

Hospitality sourcing. Operating supplies.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"HORECA","city":"India","expertise":"Hospitality sourcing;Operating supplies","sort_order":"10"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','novotel-bengaluru','Novotel','Hospitality procurement and operating supplies.','A procurement engagement supporting the practical product requirements of a hotel operating environment.

## Scope of involvement

HORECA. Procurement.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"HORECA","city":"Bengaluru","expertise":"HORECA;Procurement","sort_order":"11"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
with inserted as (insert into public.ig_content(kind,slug,title,summary,body,public_data,status,published_version) values('project','peach-tree','Peach Tree','Leasing and fit-out coordination for a commercial property.','The engagement linked leasing discussions with the practical coordination required to prepare commercial space for occupation.

## Scope of involvement

Leasing. Fit-out coordination.

This is a selected historical engagement. It is not an offer of the asset or a representation of a current exclusive mandate.','{"sector":"Retail & fit-out","city":"Faridabad","expertise":"Leasing;Fit-out coordination","sort_order":"12"}','published',1) on conflict(kind,slug) do nothing returning *)
insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(inserted) from inserted;
insert into public.ig_public_content(id,kind,slug,title,summary,body,seo_title,seo_description,public_data,version) select id,kind,slug,title,summary,body,seo_title,seo_description,public_data,version from public.ig_content where kind in ('person','page','project') and status='published' on conflict(id) do nothing;
with updated as (update public.ig_content set public_data=case when kind='opportunity' then public_data-'image' else jsonb_set(public_data,'{image}','"/images/dining.jpg"') end,version=version+1,published_version=version+1,updated_at=now() where public_data->>'image' in ('/images/jaipur.jpg','/images/courtyard.jpg') and status='published' and version=published_version returning *) insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(updated) from updated;
update public.ig_public_content p set public_data=c.public_data,version=c.version,published_at=now() from public.ig_content c where p.id=c.id and p.public_data->>'image' in ('/images/jaipur.jpg','/images/courtyard.jpg');
insert into public.ig_audit(action,detail) values('editorial.source_migration','{"source":"indiagully.com/about and /works","reviewed":"2026-11-11","scope":"company, leadership, historical work and invalid media removal"}');
commit;
