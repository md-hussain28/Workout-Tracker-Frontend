import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { TemplateDetailClient } from "./template-detail-client";

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (Number.isNaN(templateId)) notFound();

  let template: Awaited<ReturnType<typeof api.templates.get>>;
  try {
    template = await api.templates.get(templateId);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <TemplateDetailClient template={template} />
    </div>
  );
}
