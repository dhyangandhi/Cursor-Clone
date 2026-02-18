import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export const useFile = (fileId: Id<"files"> | null) => {
  return useQuery(
    api.files.getFile,
    fileId ? { id: fileId } : "skip"
  );
};

export const useFilePath = (fileId: Id<"files"> | null) => {
  return useQuery(
    api.files.getFilePath,
    fileId ? { id: fileId } : "skip"
  );
};

export const useCreateFile = () =>
  useMutation(api.files.createFile);

export const useUpdateFile = () => {
  return useMutation(api.files.updateFile);
}
export const useRenameFile = () =>
  useMutation(api.files.renameFile);

export const useDeleteFile = () =>
  useMutation(api.files.deleteFile);

export const useCreateFolder = () =>
  useMutation(api.files.createFolder);

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
    enabled
      ? { projectId, parentId }
      : "skip"
  );
};
