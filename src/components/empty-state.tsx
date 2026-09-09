import { AlertCircle, Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <Inbox className="mb-3 size-8 text-muted-foreground" aria-hidden />
      <h2 className="font-heading text-lg">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
      <AlertCircle className="mt-0.5 size-4 text-destructive" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
