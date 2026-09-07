// Copyright (c) 2026 Siyu Long, portions Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
// Main.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Breadcrumbs,
  Button,
  Link,
  Skeleton,
  Typography,
} from "@mui/material";
import { Home as HomeIcon, NoteAdd as NoteAddIcon } from "@mui/icons-material";

import ConfirmDialog from "./ConfirmDialog";
import FileGrid, { encodeKey, FileItem, isDirectory } from "./FileGrid";
import FolderPickerDialog from "./FolderPickerDialog";
import ImagePreview from "./ImagePreview";
import MultiSelectToolbar from "./MultiSelectToolbar";
import PromptDialog from "./PromptDialog";
import UploadDrawer, { UploadFab } from "./UploadDrawer";
import TextPadDrawer from "./TextPadDrawer";
import { copyPaste, describeHttpError, fetchPath } from "./app/transfer";
import { humanReadableSize, Notice } from "./app/utils";
import { useTransferQueue, useUploadEnqueue } from "./app/transferQueue";
import type { SortDirection, SortKey, ViewMode } from "./App";

function isPreviewable(file: FileItem) {
  const contentType = file.httpMetadata?.contentType ?? "";
  return contentType.startsWith("image/") || contentType.startsWith("video/");
}

// Centered helper
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      {children}
    </Box>
  );
}

// Breadcrumb component
function PathBreadcrumb({
  path,
  onCwdChange,
}: {
  path: string;
  onCwdChange: (newCwd: string) => void;
}) {
  const parts = path.replace(/\/$/, "").split("/");

  return (
    <Breadcrumbs separator="›" sx={{ padding: 1 }}>
      <Button onClick={() => onCwdChange("")} sx={{ minWidth: 0, padding: 0 }}>
        <HomeIcon />
      </Button>
      {parts.map((part, index) =>
        index === parts.length - 1 ? (
          <Typography key={index} color="text.primary">
            {part}
          </Typography>
        ) : (
          <Link
            key={index}
            component="button"
            onClick={() => {
              onCwdChange(parts.slice(0, index + 1).join("/") + "/");
            }}
          >
            {part}
          </Link>
        )
      )}
    </Breadcrumbs>
  );
}

// DropZone wrapper
function DropZone({
  children,
  onDrop,
}: {
  children: React.ReactNode;
  onDrop: (files: FileList) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        backgroundColor: (theme) => theme.palette.background.default,
        filter: dragging ? "brightness(0.9)" : "none",
        transition: "filter 0.2s",
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e.dataTransfer.files);
        setDragging(false);
      }}
    >
      {children}
    </Box>
  );
}

function LoadingSkeleton() {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, padding: 2 }}>
      {Array.from({ length: 12 }, (_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          width={160}
          height={72}
          sx={{ flexGrow: 1, maxWidth: 220 }}
        />
      ))}
    </Box>
  );
}

