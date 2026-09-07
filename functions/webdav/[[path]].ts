// Copyright (c) 2026 Siyu Long, portions Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
import { notFound, parseBucketPath } from "./utils";
import { handleRequestCopy } from "./copy";
import { handleRequestDelete } from "./delete";
import { handleRequestGet } from "./get";
import { handleRequestHead } from "./head";
import { handleRequestMkcol } from "./mkcol";
import { handleRequestMove } from "./move";
import { handleRequestPropfind } from "./propfind";
import { handleRequestPut } from "./put";
import { RequestHandlerParams } from "./utils";
import { handleRequestPost } from "./post";

async function handleRequestOptions() {
  return new Response(null, {
    headers: {
      Allow: Object.keys(HANDLERS).join(", "),
      DAV: "1",
    },
  });
}

async function handleMethodNotAllowed() {
  return new Response(null, { status: 405 });
}

const HANDLERS: Record<
  string,
  (context: RequestHandlerParams) => Promise<Response>
> = {
  PROPFIND: handleRequestPropfind,
  MKCOL: handleRequestMkcol,
  HEAD: handleRequestHead,
  GET: handleRequestGet,
  POST: handleRequestPost,
  PUT: handleRequestPut,
  COPY: handleRequestCopy,
  MOVE: handleRequestMove,
  DELETE: handleRequestDelete,
};

// Folder paths (relative to the bucket root, no leading/trailing slash) that
// are readable without authentication, e.g. "guest,test/samples". Matching is
// case-insensitive, so "Guest" or "GUEST" also count as the "guest" folder.
function parsePublicFolders(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((folder) => folder.trim().replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
}

function isUnderPublicFolder(path: string, publicFolders: string[]): boolean {
  const lowerPath = path.toLowerCase();
  return publicFolders.some((folder) => {
    const lowerFolder = folder.toLowerCase();
    return lowerPath === lowerFolder || lowerPath.startsWith(`${lowerFolder}/`);
  });
}

export const onRequest: PagesFunction<{
  WEBDAV_USERNAME: string;
  WEBDAV_PASSWORD: string;
  WEBDAV_PUBLIC_READ?: string;
  WEBDAV_PUBLIC_FOLDERS?: string;
}> = async function (context) {
  const env = context.env;
  const request: Request = context.request;
  if (request.method === "OPTIONS") return handleRequestOptions();

  const [bucket, path] = parseBucketPath(context);

  const isReadMethod = ["GET", "HEAD", "PROPFIND"].includes(request.method);
  const isThumbnail = path.startsWith("_$flaredrive$/thumbnails/");
  const isRoot = path === "";
  const publicFolders = parsePublicFolders(env.WEBDAV_PUBLIC_FOLDERS);

  // The root listing itself is always public so the site loads without a
  // login prompt. It only exposes folder/file NAMES at the top level, not
  // the contents of folders that aren't in WEBDAV_PUBLIC_FOLDERS.
  const skipAuth =
    isReadMethod &&
    (env.WEBDAV_PUBLIC_READ === "1" ||
      isThumbnail ||
      isRoot ||
      isUnderPublicFolder(path, publicFolders));

  if (!skipAuth) {
    if (!env.WEBDAV_USERNAME || !env.WEBDAV_PASSWORD)
      return new Response("WebDAV protocol is not enabled", { status: 403 });

    const auth = request.headers.get("Authorization");
    const expectedAuth = `Basic ${btoa(
      `${env.WEBDAV_USERNAME}:${env.WEBDAV_PASSWORD}`
    )}`;
    if (!auth || auth !== expectedAuth) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": `Basic realm="WebDAV"` },
      });
    }
  }

  if (!bucket) return notFound();

  const method: string = (context.request as Request).method;
  const handler = HANDLERS[method] ?? handleMethodNotAllowed;
  return handler({ bucket, path, request: context.request });
};
