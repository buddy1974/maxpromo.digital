module.exports=[18622,(e,t,n)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,n)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,n)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},16218,e=>{"use strict";var t=e.i(22254),n=e.i(44),r=e.i(71405),a=e.i(49842),i=e.i(46656),o=e.i(20165),s=e.i(48640),l=e.i(86089),d=e.i(66079),c=e.i(86101),u=e.i(48050),p=e.i(84962),h=e.i(4088),m=e.i(99181),g=e.i(97605),x=e.i(93695);e.i(65405);var f=e.i(79953),v=e.i(17484);let R=`You are an invoice extraction assistant for MAXPROMO DIGITAL, a German AI and web development agency.

Your job is to extract ONLY the commercially relevant information from raw input — whether typed notes, pasted text, or screenshots.

IGNORE and discard:
- Greetings and pleasantries (Hallo, Guten Tag, Dear, Hi etc)
- Email headers and signatures
- Phone numbers in email footers
- Legal disclaimers
- Unrelated conversation
- Timestamps and message metadata
- Social media handles
- Anything not related to the business transaction

EXTRACT and structure:
- Client name and company
- Client contact details (email, phone, address)
- Each ordered item or service with description
- Quantities if mentioned
- Prices if mentioned
- Payment terms if mentioned
- Deposit/Anzahlung if mentioned
- Due dates if mentioned
- Any special instructions relevant to the order

For line items — write clean, professional German business descriptions. Examples:
  Raw: "website 5 seiten 1500"
  Clean: "Website-Entwicklung — 5 Seiten inkl. Kontaktformular und responsivem Design"

  Raw: "logo design"
  Clean: "Logodesign inkl. 2 Entw\xfcrfe und Reinzeichnung als AI/PDF"

  Raw: "flyer a5 500 st\xfcck"
  Clean: "Flyerdruck A5, 500 St\xfcck, 4/4-farbig"

If information is missing or unclear, leave the field empty — do not invent data.

Return ONLY valid JSON with no explanation, no markdown, no code blocks:
{
  "clientName": "",
  "clientCompany": "",
  "clientEmail": "",
  "clientPhone": "",
  "clientAddress": "",
  "clientCity": "",
  "clientPostcode": "",
  "lineItems": [
    {
      "description": "clean professional German description",
      "quantity": 1,
      "unit": "pauschal",
      "unitPrice": 0,
      "finalPrice": 0,
      "isFixedPrice": true,
      "confidence": "high"
    }
  ],
  "anzahlung": 0,
  "anzahlungDate": "",
  "anzahlungMethod": "\xdcberweisung",
  "notes": "",
  "dueDate": "",
  "validUntil": "",
  "type": "rechnung",
  "overallConfidence": "high",
  "extractionNotes": ""
}

Confidence rules:
- "high": value clearly stated in input
- "medium": inferred or partially mentioned
- "low": guessed or very uncertain
- overallConfidence: "high" if name + 2 items clear, "medium" if some gaps, "low" if mostly guessing
- If the word "Angebot" appears, set type: "angebot", otherwise "rechnung"
- extractionNotes: brief note if anything was unclear — e.g. "Price not mentioned — please add manually"

Return ONLY the JSON. No other text.`;async function w(e){try{let{text:t}=await e.json();if(!t?.trim())return v.NextResponse.json({error:"Text required"},{status:400});if(!process.env.ANTHROPIC_API_KEY)return v.NextResponse.json({error:"AI not configured"},{status:503});let n=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2e3,system:R,messages:[{role:"user",content:t}]})});if(!n.ok){let e=await n.text();throw Error(`Anthropic error ${n.status}: ${e}`)}let r=(await n.json()).content[0].text.trim().replace(/^```(?:json)?\n?/,"").replace(/\n?```$/,""),a=JSON.parse(r);return v.NextResponse.json(a)}catch(e){return console.error("[/api/os/ai/generate-invoice]",e),v.NextResponse.json({error:"Extraction failed"},{status:500})}}e.s(["POST",()=>w],97633);var y=e.i(97633);let E=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/os/ai/generate-invoice/route",pathname:"/api/os/ai/generate-invoice",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/projects/maxpromo.digital/apps/web/app/api/os/ai/generate-invoice/route.ts",nextConfigOutput:"",userland:y}),{workAsyncStorage:C,workUnitAsyncStorage:A,serverHooks:b}=E;function N(){return(0,r.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:A})}async function P(e,t,r){E.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let v="/api/os/ai/generate-invoice/route";v=v.replace(/\/index$/,"")||"/";let R=await E.prepare(e,t,{srcPage:v,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:w,params:y,nextConfig:C,parsedUrl:A,isDraftMode:b,prerenderManifest:N,routerServerContext:P,isOnDemandRevalidate:O,revalidateOnlyGenerated:T,resolvedPathname:k,clientReferenceManifest:I,serverActionsManifest:S}=R,j=(0,s.normalizeAppPath)(v),_=!!(N.dynamicRoutes[j]||N.routes[k]),q=async()=>((null==P?void 0:P.render404)?await P.render404(e,t,A,!1):t.end("This page could not be found"),null);if(_&&!b){let e=!!N.routes[k],t=N.dynamicRoutes[j];if(t&&!1===t.fallback&&!e){if(C.experimental.adapterPath)return await q();throw new x.NoFallbackError}}let D=null;!_||E.isDev||b||(D="/index"===(D=k)?"/":D);let H=!0===E.isDev||!_,U=_&&!H;S&&I&&(0,o.setManifestsSingleton)({page:v,clientReferenceManifest:I,serverActionsManifest:S});let M=e.method||"GET",F=(0,i.getTracer)(),$=F.getActiveScopeSpan(),K={params:y,prerenderManifest:N,renderOpts:{experimental:{authInterrupts:!!C.experimental.authInterrupts},cacheComponents:!!C.cacheComponents,supportsDynamicResponse:H,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:C.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,r,a)=>E.onRequestError(e,t,r,a,P)},sharedContext:{buildId:w}},L=new l.NodeNextRequest(e),G=new l.NodeNextResponse(t),Y=d.NextRequestAdapter.fromNodeNextRequest(L,(0,d.signalFromNodeResponse)(t));try{let o=async e=>E.handle(Y,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=F.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=n.get("next.route");if(r){let t=`${M} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t)}else e.updateName(`${M} ${v}`)}),s=!!(0,a.getRequestMeta)(e,"minimalMode"),l=async a=>{var i,l;let d=async({previousCacheEntry:n})=>{try{if(!s&&O&&T&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await o(a);e.fetchMetrics=K.renderOpts.fetchMetrics;let l=K.renderOpts.pendingWaitUntil;l&&r.waitUntil&&(r.waitUntil(l),l=void 0);let d=K.renderOpts.collectedTags;if(!_)return await (0,p.sendResponse)(L,G,i,K.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[g.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,r=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:f.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:r}}}}catch(t){throw(null==n?void 0:n.isStale)&&await E.onRequestError(e,t,{routerKind:"App Router",routePath:v,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:O})},!1,P),t}},c=await E.handleResponse({req:e,nextConfig:C,cacheKey:D,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:N,isRoutePPREnabled:!1,isOnDemandRevalidate:O,revalidateOnlyGenerated:T,responseGenerator:d,waitUntil:r.waitUntil,isMinimalMode:s});if(!_)return null;if((null==c||null==(i=c.value)?void 0:i.kind)!==f.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",O?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),b&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let x=(0,h.fromNodeOutgoingHttpHeaders)(c.value.headers);return s&&_||x.delete(g.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||x.get("Cache-Control")||x.set("Cache-Control",(0,m.getCacheControlHeader)(c.cacheControl)),await (0,p.sendResponse)(L,G,new Response(c.value.body,{headers:x,status:c.value.status||200})),null};$?await l($):await F.withPropagatedContext(e.headers,()=>F.trace(c.BaseServerSpan.handleRequest,{spanName:`${M} ${v}`,kind:i.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},l))}catch(t){if(t instanceof x.NoFallbackError||await E.onRequestError(e,t,{routerKind:"App Router",routePath:j,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:O})},!1,P),_)throw t;return await (0,p.sendResponse)(L,G,new Response(null,{status:500})),null}}e.s(["handler",()=>P,"patchFetch",()=>N,"routeModule",()=>E,"serverHooks",()=>b,"workAsyncStorage",()=>C,"workUnitAsyncStorage",()=>A],16218)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__79e820ca._.js.map