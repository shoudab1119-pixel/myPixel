"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import {
  PROJECT_DB_NAME,
  PROJECT_FALLBACK_KEY,
  PROJECT_STORE_NAME,
} from "@/lib/constants";
import type {
  ProjectListItem,
  ProjectRecord,
  ProjectSnapshot,
} from "@/types/project";

interface ProjectDatabase extends DBSchema {
  projects: {
    key: string;
    value: ProjectRecord;
    indexes: {
      "by-updatedAt": string;
    };
  };
}

let databasePromise: Promise<IDBPDatabase<ProjectDatabase>> | null = null;

function isIndexedDbAvailable() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDB<ProjectDatabase>(PROJECT_DB_NAME, 1, {
      upgrade(database) {
        const store = database.createObjectStore(PROJECT_STORE_NAME, {
          keyPath: "id",
        });
        store.createIndex("by-updatedAt", "updatedAt");
      },
    });
  }

  return databasePromise;
}

function readFallbackStore() {
  if (typeof window === "undefined") {
    return [] as ProjectRecord[];
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(PROJECT_FALLBACK_KEY) ?? "[]",
    ) as ProjectRecord[];
  } catch {
    return [];
  }
}

function writeFallbackStore(records: ProjectRecord[]) {
  window.localStorage.setItem(PROJECT_FALLBACK_KEY, JSON.stringify(records));
}

function toListItem(record: ProjectRecord): ProjectListItem {
  return {
    id: record.id,
    name: record.name,
    updatedAt: record.updatedAt,
    thumbnailDataUrl: record.thumbnailDataUrl,
    width: record.snapshot.grid.width,
    height: record.snapshot.grid.height,
    colorCount: new Set(record.snapshot.grid.cells).size,
  };
}

export async function listProjects() {
  if (!isIndexedDbAvailable()) {
    return readFallbackStore()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(toListItem);
  }

  const database = await getDatabase();
  const records = await database.getAllFromIndex(PROJECT_STORE_NAME, "by-updatedAt");

  return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toListItem);
}

export async function getProject(projectId: string) {
  if (!isIndexedDbAvailable()) {
    return readFallbackStore().find((record) => record.id === projectId) ?? null;
  }

  const database = await getDatabase();
  return (await database.get(PROJECT_STORE_NAME, projectId)) ?? null;
}

export async function saveProjectRecord(record: ProjectRecord) {
  if (!isIndexedDbAvailable()) {
    const records = readFallbackStore();
    const existingIndex = records.findIndex((item) => item.id === record.id);

    if (existingIndex === -1) {
      records.push(record);
    } else {
      records[existingIndex] = record;
    }

    writeFallbackStore(records);
    return record;
  }

  const database = await getDatabase();
  await database.put(PROJECT_STORE_NAME, record);
  return record;
}

export async function deleteProject(projectId: string) {
  if (!isIndexedDbAvailable()) {
    writeFallbackStore(readFallbackStore().filter((record) => record.id !== projectId));
    return;
  }

  const database = await getDatabase();
  await database.delete(PROJECT_STORE_NAME, projectId);
}

export function createProjectRecord(
  snapshot: ProjectSnapshot,
  thumbnailDataUrl: string,
  existing?: ProjectRecord | null,
): ProjectRecord {
  const now = new Date().toISOString();

  return {
    id: snapshot.projectId,
    name: snapshot.projectName.trim() || "Untitled Pattern",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    thumbnailDataUrl,
    snapshot,
  };
}
