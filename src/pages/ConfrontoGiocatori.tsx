import Navbar from "@/components/Navbar";

const ConfrontoGiocatori = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-foreground">Confronto Giocatori</h1>
        <p className="text-muted-foreground">Confronta le statistiche dei tuoi giocatori.</p>
      </div>
    </div>
  );
};

export default ConfrontoGiocatori;
