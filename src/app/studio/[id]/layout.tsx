import { StudioProvider } from "@/components/feat/context";

export default async function StudioLayout({
  leftPanel,
  rightPanel,
  params,
}: {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <StudioProvider videoId={id}>
      {leftPanel}
      {rightPanel}
    </StudioProvider>
  );
}
