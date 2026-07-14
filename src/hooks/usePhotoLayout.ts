type GridSize = {
  cols: number;
  rows: number;
};

type PhotoLayoutPreset = {
  isLarge: boolean;
  mobile: GridSize;
  sm: GridSize;
  lg: GridSize;
  classes: string;
};

const PHOTO_LAYOUT_PRESETS: PhotoLayoutPreset[] = [
  {
    isLarge: false,
    mobile: { cols: 1, rows: 28 },
    sm: { cols: 2, rows: 34 },
    lg: { cols: 2, rows: 34 },
    classes:
      "col-span-1 row-span-[28] sm:col-span-2 sm:row-span-[34] lg:col-span-2 lg:row-span-[34]",
  },
  {
    isLarge: false,
    mobile: { cols: 1, rows: 38 },
    sm: { cols: 2, rows: 44 },
    lg: { cols: 2, rows: 44 },
    classes:
      "col-span-1 row-span-[38] sm:col-span-2 sm:row-span-[44] lg:col-span-2 lg:row-span-[44]",
  },
  {
    isLarge: false,
    mobile: { cols: 2, rows: 26 },
    sm: { cols: 2, rows: 32 },
    lg: { cols: 2, rows: 32 },
    classes:
      "col-span-2 row-span-[26] sm:col-span-2 sm:row-span-[32] lg:col-span-2 lg:row-span-[32]",
  },
  {
    isLarge: true,
    mobile: { cols: 2, rows: 34 },
    sm: { cols: 3, rows: 38 },
    lg: { cols: 3, rows: 38 },
    classes:
      "col-span-2 row-span-[34] sm:col-span-3 sm:row-span-[38] lg:col-span-3 lg:row-span-[38]",
  },
  {
    isLarge: true,
    mobile: { cols: 2, rows: 42 },
    sm: { cols: 3, rows: 50 },
    lg: { cols: 3, rows: 50 },
    classes:
      "col-span-2 row-span-[42] sm:col-span-3 sm:row-span-[50] lg:col-span-3 lg:row-span-[50]",
  },
  {
    isLarge: false,
    mobile: { cols: 1, rows: 44 },
    sm: { cols: 2, rows: 52 },
    lg: { cols: 2, rows: 52 },
    classes:
      "col-span-1 row-span-[44] sm:col-span-2 sm:row-span-[52] lg:col-span-2 lg:row-span-[52]",
  },
  {
    isLarge: true,
    mobile: { cols: 2, rows: 30 },
    sm: { cols: 4, rows: 36 },
    lg: { cols: 4, rows: 36 },
    classes:
      "col-span-2 row-span-[30] sm:col-span-4 sm:row-span-[36] lg:col-span-4 lg:row-span-[36]",
  },
  {
    isLarge: true,
    mobile: { cols: 2, rows: 40 },
    sm: { cols: 4, rows: 48 },
    lg: { cols: 4, rows: 48 },
    classes:
      "col-span-2 row-span-[40] sm:col-span-4 sm:row-span-[48] lg:col-span-4 lg:row-span-[48]",
  },
];

export function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function canPlace(
  occupied: Set<string>,
  row: number,
  col: number,
  size: GridSize,
  gridCols: number,
) {
  if (col + size.cols > gridCols) return false;

  for (let r = row; r < row + size.rows; r += 1) {
    for (let c = col; c < col + size.cols; c += 1) {
      if (occupied.has(cellKey(r, c))) return false;
    }
  }

  return true;
}

function markPlaced(
  occupied: Set<string>,
  row: number,
  col: number,
  size: GridSize,
) {
  for (let r = row; r < row + size.rows; r += 1) {
    for (let c = col; c < col + size.cols; c += 1) {
      occupied.add(cellKey(r, c));
    }
  }
}

function findDenseSlot(
  occupied: Set<string>,
  gridCols: number,
  size: GridSize,
) {
  for (let row = 0; row < 800; row += 1) {
    for (let col = 0; col <= gridCols - size.cols; col += 1) {
      if (canPlace(occupied, row, col, size, gridCols)) {
        return { row, col };
      }
    }
  }

  return { row: 0, col: 0 };
}

function getPresetSize(
  preset: PhotoLayoutPreset,
  gridCols: number,
): GridSize {
  if (gridCols >= 6) return preset.lg;
  if (gridCols >= 4) return preset.sm;
  return preset.mobile;
}

function packPresetIndices(photoIds: string[], gridCols: number) {
  const occupied = new Set<string>();
  const assignments: number[] = [];
  let previousWasLarge = false;

  for (let index = 0; index < photoIds.length; index += 1) {
    const photoId = photoIds[index];
    if (!photoId) continue;

    const preferred =
      hashString(`${photoId}-${index}`) % PHOTO_LAYOUT_PRESETS.length;

    const candidateOrder = Array.from(
      { length: PHOTO_LAYOUT_PRESETS.length },
      (_, offset) => (preferred + offset) % PHOTO_LAYOUT_PRESETS.length,
    );

    let bestPresetIndex = candidateOrder[0] ?? 0;
    let bestSlotRow = Number.POSITIVE_INFINITY;
    let bestSlotCol = Number.POSITIVE_INFINITY;

    for (const presetIndex of candidateOrder) {
      const preset = PHOTO_LAYOUT_PRESETS[presetIndex];
      if (!preset) continue;

      const size = getPresetSize(preset, gridCols);
      if (size.cols > gridCols) continue;
      if (previousWasLarge && preset.isLarge) continue;

      const slot = findDenseSlot(occupied, gridCols, size);
      const isBetter =
        slot.row < bestSlotRow ||
        (slot.row === bestSlotRow && slot.col < bestSlotCol);

      if (isBetter) {
        bestPresetIndex = presetIndex;
        bestSlotRow = slot.row;
        bestSlotCol = slot.col;
      }
    }

    const chosenPreset = PHOTO_LAYOUT_PRESETS[bestPresetIndex];
    if (!chosenPreset) continue;

    const chosenSize = getPresetSize(chosenPreset, gridCols);
    const chosenSlot = findDenseSlot(occupied, gridCols, chosenSize);
    markPlaced(occupied, chosenSlot.row, chosenSlot.col, chosenSize);

    assignments.push(bestPresetIndex);
    previousWasLarge = chosenPreset.isLarge;
  }

  return assignments;
}

export function assignPhotoLayouts(photos: { id: string }[]) {
  const photoIds = photos.map((photo) => photo.id);

  // Pack against the desktop grid; dense flow follows the same placement rules.
  const presetIndices = packPresetIndices(photoIds, 6);

  return presetIndices.map((presetIndex) => {
    return PHOTO_LAYOUT_PRESETS[presetIndex]?.classes ?? "";
  });
}

export function getPhotoLayout(photoId: string, index: number) {
  const layouts = assignPhotoLayouts([{ id: photoId }]);
  const presetIndex =
    hashString(`${photoId}-${index}`) % PHOTO_LAYOUT_PRESETS.length;

  return {
    className: layouts[0] ?? PHOTO_LAYOUT_PRESETS[presetIndex]?.classes ?? "",
    presetIndex,
  };
}
