export interface AccessoryOption {
  code: number;
  label: string;
  category?: string;
  description?: string;
}

export interface AccessoryColorOption {
  code: number;
  label: string;
  hex: string;
}

/**
 * 1. Stile Divisa (JerseyStyle / jerseystylecode)
 * 0 = Tucked In
 * 1 = Untucked
 * 2 = Half Tuck
 */
export const JERSEY_STYLE_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Tucked In (Dentro i pantaloncini)", description: "Maglia infilata all'interno dei pantaloncini" },
  { code: 1, label: "Untucked (Fuori dai pantaloncini)", description: "Maglia lasciata cadere fuori dai pantaloncini" },
  { code: 2, label: "Half Tuck (Mezza rimboccata)", description: "Maglia parzialmente infilata nei pantaloncini" },
];

/**
 * 2. Vestibilità Divisa (JerseyFit / jerseyfit)
 * 0 = Normal
 * 1 = Tight
 * 2 = Team Kit Fit
 */
export const JERSEY_FIT_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Normal (Normale)", description: "Vestibilità standard classica" },
  { code: 1, label: "Tight (Attillata / Slim Fit)", description: "Taglio aderente al corpo del calciatore" },
  { code: 2, label: "Team Kit Fit (Fit Squadra)", description: "Vestibilità predefinita del kit squadra" },
];

/**
 * 3. Lunghezza Maniche (SleeveLength / jerseysleevelengthcode)
 * 0 = Short
 * 1 = Long
 * 2 = Long and Turtleneck
 * 3 = Seasonal Undershirt
 * 4 = Seasonal Undershirt and Turtleneck
 */
export const SLEEVE_LENGTH_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Short (Maniche corte)", description: "Divisa standard a maniche corte" },
  { code: 1, label: "Long (Maniche lunghe)", description: "Divisa a maniche lunghe" },
  { code: 2, label: "Long and Turtleneck (Maniche lunghe + Dolcevita)", description: "Maniche lunghe con colletto alto/scaldacollo" },
  { code: 3, label: "Seasonal Undershirt (Sottomaglia stagionale)", description: "Sottomaglia termica stagionale a maniche lunghe" },
  { code: 4, label: "Seasonal Undershirt and Turtleneck (Sottomaglia + Dolcevita)", description: "Sottomaglia termica stagionale con collo alto" },
  { code: 5, label: "Opzione 5 (-)", description: "Variante EA FC #5" },
  { code: 6, label: "Opzione 6 (-)", description: "Variante EA FC #6" },
  { code: 7, label: "Opzione 7 (-)", description: "Variante EA FC #7" },
];

/**
 * 4. Divisa Stagionale (SeasonalJersey / hasseasonaljersey)
 * 0 = Short
 * 1 = Long
 * 2 = Long and Turtleneck
 * 3 = Seasonal Undershirt
 * 4 = Seasonal Undershirt and Turtleneck
 */
export const SEASONAL_JERSEY_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Short (Maniche corte)", description: "Assetto standard a maniche corte" },
  { code: 1, label: "Long (Maniche lunghe)", description: "Assetto stagionale a maniche lunghe" },
  { code: 2, label: "Long and Turtleneck (Maniche lunghe + Dolcevita)", description: "Maniche lunghe e collo alto" },
  { code: 3, label: "Seasonal Undershirt (Sottomaglia stagionale)", description: "Sottomaglia termica stagionale" },
  { code: 4, label: "Seasonal Undershirt and Turtleneck (Sottomaglia + Dolcevita)", description: "Sottomaglia termica + collo alto" },
  { code: 5, label: "Opzione 5 (-)", description: "Variante EA FC #5" },
  { code: 6, label: "Opzione 6 (-)", description: "Variante EA FC #6" },
  { code: 7, label: "Opzione 7 (-)", description: "Variante EA FC #7" },
];

/**
 * 4b. Stile Pantaloncini Portiere (ShortStyle / shortstyle)
 * 0 = GK Shorts
 * 1 = GK Pants
 */
export const SHORT_STYLE_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "GK Shorts (Pantaloncini corti)", description: "Pantaloncini corti da portiere" },
  { code: 1, label: "GK Pants (Pantaloni lunghi)", description: "Pantaloni lunghi da portiere" },
];

/**
 * 4c. Sottopantaloncini (UndershortStyle / undershortstyle)
 */
