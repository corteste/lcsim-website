import Navbar from "@/components/Navbar";

const Roster = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-foreground">Roster</h1>
        <p className="text-muted-foreground">Gestisci il roster della tua squadra.</p>
      </div>
    </div>
  );
};

export default Roster;
