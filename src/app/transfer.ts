// Copyright (c) 2026 Siyu Long, portions Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
import pLimit from "p-limit";

import { encodeKey, FileItem } from "../FileGrid";
import { TransferTask } from "./transferQueue";

const WEBDAV_ENDPOINT = "/webdav/";

export function describeHttpError(status: number, action: string): string {
  switch (status) {
    case 400:
      return `${action} failed: invalid destination (400) — a folder can't be moved into itself or its own subfolder.`;
    case 401:
      return `${action} failed: authentication required (401). Sign in with the WebDAV username/password when prompted.`;
    case 403:
      return `${action} failed: access denied (403).`;
    case 404:
      return `${action} failed: not found (404).`;
    case 409:
      return `${action} failed: conflict (409) — the destination may already exist.`;
    case 412:
      return `${action} failed: precondition failed (412).`;
    default:
      if (status >= 500)
        return `${action} failed: server error (${status}). Please try again later.`;
      return `${action} failed (${status}).`;
  }
}

// There's no server-side session to end for HTTP Basic Auth, so "logging
// out" means making the browser discard the credentials it cached. Sending
// deliberately wrong credentials through XMLHttpRequest.open()'s user/password
// arguments (rather than a manually-set Authorization header, which the
// browser's credential cache ignores) causes most browsers to drop the
// previously cached valid credentials for this origin, so the next
// auth-requiring action prompts fresh. The target path always requires auth
// and never actually deletes anything real, since auth is checked before the
// request ever reaches the delete handler.
export function logout(): Promise<void> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "DELETE",
      "/webdav/_$flaredrive$/__logout__",
      true,
      "logout",
      Math.random().toString(36)
    );
    xhr.onloadend = () => resolve();
    xhr.onerror = () => resolve();
    xhr.send();
  });
}

