import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

export default async function TemplatesPage() {
  let templates: Awaited<ReturnType<typeof api.templates.list>> = [];
  let error: string | null = null;
  try {
    templates = await api.templates.list();
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load templates";
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Templates</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Start a workout from a saved template.
      </p>

      {error && <p className="text-destructive text-sm py-4">{error}</p>}

      {!error && templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="font-medium">No templates yet</p>
            <p className="text-sm mt-1">Save a completed workout as a template from its workout page.</p>
          </CardContent>
        </Card>
      )}

      {!error && templates.length > 0 && (
        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t.id}>
              <TemplateCard template={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function TemplateCard({ template }: { template: Awaited<ReturnType<typeof api.templates.list>>[0] }) {
  return (
    <Card className="overflow-hidden">
      <Link href={`/templates/${template.id}`}>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium">{template.name}</p>
            <p className="text-muted-foreground text-sm">
              {template.exercises.length} exercise{template.exercises.length !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="text-muted-foreground text-sm">Open</span>
        </CardContent>
      </Link>
    </Card>
  );
}
