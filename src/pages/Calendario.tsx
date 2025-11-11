import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

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

type MatchRow = {
	home: string;
	away: string;
	homeScore: number | null;
	awayScore: number | null;
	status: "scheduled" | "completed";
};

type Round = {
	round: number;
	date: string;
	matches: MatchRow[];
};

const generateStats = (m: MatchRow) => {
	// deterministic simple stats derived from score when available
	if (m.status === "completed" && m.homeScore !== null && m.awayScore !== null) {
		const totalGoals = m.homeScore + m.awayScore;
		const homeAdv = m.homeScore - m.awayScore;
		const possessionHome = Math.max(20, Math.min(80, 50 + homeAdv * 6));
		const possessionAway = 100 - possessionHome;
		const shotsHome = 6 + Math.max(0, m.homeScore) * 3 + Math.max(0, Math.min(4, homeAdv));
		const shotsAway = 6 + Math.max(0, m.awayScore) * 3 + Math.max(0, Math.min(4, -homeAdv));
		const shotsOnTargetHome = Math.max(0, Math.round(shotsHome * 0.45));
		const shotsOnTargetAway = Math.max(0, Math.round(shotsAway * 0.4));
		const cornersHome = Math.max(0, Math.round(shotsHome / 3));
		const cornersAway = Math.max(0, Math.round(shotsAway / 3));
		const foulsHome = 8 + Math.abs(homeAdv) * 2;
		const foulsAway = 8 + Math.abs(homeAdv) * 2 - (homeAdv > 0 ? 1 : 0);

		return {
			possessionHome,
			possessionAway,
			shotsHome,
			shotsAway,
			shotsOnTargetHome,
			shotsOnTargetAway,
			cornersHome,
			cornersAway,
			foulsHome,
			foulsAway,
		};
	}

	// scheduled -> placeholder / N/D values
	return {
		possessionHome: "N/D",
		possessionAway: "N/D",
		shotsHome: "N/D",
		shotsAway: "N/D",
		shotsOnTargetHome: "N/D",
		shotsOnTargetAway: "N/D",
		cornersHome: "N/D",
		cornersAway: "N/D",
		foulsHome: "N/D",
		foulsAway: "N/D",
	} as const;
};

