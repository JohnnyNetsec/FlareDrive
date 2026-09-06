// Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
export const GITHUB_URL = "https://github.com/JohnnyNetsec/FlareDrive";
export const AUTHOR_NAME = "NETSEC";
export const AUTHOR_URL = "https://51sec.org";

const FIRST_YEAR = 2024;

export function copyrightYearRange(): string {
  const currentYear = new Date().getFullYear();
  return currentYear > FIRST_YEAR
    ? `${FIRST_YEAR}–${currentYear}`
    : `${FIRST_YEAR}`;
}
