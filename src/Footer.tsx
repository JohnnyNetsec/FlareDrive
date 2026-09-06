import { Box, Link, Typography } from "@mui/material";

const GITHUB_URL = "https://github.com/JohnnyNetsec/FlareDrive";
const FIRST_YEAR = 2024;

function Footer() {
  const currentYear = new Date().getFullYear();
  const yearLabel =
    currentYear > FIRST_YEAR ? `${FIRST_YEAR}–${currentYear}` : `${FIRST_YEAR}`;

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
        © {yearLabel} FlareDrive ·{" "}
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