export const UNDERSHORT_STYLE_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "0 (-)", description: "Standard" },
  { code: 1, label: "1 (-)", description: "Scaldamuscoli / Sottopantaloncini" },
];

/**
 * 5. Altezza Calzettoni (SockLength / socklengthcode)
 * 0 = Average
 * 1 = Short
 * 2 = High
 * 3 = Ankle
 * 4 = Average no Shinpad
 * 5 = Bellingham cut out socks
 */
export const SOCK_LENGTH_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Average (Normale)", description: "Altezza media standard sotto il ginocchio" },
  { code: 1, label: "Short (Bassi)", description: "Calzettoni bassi" },
  { code: 2, label: "High (Alti sopra il ginocchio)", description: "Calzettoni alti fin sopra il ginocchio" },
  { code: 3, label: "Ankle (Alla caviglia)", description: "Calzettoni molto bassi alla caviglia" },
  { code: 4, label: "Average no Shinpad (Medi senza parastinco visibile)", description: "Altezza media senza ingombro parastinco" },
  { code: 5, label: "Bellingham cut out socks (Calzettoni forati stile Bellingham)", description: "Calzettoni con fori posteriori sul polpaccio" },
];

/**
 * 6. Accessori Giocatore (Accessory1..4 / accessorycode1..4)
 */
export const ACCESSORY_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "No (Nessuno)", category: "Base", description: "Nessun accessorio equipaggiato in questo slot" },
  { code: 6, label: "Left Hand Tape (Fasciatura mano sinistra)", category: "Mani & Polsi", description: "Nastro protettivo sulla mano sinistra" },
  { code: 7, label: "Right Hand Tape (Fasciatura mano destra)", category: "Mani & Polsi", description: "Nastro protettivo sulla mano destra" },
  { code: 8, label: "Left Wristle Tape (Polsino/Nastro polso sinistro)", category: "Mani & Polsi", description: "Fasciatura/polsino corto sul polso sinistro" },
  { code: 9, label: "Right Wristle Tape (Polsino/Nastro polso destro)", category: "Mani & Polsi", description: "Fasciatura/polsino corto sul polso destro" },
  { code: 10, label: "Left Knee Tape (Fasciatura ginocchio sinistro)", category: "Ginocchia & Gambe", description: "Nastro sotto il ginocchio sinistro" },
  { code: 11, label: "Right Knee Tape (Fasciatura ginocchio destro)", category: "Ginocchia & Gambe", description: "Nastro sotto il ginocchio destro" },
  { code: 12, label: "Left Knee Tutor (Tutore ginocchio sinistro)", category: "Ginocchia & Gambe", description: "Fascia/tutore elastico sul ginocchio sinistro" },
  { code: 13, label: "Right Knee Tutor (Tutore ginocchio destro)", category: "Ginocchia & Gambe", description: "Fascia/tutore elastico sul ginocchio destro" },
  { code: 14, label: "Ankle Tape (Fasciatura caviglie)", category: "Ginocchia & Gambe", description: "Nastro di supporto sulle caviglie" },
  { code: 16, label: "Gloves (Guanti invernali)", category: "Guanti", description: "Guanti da movimento per basse temperature" },
  { code: 22, label: "Left Finger Tape (Nastro dita mano sinistra)", category: "Mani & Polsi", description: "Fasciatura sulle dita della mano sinistra" },
  { code: 23, label: "Right Finger Tape (Nastro dita mano destra)", category: "Mani & Polsi", description: "Fasciatura sulle dita della mano destra" },
  { code: 24, label: "Left Wide Wristle Tape (Fascia larga polso sinistro)", category: "Mani & Polsi", description: "Polsino/fascia ampia sul polso sinistro" },
  { code: 25, label: "Right Wide Wristle Tape (Fascia larga polso destro)", category: "Mani & Polsi", description: "Polsino/fascia ampia sul polso destro" },
  { code: 26, label: "Left Bracelet (Braccialetto sinistro)", category: "Mani & Polsi", description: "Braccialetto sottile al polso sinistro" },
  { code: 27, label: "Right Bracelet (Braccialetto destro)", category: "Mani & Polsi", description: "Braccialetto sottile al polso destro" },
  { code: 150, label: "Facemask_150 (Maschera protettiva 150)", category: "Protezioni", description: "Maschera facciale protettiva modello 150" },
  { code: 151, label: "Facemask_151 (Maschera protettiva 151)", category: "Protezioni", description: "Maschera facciale protettiva modello 151" },
  { code: 154, label: "Facemask_154 (Maschera protettiva 154)", category: "Protezioni", description: "Maschera facciale protettiva modello 154" },
  { code: 156, label: "Osimhen Facemask (Maschera stile Osimhen)", category: "Protezioni", description: "Maschera in carbonio modello Osimhen" },
  { code: 158, label: "Facemask_158 (Maschera protettiva 158)", category: "Protezioni", description: "Maschera facciale protettiva modello 158" },
  { code: 190, label: "Knee Brace (Tutore rigido ginocchio)", category: "Ginocchia & Gambe", description: "Ginocchiera/tutore ortopedico completo" },
];

