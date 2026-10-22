import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface RequireAuthPromptProps {
  title?: string;
  description?: string;
}

export default function RequireAuthPrompt({
  title = "Accesso Riservato",
  description = "Questa sezione fa parte de 'La Mia Squadra' ed è riservata ai gestori delle squadre e all'amministratore della lega. Accedi con il tuo account oppure scegli una delle squadre libere per iniziare a gestire la rosa!"
}: RequireAuthPromptProps) {
  const { openLogin } = useAuth();

  return (
    <Card className="max-w-xl mx-auto my-12 border-dashed border-2 bg-card/60 backdrop-blur-sm text-center shadow-lg">
      <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary shadow-sm">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button onClick={() => openLogin("login")} className="w-full sm:w-auto font-semibold">
            <LogIn className="h-4 w-4 mr-2" /> Accedi con le tue credenziali
          </Button>
          <Button
            onClick={() => openLogin("claim")}
            variant="outline"
            className="w-full sm:w-auto font-semibold border-primary/40 text-primary hover:bg-primary/10"
          >
            <Sparkles className="h-4 w-4 mr-2" /> Scegli una Squadra Libera
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
