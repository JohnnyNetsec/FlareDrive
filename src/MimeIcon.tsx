// Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
import AudioFileIcon from "@mui/icons-material/AudioFile";
import CodeIcon from "@mui/icons-material/Code";
import FolderIcon from "@mui/icons-material/Folder";
import FolderZipOutlinedIcon from "@mui/icons-material/FolderZipOutlined";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import PdfIcon from "@mui/icons-material/PictureAsPdf";
import VideoFileIcon from "@mui/icons-material/VideoFile";

function MimeIcon({
  contentType,
  fontSize = "large",
}: {
  contentType: string;
  fontSize?: "small" | "medium" | "large";
}) {
  const fallbackIcon = <InsertDriveFileOutlinedIcon fontSize={fontSize} />;
  if (typeof contentType !== "string") return fallbackIcon;

  return contentType.startsWith("image/") ? (
    <ImageIcon fontSize={fontSize} />
  ) : contentType.startsWith("audio/") ? (
    <AudioFileIcon fontSize={fontSize} />
  ) : contentType.startsWith("video/") ? (
    <VideoFileIcon fontSize={fontSize} />
  ) : contentType === "application/pdf" ? (
    <PdfIcon fontSize={fontSize} />
  ) : ["application/zip", "application/gzip"].includes(contentType) ? (
    <FolderZipOutlinedIcon fontSize={fontSize} />
  ) : contentType.startsWith("text/") ? (
    <CodeIcon fontSize={fontSize} />
  ) : contentType === "application/x-directory" ? (
    <FolderIcon fontSize={fontSize} />
  ) : (
    fallbackIcon
  );
}

export default MimeIcon;