// Main Component
function Main({
  search,
  sortBy,
  sortDirection,
  viewMode,
  onError,
}: {
  search: string;
  sortBy: SortKey;
  sortDirection: SortDirection;
  viewMode: ViewMode;
  onError: (error: Error) => void;
}) {
  const [cwd, setCwd] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [multiSelected, setMultiSelected] = useState<string[] | null>(null);
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [showTextPadDrawer, setShowTextPadDrawer] = useState(false);
  const [pickerMode, setPickerMode] = useState<"move" | "copy" | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [lastUploadKey, setLastUploadKey] = useState<string | null>(null);

  const lastSelectedKeyRef = useRef<string | null>(null);

  const transferQueue = useTransferQueue();
  const uploadEnqueue = useUploadEnqueue();

  const fetchFiles = useCallback(() => {
    fetchPath(cwd)
      .then((files) => {
        setFiles(files);
        setMultiSelected(null);
      })
      .catch(onError)
      .finally(() => setLoading(false));
  }, [cwd, onError]);

  useEffect(() => setLoading(true), [cwd]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    if (!transferQueue.length) return;
    const lastFile = transferQueue[transferQueue.length - 1];
    if (["pending", "in-progress"].includes(lastFile.status)) {
      setLastUploadKey(lastFile.remoteKey);
    } else if (lastUploadKey) {
      fetchFiles();
      setLastUploadKey(null);
    }
  }, [cwd, fetchFiles, lastUploadKey, transferQueue]);

  const notifiedTaskCount = useRef(0);
  useEffect(() => {
    for (let i = notifiedTaskCount.current; i < transferQueue.length; i++) {
      const task = transferQueue[i];
      if (task.status === "completed") {
        onError(new Notice(`Uploaded "${task.name}"`, "success"));
      } else if (task.status === "failed") {
        onError(
          new Error(
            `Failed to upload "${task.name}": ${task.error?.message ?? "unknown error"}`
          )
        );
      } else {
        break;
      }
      notifiedTaskCount.current = i + 1;
    }
  }, [transferQueue, onError]);

  const filteredFiles = useMemo(() => {
    const matches = search
      ? files.filter((file) =>
          file.key.toLowerCase().includes(search.toLowerCase())
        )
      : files;
    const direction = sortDirection === "asc" ? 1 : -1;
    const compareBySortKey = (a: FileItem, b: FileItem) => {
      switch (sortBy) {
        case "date":
          return (
            direction *
            (new Date(a.uploaded).getTime() - new Date(b.uploaded).getTime())
          );
        case "size":
          return direction * (a.size - b.size);
        default:
          return (
            direction * a.key.localeCompare(b.key, undefined, { numeric: true })
          );
      }
    };
    return [...matches].sort((a, b) =>
      isDirectory(a) === isDirectory(b)
        ? compareBySortKey(a, b)
        : isDirectory(a)
          ? -1
          : 1
    );
  }, [files, search, sortBy, sortDirection]);

  const previewableFiles = useMemo(
    () => filteredFiles.filter((file) => !isDirectory(file) && isPreviewable(file)),
    [filteredFiles]
  );

  const { itemCount, totalSize } = useMemo(() => {
    let size = 0;
    for (const file of filteredFiles) if (!isDirectory(file)) size += file.size;
    return { itemCount: filteredFiles.length, totalSize: size };
  }, [filteredFiles]);

  const handleMultiSelect = useCallback((key: string) => {
    lastSelectedKeyRef.current = key;
    setMultiSelected((prev) => {
      if (prev === null) return [key];
      if (prev.includes(key)) {
        const updated = prev.filter((k) => k !== key);
        return updated.length ? updated : null;
      }
      return [...prev, key];
    });
  }, []);

  const handleRangeSelect = useCallback(
    (key: string) => {
      const keys = filteredFiles.map((file) => file.key);
      setMultiSelected((prev) => {
        const anchorKey = lastSelectedKeyRef.current ?? key;
        const anchorIdx = keys.indexOf(anchorKey);
        const targetIdx = keys.indexOf(key);
        if (anchorIdx === -1 || targetIdx === -1) return prev ?? [key];
        const [start, end] =
          anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
        const range = keys.slice(start, end + 1);
        return Array.from(new Set([...(prev ?? []), ...range]));
      });
      lastSelectedKeyRef.current = key;
    },
    [filteredFiles]
  );

  const handleSelectAll = useCallback(() => {
    setMultiSelected(filteredFiles.map((file) => file.key));
  }, [filteredFiles]);

  const handleOpenFile = useCallback(
    (file: FileItem) => {
      if (isDirectory(file)) {
        setCwd(file.key + "/");
        return;
      }
      if (isPreviewable(file)) {
        setPreviewKey(file.key);
        return;
      }
      window.open(`/webdav/${encodeKey(file.key)}`, "_blank", "noopener,noreferrer");
    },
    []
  );

  const performDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    if (!multiSelected?.length) return;
    let firstFailureStatus: number | null = null;
    const failed: string[] = [];
    for (const key of multiSelected) {
      const response = await fetch(`/webdav/${encodeKey(key)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        failed.push(key.split("/").pop()!);
        firstFailureStatus ??= response.status;
      }
    }
    if (failed.length)
      onError(
        new Error(
          `${describeHttpError(firstFailureStatus!, "Delete")} (${failed.join(", ")})`
        )
      );
    else
      onError(new Notice(`Deleted ${multiSelected.length} item(s)`, "success"));
    fetchFiles();
  }, [multiSelected, onError, fetchFiles]);

  // Keyboard shortcuts: Delete/Backspace to delete selection, Escape to
  // clear it, Ctrl/Cmd+A to select all — skipped while typing in a text
  // field, or while the image preview (which handles its own keys) is open.
  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      return (
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.isContentEditable
      );
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (previewKey || isTypingTarget(e.target)) return;
      if ((e.key === "Delete" || e.key === "Backspace") && multiSelected?.length) {
        e.preventDefault();
        setShowDeleteConfirm(true);
      } else if (e.key === "Escape" && multiSelected !== null) {
        setMultiSelected(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        handleSelectAll();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [multiSelected, previewKey, handleSelectAll]);

  return (
    <>
      {!loading && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {cwd ? (
            <PathBreadcrumb path={cwd} onCwdChange={setCwd} />
          ) : (
            <Box />
          )}
          {itemCount > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ paddingRight: 2, whiteSpace: "nowrap" }}
            >
              {itemCount} item{itemCount === 1 ? "" : "s"}
              {totalSize > 0 && ` • ${humanReadableSize(totalSize)}`}
            </Typography>
          )}
        </Box>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <DropZone
          onDrop={(files) => {
            uploadEnqueue(
              ...Array.from(files).map((file) => ({ file, basedir: cwd }))
            );
          }}
        >
          <FileGrid
            files={filteredFiles}
            onOpenFile={handleOpenFile}
            multiSelected={multiSelected}
            onMultiSelect={handleMultiSelect}
            onRangeSelect={handleRangeSelect}
            viewMode={viewMode}
            emptyMessage={
              <Centered>
                {search ? `No results for "${search}"` : "No files or folders"}
              </Centered>
            }
          />
        </DropZone>
      )}

      {multiSelected === null && (
        <>
          <UploadFab onClick={() => setShowUploadDrawer(true)} />
          <Button
            variant="contained"
            startIcon={<NoteAddIcon />}
            sx={{
              position: "fixed",
              bottom: 90,
              right: 24,
              zIndex: 999,
            }}
            onClick={() => setShowTextPadDrawer(true)}
          >
            Open TextPad
          </Button>
        </>
      )}

      <UploadDrawer
        open={showUploadDrawer}
        setOpen={setShowUploadDrawer}
        cwd={cwd}
        onUpload={fetchFiles}
        onError={onError}
      />

      <TextPadDrawer
        open={showTextPadDrawer}
        setOpen={setShowTextPadDrawer}
        cwd={cwd}
        onUpload={fetchFiles}
      />

      <MultiSelectToolbar
        multiSelected={multiSelected}
        onClose={() => setMultiSelected(null)}
        onDownload={() => {
          if (multiSelected?.length !== 1) return;
          const a = document.createElement("a");
          a.href = `/webdav/${encodeKey(multiSelected[0])}`;
          a.download = multiSelected[0].split("/").pop()!;
          a.click();
        }}
        onRename={() => {
          if (multiSelected?.length !== 1) return;
          setRenameTarget(multiSelected[0]);
        }}
        onDelete={() => {
          if (!multiSelected?.length) return;
          setShowDeleteConfirm(true);
        }}
        onShare={async () => {
          if (multiSelected?.length !== 1) return;
          const url = new URL(
            `/webdav/${encodeKey(multiSelected[0])}`,
            window.location.href
          );
          const shareUrl = url.toString();

          if (navigator.share) {
            try {
              await navigator.share({ url: shareUrl });
              return;
            } catch (error) {
              if ((error as Error)?.name === "AbortError") return;
            }
          }

          if (navigator.clipboard?.writeText) {
            try {
              await navigator.clipboard.writeText(shareUrl);
              onError(new Notice("Link copied to clipboard", "success"));
              return;
            } catch (error) {
              // Fall through to the prompt fallback below.
            }
          }

          window.prompt("Copy this link:", shareUrl);
        }}
        onMove={() => {
          if (!multiSelected?.length) return;
          setPickerMode("move");
        }}
        onCopy={() => {
          if (!multiSelected?.length) return;
          setPickerMode("copy");
        }}
        onSelectAll={handleSelectAll}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete permanently?"
        danger
        confirmLabel="Delete"
        message={
          multiSelected
            ? multiSelected
                .map((key) => key.replace(/\/$/, "").split("/").pop())
                .join("\n")
            : ""
        }
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={performDelete}
      />

      <PromptDialog
        open={renameTarget !== null}
        title="Rename"
        label="New name"
        confirmLabel="Rename"
        defaultValue={renameTarget?.replace(/\/$/, "").split("/").pop() ?? ""}
        onCancel={() => setRenameTarget(null)}
        onConfirm={async (newName) => {
          const target = renameTarget!;
          setRenameTarget(null);
          try {
            await copyPaste(target, cwd + newName, true);
            onError(new Notice(`Renamed to "${newName}"`, "success"));
          } catch (error) {
            onError(error as Error);
          }
          fetchFiles();
        }}
      />

      <FolderPickerDialog
        open={pickerMode !== null}
        initialPath={cwd}
        title={
          pickerMode === "copy"
            ? `Copy ${multiSelected?.length ?? 0} item(s) to…`
            : `Move ${multiSelected?.length ?? 0} item(s) to…`
        }
        onClose={() => setPickerMode(null)}
        onConfirm={async (destination) => {
          const mode = pickerMode;
          setPickerMode(null);
          if (!multiSelected?.length || !mode) return;
          const move = mode === "move";
          const actionLabel = move ? "Move" : "Copy";
          let firstError: string | null = null;
          const failed: string[] = [];
          for (const key of multiSelected) {
            const name = key.replace(/\/$/, "").split("/").pop()!;
            try {
              await copyPaste(key, destination + name, move, actionLabel);
            } catch (error) {
              failed.push(name);
              firstError ??= (error as Error).message;
            }
          }
          if (failed.length)
            onError(new Error(`${firstError} (${failed.join(", ")})`));
          else
            onError(
              new Notice(
                `${actionLabel === "Move" ? "Moved" : "Copied"} ${multiSelected.length} item(s) to ${
                  destination ? `/${destination.replace(/\/$/, "")}` : "root"
                }`,
                "success"
              )
            );
          fetchFiles();
        }}
      />

      {previewKey && (
        <ImagePreview
          files={previewableFiles}
          currentKey={previewKey}
          onClose={() => setPreviewKey(null)}
          onNavigate={setPreviewKey}
        />
      )}
    </>
  );
}

export default Main;
