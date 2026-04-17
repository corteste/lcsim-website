import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, X, MapPin, Flag, BarChart3, Users, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Schedule } from "@/types/schedule";
import { MatchStats } from "@/types/teamStats";
import { getRoleColor, getValueColor, getWeatherIcon } from "@/utils/functions";
import { useSchedule } from "@/context/ScheduleContext";

const Calendario = () => {
	const [selected, setSelected] = useState<{ week: number; match: MatchStats } | null>(null);
	const [showAdvancedStats, setShowAdvancedStats] = useState(false);
	const { schedule, loaded } = useSchedule();

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
				{loaded ? (
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
												{new Date(round.matches[0].date).toLocaleDateString("it-IT")}
											</CardDescription>
										</div>
										{round.matches[0].away_minuti < 1 && (
											<Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
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
												onClick={() => setSelected({ week: round.week, match })}
												className="grid grid-cols-[minmax(100px,1fr)_32px_90px_32px_minmax(100px,1fr)] sm:grid-cols-[minmax(150px,1fr)_40px_90px_40px_minmax(150px,1fr)] gap-2 sm:gap-3 items-center p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
											>
												<span className="font-medium text-right text-sm sm:text-base truncate">{match.home_team}</span>
												<img src={`/images/teams/${match.home}_Logo.png`} alt={`${match.home} Logo`} className="h-6 w-6 sm:h-8 sm:w-8 object-contain flex-shrink-0 justify-self-center" />
												
												<div className="flex items-center gap-2 justify-center">
													{match.away_minuti != 0 ? (
														<>
															<span className="text-lg sm:text-2xl font-bold text-primary">{match.home_gol}</span>
															<span className="text-muted-foreground">-</span>
															<span className="text-lg sm:text-2xl font-bold text-primary">{match.away_gol}</span>
														</>
													) : (
														<span className="text-muted-foreground font-medium">vs</span>
													)}
												</div>
												
												<img src={`/images/teams/${match.away}_Logo.png`} alt={`${match.away} Logo`} className="h-6 w-6 sm:h-8 sm:w-8 object-contain flex-shrink-0 justify-self-center" />
												<span className="font-medium text-sm sm:text-base truncate">{match.away_team}</span>
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
					className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
					onClick={handleCloseModal}
				>
					<div
						className="w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border bg-card animate-in zoom-in-95 duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						{/* HERO HEADER */}
						<div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary/15 via-card to-accent/10 border-b">
							{/* decorative orbs */}
							<div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
							<div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

							<button
								onClick={handleCloseModal}
								className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/60 hover:bg-background border transition-colors"
								aria-label="Chiudi"
							>
								<X className="h-4 w-4" />
							</button>

							<div className="relative p-6 sm:p-8">
								<div className="flex items-center justify-center gap-2 mb-4">
									<Badge variant="outline" className="bg-background/60 backdrop-blur-sm">
										<Trophy className="h-3 w-3 mr-1" />
										Giornata {selected.week}
									</Badge>
									<Badge variant="outline" className="bg-background/60 backdrop-blur-sm">
										<CalendarIcon className="h-3 w-3 mr-1" />
										{new Date(selected.match.date).toLocaleDateString("it-IT")}
									</Badge>
								</div>

								<div className="grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-8 items-center">
									{/* Home team */}
									<div className="flex flex-col items-center text-center gap-3">
										<div className="relative">
											<div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
											<img
												src={`/images/teams/${selected.match.home}_Logo.png`}
												alt={`${selected.match.home} Logo`}
												className="relative h-20 w-20 sm:h-28 sm:w-28 object-contain drop-shadow-lg"
											/>
										</div>
										<div>
											<div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Casa</div>
											<div className="font-bold text-base sm:text-xl">{selected.match.home_team}</div>
										</div>
									</div>

									{/* Score */}
									<div className="flex flex-col items-center justify-center min-w-[140px]">
										{selected.match.home_minuti > 0 ? (
											<div className="flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-3 rounded-2xl bg-background/70 backdrop-blur-sm border shadow-inner">
												<span className="text-4xl sm:text-6xl font-extrabold text-primary tabular-nums">{selected.match.home_gol}</span>
												<span className="text-2xl sm:text-3xl text-muted-foreground font-light">:</span>
												<span className="text-4xl sm:text-6xl font-extrabold text-primary tabular-nums">{selected.match.away_gol}</span>
											</div>
										) : (
											<div className="px-6 py-4 rounded-2xl bg-background/70 backdrop-blur-sm border">
												<span className="text-2xl sm:text-3xl font-bold text-muted-foreground">VS</span>
											</div>
										)}
										<div className="mt-3 text-xs text-muted-foreground">
											{selected.match.home_minuti > 0 ? "Risultato finale" : "Da giocare"}
										</div>
									</div>

									{/* Away team */}
									<div className="flex flex-col items-center text-center gap-3">
										<div className="relative">
											<div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
											<img
												src={`/images/teams/${selected.match.away}_Logo.png`}
												alt={`${selected.match.away} Logo`}
												className="relative h-20 w-20 sm:h-28 sm:w-28 object-contain drop-shadow-lg"
											/>
										</div>
										<div>
											<div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Trasferta</div>
											<div className="font-bold text-base sm:text-xl">{selected.match.away_team}</div>
										</div>
									</div>
								</div>

								{/* Match info chips */}
								<div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
									<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-sm border">
										<MapPin className="h-3.5 w-3.5 text-muted-foreground" />
										<span className="font-medium">{selected.match.stadium}</span>
									</div>
									<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-sm border">
										<Flag className="h-3.5 w-3.5 text-muted-foreground" />
										<span className="font-medium">{selected.match.referee}</span>
									</div>
									<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-sm border">
										<span>{getWeatherIcon(selected.match.weather)}</span>
										<span className="font-medium">{selected.match.weather}</span>
									</div>
								</div>
							</div>
						</div>

						{/* BODY */}
						<div className="p-6 sm:p-8 space-y-8">
							{/* Stats section */}
							<div>
								<div className="flex items-center gap-2 mb-5">
									<div className="p-1.5 rounded-md bg-primary/10">
										<BarChart3 className="h-4 w-4 text-primary" />
									</div>
									<h3 className="font-semibold text-lg">Statistiche principali</h3>
								</div>

								{(() => {
									const renderStat = (label: string, left: number | string | undefined, right: number | string | undefined, format?: (v: number) => string) => {
										const isNum = typeof left === "number" && typeof right === "number";
										const total = isNum ? (left as number) + (right as number) : 0;
										const leftPct = isNum && total > 0 ? Math.round(((left as number) / total) * 100) : 50;
										const rightPct = 100 - leftPct;
										const leftDisplay = isNum ? (format ? format(left as number) : String(left)) : "N/D";
										const rightDisplay = isNum ? (format ? format(right as number) : String(right)) : "N/D";

										return (
											<div className="space-y-2">
												<div className="flex items-center justify-between text-sm">
													<span className="font-bold tabular-nums text-primary min-w-[3rem]">{leftDisplay}</span>
													<span className="text-muted-foreground font-medium uppercase tracking-wide text-xs">{label}</span>
													<span className="font-bold tabular-nums text-accent-foreground min-w-[3rem] text-right">{rightDisplay}</span>
												</div>
												<div className="relative w-full h-2 rounded-full bg-muted/40 overflow-hidden flex">
													<div
														className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
														style={{ width: `${leftPct}%` }}
													/>
													<div
														className="h-full bg-gradient-to-l from-accent to-accent/70 transition-all duration-500"
														style={{ width: `${rightPct}%` }}
													/>
												</div>
											</div>
										);
									};

									return (
										<div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 p-5 rounded-xl bg-muted/20 border">
											{renderStat("Possesso", selected.match.home_poss, selected.match.away_poss, (v) => `${Math.round(v * 100)}%`)}
											{renderStat("Tiri", selected.match.home_tiri_tot, selected.match.away_tiri_tot)}
											{renderStat("Tiri in porta", selected.match.home_tiri_si, selected.match.away_tiri_si)}
											{renderStat("Calci d'angolo", selected.match.home_cangl, selected.match.away_cangl)}
											{renderStat("Falli", selected.match.home_falli, selected.match.away_falli)}
										</div>
									);
								})()}
							</div>

							{/* Toggle advanced stats */}
							<div>
								<Button
									variant="outline"
									className="w-full h-11 rounded-xl border-dashed hover:border-solid hover:bg-primary/5"
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

							{/* Advanced player stats */}
							{showAdvancedStats && selected.match.home_minuti > 0 && (
								<div className="animate-in fade-in slide-in-from-top-2 duration-300">
									<div className="flex items-center gap-2 mb-5">
										<div className="p-1.5 rounded-md bg-primary/10">
											<Users className="h-4 w-4 text-primary" />
										</div>
										<h3 className="font-semibold text-lg">Statistiche Giocatori</h3>
									</div>

									<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
										{[
											{ team: selected.match.home_team, abbr: selected.match.home, players: selected.match.home_player_stats, accent: "primary" as const },
											{ team: selected.match.away_team, abbr: selected.match.away, players: selected.match.away_player_stats, accent: "accent" as const },
										].map((side, sideIdx) => (
											<div key={sideIdx} className="rounded-xl border bg-muted/10 overflow-hidden">
												<div className={`flex items-center gap-3 p-4 border-b ${side.accent === "primary" ? "bg-primary/5" : "bg-accent/5"}`}>
													<img
														src={`/images/teams/${side.abbr}_Logo.png`}
														alt={`${side.abbr} Logo`}
														className="h-8 w-8 object-contain"
													/>
													<h4 className={`font-semibold ${side.accent === "primary" ? "text-primary" : "text-accent-foreground"}`}>
														{side.team}
													</h4>
												</div>
												<div className="p-3 space-y-2">
													{side.players.map((player, idx) => (
														<div key={idx} className="p-3 rounded-lg bg-card border hover:border-primary/30 hover:shadow-sm transition-all">
															<div className="flex items-center justify-between mb-2.5">
																<div className="flex items-center gap-2 min-w-0">
																	<Badge variant="outline" className={`${getRoleColor(player.Posiz)} flex-shrink-0`}>
																		{player.Posiz}
																	</Badge>
																	<span className="text-sm font-medium truncate">
																		{player.Cognome} {player.Nome}
																	</span>
																</div>
																<Badge
																	variant="outline"
																	className={`font-bold tabular-nums flex-shrink-0 ${Number(player.VOTO) >= 7 ? "bg-primary/10 text-primary border-primary/30" : Number(player.VOTO) < 6 ? "bg-destructive/10 text-destructive border-destructive/30" : ""}`}
																>
																	{Number(player.VOTO).toFixed(1)}
																</Badge>
															</div>
															<div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-xs text-muted-foreground">
																<div>⚽ {player.GOL} | 🅰️ {player.ASST}</div>
																<div>⏱️ {player.MINUTI}' {player.MINUTI < 90 && player.ROSSI < 1 && "🔄"}</div>
																<div>🟨 {player.GIALLI} {player.ROSSI > 0 && "🟥 1"}</div>
																<div>Pass: {player.PASS_SI}/{player.PASS_TOT}{player.PASS_TOT > 0 && ` (${Math.round((player.PASS_SI / player.PASS_TOT) * 100)}%)`}</div>
																<div>Tiri: {player.TIRI_IN}/{player.TIRI_TOT}{player.TIRI_TOT > 0 && ` (${Math.round((player.TIRI_IN / player.TIRI_TOT) * 100)}%)`}</div>
																<div>Cross: {player.CROS_SI}/{player.CROS_TOT}{player.CROS_TOT > 0 && ` (${Math.round((player.CROS_SI / player.CROS_TOT) * 100)}%)`}</div>
																<div>Drib: {player.DRIB_SI}/{player.DRIB_TOT}{player.DRIB_TOT > 0 && ` (${Math.round((player.DRIB_SI / player.DRIB_TOT) * 100)}%)`}</div>
																<div>Ctrs: {player.CTRS_SI}/{player.CTRS_TOT}{player.CTRS_TOT > 0 && ` (${Math.round((player.CTRS_SI / player.CTRS_TOT) * 100)}%)`}</div>
															</div>
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Calendario;
