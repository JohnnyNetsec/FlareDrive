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

function FileGrid({
  files,
  onCwdChange,
  multiSelected,
  onMultiSelect,
  emptyMessage,
  viewMode = "large",
}: {
  files: FileItem[];
  onCwdChange: (newCwd: string) => void;
  multiSelected: string[] | null;
  onMultiSelect: (key: string) => void;
  emptyMessage?: React.ReactNode;
  viewMode?: ViewMode;
}) {
  if (files.length === 0) return <>{emptyMessage}</>;

  const handleOpen = (file: FileItem) => {
    if (multiSelected !== null) {
      onMultiSelect(file.key);
    } else if (isDirectory(file)) {
      onCwdChange(file.key + "/");
    } else
      window.open(`/webdav/${encodeKey(file.key)}`, "_blank", "noopener,noreferrer");
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    onMultiSelect(file.key);
  };

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
                onClick={() => handleOpen(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
                sx={{ cursor: "pointer", userSelect: "none" }}
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
            onClick={() => handleOpen(file)}
            onContextMenu={(e) => handleContextMenu(e, file)}
            sx={{ userSelect: "none" }}
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