/**
 * 7. Colori Accessori (Colour, Colour_1, Colour_2, Colour_3 / accessorycolourcode1..4)
 * 0 White, 1 Black, 2 Blue, 3 Red, 4 Yellow, 5 Dark Green, 6 Orange,
 * 7 Violet, 8 Brown, 9 Pink, 10 Bordeaux, 11 Cyan, 12 Dark Blue
 */
export const ACCESSORY_COLOR_OPTIONS: AccessoryColorOption[] = [
  { code: 0, label: "White (Bianco)", hex: "#ffffff" },
  { code: 1, label: "Black (Nero)", hex: "#171717" },
  { code: 2, label: "Blue (Blu)", hex: "#2563eb" },
  { code: 3, label: "Red (Rosso)", hex: "#ef4444" },
  { code: 4, label: "Yellow (Giallo)", hex: "#eab308" },
  { code: 5, label: "Dark Green (Verde Scuro)", hex: "#15803d" },
  { code: 6, label: "Orange (Arancione)", hex: "#f97316" },
  { code: 7, label: "Violet (Viola)", hex: "#7c3aed" },
  { code: 8, label: "Brown (Marrone)", hex: "#78350f" },
  { code: 9, label: "Pink (Rosa)", hex: "#ec4899" },
  { code: 10, label: "Bordeaux (Granata / Bordeaux)", hex: "#881337" },
  { code: 11, label: "Cyan (Ciano / Azzurro)", hex: "#06b6d4" },
  { code: 12, label: "Dark Blue (Blu Scuro / Navy)", hex: "#1e3a8a" },
];

/**
 * 7b. Emotion (Emotion / emotion)
 * 1 Cold, 2 Calm, 3 Average, 4 Hot Temper, 5 Explosive
 */
export const EMOTION_OPTIONS: AccessoryOption[] = [
  { code: 1, label: "Cold (Freddo / Glaciale)" },
  { code: 2, label: "Calm (Calmo)" },
  { code: 3, label: "Average (Normale)" },
  { code: 4, label: "Hot Temper (Fumantino)" },
  { code: 5, label: "Explosive (Esplosivo)" },
];

/**
 * 8. Guanti Portiere (GKGloves) - Selezione modelli EA FC
 */
export const GK_GLOVES_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Nessuno (Giocatore di movimento)", description: "Non equipaggiato" },
  { code: 7, label: "Nike Vapor Grip 3", category: "Nike", description: "Guanti professionali Nike Vapor Grip con palmo aderente" },
  { code: 9, label: "Adidas Predator Pro", category: "Adidas", description: "Guanti Adidas Predator con elementi Demonskin sul dorso" },
  { code: 15, label: "Adidas Copa Pro", category: "Adidas", description: "Guanti Adidas classici con lattice URG 2.0" },
  { code: 35, label: "Puma Future Grip Hybrid", category: "Puma", description: "Guanti Puma Future con taglio ibrido" },
  { code: 64, label: "Reusch Attrakt Freegel", category: "Reusch", description: "Guanti specialistici Reusch con sistema Freegel" },
  { code: 75, label: "Modello EA FC #75", category: "EA Sports", description: "Guanti da portiere modello #75" },
  { code: 141, label: "Puma Ultra Grip 1 RC", category: "Puma", description: "Guanti Puma Ultra ultraleggeri" },
  { code: 167, label: "Uhlsport Speed Contact Supergrip+", category: "Uhlsport", description: "Guanti Uhlsport con mescola Supergrip+" },
];

/**
 * 9. Scarpini (Shoe) - Principali categorie e modelli EA FC
 */