const Calendario = () => {
	const [selected, setSelected] = useState<{ round: number; date: string; match: MatchRow } | null>(null);

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
					{matches.map((round: Round) => (
						<Card key={round.round} className="shadow-lg">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>Giornata {round.round}</CardTitle>
										<CardDescription>
											{new Date(round.date).toLocaleDateString("it-IT", {
												weekday: "long",
												year: "numeric",
												month: "long",
												day: "numeric",
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
											onClick={() => setSelected({ round: round.round, date: round.date, match })}
											className="flex items-center justify-center p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
										>
											<div className="flex items-center gap-4">
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

			{/* Modal / Popup per dettaglio partita */}
			{selected && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={() => setSelected(null)}
				>
					<div className="w-full max-w-3xl p-4" onClick={(e) => e.stopPropagation()}>
						<Card className="shadow-xl">
							<CardHeader>
								<div className="flex items-start justify-between gap-4">
									<div>
										<CardTitle className="flex items-center gap-2">
											{selected.match.home}{" "}
											<span className="text-muted-foreground">vs</span> {selected.match.away}
										</CardTitle>
										<CardDescription>
											Giornata {selected.round} —{" "}
											{new Date(selected.date).toLocaleDateString("it-IT")}
										</CardDescription>
									</div>
									<div className="text-right">
										<div className="text-3xl font-bold text-primary">
											{selected.match.status === "completed"
												? `${selected.match.homeScore} - ${selected.match.awayScore}`
												: "Non giocata"}
										</div>
										<button
											onClick={() => setSelected(null)}
											className="mt-3 px-3 py-1 rounded bg-muted/60 hover:bg-muted text-sm"
										>
											Chiudi
										</button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-6">
									{/* Basic stats */}
									<div>
										<h3 className="font-semibold mb-2">Statistiche principali</h3>
										{(() => {
											const s = generateStats(selected.match);

											const renderBar = (left: number | string, right: number | string) => {
												if (typeof left !== "number" || typeof right !== "number") {
													return <div className="h-3 bg-muted rounded" />;
												}
												const total = left + right;
												const leftPct = total > 0 ? Math.round((left / total) * 100) : 50;
												const rightPct = 100 - leftPct;

												return (
													<div className="w-full bg-muted/20 h-3 rounded overflow-hidden flex">
														<div
															className="h-full bg-[rgb(73,140,244)]"
															style={{ width: `${leftPct}%` }}
														/>
														<div
															className="h-full bg-[rgb(80,200,120)]"
															style={{ width: `${rightPct}%` }}
														/>
													</div>
												);
											};

											return (
												<div className="space-y-4 text-sm text-foreground">
													{/* Possesso palla (percentuali) */}
													<div>
														<div className="flex justify-between mb-1">
															<span>Possesso palla</span>
															<span>
																{typeof s.possessionHome === "number"
																	? `${s.possessionHome}% - ${s.possessionAway}%`
																	: "N/D"}
															</span>
														</div>
														{typeof s.possessionHome === "number" &&
														typeof s.possessionAway === "number" ? (
															<div className="w-full">
																<div className="w-full bg-muted/20 h-3 rounded overflow-hidden flex">
																	<div
																		className="h-full bg-primary"
																		style={{ width: `${s.possessionHome}%` }}
																	/>
																	<div
																		className="h-full bg-accent"
																		style={{ width: `${s.possessionAway}%` }}
																	/>
																</div>
															</div>
														) : (
															<div className="h-3 bg-muted rounded" />
														)}
													</div>

													{/* Tiri */}
													<div>
														<div className="flex justify-between mb-1">
															<span>Tiri</span>
															<span>
																{typeof s.shotsHome === "number"
																	? `${s.shotsHome} - ${s.shotsAway}`
																	: "N/D"}
															</span>
														</div>
														{renderBar(s.shotsHome, s.shotsAway)}
													</div>

													{/* Tiri in porta */}
													<div>
														<div className="flex justify-between mb-1">
															<span>Tiri in porta</span>
															<span>
																{typeof s.shotsOnTargetHome === "number"
																	? `${s.shotsOnTargetHome} - ${s.shotsOnTargetAway}`
																	: "N/D"}
															</span>
														</div>
														{renderBar(s.shotsOnTargetHome, s.shotsOnTargetAway)}
													</div>

													{/* Calci d'angolo */}
													<div>
														<div className="flex justify-between mb-1">
															<span>Calci d'angolo</span>
															<span>
																{typeof s.cornersHome === "number"
																	? `${s.cornersHome} - ${s.cornersAway}`
																	: "N/D"}
															</span>
														</div>
														{renderBar(s.cornersHome, s.cornersAway)}
													</div>

													{/* Falli */}
													<div>
														<div className="flex justify-between mb-1">
															<span>Falli</span>
															<span>
																{typeof s.foulsHome === "number"
																	? `${s.foulsHome} - ${s.foulsAway}`
																	: "N/D"}
															</span>
														</div>
														{renderBar(s.foulsHome, s.foulsAway)}
													</div>
												</div>
											);
										})()}
									</div>

									{/* Extra / evento */}
									<div>
										<h3 className="font-semibold mb-2">Dettagli</h3>
										<div className="text-sm text-foreground space-y-2">
											<div>
												<strong>Stato:</strong>{" "}
												<span className="ml-2">{selected.match.status}</span>
											</div>
											<div>
												<strong>Data:</strong>{" "}
												<span className="ml-2">
													{new Date(selected.date).toLocaleString("it-IT")}
												</span>
											</div>
											<div>
												<strong>Sede:</strong>{" "}
												<span className="ml-2">Stadio principale</span>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
};

export default Calendario;
