import { IconButton, InputBase, Menu, MenuItem, Toolbar } from "@mui/material";
import { useState } from "react";
import {
  GitHub as GitHubIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

const GITHUB_URL = "https://github.com/JohnnyNetsec/FlareDrive";

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
