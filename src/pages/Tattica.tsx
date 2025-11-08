import Navbar from "@/components/Navbar";

const Tattica = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-foreground">Tattica</h1>
        <p className="text-muted-foreground">Imposta la tattica della tua squadra.</p>
      </div>
    </div>
  );
};

export default Tattica;
