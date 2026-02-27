import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { RecipientRequest, MatchResult } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useFindMatch() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RecipientRequest) => {
      const validated = api.match.find.input.parse(data);
      const res = await fetch(api.match.find.path, {
        method: api.match.find.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.match.find.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to find matches");
      }
      return api.match.find.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Match Processing Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
