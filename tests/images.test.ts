import { test } from "node:test";
import assert from "node:assert/strict";
import { getImageProps } from "next/image";
import { isPublicImageUrl } from "../lib/image-url";
import { isCloudinaryImageUrl, isOptimizedCloudinaryImage } from "../lib/cloudinary-image";
import { verifyCloudinaryImage } from "../lib/verify-cloudinary-image";
import { contentSchema } from "../lib/content/schema";
import { moduleSchemas } from "../lib/admin/module-schema";
import { approvedImages, rejectedImages, imageRoot } from "./image-fixtures";
import config from "../next.config.mjs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroMedia } from "../components/home/hero-media";

test("only the Owner's Cloudinary image uploads and safe transforms are allowed", () => {
  for (const url of approvedImages) {
    assert.equal(isCloudinaryImageUrl(url), true, url);
    assert.equal(isPublicImageUrl(url), true, url);
  }
  for (const url of rejectedImages) {
    assert.equal(isCloudinaryImageUrl(url), false, url);
    assert.equal(isPublicImageUrl(url), false, url);
  }
  for (const url of ["https://127.0.0.1/a.jpg", "https://[::1]/a.jpg", "https://169.254.169.254/a.jpg", "https://untrusted.invalid/a.jpg"])
    assert.equal(isPublicImageUrl(url), false, url);
  assert.ok(isPublicImageUrl("https://tuzefzcosvvhzffbxhpm.supabase.co/storage/v1/object/public/tifawave-media/existing.webp"));
});

test("existing CMS slots, mobile photos, sections, branding and package schemas accept owned delivery", () => {
  const url = approvedImages[0];
  assert.ok(contentSchema.safeParse({heroImage:url,heroMobileImage:url,homeMedia:[{slot:"breakfast",imageUrl:url,mobileImage:url}],sections:[{heading:"Rooftop",body:"",imageUrl:url}],branding:{logo:url}}).success);
  assert.ok(moduleSchemas.package_photos.safeParse({package_id:"10000000-0000-4000-8000-000000000001",image_url:url,alt_text:"Authentic photo",caption:"",focal_position:"center",mobile_focal_position:"center",sort_order:0,archived:false}).success);
  assert.ok(!contentSchema.safeParse({homeMedia:[{slot:"breakfast",imageUrl:rejectedImages[1]}]}).success);
});

test("optimizer and browser policy are bounded to the owned upload path with redirects disabled", async () => {
  const patterns = config.images!.remotePatterns!.filter((p) => p.hostname === "res.cloudinary.com");
  assert.deepEqual(patterns,[{protocol:"https",hostname:"res.cloudinary.com",port:"",pathname:"/dytykwtc/image/upload/**",search:""}]);
  assert.equal(config.images!.maximumRedirects,0);
  assert.equal(config.images!.dangerouslyAllowLocalIP,false);
  const csp = (await config.headers!())[0].headers.find((h) => h.key === "Content-Security-Policy")!.value;
  assert.ok(csp.includes("https://res.cloudinary.com/dytykwtc/image/upload/"));
  assert.ok(!csp.includes("https://*.cloudinary.com"));
});

test("already optimized Cloudinary images bypass a second encode, including mobile sources", () => {
  assert.equal(isOptimizedCloudinaryImage(approvedImages[0]),false);
  for (const url of approvedImages.slice(1)) {
    assert.ok(isOptimizedCloudinaryImage(url));
    const props = getImageProps({src:url,alt:"Photo",width:640,height:480,unoptimized:isOptimizedCloudinaryImage(url)}).props;
    assert.equal(props.src,url);
    assert.equal(props.srcSet,undefined);
  }
  assert.ok(!isOptimizedCloudinaryImage(rejectedImages[1]));
});

test("server save probes only approved Cloudinary delivery, without following redirects", async () => {
  const calls: string[] = [];
  const request: typeof fetch = async (input,init) => {
    calls.push(String(input));
    assert.equal(init?.redirect,"error");
    assert.equal(init?.method,"HEAD");
    return new Response(null,{status:200,headers:{"content-type":"image/jpeg","content-length":"500"}});
  };
  await verifyCloudinaryImage(approvedImages[0],request);
  assert.equal(calls.length,1);
  await assert.rejects(verifyCloudinaryImage(rejectedImages[1],request),/account dytykwtc/);
  await verifyCloudinaryImage("https://127.0.0.1/a.jpg",request);
  assert.equal(calls.length,1,"untrusted URLs never fetched");
  for (const response of [
    new Response(null,{status:302,headers:{location:"http://127.0.0.1/private"}}),
    new Response(null,{status:404}),
    new Response(null,{status:200,headers:{"content-type":"text/html"}}),
    new Response(null,{status:200,headers:{"content-type":"image/svg+xml"}}),
    new Response(null,{status:200,headers:{"content-type":"image/jpeg","content-length":"99999999"}}),
  ]) await assert.rejects(verifyCloudinaryImage(imageRoot+"missing.jpg",async()=>response),/could not be verified/);
  await assert.rejects(verifyCloudinaryImage(approvedImages[0],async()=>{throw Error("Timeout");}),/could not be verified/);
});

test("actual hero picture sources retain directly optimized mobile and desktop URLs", () => {
  const desktop = approvedImages[1], mobile = approvedImages[2];
  for (const html of [
    renderToStaticMarkup(createElement(HeroMedia,{image:desktop,mobileImage:mobile,alt:"Photo",video:"",locale:"fr"})),
  ]) {
    assert.ok(html.includes(desktop));
    assert.ok(html.includes(mobile),"mobile source must not disappear when srcSet is unoptimized");
    assert.ok(!html.includes("/_next/image"),"no second encode of already optimized delivery");
  }
});
