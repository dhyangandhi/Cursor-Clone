import { Id } from "@convex/_generated/dataModel";
import { ProjectIdLayout } from "@/features/projects/components/Project-id-layout";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: Id<"projects"> }>;
}) {
  const { projectId } = await params;
  return (
    <ProjectIdLayout projectId={projectId as Id<"projects">}>
      {children}
    </ProjectIdLayout>
  );
}