export const POPULAR_SHOE_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Scarpini Standard EA Sports", category: "EA Sports", description: "Modello classico nero standard" },
  { code: 1, label: "Nike Mercurial Superfly IX", category: "Nike", description: "Scarpini Nike veloci con collare Flyknit" },
  { code: 2, label: "Nike Mercurial Vapor XV", category: "Nike", description: "Taglio basso per massima accelerazione" },
  { code: 8, label: "Nike Phantom GX Elite", category: "Nike", description: "Superficie Gripknit per tocco di palla millimetrico" },
  { code: 15, label: "Nike Tiempo Legend X", category: "Nike", description: "Tomaia in pelle sintetica FlyTouch Plus" },
  { code: 35, label: "Adidas Predator 24 Elite", category: "Adidas", description: "Linguetta ripiegata e alette Strikeskin" },
  { code: 42, label: "Adidas F50 Elite", category: "Adidas", description: "Leggerezza assoluta e tomaia Fibertouch" },
  { code: 51, label: "Adidas Copa Pure II", category: "Adidas", description: "Pelle Fusionskin morbida per massimo comfort" },
  { code: 84, label: "Puma Future 7 Ultimate", category: "Puma", description: "Fasce Fuzionfit360 e texture 3D" },
  { code: 91, label: "Puma Ultra 5 Carbon", category: "Puma", description: "Suola Speedsystem in carbonio" },
  { code: 121, label: "Mizuno Morelia Neo IV Beta", category: "Mizuno", description: "Pelle di canguro artigianale giapponese" },
  { code: 140, label: "New Balance Tekela v4+", category: "New Balance", description: "Tomaia monopezzo Hypoknit senza lacci" },
  { code: 167, label: "Skechers SKX_01", category: "Skechers", description: "Scarpa da controllo e visione di gioco" },
  { code: 180, label: "Nike Mercurial Dream Speed", category: "Nike", description: "Edizione speciale ad altissima velocità" },
];

/* Helper per reperire label e opzioni */
export function getJerseyStyleLabel(code: number | null | undefined): string {
  const opt = JERSEY_STYLE_OPTIONS.find((o) => o.code === Number(code));
  return opt ? opt.label : `Stile #${code ?? 0}`;
}

export function getJerseyFitLabel(code: number | null | undefined): string {
  const opt = JERSEY_FIT_OPTIONS.find((o) => o.code === Number(code));
  return opt ? opt.label : `Fit #${code ?? 0}`;
}

export function getSleeveLengthLabel(code: number | null | undefined): string {
  const opt = SLEEVE_LENGTH_OPTIONS.find((o) => o.code === Number(code));
  return opt ? opt.label : `Maniche #${code ?? 0}`;
}

export function getSeasonalJerseyLabel(code: number | null | undefined): string {
  const opt = SEASONAL_JERSEY_OPTIONS.find((o) => o.code === Number(code));
  return opt ? opt.label : `Stagionale #${code ?? 0}`;
}

export function getSockLengthLabel(code: number | null | undefined): string {
  const opt = SOCK_LENGTH_OPTIONS.find((o) => o.code === Number(code));
  return opt ? opt.label : `Calzettoni #${code ?? 0}`;
}

export function getAccessoryLabel(code: number | null | undefined): string {
  const opt = ACCESSORY_OPTIONS.find((o) => o.code === Number(code));
  return opt ? opt.label : `Accessorio #${code ?? 0}`;
}

export function getAccessoryColorLabel(code: number | null | undefined): { label: string; hex: string } {
  const opt = ACCESSORY_COLOR_OPTIONS.find((o) => o.code === Number(code));
  return opt ? { label: opt.label, hex: opt.hex } : { label: `Colore #${code ?? 0}`, hex: "#64748b" };
}

export function getEmotionLabel(code: number | null | undefined): string {
  const opt = EMOTION_OPTIONS.find((o) => o.code === Number(code));
  return opt ? opt.label : `Emotion #${code ?? 3}`;
}

export function getGKGlovesLabel(code: number | null | undefined): string {
  if (!code || Number(code) === 0) return "Nessuno (Giocatore)";
  const opt = GK_GLOVES_OPTIONS.find((o) => o.code === Number(code));
  return opt ? opt.label : `Guanti #${code}`;
}

export function getShoeLabel(code: number | null | undefined): string {
  if (!code || Number(code) === 0) return "Standard EA Sports";
  const opt = POPULAR_SHOE_OPTIONS.find((o) => o.code === Number(code));
  return opt ? `${opt.category} - ${opt.label}` : `Modello #${code}`;
}
