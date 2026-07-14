"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["data-photo-lightbox-open"],
  });

  return () => observer.disconnect();
}

function getSnapshot() {
  return document.body.dataset.photoLightboxOpen === "true";
}

function getServerSnapshot() {
  return false;
}

export function usePhotoLightboxOpen() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
