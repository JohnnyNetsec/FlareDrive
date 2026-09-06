// Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
export class Notice extends Error {
  severity: "error" | "success";
  constructor(message: string, severity: "error" | "success" = "error") {
    super(message);
    this.severity = severity;
  }
}

export function humanReadableSize(size: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (size >= 1024) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}
