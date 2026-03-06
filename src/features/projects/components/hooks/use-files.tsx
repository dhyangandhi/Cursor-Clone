import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

/* =========================
   GET SINGLE FILE
========================= */

export const useFile = (fileId: Id<"files"> | null) => {
  return useQuery(
    api.files.getFile,
    fileId ? { fileId } : "skip"
  );
};

/* =========================
   GET FILE PATH
========================= */

export const useFilePath = (fileId: Id<"files"> | null) => {
  return useQuery(
    api.files.getFilePath,
    fileId ? { fileId } : "skip"
  );
};

/* =========================
   GET ROOT FILES
========================= */

export const useFiles = (projectId: Id<"projects"> | null) => {
  return useQuery(
    api.files.getFolderContents,
    projectId ? { projectId, parentId: undefined } : "skip"
  );
};

/* =========================
   MUTATIONS
========================= */

export const useCreateFile = () =>
  useMutation(api.files.createFile);

export const useUpdateFile = () =>
  useMutation(api.files.updateFile);

export const useRenameFile = () =>
  useMutation(api.files.renameFile);

export const useDeleteFile = () =>
  useMutation(api.files.deleteFile);

export const useCreateFolder = () =>
  useMutation(api.files.createFolder);

/* =========================
   GET FOLDER CONTENTS
========================= */

export const useFolderContents = ({
  projectId,
  parentId,
  enabled = true,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
  enabled?: boolean;
}) => {
  return useQuery(
    api.files.getFolderContents,
    enabled ? { projectId, parentId } : "skip"
  );
};