// Copyright (c) 2024-2026 NETSEC (https://51sec.org).
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
  CircularProgress,
  Link,
  Typography,
} from "@mui/material";
import { Home as HomeIcon, NoteAdd as NoteAddIcon } from "@mui/icons-material";

import FileGrid, { encodeKey, FileItem, isDirectory } from "./FileGrid";
import MultiSelectToolbar from "./MultiSelectToolbar";
import UploadDrawer, { UploadFab } from "./UploadDrawer";
import TextPadDrawer from "./TextPadDrawer";
import { copyPaste, describeHttpError, fetchPath } from "./app/transfer";
import { Notice } from "./app/utils";
import { useTransferQueue, useUploadEnqueue } from "./app/transferQueue";
import type { SortKey } from "./App";

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

// Main Component
function Main({
  search,
  sortBy,
  onError,
}: {
  search: string;
  sortBy: SortKey;
  onError: (error: Error) => void;
}) {
  const [cwd, setCwd] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [multiSelected, setMultiSelected] = useState<string[] | null>(null);
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [showTextPadDrawer, setShowTextPadDrawer] = useState(false);
  const [lastUploadKey, setLastUploadKey] = useState<string | null>(null);

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
    const compareBySortKey = (a: FileItem, b: FileItem) => {
      switch (sortBy) {
        case "date":
          return (
            new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime()
          );
        case "size":
          return b.size - a.size;
        default:
          return a.key.localeCompare(b.key, undefined, { numeric: true });
      }
    };
    return [...matches].sort((a, b) =>
      isDirectory(a) === isDirectory(b)
        ? compareBySortKey(a, b)
        : isDirectory(a)
          ? -1
          : 1
    );
  }, [files, search, sortBy]);

  const handleMultiSelect = useCallback((key: string) => {
    setMultiSelected((prev) => {
      if (prev === null) return [key];
      if (prev.includes(key)) {
        const updated = prev.filter((k) => k !== key);
        return updated.length ? updated : null;
      }
      return [...prev, key];
    });
  }, []);

  return (
    <>
      {cwd && <PathBreadcrumb path={cwd} onCwdChange={setCwd} />}

      {loading ? (
        <Centered>
          <CircularProgress />
        </Centered>
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
            onCwdChange={(newCwd: string) => setCwd(newCwd)}
            multiSelected={multiSelected}
            onMultiSelect={handleMultiSelect}
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
        onRename={async () => {
          if (multiSelected?.length !== 1) return;
          const newName = window.prompt("Rename to:");
          if (!newName) return;
          try {
            await copyPaste(multiSelected[0], cwd + newName, true);
            onError(new Notice(`Renamed to "${newName}"`, "success"));
          } catch (error) {
            onError(error as Error);
          }
          fetchFiles();
        }}
        onDelete={async () => {
          if (!multiSelected?.length) return;
          const filenames = multiSelected
            .map((key) => key.replace(/\/$/, "").split("/").pop())
            .join("\n");
          const confirmMessage = "Delete the following file(s) permanently?";
          if (!window.confirm(`${confirmMessage}\n${filenames}`)) return;
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
            onError(
              new Notice(
                `Deleted ${multiSelected.length} item(s)`,
                "success"
              )
            );
          fetchFiles();
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
      />
    </>
  );
}

export default Main;
