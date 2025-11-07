import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const matches = [
  {
    round: 11,
    date: "2024-12-15",
    matches: [
      { home: "FC Dragonslayers", away: "Sharks FC", homeScore: null, awayScore: null, status: "scheduled" },
      { home: "Thunder United", away: "Lions SC", homeScore: null, awayScore: null, status: "scheduled" },
      { home: "Phoenix Rising", away: "Eagles United", homeScore: null, awayScore: null, status: "scheduled" },
      { home: "Warriors Club", away: "Titans FC", homeScore: null, awayScore: null, status: "scheduled" },
    ],
  },
  {
    round: 10,
    date: "2024-12-08",
    matches: [
      { home: "FC Dragonslayers", away: "Thunder United", homeScore: 2, awayScore: 1, status: "completed" },
      { home: "Phoenix Rising", away: "Warriors Club", homeScore: 3, awayScore: 3, status: "completed" },
      { home: "Titans FC", away: "Eagles United", homeScore: 1, awayScore: 0, status: "completed" },
      { home: "Sharks FC", away: "Lions SC", homeScore: 2, awayScore: 2, status: "completed" },
    ],
  },
  {
    round: 9,
    date: "2024-12-01",
    matches: [
      { home: "Thunder United", away: "Phoenix Rising", homeScore: 1, awayScore: 2, status: "completed" },
      { home: "Warriors Club", away: "FC Dragonslayers", homeScore: 0, awayScore: 3, status: "completed" },
      { home: "Eagles United", away: "Sharks FC", homeScore: 2, awayScore: 1, status: "completed" },
      { home: "Lions SC", away: "Titans FC", homeScore: 1, awayScore: 1, status: "completed" },
    ],
  },
];

const Calendario = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Calendario
          </h1>
          <p className="text-muted-foreground">Tutte le partite del campionato</p>
        </div>

        <div className="space-y-6">
          {matches.map((round) => (
            <Card key={round.round} className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Giornata {round.round}</CardTitle>
                    <CardDescription>
                      {new Date(round.date).toLocaleDateString('it-IT', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardDescription>
                  </div>
                  {round.matches[0].status === "scheduled" && (
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                      In programma
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {round.matches.map((match, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="font-medium text-right w-48">{match.home}</span>
                        <div className="flex items-center gap-3 min-w-[80px] justify-center">
                          {match.status === "completed" ? (
                            <>
                              <span className="text-2xl font-bold text-primary">{match.homeScore}</span>
                              <span className="text-muted-foreground">-</span>
                              <span className="text-2xl font-bold text-primary">{match.awayScore}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground font-medium">vs</span>
                          )}
                        </div>
                        <span className="font-medium w-48">{match.away}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Calendario;
