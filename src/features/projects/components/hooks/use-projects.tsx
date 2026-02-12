import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export const useProjects = () => {
  return useQuery(api.projects.get);
};

export const useProject = (projectId: Id<"projects">) => {
  return useQuery(api.projects.getById, { id: projectId });
};

export const useProjectsPartial = (limit: number) => {
  return useQuery(api.projects.getPartial, { limit });
};

export const useCreateProject = () => {
  return useMutation(api.projects.addProject).withOptimisticUpdate(
    (localStore, args) => {
      const existingProjects = localStore.getQuery(api.projects.get) ?? [];
      // eslint-disable-next-line react-hooks/purity
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

export const useRenameProject = () => {
  return useMutation(api.projects.rename).withOptimisticUpdate(
    (localStore, args) => {
      const existingProject = localStore.getQuery(api.projects.getById, { id: args.id });
      if (existingProject) {
        const updatedProject = {
          ...existingProject,
          name: args.name,
          // eslint-disable-next-line react-hooks/purity
          updateAt: Date.now(),
        };
        localStore.setQuery(api.projects.getById, { id: args.id }, updatedProject);

        // Update the list as well
        const existingProjects = localStore.getQuery(api.projects.get) ?? [];
        const updatedProjects = existingProjects.map(p => p._id === args.id ? updatedProject : p);
        localStore.setQuery(api.projects.get, {}, updatedProjects);
      }
    }
    );
};
