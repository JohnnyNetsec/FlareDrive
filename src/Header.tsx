// Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
import {
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import {
  Check as CheckIcon,
  Clear as ClearIcon,
  GitHub as GitHubIcon,
  Logout as LogoutIcon,
  MoreHoriz as MoreHorizIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { AUTHOR_NAME, GITHUB_URL, copyrightYearRange } from "./copyright";
import { logout } from "./app/transfer";
import { Notice } from "./app/utils";
import type { SortKey } from "./App";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "date", label: "Date modified" },
  { key: "size", label: "Size" },
];

function Header({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  setShowProgressDialog,
  onNotify,
}: {
  search: string;
  onSearchChange: (newSearch: string) => void;
  sortBy: SortKey;
  onSortChange: (sortBy: SortKey) => void;
  setShowProgressDialog: (show: boolean) => void;
  onNotify: (error: Error) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <Toolbar disableGutters sx={{ padding: 1 }}>
      <SearchIcon color="action" sx={{ marginX: 1 }} />
      <InputBase
        size="small"
        fullWidth
        placeholder="Search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        endAdornment={
          search && (
            <IconButton
              aria-label="Clear search"
              size="small"
              onClick={() => onSearchChange("")}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          )
        }
        sx={{
          backgroundColor: "whitesmoke",
          borderRadius: "999px",
          padding: "4px 8px 4px 16px",
        }}
      />
      <Tooltip
        title={`© ${copyrightYearRange()} FlareDrive · ${AUTHOR_NAME} — view on GitHub`}
      >
        <IconButton
          aria-label="GitHub repository"
          color="inherit"
          component="a"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ marginLeft: 0.5 }}
        >
          <GitHubIcon />
        </IconButton>
      </Tooltip>
      <IconButton
        aria-label="More"
        color="inherit"
        sx={{ marginLeft: 0.5 }}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <MoreHorizIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {SORT_OPTIONS.map(({ key, label }) => (
          <MenuItem
            key={key}
            selected={sortBy === key}
            onClick={() => {
              onSortChange(key);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              {sortBy === key && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>Sort by {label}</ListItemText>
          </MenuItem>
        ))}
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setShowProgressDialog(true);
          }}
        >
          Progress
        </MenuItem>
        <MenuItem
          onClick={async () => {
            setAnchorEl(null);
            await logout();
            onNotify(
              new Notice(
                "Logged out. You'll be asked to sign in again next time you upload, delete, or manage folders.",
                "success"
              )
            );
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Log Out</ListItemText>
        </MenuItem>
      </Menu>
    </Toolbar>
  );
}

export default Header;