export async function fetchPath(path: string) {
  const res = await fetch(`${WEBDAV_ENDPOINT}${encodeKey(path)}`, {
    method: "PROPFIND",
    headers: { Depth: "1" },
  });

  if (!res.ok) throw new Error(describeHttpError(res.status, "List folder"));
  if (!res.headers.get("Content-Type")?.includes("application/xml"))
    throw new Error("List folder failed: invalid response from server.");

  const parser = new DOMParser();
  const text = await res.text();
  const document = parser.parseFromString(text, "application/xml");
  const items: FileItem[] = Array.from(document.querySelectorAll("response"))
    .filter(
      (response) =>
        decodeURIComponent(
          response.querySelector("href")?.textContent ?? ""
        ).slice(WEBDAV_ENDPOINT.length) !== path.replace(/\/$/, "")
    )
    .map((response) => {
      const href = response.querySelector("href")?.textContent;
      if (!href) throw new Error("Invalid response");
      const contentType = response.querySelector("getcontenttype")?.textContent;
      const size = response.querySelector("getcontentlength")?.textContent;
      const lastModified =
        response.querySelector("getlastmodified")?.textContent;
      const thumbnail = response.getElementsByTagNameNS(
        "flaredrive",
        "thumbnail"
      )[0]?.textContent;
      return {
        key: decodeURI(href).replace(/^\/webdav\//, ""),
        size: size ? Number(size) : 0,
        uploaded: lastModified!,
        httpMetadata: { contentType: contentType! },
        customMetadata: { thumbnail },
      } as FileItem;
    });
  return items;
}

const THUMBNAIL_SIZE = 144;

export async function generateThumbnail(file: File) {
  const canvas = document.createElement("canvas");
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;
  var ctx = canvas.getContext("2d")!;

  if (file.type.startsWith("image/")) {
    const image = await new Promise<HTMLImageElement>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = URL.createObjectURL(file);
    });
    ctx.drawImage(image, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  } else if (file.type === "video/mp4") {
    // Generate thumbnail from video
    const video = await new Promise<HTMLVideoElement>(
      async (resolve, reject) => {
        const video = document.createElement("video");
        video.muted = true;
        video.src = URL.createObjectURL(file);
        setTimeout(() => reject(new Error("Video load timeout")), 2000);
        await video.play();
        video.pause();
        video.currentTime = 0;
        resolve(video);
      }
    );
    ctx.drawImage(video, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  } else if (file.type === "application/pdf") {
    const pdfjsLib = await import(
      // @ts-ignore
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs"
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    const page = await pdf.getPage(1);
    const { width, height } = page.getViewport({ scale: 1 });
    var scale = THUMBNAIL_SIZE / Math.max(width, height);
    const viewport = page.getViewport({ scale });
    const renderContext = { canvasContext: ctx, viewport };
    await page.render(renderContext).promise;
  }

  const thumbnailBlob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((blob) => resolve(blob!))
  );

  return thumbnailBlob;
}

export async function blobDigest(blob: Blob) {
  const digest = await crypto.subtle.digest("SHA-1", await blob.arrayBuffer());
  const digestArray = Array.from(new Uint8Array(digest));
  const digestHex = digestArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return digestHex;
}

export const SIZE_LIMIT = 100 * 1000 * 1000; // 100MB

function xhrFetch(
  url: RequestInfo | URL,
  requestInit: RequestInit & {
    onUploadProgress?: (progressEvent: ProgressEvent) => void;
  }
) {
  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = requestInit.onUploadProgress ?? null;
    xhr.open(
      requestInit.method ?? "GET",
      url instanceof Request ? url.url : url
    );
    const headers = new Headers(requestInit.headers);
    headers.forEach((value, key) => xhr.setRequestHeader(key, value));
    xhr.onload = () => {
      const headers = xhr
        .getAllResponseHeaders()
        .trim()
        .split("\r\n")
        .reduce((acc, header) => {
          const [key, value] = header.split(": ");
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
      resolve(new Response(xhr.responseText, { status: xhr.status, headers }));
    };
    xhr.onerror = reject;
    if (
      requestInit.body instanceof Blob ||
      typeof requestInit.body === "string"
    ) {
      xhr.send(requestInit.body);
    }
  });
}

export async function multipartUpload(
  key: string,
  file: File,
  options?: {
    headers?: Record<string, string>;
    onUploadProgress?: (progressEvent: {
      loaded: number;
      total: number;
    }) => void;
  }
) {
  const headers = options?.headers || {};
  headers["content-type"] = file.type;

  const uploadResponse = await fetch(`/webdav/${encodeKey(key)}?uploads`, {
    headers,
    method: "POST",
  });
  if (!uploadResponse.ok)
    throw new Error(describeHttpError(uploadResponse.status, "Upload"));
  const { uploadId } = await uploadResponse.json<{ uploadId: string }>();
  const totalChunks = Math.ceil(file.size / SIZE_LIMIT);

  const limit = pLimit(2);
  const parts = Array.from({ length: totalChunks }, (_, i) => i + 1);
  const partsLoaded = Array.from({ length: totalChunks + 1 }, () => 0);
  const promises = parts.map((i) =>
    limit(async () => {
      const chunk = file.slice((i - 1) * SIZE_LIMIT, i * SIZE_LIMIT);
      const searchParams = new URLSearchParams({
        partNumber: i.toString(),
        uploadId,
      });
      const uploadUrl = `/webdav/${encodeKey(key)}?${searchParams}`;
      if (i === limit.concurrency)
        await new Promise((resolve) => setTimeout(resolve, 1000));

      const uploadPart = () =>
        xhrFetch(uploadUrl, {
          method: "PUT",
          headers,
          body: chunk,
          onUploadProgress: (progressEvent) => {
            partsLoaded[i] = progressEvent.loaded;
            options?.onUploadProgress?.({
              loaded: partsLoaded.reduce((a, b) => a + b),
              total: file.size,
            });
          },
        });

      const retryReducer = (acc: Promise<Response>) =>
        acc
          .then((res) => {
            const retryAfter = res.headers.get("retry-after");
            if (!retryAfter) return res;
            return uploadPart();
          })
          .catch(uploadPart);
      const response = await [1, 2].reduce(retryReducer, uploadPart());
      if (!response.ok)
        throw new Error(describeHttpError(response.status, "Upload"));
      return { partNumber: i, etag: response.headers.get("etag")! };
    })
  );
  const uploadedParts = await Promise.all(promises);
  const completeParams = new URLSearchParams({ uploadId });
  const response = await fetch(`/webdav/${encodeKey(key)}?${completeParams}`, {
    method: "POST",
    body: JSON.stringify({ parts: uploadedParts }),
  });
  if (!response.ok)
    throw new Error(describeHttpError(response.status, "Upload"));
  return response;
}

export async function copyPaste(
  source: string,
  target: string,
  move = false,
  actionLabel?: string
) {
  const uploadUrl = `${WEBDAV_ENDPOINT}${encodeKey(source)}`;
  const destinationUrl = new URL(
    `${WEBDAV_ENDPOINT}${encodeKey(target)}`,
    window.location.href
  );
  const response = await fetch(uploadUrl, {
    method: move ? "MOVE" : "COPY",
    headers: { Destination: destinationUrl.href },
  });
  if (!response.ok)
    throw new Error(
      describeHttpError(response.status, actionLabel ?? (move ? "Rename" : "Copy"))
    );
}

export async function createFolder(cwd: string, folderName: string) {
  const folderKey = `${cwd}${folderName}`;
  const uploadUrl = `${WEBDAV_ENDPOINT}${encodeKey(folderKey)}`;
  const response = await fetch(uploadUrl, { method: "MKCOL" });
  if (!response.ok)
    throw new Error(describeHttpError(response.status, "Create folder"));
}

export async function processTransferTask({
  task,
  onTaskProgress,
}: {
  task: TransferTask;
  onTaskProgress?: (event: { loaded: number; total: number }) => void;
}) {
  const { remoteKey, file } = task;
  if (task.type !== "upload" || !file) throw new Error("Invalid task");
  let thumbnailDigest = null;

  if (
    file.type.startsWith("image/") ||
    file.type === "video/mp4" ||
    file.type === "application/pdf"
  ) {
    try {
      const thumbnailBlob = await generateThumbnail(file);
      const digestHex = await blobDigest(thumbnailBlob);

      const thumbnailUploadUrl = `/webdav/_$flaredrive$/thumbnails/${digestHex}.png`;
      try {
        await fetch(thumbnailUploadUrl, {
          method: "PUT",
          body: thumbnailBlob,
        });
        thumbnailDigest = digestHex;
      } catch (error) {
        console.log(`Upload ${digestHex}.png failed`);
      }
    } catch (error) {
      console.log(`Generate thumbnail failed`);
    }
  }

  const headers: { "fd-thumbnail"?: string } = {};
  if (thumbnailDigest) headers["fd-thumbnail"] = thumbnailDigest;
  if (file.size >= SIZE_LIMIT) {
    return await multipartUpload(remoteKey, file, {
      headers,
      onUploadProgress: onTaskProgress,
    });
  } else {
    const uploadUrl = `${WEBDAV_ENDPOINT}${encodeKey(remoteKey)}`;
    const response = await xhrFetch(uploadUrl, {
      method: "PUT",
      headers,
      body: file,
      onUploadProgress: onTaskProgress,
    });
    if (!response.ok)
      throw new Error(describeHttpError(response.status, "Upload"));
    return response;
  }
}
