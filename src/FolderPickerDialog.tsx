// Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
import { useEffect, useState } from "react";
import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { Folder as FolderIcon, Home as HomeIcon } from "@mui/icons-material";
import { fetchPath } from "./app/transfer";
import { isDirectory } from "./FileGrid";

function FolderPickerDialog({
  open,
  onClose,
  onConfirm,
  initialPath = "",
  title = "Select destination folder",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (path: string) => void;
  initialPath?: string;
  title?: string;
}) {
  const [path, setPath] = useState(initialPath);
  const [folderNames, setFolderNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setPath(initialPath);
  }, [open, initialPath]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchPath(path)
      .then((files) =>
        setFolderNames(
          files.filter(isDirectory).map((file) => file.key.split("/").pop()!)
        )
      )
      .catch(() => setFolderNames([]))
      .finally(() => setLoading(false));
  }, [open, path]);

  const parts = path.replace(/\/$/, "").split("/").filter(Boolean);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ minHeight: 320 }}>
        <Breadcrumbs sx={{ marginBottom: 1 }}>
          <Link component="button" onClick={() => setPath("")}>
            <HomeIcon fontSize="small" sx={{ verticalAlign: "middle" }} />
          </Link>
          {parts.map((part, index) => (
            <Link
              key={index}
              component="button"
              onClick={() => setPath(parts.slice(0, index + 1).join("/") + "/")}
            >
              {part}
            </Link>
          ))}
        </Breadcrumbs>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : folderNames.length === 0 ? (
          <Typography color="text.secondary" sx={{ padding: 2 }}>
            No subfolders here
          </Typography>
        ) : (
          <List dense>
            {folderNames.map((name) => (
              <ListItemButton key={name} onClick={() => setPath(`${path}${name}/`)}>
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText primary={name} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onConfirm(path)}>
          Move here{path ? ` (/${path.replace(/\/$/, "")})` : " (root)"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FolderPickerDialog;
