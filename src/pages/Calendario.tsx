import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { PlayerStats } from "@/types/playerStats";
import { Schedule } from "@/types/schedule";
import { MatchStats } from "@/types/teamStats";
import { fetchSchedule } from "@/services/scheduleService";
import { getRoleColor, getValueColor } from "@/utils/functions";

const Calendario = () => {
	const [selected, setSelected] = useState<{ week: number; date: string; match: MatchStats } | null>(null);
	const [showAdvancedStats, setShowAdvancedStats] = useState(false);
	const [schedule, setSchedule] = useState<Schedule[]>([]);
	const [loading, setLoading] = useState<boolean>(true); // stato per lo spinner

	// PER ORDINE FORMAZIONE
	const rolePriority: Record<string, number> = {
		POR: 0, TD: 1, DC: 2, TS: 3, CDC: 4, ED: 5, CC: 6, ES: 7, COC: 8, AD: 9, AS: 10, AT: 11, ATT: 12
	};

	function sortPlayersByRole(players: PlayerStats[]): PlayerStats[] {
		// slice() serve per non modificare l'array originale
		return players.slice().sort((a, b) => rolePriority[a.Posiz] - rolePriority[b.Posiz]);
	}


	// popolo il calendario con i risultati
	useEffect(() => {
		async function fetchAllWeeks() {
			setLoading(true); // inizio caricamento
			let temp: Schedule[] = [];

			for (let i = 0; i < 9; i++) {
				try {
					const matchStats = await fetchSchedule(9, i + 1);
					//ordino lista di giocatori per la formazione
					for (const m of matchStats) {
						m.away_player_stats = sortPlayersByRole(m.away_player_stats);
						m.home_player_stats = sortPlayersByRole(m.home_player_stats);
					}
					temp.push({
						week: i + 1,
						matches: matchStats,
					});
				} catch (err) {
					console.error("Error fetching week", i + 1, err);
					temp.push({
						week: i + 1,
						matches: [],
					});
				}
			}
			setLoading(false); // fine caricamento
			setSchedule(temp);
		}

		fetchAllWeeks();
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

				{/* qui mostriamo lo spinner se loading, altrimenti la lista delle giornate */}
				{loading ? (
					<div className="w-full max-w-6xl mx-auto py-12 flex items-center justify-center">
						<div className="flex flex-col items-center gap-4">
							<div
								className="animate-spin rounded-full border-4 border-t-transparent"
								style={{ width: 56, height: 56, borderColor: "rgba(73,140,244,0.15)", borderTopColor: "rgb(73,140,244)" }}
								aria-hidden="true"
							/>
							<span className="text-sm text-muted-foreground">Caricamento calendario…</span>
						</div>
					</div>
				) : (
					<div className="space-y-6">
						{schedule.map((round: Schedule) => (
							<Card key={round.week} className="shadow-lg">
								<CardHeader>
									<div className="flex items-center justify-between">
										<div>
											<CardTitle>Giornata {round.week}</CardTitle>
											<CardDescription>
												{new Date().toLocaleDateString("it-IT", {
													weekday: "long",
													year: "numeric",
													month: "long",
													day: "numeric",
												})}
											</CardDescription>
										</div>
										{round.matches[0].away_minuti < 1 && (
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
												onClick={() => setSelected({ week: round.week, date: new Date().toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric", }), match })}
												className="flex items-center justify-center p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
											>
												<div className="flex items-center gap-4">
													<img src={`/images/teams/${match.home}_Logo.png`} alt={`${match.home} Logo`} className="h-8 w-8 object-contain" />
													<span className="font-medium text-right w-48">{match.home_team}</span>
													<div className="flex items-center gap-3 min-w-[80px] justify-center">
														{match.away_minuti != 0 ? (
															<>
																<span className="text-2xl font-bold text-primary">{match.home_gol}</span>
																<span className="text-muted-foreground">-</span>
																<span className="text-2xl font-bold text-primary">{match.away_gol}</span>
															</>
														) : (
															<span className="text-muted-foreground font-medium">-</span>
														)}
													</div>
													<span className="font-medium w-48">{match.away_team}</span>

													<img src={`/images/teams/${match.away}_Logo.png`} alt={`${match.away} Logo`} className="h-8 w-8 object-contain" />
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
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
											{selected.match.home_minuti > 0 ? (
												<>
													{selected.match.home_team}
													<span className="text-primary font-bold">{selected.match.home_gol}</span>
													<span className="text-muted-foreground font-medium">-</span>
													<span className="text-primary font-bold">{selected.match.away_gol}</span>
													{selected.match.away_team}
												</>
											) : (
												<>
													{selected.match.home_team}
													<span className="text-muted-foreground font-medium">-</span>
													{selected.match.away_team}
												</>
											)}
										</CardTitle>
										<CardDescription>
											Giornata {selected.week} —{" "}
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
											// const s = generateStats(selected.match);

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
																{typeof selected.match.home_poss === "number"
																	? `${Math.round(selected.match.home_poss * 100)}% - ${Math.round(selected.match.away_poss * 100)}%`
																	: "N/D"}
															</span>
														</div>
														{renderBar(selected.match.home_poss, selected.match.away_poss)}
													</div>

													{/* Tiri */}
													<div>
														<div className="flex justify-between mb-1">
															<span>Tiri</span>
															<span>
																{typeof selected.match.home_tiri_tot === "number"
																	? `${selected.match.home_tiri_tot} - ${selected.match.away_tiri_tot}`
																	: "N/D"}
															</span>
														</div>
														{renderBar(selected.match.home_tiri_tot, selected.match.away_tiri_tot)}
													</div>

													{/* Tiri in porta */}
													<div>
														<div className="flex justify-between mb-1">
															<span>Tiri in porta</span>
															<span>
																{typeof selected.match.home_tiri_si === "number"
																	? `${selected.match.home_tiri_si} - ${selected.match.away_tiri_si}`
																	: "N/D"}
															</span>
														</div>
														{renderBar(selected.match.home_tiri_si, selected.match.away_tiri_si)}
													</div>

													{/* Calci d'angolo */}
													<div>
														<div className="flex justify-between mb-1">
															<span>Calci d'angolo</span>
															<span>
																{typeof selected.match.home_cangl === "number"
																	? `${selected.match.home_cangl} - ${selected.match.away_cangl}`
																	: "N/D"}
															</span>
														</div>
														{renderBar(selected.match.home_cangl, selected.match.away_cangl)}
													</div>

													{/* Falli */}
													<div>
														<div className="flex justify-between mb-1">
															<span>Falli</span>
															<span>
																{typeof selected.match.home_falli === "number"
																	? `${selected.match.home_falli} - ${selected.match.away_falli}`
																	: "N/D"}
															</span>
														</div>
														{renderBar(selected.match.home_falli, selected.match.away_falli)}
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
								{showAdvancedStats && selected.match.home_minuti > 0 && (
									<div className="mt-6 space-y-6">
										<div className="border-t pt-6">
											<h3 className="font-semibold text-lg mb-4">Statistiche Giocatori</h3>

											<div className="grid grid-cols-2 gap-6">
												{/* Giocatori squadra casa */}
												<div>
													<h4 className="font-medium mb-3 text-primary">{selected.match.home_team}</h4>
													<div className="space-y-2">
														{selected.match.home_player_stats.map((player, idx) => (
															<div key={idx} className="p-3 bg-muted/30 rounded-lg">
																<div className="flex items-center justify-between mb-2">
																	<div className="flex items-center gap-2">
																		{/* <span className="font-semibold text-sm">7</span> */}
																		<Badge variant="outline" className={getRoleColor(player.Posiz)}>{player.Posiz}</Badge>
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
													<h4 className="font-medium mb-3 text-accent">{selected.match.away_team}</h4>
													<div className="space-y-2">
														{selected.match.away_player_stats.map((player, idx) => (
															<div key={idx} className="p-3 bg-muted/30 rounded-lg">
																<div className="flex items-center justify-between mb-2">
																	<div className="flex items-center gap-2">
																		{/* <span className="font-semibold text-sm">7</span> */}
																		<Badge variant="outline" className={getRoleColor(player.Posiz)}>{player.Posiz}</Badge>
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
