"use client";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import React from "react";

const ProjectList = () => {
  const projects = useQuery(api.projects.getProjects);
  const createProject = useMutation(api.projects.addProject);

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={() => createProject({ name: "New Project" })}>
        Add New
      </Button>
      {projects?.map((project) => (
        <div className="flex flex-col gap-2" key={project._id}>
          <p>Name: {project.name}</p>
          <p>ID: {project._id}</p>
          <p>Owner ID: {project.ownerId}</p>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;