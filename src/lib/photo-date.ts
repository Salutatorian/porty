export function formatPhotoDate(date: Date | undefined) {
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatPhotoDateValue(date: Date | undefined) {
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parsePhotoDate(value?: string) {
  if (!value?.trim()) {
    return undefined;
  }

  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T12:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return undefined;
}

export function photoMatchesDateFilter(
  photoDateTaken: string | undefined,
  filterDate: Date,
) {
  if (!photoDateTaken?.trim()) {
    return false;
  }

  const photoDate = parsePhotoDate(photoDateTaken);
  if (!photoDate) {
    const month = filterDate.toLocaleDateString("en-US", { month: "long" });
    const year = String(filterDate.getFullYear());
    return photoDateTaken.includes(month) && photoDateTaken.includes(year);
  }

  const isMonthOnly = !/^\d{4}-\d{2}-\d{2}$/.test(photoDateTaken.trim());

  if (isMonthOnly) {
    return (
      photoDate.getFullYear() === filterDate.getFullYear() &&
      photoDate.getMonth() === filterDate.getMonth()
    );
  }

  return (
    photoDate.getFullYear() === filterDate.getFullYear() &&
    photoDate.getMonth() === filterDate.getMonth() &&
    photoDate.getDate() === filterDate.getDate()
  );
}
