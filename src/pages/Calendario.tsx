import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";
import { useState, useEffect } from "react";
import { PlayerStats } from "@/types/playerStats";

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

// Funzione per generare statistiche giocatori
const generatePlayerStats = (teamName: string, isHome: boolean, match: MatchRow) => {
	if (match.status !== "completed") return [];

	const numPlayers = 11;
	const players = [];

	for (let i = 1; i <= numPlayers; i++) {
		const baseRating = 5.5 + Math.random() * 3;
		const goals = Math.random() > 0.85 ? 1 : 0;
		const assists = Math.random() > 0.90 ? 1 : 0;
		const yellowCards = Math.random() > 0.85 ? 1 : 0;
		const redCards = Math.random() > 0.95 ? 1 : 0;

		players.push({
			name: `Giocatore ${i}`,
			number: i,
			rating: (baseRating + goals * 0.5 + assists * 0.3 - redCards * 2).toFixed(1),
			goals,
			assists,
			yellowCards,
			redCards,
			minutesPlayed: Math.floor(70 + Math.random() * 20),
			passes: Math.floor(20 + Math.random() * 40),
			passAccuracy: Math.floor(70 + Math.random() * 25),
		});
	}

	return players;
};

const Calendario = () => {
	const [selected, setSelected] = useState<{ round: number; date: string; match: MatchRow } | null>(null);
	const [showAdvancedStats, setShowAdvancedStats] = useState(false);
	const [playersStats, setPlayersStats] = useState<PlayerStats[]>([]);
	
	// PER ORDINE FORMAZIONE
	const rolePriority: Record<string, number> = {
  	POR: 0,
  	TD: 1,
  	DC: 2,
  	TS: 3,
	CDC: 4,
	ED: 5,
	CC: 6,
	ES: 7,
	COC: 8,
	AD: 9,
	AS: 10,
	AT: 11,
	ATT: 12
	};
	
	const sortedPlayers = playersStats.sort(
  	(a, b) => rolePriority[a.Posiz] - rolePriority[b.Posiz]
	);

	useEffect(() => {
		  async function fetchStats() {
			const { data, error } = await supabase.from("VIEW_PLAYER_STATS").select("*").eq('Squadra', 'APD').eq('STAG', 8).eq('WEEK', 4); // filtrare per squadra dell'utente
			console.log("Fetch risultati di giornata:");
			console.log(data);
			if (error) console.error(error);
			else setPlayersStats(data || []);
		  }
		  fetchStats();
		}, []);

	const handleCloseModal = () => {
		setSelected(null);
		setShowAdvancedStats(false);
	};

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
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					onClick={handleCloseModal}
				>
					<div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
						<Card className="shadow-xl">
							<CardHeader>
								<div className="flex items-start justify-between gap-4">
									<div>
										<CardTitle className="flex items-center gap-2">
										{selected.match.status === "completed" ? (
											<>
											{selected.match.home}
											<span className="text-primary font-bold">{selected.match.homeScore}</span>
											-
											<span className="text-primary font-bold">{selected.match.awayScore}</span>
											{selected.match.away}
											</>
										) : (
											<>
											{selected.match.home} vs {selected.match.away}
											</>
										)}
										</CardTitle>
										<CardDescription>
											Giornata {selected.round} —{" "}
											{new Date(selected.date).toLocaleDateString("it-IT")}
										</CardDescription>
									</div>
									{/* <div className="text-right">
										<div className="text-3xl font-bold text-primary">
											{selected.match.status === "completed"
												? `${selected.match.homeScore} - ${selected.match.awayScore}`
												: "Non giocata"}
										</div>
									</div> */}
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
														{renderBar(s.possessionHome, s.possessionAway)}
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
												<strong>Data:</strong>{" "}
												<span className="ml-2">
													{new Date(selected.date).toLocaleString("it-IT")}
												</span>
											</div>
											<div>
												<strong>Stadio:</strong>{" "}
												<span className="ml-2">Stadio principale</span>
											</div>
										</div>
									</div>
								</div>

								{/* Pulsante statistiche avanzate */}
								<div className="mt-6 pt-6 border-t">
									<Button
										variant="outline"
										className="w-full"
										onClick={() => setShowAdvancedStats(!showAdvancedStats)}
									>
										{showAdvancedStats ? (
											<>
												<ChevronUp className="h-4 w-4 mr-2" />
												Nascondi statistiche avanzate
											</>
										) : (
											<>
												<ChevronDown className="h-4 w-4 mr-2" />
												Mostra statistiche avanzate
											</>
										)}
									</Button>
								</div>

								{/* Sezione statistiche avanzate giocatori */}
								{showAdvancedStats && selected.match.status === "completed" && (
									<div className="mt-6 space-y-6">
										<div className="border-t pt-6">
											<h3 className="font-semibold text-lg mb-4">Statistiche Giocatori</h3>

											<div className="grid grid-cols-2 gap-6">
												{/* Giocatori squadra casa */}
												<div>
													<h4 className="font-medium mb-3 text-primary">{selected.match.home}</h4>
													<div className="space-y-2">
														{sortedPlayers.map((player, idx) => (
															<div key={idx} className="p-3 bg-muted/30 rounded-lg">
																<div className="flex items-center justify-between mb-2">
																	<div className="flex items-center gap-2">
																		<span className="font-semibold text-sm">7</span>
																		<span className="text-sm">{player.Cognome} {player.Nome}</span>
																	</div>
																	<Badge variant="outline" className="font-semibold">
																		{player.VOTO}
																	</Badge>
																</div>
																<div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
																	<div>⚽Goal: {player.GOL} | 🅰️ Assist: {player.ASST}</div>
																	<div>⏱️Minuti: {player.MINUTI}' {player.MINUTI < 90 && "🔄"}</div>
																	<div>🟨 {player.GIALLI} {player.ROSSI > 0 && "🟥"}</div>
																	<div>Passaggi: {player.PASS_SI}/{player.PASS_TOT} {player.PASS_TOT > 0 && (<> ({Math.round((player.PASS_SI / player.PASS_TOT) * 100)}%)</>)}</div>
																	<div>Tiri: {player.TIRI_IN}/{player.TIRI_TOT} {player.TIRI_TOT > 0 && (<> ({Math.round((player.TIRI_IN / player.TIRI_TOT) * 100)}%)</>)}</div>
																	<div>Cross: {player.CROS_SI}/{player.CROS_TOT} {player.CROS_TOT > 0 && (<> ({Math.round((player.CROS_SI / player.CROS_TOT) * 100)}%)</>)}</div>
																	<div>Dribbling: {player.DRIB_SI}/{player.DRIB_TOT} {player.DRIB_TOT > 0 && (<> ({Math.round((player.DRIB_TOT / player.DRIB_TOT) * 100)}%)</>)}</div>
																	<div>Contrasti: {player.CTRS_SI}/{player.CTRS_TOT} {player.CTRS_TOT > 0 && (<> ({Math.round((player.CTRS_SI / player.CTRS_TOT) * 100)}%)</>)}</div>
																</div>
															</div>
														))}
													</div>
												</div>

												{/* Giocatori squadra trasferta */}
												<div>
													<h4 className="font-medium mb-3 text-accent">{selected.match.away}</h4>
													<div className="space-y-2">
														{generatePlayerStats(selected.match.away, false, selected.match).map((player, idx) => (
															<div key={idx} className="p-3 bg-muted/30 rounded-lg">
																<div className="flex items-center justify-between mb-2">
																	<div className="flex items-center gap-2">
																		<span className="font-semibold text-sm">{player.number}</span>
																		<span className="text-sm">{player.name}</span>
																	</div>
																	<Badge variant="outline" className="font-semibold">
																		{player.rating}
																	</Badge>
																</div>
																<div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
																	<div>⚽ {player.goals} | 🅰️ {player.assists}</div>
																	<div>⏱️ {player.minutesPlayed}'</div>
																	<div>🟨 {player.yellowCards} {player.redCards > 0 && "🟥"}</div>
																</div>
																<div className="mt-1 text-xs text-muted-foreground">
																	Passaggi: {player.passes} ({player.passAccuracy}%)
																</div>
															</div>
														))}
													</div>
												</div>
											</div>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
};

export default Calendario;
