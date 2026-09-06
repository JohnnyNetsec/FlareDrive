// Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
import { useEffect } from "react";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import {
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { encodeKey, FileItem } from "./FileGrid";

function ImagePreview({
  files,
  currentKey,
  onClose,
  onNavigate,
}: {
  files: FileItem[];
  currentKey: string;
  onClose: () => void;
  onNavigate: (key: string) => void;
}) {
  const index = files.findIndex((file) => file.key === currentKey);
  const file = index >= 0 ? files[index] : null;
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < files.length - 1;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasPrev)
        onNavigate(files[index - 1].key);
      else if (e.key === "ArrowRight" && hasNext)
        onNavigate(files[index + 1].key);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [files, index, hasPrev, hasNext, onClose, onNavigate]);

  if (!file) return null;
  const isVideo = file.httpMetadata.contentType.startsWith("video/");
  const src = `/webdav/${encodeKey(file.key)}`;

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { backgroundColor: "rgba(0, 0, 0, 0.94)", boxShadow: "none" },
      }}
    >
      <IconButton
        aria-label="Close preview"
        onClick={onClose}
        sx={{ position: "absolute", top: 8, right: 8, color: "white", zIndex: 2 }}
      >
        <CloseIcon />
      </IconButton>
      {hasPrev && (
        <IconButton
          aria-label="Previous"
          onClick={() => onNavigate(files[index - 1].key)}
          sx={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            color: "white",
            zIndex: 2,
          }}
        >
          <ChevronLeftIcon fontSize="large" />
        </IconButton>
      )}
      {hasNext && (
        <IconButton
          aria-label="Next"
          onClick={() => onNavigate(files[index + 1].key)}
          sx={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            color: "white",
            zIndex: 2,
          }}
        >
          <ChevronRightIcon fontSize="large" />
        </IconButton>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: 4,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {isVideo ? (
          <video
            src={src}
            controls
            autoPlay
            style={{ maxWidth: "100%", maxHeight: "85%" }}
          />
        ) : (
          <img
            src={src}
            alt={file.key}
            style={{ maxWidth: "100%", maxHeight: "85%", objectFit: "contain" }}
          />
        )}
        <Typography color="white" variant="body2" sx={{ marginTop: 2 }}>
          {file.key.split("/").pop()} ({index + 1} / {files.length})
        </Typography>
      </Box>
    </Dialog>
  );
}

export default ImagePreview;
