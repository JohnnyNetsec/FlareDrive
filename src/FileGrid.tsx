// Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
import React from "react";
import {
  Grid,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import MimeIcon from "./MimeIcon";
import { humanReadableSize } from "./app/utils";
import { useLongPress } from "./useLongPress";
import type { ViewMode } from "./App";

export interface FileItem {
  key: string;
  size: number;
  uploaded: string;
  httpMetadata: { contentType: string };
  customMetadata?: { thumbnail?: string };
}

function extractFilename(key: string) {
  return key.split("/").pop();
}

export function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export function isDirectory(file: FileItem) {
  return file.httpMetadata?.contentType === "application/x-directory";
}

function fileTypeLabel(file: FileItem) {
  if (isDirectory(file)) return "Folder";
  const name = extractFilename(file.key) ?? "";
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0) return "File";
  return `${name.slice(dotIndex + 1).toUpperCase()} File`;
}

const GRID_BREAKPOINTS: Record<"large" | "small", object> = {
  large: { xs: 12, sm: 6, md: 4, lg: 3, xl: 2 },
  small: { xs: 6, sm: 4, md: 3, lg: 2, xl: 2 },
};

function Thumbnail({
  file,
  size,
}: {
  file: FileItem;
  size: "small" | "large";
}) {
  const pixels = size === "small" ? 24 : 36;
  return file.customMetadata?.thumbnail ? (
    <img
      src={`/webdav/_$flaredrive$/thumbnails/${file.customMetadata.thumbnail}.png`}
      alt={file.key}
      style={{ width: pixels, height: pixels, objectFit: "cover" }}
    />
  ) : (
    <MimeIcon
      contentType={file.httpMetadata.contentType}
      fontSize={size === "small" ? "medium" : "large"}
    />
  );
}

// Plain helper (not a hook) — combines click/context-menu handling with the
// long-press touch handlers produced by the single useLongPress() factory
// call in the component below. Safe to call once per rendered item.
function getItemGestures({
  file,
  multiSelected,
  onOpenFile,
  onMultiSelect,
  onRangeSelect,
  getLongPressHandlers,
}: {
  file: FileItem;
  multiSelected: string[] | null;
  onOpenFile: (file: FileItem) => void;
  onMultiSelect: (key: string) => void;
  onRangeSelect: (key: string) => void;
  getLongPressHandlers: (onLongPress: () => void) => object;
}) {
  const onClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      onRangeSelect(file.key);
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      onMultiSelect(file.key);
      return;
    }
    if (multiSelected !== null) onMultiSelect(file.key);
    else onOpenFile(file);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onMultiSelect(file.key);
  };

  return {
    onClick,
    onContextMenu,
    ...getLongPressHandlers(() => onMultiSelect(file.key)),
  };
}

function FileGrid({
  files,
  onOpenFile,
  multiSelected,
  onMultiSelect,
  onRangeSelect,
  emptyMessage,
  viewMode = "large",
}: {
  files: FileItem[];
  onOpenFile: (file: FileItem) => void;
  multiSelected: string[] | null;
  onMultiSelect: (key: string) => void;
  onRangeSelect: (key: string) => void;
  emptyMessage?: React.ReactNode;
  viewMode?: ViewMode;
}) {
  const getLongPressHandlers = useLongPress();

  if (files.length === 0) return <>{emptyMessage}</>;

  if (viewMode === "details") {
    return (
      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Date modified</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Size</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => (
              <TableRow
                key={file.key}
                hover
                selected={multiSelected?.includes(file.key)}
                sx={{ cursor: "pointer", userSelect: "none" }}
                {...getItemGestures({
                  file,
                  multiSelected,
                  onOpenFile,
                  onMultiSelect,
                  onRangeSelect,
                  getLongPressHandlers,
                })}
              >
                <TableCell
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <Thumbnail file={file} size="small" />
                  {extractFilename(file.key)}
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {new Date(file.uploaded).toLocaleString()}
                </TableCell>
                <TableCell>{fileTypeLabel(file)}</TableCell>
                <TableCell align="right">
                  {!isDirectory(file) && humanReadableSize(file.size)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  const iconSize = viewMode === "small" ? "small" : "large";

  return (
    <Grid container sx={{ paddingBottom: "48px" }}>
      {files.map((file) => (
        <Grid item key={file.key} {...GRID_BREAKPOINTS[viewMode]}>
          <ListItemButton
            selected={multiSelected?.includes(file.key)}
            sx={{ userSelect: "none" }}
            {...getItemGestures({
              file,
              multiSelected,
              onOpenFile,
              onMultiSelect,
              onRangeSelect,
              getLongPressHandlers,
            })}
          >
            <ListItemIcon>
              <Thumbnail file={file} size={iconSize} />
            </ListItemIcon>
            <ListItemText
              primary={extractFilename(file.key)}
              primaryTypographyProps={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              secondary={
                viewMode === "large" && (
                  <React.Fragment>
                    <span
                      style={{
                        display: "inline-block",
                        minWidth: "160px",
                        marginRight: 8,
                      }}
                    >
                      {new Date(file.uploaded).toLocaleString()}
                    </span>
                    {!isDirectory(file) && humanReadableSize(file.size)}
                  </React.Fragment>
                )
              }
            />
          </ListItemButton>
        </Grid>
      ))}
    </Grid>
  );
}

export default FileGrid;
