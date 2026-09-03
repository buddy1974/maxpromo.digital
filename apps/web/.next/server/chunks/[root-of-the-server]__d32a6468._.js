module.exports=[18622,(e,t,a)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,a)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,a)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},95722,e=>{"use strict";var t=e.i(22254),a=e.i(44),n=e.i(71405),r=e.i(49842),i=e.i(46656),s=e.i(20165),o=e.i(48640),l=e.i(86089),d=e.i(66079),c=e.i(86101),u=e.i(48050),p=e.i(84962),h=e.i(4088),m=e.i(99181),g=e.i(97605),x=e.i(93695);e.i(65405);var v=e.i(79953),f=e.i(17484);let R=`You are an invoice extraction assistant for MAXPROMO DIGITAL, a German AI and web development agency.

The user has shared an image — this could be a photo of handwritten notes, a screenshot of a WhatsApp message, a printed invoice, an email, or any document with order information.

Read ALL text visible in the image. Extract ONLY the commercially relevant information.

IGNORE and discard:
- Greetings and pleasantries
- Email headers and signatures
- Legal disclaimers and footer text
- Unrelated conversation
- Timestamps and metadata

EXTRACT and structure:
- Client name and company
- Client contact details (email, phone, address)
- Each ordered item or service with description
- Quantities if visible
- Prices if visible
- Payment terms if visible
- Deposit/Anzahlung if visible

For line items — write clean, professional German business descriptions:
  Visible: "website 5 seiten 1500"
  Clean:   "Website-Entwicklung — 5 Seiten inkl. Kontaktformular und responsivem Design"

  Visible: "logo"
  Clean:   "Logodesign inkl. Entw\xfcrfe und Reinzeichnung"

If information is missing or unclear, leave the field empty. Do not invent data.

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
- "high": clearly readable in the image
- "medium": partially visible or inferred
- "low": blurry, unclear, or guessed
- overallConfidence: "high" if name + items clear, "medium" if some gaps, "low" if image unclear
- extractionNotes: e.g. "Image partially blurry — prices may need verification"

Return ONLY the JSON. No other text.`;async function y(e){try{let{base64:t,mediaType:a}=await e.json();if(!t)return f.NextResponse.json({error:"Image data required"},{status:400});if(!process.env.ANTHROPIC_API_KEY)return f.NextResponse.json({error:"AI not configured"},{status:503});let n=["image/jpeg","image/png","image/gif","image/webp"].includes(a)?a:"image/jpeg",r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2e3,system:R,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:n,data:t}},{type:"text",text:"Extract all invoice data from this image and return JSON."}]}]})});if(!r.ok){let e=await r.text();throw Error(`Anthropic error ${r.status}: ${e}`)}let i=(await r.json()).content[0].text.trim().replace(/^```(?:json)?\n?/,"").replace(/\n?```$/,""),s=JSON.parse(i);return f.NextResponse.json(s)}catch(e){return console.error("[/api/os/ai/scan-invoice]",e),f.NextResponse.json({error:"Scan extraction failed"},{status:500})}}e.s(["POST",()=>y],1534);var w=e.i(1534);let E=new t.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/os/ai/scan-invoice/route",pathname:"/api/os/ai/scan-invoice",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/projects/maxpromo.digital/apps/web/app/api/os/ai/scan-invoice/route.ts",nextConfigOutput:"",userland:w}),{workAsyncStorage:b,workUnitAsyncStorage:C,serverHooks:A}=E;function N(){return(0,n.patchFetch)({workAsyncStorage:b,workUnitAsyncStorage:C})}async function P(e,t,n){E.isDev&&(0,r.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let f="/api/os/ai/scan-invoice/route";f=f.replace(/\/index$/,"")||"/";let R=await E.prepare(e,t,{srcPage:f,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:y,params:w,nextConfig:b,parsedUrl:C,isDraftMode:A,prerenderManifest:N,routerServerContext:P,isOnDemandRevalidate:O,revalidateOnlyGenerated:T,resolvedPathname:k,clientReferenceManifest:j,serverActionsManifest:I}=R,S=(0,o.normalizeAppPath)(f),_=!!(N.dynamicRoutes[S]||N.routes[k]),q=async()=>((null==P?void 0:P.render404)?await P.render404(e,t,C,!1):t.end("This page could not be found"),null);if(_&&!A){let e=!!N.routes[k],t=N.dynamicRoutes[S];if(t&&!1===t.fallback&&!e){if(b.experimental.adapterPath)return await q();throw new x.NoFallbackError}}let D=null;!_||E.isDev||A||(D="/index"===(D=k)?"/":D);let H=!0===E.isDev||!_,U=_&&!H;I&&j&&(0,s.setManifestsSingleton)({page:f,clientReferenceManifest:j,serverActionsManifest:I});let M=e.method||"GET",L=(0,i.getTracer)(),$=L.getActiveScopeSpan(),K={params:w,prerenderManifest:N,renderOpts:{experimental:{authInterrupts:!!b.experimental.authInterrupts},cacheComponents:!!b.cacheComponents,supportsDynamicResponse:H,incrementalCache:(0,r.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:b.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,n,r)=>E.onRequestError(e,t,n,r,P)},sharedContext:{buildId:y}},F=new l.NodeNextRequest(e),G=new l.NodeNextResponse(t),z=d.NextRequestAdapter.fromNodeNextRequest(F,(0,d.signalFromNodeResponse)(t));try{let s=async e=>E.handle(z,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=L.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=a.get("next.route");if(n){let t=`${M} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t)}else e.updateName(`${M} ${f}`)}),o=!!(0,r.getRequestMeta)(e,"minimalMode"),l=async r=>{var i,l;let d=async({previousCacheEntry:a})=>{try{if(!o&&O&&T&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await s(r);e.fetchMetrics=K.renderOpts.fetchMetrics;let l=K.renderOpts.pendingWaitUntil;l&&n.waitUntil&&(n.waitUntil(l),l=void 0);let d=K.renderOpts.collectedTags;if(!_)return await (0,p.sendResponse)(F,G,i,K.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[g.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,n=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:n}}}}catch(t){throw(null==a?void 0:a.isStale)&&await E.onRequestError(e,t,{routerKind:"App Router",routePath:f,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:O})},!1,P),t}},c=await E.handleResponse({req:e,nextConfig:b,cacheKey:D,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:N,isRoutePPREnabled:!1,isOnDemandRevalidate:O,revalidateOnlyGenerated:T,responseGenerator:d,waitUntil:n.waitUntil,isMinimalMode:o});if(!_)return null;if((null==c||null==(i=c.value)?void 0:i.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",O?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),A&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let x=(0,h.fromNodeOutgoingHttpHeaders)(c.value.headers);return o&&_||x.delete(g.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||x.get("Cache-Control")||x.set("Cache-Control",(0,m.getCacheControlHeader)(c.cacheControl)),await (0,p.sendResponse)(F,G,new Response(c.value.body,{headers:x,status:c.value.status||200})),null};$?await l($):await L.withPropagatedContext(e.headers,()=>L.trace(c.BaseServerSpan.handleRequest,{spanName:`${M} ${f}`,kind:i.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},l))}catch(t){if(t instanceof x.NoFallbackError||await E.onRequestError(e,t,{routerKind:"App Router",routePath:S,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:O})},!1,P),_)throw t;return await (0,p.sendResponse)(F,G,new Response(null,{status:500})),null}}e.s(["handler",()=>P,"patchFetch",()=>N,"routeModule",()=>E,"serverHooks",()=>A,"workAsyncStorage",()=>b,"workUnitAsyncStorage",()=>C],95722)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__d32a6468._.js.map