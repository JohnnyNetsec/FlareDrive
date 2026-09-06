// Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
import { ThemeProvider } from "@emotion/react";
import {
  Alert,
  createTheme,
  CssBaseline,
  GlobalStyles,
  Snackbar,
  Stack,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";

import Footer from "./Footer";
import Header from "./Header";
import Main from "./Main";
import ProgressDialog from "./ProgressDialog";
import { Notice } from "./app/utils";
import { TransferQueueProvider } from "./app/transferQueue";

const globalStyles = (
  <GlobalStyles styles={{ "html, body, #root": { height: "100%" } }} />
);

export type SortKey = "name" | "date" | "size";
export type SortDirection = "asc" | "desc";
export type ThemeMode = "light" | "dark";
export type ViewMode = "large" | "small" | "details";

function readStored<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    readStored("flaredrive-theme", "light")
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    readStored("flaredrive-view", "large")
  );
  const [showProgressDialog, setShowProgressDialog] = React.useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("flaredrive-theme", themeMode);
    } catch {}
  }, [themeMode]);

  useEffect(() => {
    try {
      localStorage.setItem("flaredrive-view", viewMode);
    } catch {}
  }, [viewMode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: themeMode, primary: { main: "#f38020" } },
      }),
    [themeMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <TransferQueueProvider>
        <Stack sx={{ height: "100%" }}>
          <Header
            search={search}
            onSearchChange={(newSearch: string) => setSearch(newSearch)}
            sortBy={sortBy}
            onSortChange={(key) => {
              if (key === sortBy) {
                setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
              } else {
                setSortBy(key);
                setSortDirection("asc");
              }
            }}
            sortDirection={sortDirection}
            onToggleSortDirection={() =>
              setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"))
            }
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            themeMode={themeMode}
            onThemeModeChange={setThemeMode}
            setShowProgressDialog={setShowProgressDialog}
            onNotify={setError}
          />
          <Main
            search={search}
            sortBy={sortBy}
            sortDirection={sortDirection}
            viewMode={viewMode}
            onError={setError}
          />
          <Footer />
        </Stack>
        <Snackbar
          autoHideDuration={8000}
          open={Boolean(error)}
          onClose={(_, reason) => {
            if (reason !== "clickaway") setError(null);
          }}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={error instanceof Notice ? error.severity : "error"}
            variant="filled"
            onClose={() => setError(null)}
            sx={{ maxWidth: 480 }}
          >
            {error?.message}
          </Alert>
        </Snackbar>
        <ProgressDialog
          open={showProgressDialog}
          onClose={() => setShowProgressDialog(false)}
        />
      </TransferQueueProvider>
    </ThemeProvider>
  );
}

export default App;
