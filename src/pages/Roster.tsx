import Navbar from "@/components/Navbar";
import { Shield } from "lucide-react";

const Roster = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">Roster</h1>
        <p className="text-muted-foreground">Lista dei giocatori della squadra.</p>
      </div>
      </main>
    </div>
  );
};

export default Roster;
