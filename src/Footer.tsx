// Copyright (c) 2026 Siyu Long, portions Copyright (c) 2024-2026 FlareDrive contributors.
// SPDX-License-Identifier: MIT
import { Box, Link, Typography } from "@mui/material";
import { GITHUB_URL, copyrightYearRange } from "./copyright";

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        padding: 1,
        textAlign: "center",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        © {copyrightYearRange()} FlareDrive ·{" "}
        <Link
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          color="inherit"
        >
          GitHub
        </Link>
      </Typography>
    </Box>
  );
}

export default Footer;
