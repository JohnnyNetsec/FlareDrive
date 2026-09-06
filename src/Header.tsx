// Copyright (c) 2026 Siyu Long, portions Copyright (c) 2024-2026 FlareDrive contributors.
// SPDX-License-Identifier: MIT
import {
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import {
  GitHub as GitHubIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";
import { GITHUB_URL, copyrightYearRange } from "./copyright";

function Header({
  search,
  onSearchChange,
  setShowProgressDialog,
}: {
  search: string;
  onSearchChange: (newSearch: string) => void;
  setShowProgressDialog: (show: boolean) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <Toolbar disableGutters sx={{ padding: 1 }}>
      <Tooltip title={`© ${copyrightYearRange()} FlareDrive`}>
        <Typography
          variant="subtitle1"
          noWrap
          sx={{ paddingX: 1, cursor: "default" }}
        >
          FlareDrive
        </Typography>
      </Tooltip>
      <InputBase
        size="small"
        fullWidth
        placeholder="Search…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{
          backgroundColor: "whitesmoke",
          borderRadius: "999px",
          padding: "8px 16px",
        }}
      />
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
        <MenuItem>View as</MenuItem>
        <MenuItem>Sort by</MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setShowProgressDialog(true);
          }}
        >
          Progress
        </MenuItem>
      </Menu>
    </Toolbar>
  );
}

export default Header;
