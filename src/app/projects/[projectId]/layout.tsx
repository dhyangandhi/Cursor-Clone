import { Id } from "@convex/_generated/dataModel";
import { ProjectIdLayout } from "@/features/projects/components/Project-id-layout";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: Id<"projects"> };
}) {
  const { projectId } = params;

  return (
    <ProjectIdLayout projectId={projectId}>
      {children}
    </ProjectIdLayout>
  );
}
