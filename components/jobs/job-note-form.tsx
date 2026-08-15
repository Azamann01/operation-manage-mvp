"use client";

import { useActionState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addJobNote } from "@/lib/actions/jobs";

export function JobNoteForm({ jobId }: { jobId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prevState: { error?: string } | undefined, formData: FormData) => {
    const result = await addJobNote(jobId, prevState, formData);
    if (!result.error) {
      formRef.current?.reset();
      toast.success("Note added");
    }
    return result;
  }, undefined);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <Textarea
        name="description"
        placeholder="Add a note or update..."
        required
        rows={2}
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Post note
      </Button>
    </form>
  );
}
