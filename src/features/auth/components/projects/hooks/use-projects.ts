/* eslint-disable react-hooks/purity */

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export const useProjects = () => {
  return useQuery(api.projects.get);
};

export const useProjectsPartial = (limit: number) => {
  return useQuery(api.projects.getPartial, { 
    limit, 
    });
};


export const useCreateProject = () => {
  return useMutation(api.projects.addProject).withOptimisticUpdate(
    (localStore, args) => {
      const existingProjects = localStore.getQuery(api.projects.get) ?? [];
      const now = Date.now();
      const newProject = {
        _id: crypto.randomUUID() as Id<"projects">,
        _creationTime: now,
        name: args.name,
        ownerId: "anonymous",
        updateAt: now,
      };
      localStore.setQuery(api.projects.get, {}, [
        newProject,
        ...existingProjects,
      ]);
    }
  );
};
