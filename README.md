# FlareDrive

Cloudflare R2 storage manager with Pages and Workers. Free 10 GB storage.
Free serverless backend with a limit of 100,000 invocation requests per day.
[More about pricing](https://developers.cloudflare.com/r2/platform/pricing/)

Maintained by [NETSEC](https://51sec.org).

## Features

### File management

- Upload via drag-and-drop, or the upload menu's Camera capture (mobile),
  Image/Video picker, or any-file picker
- Upload large files (chunked upload for files ≥100MB)
- Create folders
- TextPad: write a quick note and save it straight to the current folder
  as a `.txt` file, without needing a separate file to upload
- Move and Copy files/folders between folders, via a folder-picker dialog
- Rename, delete (with confirmation), and multi-select all of the above
- Search files by name
- Sort by Name, Date modified, or Size, with an ascending/descending toggle
- Three view modes: Large icons, Small icons, and a Details table
  (Name / Date modified / Type / Size), like a desktop file explorer
- Image/video/PDF thumbnails
- Full-screen image/video preview (lightbox) with prev/next navigation,
  instead of opening a new tab
- Selection shortcuts: right-click or long-press (touch) to select,
  Ctrl/Cmd-click to toggle one item, Shift-click for a range, "Select all",
  and keyboard shortcuts (Delete/Backspace, Escape, Ctrl/Cmd+A)
- Progress dialog (Downloads/Uploads tabs) showing per-file status, with
  the failure reason on hover if one fails
- Item count and total size shown for the current folder
- WebDAV endpoint for use with any WebDAV-compatible client

### Sharing & access control

- Share a direct link to a file (native share sheet on mobile, clipboard
  copy with a fallback prompt on desktop)
- `WEBDAV_PUBLIC_FOLDERS`: make only specific folders publicly viewable
  without login, while everything else (and all uploads/edits) still
  requires the WebDAV credentials
- `WEBDAV_PUBLIC_READ`: make the entire bucket publicly viewable
- The root folder listing always loads without a login prompt, regardless
  of the above settings
- Log Out option to make the browser forget cached WebDAV credentials

### Interface

- Dark / light theme toggle (persisted across visits)
- Success and error notifications for every action (upload, delete,
  rename, move, copy, folder creation, login/logout), with specific
  messages for authentication/permission/server errors instead of
  silent failures
- Copyright/author info in the header, footer, README, and source files

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| Right-click / long-press | Select an item |
| Ctrl/Cmd + click | Toggle a single item |
| Shift + click | Select a range |
| Ctrl/Cmd + A | Select all |
| Delete / Backspace | Delete the current selection (with confirmation) |
| Escape | Clear the current selection |
| ← / → (in image preview) | Previous / next file |
| Escape (in image preview) | Close preview |

## Usage

### Installation

Before starting, you should make sure that

- you have created a [Cloudflare](https://dash.cloudflare.com/) account
- your payment method is added
- R2 service is activated and at least one bucket is created

Steps:

1. Fork this project and connect your fork with Cloudflare Pages
   - Select `Docusaurus` framework preset
   - Set `WEBDAV_USERNAME` and `WEBDAV_PASSWORD`
   - (Optional) Set `WEBDAV_PUBLIC_READ` to `1` to enable public read for the entire bucket (every folder, not just the ones listed in `WEBDAV_PUBLIC_FOLDERS`)
   - (Optional) Set `WEBDAV_PUBLIC_FOLDERS` to a comma-separated list of folder paths (e.g. `guest,test`) to make only those folders publicly readable, without exposing the rest of the bucket. Matching is case-insensitive (`Guest`, `GUEST`, etc. all count). Files inside those folders can be viewed/shared without login; everything else — including uploading, deleting, or renaming files, even inside a public folder — still requires the WebDAV credentials.
   - The root folder listing (the page you land on when you first visit the site) is always public, regardless of the settings above, so the site never prompts for a login just to load — it only reveals folder/file **names** at the top level, not the contents of any folder that isn't in `WEBDAV_PUBLIC_FOLDERS`.
   - **Recommended setup for "public site, private folders except a few":** leave `WEBDAV_PUBLIC_READ` unset (or `0`), and set `WEBDAV_PUBLIC_FOLDERS` to your public folder names. Only set `WEBDAV_PUBLIC_READ=1` if you actually want every folder to be public.
2. After initial deployment, bind your R2 bucket to `BUCKET` variable
3. Retry deployment in `Deployments` page to apply the changes
4. (Optional) Add a custom domain

You can also deploy this project using Wrangler CLI:

```bash
npm run build
npx wrangler pages deploy build
```

### WebDAV endpoint

You can use any client (such as [Cx File Explorer](https://play.google.com/store/apps/details?id=com.cxinventor.file.explorer), [BD File Manager](https://play.google.com/store/apps/details?id=com.liuzho.file.explorer))
that supports the WebDAV protocol to access your files.
Fill the endpoint URL as `https://<your-domain.com>/webdav` and use the username and password you set.

However, the standard WebDAV protocol does not support large file (≥128MB) uploads due to the limitation of Cloudflare Workers.
You must upload large files through the web interface which supports chunked uploads.

## Acknowledgments

WebDAV related code is based on [r2-webdav](
  https://github.com/abersheeran/r2-webdav
) project by [abersheeran](
  https://github.com/abersheeran
).

## License

Copyright (c) 2024-2026 [NETSEC](https://51sec.org).
Licensed under the [MIT License](LICENSE).
