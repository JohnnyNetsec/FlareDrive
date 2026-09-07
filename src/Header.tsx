// Copyright (c) 2026 Siyu Long, portions Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
import {
  Box,
  Divider,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Toolbar,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import {
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  DarkMode as DarkModeIcon,
  GitHub as GitHubIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  MoreHoriz as MoreHorizIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { AUTHOR_NAME, GITHUB_URL, copyrightYearRange } from "./copyright";
import { logout } from "./app/transfer";
import { Notice } from "./app/utils";
import type { SortDirection, SortKey, ThemeMode, ViewMode } from "./App";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "date", label: "Date modified" },
  { key: "size", label: "Size" },
];

const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: "large", label: "Large icons" },
  { key: "small", label: "Small icons" },
  { key: "details", label: "Details" },
];

function Header({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  sortDirection,
  onToggleSortDirection,
  viewMode,
  onViewModeChange,
  themeMode,
  onThemeModeChange,
  setShowProgressDialog,
  onNotify,
}: {
  search: string;
  onSearchChange: (newSearch: string) => void;
  sortBy: SortKey;
  onSortChange: (sortBy: SortKey) => void;
  sortDirection: SortDirection;
  onToggleSortDirection: () => void;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  setShowProgressDialog: (show: boolean) => void;
  onNotify: (error: Error) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <Toolbar disableGutters sx={{ padding: 1 }}>
      <SearchIcon color="action" sx={{ marginX: 1 }} />
      <InputBase
        size="small"
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
          width: { xs: 140, sm: 220 },
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "grey.800" : "whitesmoke",
          borderRadius: "999px",
          padding: "4px 8px 4px 16px",
        }}
      />

      <Box sx={{ flexGrow: 1 }} />

      <Tooltip
        title={`Sort ${sortDirection === "asc" ? "ascending" : "descending"} (click to reverse)`}
      >
        <IconButton
          aria-label="Toggle sort direction"
          color="inherit"
          onClick={onToggleSortDirection}
        >
          {sortDirection === "asc" ? (
            <ArrowUpwardIcon fontSize="small" />
          ) : (
            <ArrowDownwardIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      <Tooltip title="Toggle dark / light theme">
        <Switch
          checked={themeMode === "dark"}
          onChange={(e) => onThemeModeChange(e.target.checked ? "dark" : "light")}
          icon={<LightModeIcon fontSize="small" sx={{ padding: "1px" }} />}
          checkedIcon={<DarkModeIcon fontSize="small" sx={{ padding: "1px" }} />}
          inputProps={{ "aria-label": "Toggle dark / light theme" }}
        />
      </Tooltip>

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
        {VIEW_OPTIONS.map(({ key, label }) => (
          <MenuItem
            key={key}
            selected={viewMode === key}
            onClick={() => {
              onViewModeChange(key);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              {viewMode === key && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
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
            <ListItemText>
              Sort by {label}
              {sortBy === key && (sortDirection === "asc" ? " ↑" : " ↓")}
            </ListItemText>
          </MenuItem>
        ))}
        <Divider />
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
