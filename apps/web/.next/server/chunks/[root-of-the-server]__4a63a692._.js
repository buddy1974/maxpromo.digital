module.exports=[18622,(e,t,a)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,a)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,a)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},84480,e=>{"use strict";var t=e.i(17484);let a=new Map;function n(e,n){let o=function(e,t){let n=t.windowMs??6e4,o=`${t.scope}:${function(e){let t=e.headers.get("x-forwarded-for");if(t)return t.split(",")[0].trim();let a=e.headers.get("x-real-ip");return a||"local"}(e)}`;a.size>5e3&&!a.has(o)&&a.clear();let r=a.get(o);r||(r={hits:[]},a.set(o,r));var s=r;let i=Date.now()-n;for(;s.hits.length>0&&s.hits[0]<i;)s.hits.shift();if(r.hits.length>=t.limit){let e=r.hits[0];return{allowed:!1,remaining:0,retryAfterSec:Math.ceil(Math.max(0,n-(Date.now()-e))/1e3)}}return r.hits.push(Date.now()),{allowed:!0,remaining:t.limit-r.hits.length,retryAfterSec:0}}(e,n);return o.allowed?null:t.NextResponse.json({error:"Too many requests",detail:`Try again in ${o.retryAfterSec}s.`},{status:429,headers:{"Retry-After":String(o.retryAfterSec)}})}e.s(["enforceRateLimit",()=>n])},32609,e=>{"use strict";async function t(e,t,o){var r;let s;return process.env.ANTHROPIC_API_KEY?a(e,t,o?.maxTokens,o?.model):process.env.OPENAI_API_KEY?n(e,t,o?.maxTokens):{content:(r=e,(s=r[r.length-1]?.content?.toLowerCase()??"").includes("automat")||s.includes("workflow")||s.includes("agent")?"Maxpromo Digital specialises in AI agents and automation systems that save organisations 10–30 hours per week. Common automations include lead qualification agents, document processing AI, and customer support bots. Would you like to contact us about what we can automate for you?":s.includes("price")||s.includes("cost")||s.includes("how much")||s.includes("pricing")?"Our pricing starts from £2,500 for a Starter automation project, £6,500 for the Growth package (up to 4 workflows + AI agents), and custom rates for Enterprise. The best starting point is to contact us — shall I point you there?":s.includes("website")||s.includes("ai website")?"We build AI-enhanced websites with built-in chat assistants, automated lead capture, knowledge bots, and smart search — built with Next.js and deployed on Vercel. These go far beyond static brochure sites.":"Maxpromo Digital builds AI agents and automation systems for businesses, NGOs, and government organisations. I can tell you about our services and pricing, or help you contact us. What would you like to know?"),model:"mock"}}async function a(e,t,n=1024,o="claude-sonnet-4-6"){let r={model:o,max_tokens:n,messages:e.filter(e=>"system"!==e.role).map(e=>({role:e.role,content:e.content}))};t&&(r.system=t);let s=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify(r)});if(!s.ok){let e=await s.text();throw Error(`Anthropic API error ${s.status}: ${e}`)}let i=await s.json();return{content:i.content[0].text,model:i.model}}async function n(e,t,a=1024){let o=t?[{role:"system",content:t},...e]:e,r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o-mini",max_tokens:a,messages:o})});if(!r.ok){let e=await r.text();throw Error(`OpenAI API error ${r.status}: ${e}`)}let s=await r.json();return{content:s.choices[0].message.content,model:s.model}}e.s(["callAI",()=>t])},56317,e=>{"use strict";var t=e.i(22254),a=e.i(44),n=e.i(71405),o=e.i(49842),r=e.i(46656),s=e.i(20165),i=e.i(48640),l=e.i(86089),c=e.i(66079),u=e.i(86101),d=e.i(48050),p=e.i(84962),m=e.i(4088),h=e.i(99181),g=e.i(97605),f=e.i(93695);e.i(65405);var w=e.i(79953),A=e.i(17484),y=e.i(32609),x=e.i(84480);let I=`You are Max, the AI assistant for Maxpromo Digital — a specialist AI automation agency. You are intelligent, helpful, direct, and focused on helping visitors understand how automation can benefit their business.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABOUT MAXPROMO DIGITAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Maxpromo Digital builds AI automation systems for businesses. We specialise in:

1. AI Agentic Workflows — autonomous agents that perceive, decide, and act
2. Process & Workflow Automation — n8n, Make, Zapier integrations end-to-end
3. Web Development + AI — Next.js platforms with embedded AI capabilities
4. App Development + Automation — custom internal tools and client portals
5. Document Intelligence — AI that reads and processes documents automatically
6. Social Media Automation — AI content pipelines, scheduling, monitoring
7. AI Chatbots & Assistants — custom agents trained on business data
8. Systems Integration & APIs — connecting entire tool stacks via webhook and API

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRICING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Starter: from \xa32,500 (one workflow/agent, 7-14 days delivery)
Growth: from \xa36,500 (up to 3 workflows, 3-6 weeks delivery)
Enterprise: custom pricing, retainer available

Payment: 50% upfront, 50% on delivery.
Payment plans available for projects over \xa33,000.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK WE USE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI: Claude AI, OpenAI, LangChain
Automation: n8n, Make, Zapier, Airtable
Infrastructure: Supabase, Neon, Vercel, Render, Next.js, Cloudflare
Integrations: HubSpot, Salesforce, Notion, Slack, Xero, QuickBooks, Google Workspace, Microsoft 365, Zendesk, Shopify, Twilio, Resend, Calendly, Buffer, WordPress

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
18 AUTOMATION SYSTEMS AVAILABLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Agents: Lead Qualification Agent, Customer Support AI Agent, Contract Review Agent, Research & Briefing Agent, Proposal Generation Agent, Internal Knowledge Assistant

Workflow: Invoice Processing, CRM Lead Routing, Meeting Summarisation, Employee Onboarding, Reporting Pipeline, Appointment Booking

Content & Social: Social Media Pipeline, Blog & SEO Automation, Email Marketing, Brand Monitoring, Video Repurposing, Product Description AI

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY PAGES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contact: /contact
Automation Lab: /automation-lab
Services: /services
Pricing: /pricing
Case Studies: /case-studies
Contact: /contact

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO HANDLE EVERY SCENARIO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRICING QUESTIONS:
Give specific numbers. Do not be vague. Direct interested visitors to the contact page.

SERVICE QUESTIONS:
Be specific about what we can build. Give a real example of how it works. Reference the automation lab for browsing.

"CAN YOU BUILD X?" QUESTIONS:
Almost always yes — be confident. If unsure, say "yes, that's achievable — let me direct you to our contact page so we can scope it properly." Never say we can't do something without being certain.

BOOKING / CONTACT:
Direct to /contact for discovery calls. Mention it is free, 30 minutes, no commitment.

COMPETITOR COMPARISONS:
Do not disparage competitors. Focus on our strengths: speed, custom builds, ROI focus, Claude AI.

TECHNICAL QUESTIONS:
Answer them. Visitors may be technical. Explain how n8n works, what webhooks do, how Claude API is used, etc.

ROI / BUSINESS CASE QUESTIONS:
Use specific numbers from our case studies. Direct to the ROI calculator on homepage. Typical payback: 60-90 days.

FRUSTRATED OR IMPATIENT VISITORS:
Acknowledge. Be direct. Offer to connect them immediately.

OFF-TOPIC QUESTIONS:
If someone asks something unrelated to business automation, politely redirect: "That is outside my area — I am specialised in automation and AI systems. Can I help you with anything related to automating your business?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE STYLE RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Maximum 4 sentences per response unless a list is genuinely needed
- Use bullet points only when listing 3 or more items
- Never use jargon without explaining it
- Always end with either an answer, a next step, or a question
- Be warm but professional — not corporate
- Never say "Great question!" or "Certainly!" — just answer
- If recommending a page, give the actual URL path
- Use \xa3 for pricing (not $ or €)`;async function R(e){let t=(0,x.enforceRateLimit)(e,{scope:"chat",limit:20,windowMs:6e4});if(t)return t;try{let{messages:t}=await e.json();if(!Array.isArray(t)||0===t.length)return A.NextResponse.json({error:"Messages array is required."},{status:400});let a=t.filter(e=>"user"===e.role||"assistant"===e.role).slice(-24),n=await (0,y.callAI)(a,I,{maxTokens:600,model:"claude-sonnet-4-6"});return A.NextResponse.json({message:n.content,model:n.model})}catch(e){return console.error("[/api/chat]",e),A.NextResponse.json({error:"Failed to get a response. Please try again."},{status:500})}}e.s(["POST",()=>R],53080);var v=e.i(53080);let E=new t.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/chat/route",pathname:"/api/chat",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/projects/maxpromo.digital/apps/web/app/api/chat/route.ts",nextConfigOutput:"",userland:v}),{workAsyncStorage:b,workUnitAsyncStorage:S,serverHooks:C}=E;function O(){return(0,n.patchFetch)({workAsyncStorage:b,workUnitAsyncStorage:S})}async function T(e,t,n){E.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let A="/api/chat/route";A=A.replace(/\/index$/,"")||"/";let y=await E.prepare(e,t,{srcPage:A,multiZoneDraftMode:!1});if(!y)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:x,params:I,nextConfig:R,parsedUrl:v,isDraftMode:b,prerenderManifest:S,routerServerContext:C,isOnDemandRevalidate:O,revalidateOnlyGenerated:T,resolvedPathname:k,clientReferenceManifest:N,serverActionsManifest:P}=y,M=(0,i.normalizeAppPath)(A),j=!!(S.dynamicRoutes[M]||S.routes[k]),U=async()=>((null==C?void 0:C.render404)?await C.render404(e,t,v,!1):t.end("This page could not be found"),null);if(j&&!b){let e=!!S.routes[k],t=S.dynamicRoutes[M];if(t&&!1===t.fallback&&!e){if(R.experimental.adapterPath)return await U();throw new f.NoFallbackError}}let D=null;!j||E.isDev||b||(D="/index"===(D=k)?"/":D);let _=!0===E.isDev||!j,q=j&&!_;P&&N&&(0,s.setManifestsSingleton)({page:A,clientReferenceManifest:N,serverActionsManifest:P});let H=e.method||"GET",L=(0,r.getTracer)(),B=L.getActiveScopeSpan(),$={params:I,prerenderManifest:S,renderOpts:{experimental:{authInterrupts:!!R.experimental.authInterrupts},cacheComponents:!!R.cacheComponents,supportsDynamicResponse:_,incrementalCache:(0,o.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:R.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,n,o)=>E.onRequestError(e,t,n,o,C)},sharedContext:{buildId:x}},G=new l.NodeNextRequest(e),K=new l.NodeNextResponse(t),W=c.NextRequestAdapter.fromNodeNextRequest(G,(0,c.signalFromNodeResponse)(t));try{let s=async e=>E.handle(W,$).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=L.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=a.get("next.route");if(n){let t=`${H} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t)}else e.updateName(`${H} ${A}`)}),i=!!(0,o.getRequestMeta)(e,"minimalMode"),l=async o=>{var r,l;let c=async({previousCacheEntry:a})=>{try{if(!i&&O&&T&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let r=await s(o);e.fetchMetrics=$.renderOpts.fetchMetrics;let l=$.renderOpts.pendingWaitUntil;l&&n.waitUntil&&(n.waitUntil(l),l=void 0);let c=$.renderOpts.collectedTags;if(!j)return await (0,p.sendResponse)(G,K,r,$.renderOpts.pendingWaitUntil),null;{let e=await r.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(r.headers);c&&(t[g.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==$.renderOpts.collectedRevalidate&&!($.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&$.renderOpts.collectedRevalidate,n=void 0===$.renderOpts.collectedExpire||$.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:$.renderOpts.collectedExpire;return{value:{kind:w.CachedRouteKind.APP_ROUTE,status:r.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:n}}}}catch(t){throw(null==a?void 0:a.isStale)&&await E.onRequestError(e,t,{routerKind:"App Router",routePath:A,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:q,isOnDemandRevalidate:O})},!1,C),t}},u=await E.handleResponse({req:e,nextConfig:R,cacheKey:D,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:O,revalidateOnlyGenerated:T,responseGenerator:c,waitUntil:n.waitUntil,isMinimalMode:i});if(!j)return null;if((null==u||null==(r=u.value)?void 0:r.kind)!==w.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(l=u.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",O?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),b&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,m.fromNodeOutgoingHttpHeaders)(u.value.headers);return i&&j||f.delete(g.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,h.getCacheControlHeader)(u.cacheControl)),await (0,p.sendResponse)(G,K,new Response(u.value.body,{headers:f,status:u.value.status||200})),null};B?await l(B):await L.withPropagatedContext(e.headers,()=>L.trace(u.BaseServerSpan.handleRequest,{spanName:`${H} ${A}`,kind:r.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},l))}catch(t){if(t instanceof f.NoFallbackError||await E.onRequestError(e,t,{routerKind:"App Router",routePath:M,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:q,isOnDemandRevalidate:O})},!1,C),j)throw t;return await (0,p.sendResponse)(G,K,new Response(null,{status:500})),null}}e.s(["handler",()=>T,"patchFetch",()=>O,"routeModule",()=>E,"serverHooks",()=>C,"workAsyncStorage",()=>b,"workUnitAsyncStorage",()=>S],56317)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__4a63a692._.js.map