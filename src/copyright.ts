// Copyright (c) 2026 Siyu Long, portions Copyright (c) 2024-2026 FlareDrive contributors.
// SPDX-License-Identifier: MIT
export const GITHUB_URL = "https://github.com/JohnnyNetsec/FlareDrive";

const FIRST_YEAR = 2024;

export function copyrightYearRange(): string {
  const currentYear = new Date().getFullYear();
  return currentYear > FIRST_YEAR
    ? `${FIRST_YEAR}–${currentYear}`
    : `${FIRST_YEAR}`;
}
