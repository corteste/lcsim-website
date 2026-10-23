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
 * 1. Stile Divisa (JerseyStyle)
 * 0 = Normale / Fuori dai pantaloncini (Untucked)
 * 1 = Dentro i pantaloncini (Tucked)
 */
export const JERSEY_STYLE_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Fuori dai pantaloncini (Standard)", description: "Maglia lasciata cadere fuori dai pantaloncini" },
  { code: 1, label: "Dentro i pantaloncini (Rimboccata)", description: "Maglia infilata all'interno della cintura" },
];

/**
 * 2. Vestibilità Divisa (JerseyFit)
 * 0 = Normale / Standard
 * 1 = Aderente / Tight
 */
export const JERSEY_FIT_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Standard / Normale", description: "Vestibilità classica e comoda" },
  { code: 1, label: "Attillata / Aderente (Slim Fit)", description: "Taglio aderente al corpo del calciatore" },
];

/**
 * 3. Lunghezza Maniche (SleeveLength)
 */
export const SLEEVE_LENGTH_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Maniche corte", description: "Divisa standard a maniche corte" },
  { code: 1, label: "Maniche lunghe", description: "Divisa con maniche lunghe in tessuto gara" },
  { code: 2, label: "Sottomaglia termica maniche lunghe", description: "Sottomaglia compressiva a maniche lunghe sotto la divisa" },
  { code: 3, label: "Manicotti / Scaldabraccia", description: "Manicotti elastici separati per le braccia" },
  { code: 4, label: "Sottomaglia maniche corte", description: "Sottomaglia a mezza manica" },
];

/**
 * 4. Divisa Invernale / Stagionale (SeasonalJersey)
 */
export const SEASONAL_JERSEY_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Nessuna variazione invernale", description: "Assetto standard per ogni temperatura" },
  { code: 1, label: "Maniche lunghe invernali", description: "Maniche lunghe pesanti per temperature rigide" },
  { code: 2, label: "Sottomaglia + Scaldacollo", description: "Sottomaglia termica e collare protettivo antivento" },
  { code: 3, label: "Scaldacollo / Fascia collo", description: "Scaldacollo tubolare in microfibra" },
  { code: 4, label: "Guanti invernali termici", description: "Guanti in neoprene da campo per temperature basse" },
];

/**
 * 5. Altezza Calzettoni (SockLength)
 */
export const SOCK_LENGTH_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Normale (Sotto il ginocchio)", description: "Altezza classica da regolamento" },
  { code: 1, label: "Bassi / Caviglia", description: "Calzettoni abbassati verso il parastinco" },
  { code: 2, label: "Alti (Sopra il ginocchio)", description: "Calzettoni tirati fino alla parte bassa della coscia" },
  { code: 3, label: "Medi / Arrotolati", description: "Calzettoni a mezza gamba con risvolto" },
];

/**
 * 6. Accessori Giocatore (Accessory1, Accessory2, Accessory3, Accessory4)
 */
export const ACCESSORY_OPTIONS: AccessoryOption[] = [
  { code: 0, label: "Nessuno", category: "Base", description: "Nessun accessorio equipaggiato in questo slot" },
  { code: 6, label: "Polsino sinistro singolo", category: "Polsini", description: "Polsino in spugna sul braccio sinistro" },
  { code: 7, label: "Polsino destro singolo", category: "Polsini", description: "Polsino in spugna sul braccio destro" },
  { code: 8, label: "Polsini su entrambe le braccia", category: "Polsini", description: "Coppia di polsini in spugna abbinati" },
  { code: 9, label: "Fascia / Nastro polso sinistro", category: "Fasciature", description: "Fasciatura medica/sportiva stretta al polso sinistro" },
  { code: 10, label: "Fascia / Nastro polso destro", category: "Fasciature", description: "Fasciatura medica/sportiva stretta al polso destro" },
  { code: 11, label: "Fasciatura entrambi i polsi", category: "Fasciature", description: "Nastro protettivo su entrambi i polsi" },
  { code: 12, label: "Nastro dita mano sinistra", category: "Fasciature", description: "Fasciatura compressiva dita della mano sinistra" },
  { code: 14, label: "Nastro dita mano destra", category: "Fasciature", description: "Fasciatura compressiva dita della mano destra" },
  { code: 16, label: "Fascia da braccio elastica", category: "Fasce", description: "Fascia elastica di tenuta/supporto sul bicipite" },
  { code: 22, label: "Nastro su entrambe le caviglie", category: "Cavigliere", description: "Fasciatura di rinforzo sui calzettoni a livello caviglia" },
  { code: 23, label: "Nastro caviglia sinistra", category: "Cavigliere", description: "Nastro di rinforzo sulla caviglia sinistra" },
  { code: 24, label: "Nastro caviglia destra", category: "Cavigliere", description: "Nastro di rinforzo sulla caviglia destra" },
  { code: 25, label: "Reggi-parastinco / Shin guard stay", category: "Parastinchi", description: "Fascia elastica ferma-parastinco sotto il ginocchio" },
  { code: 26, label: "Maschera protettiva viso", category: "Protezioni", description: "Maschera in carbonio protettiva per il setto nasale/zigomo" },
  { code: 27, label: "Caschetto protettivo", category: "Protezioni", description: "Caschetto imbottito da campo stile Cech" },
];

/**
 * 7. Colori Accessori (Colour, Colour_1, Colour_2, Colour_3)
 */
export const ACCESSORY_COLOR_OPTIONS: AccessoryColorOption[] = [
  { code: 0, label: "Colore sociale squadra (Predefinito)", hex: "#10b981" },
  { code: 1, label: "Bianco", hex: "#ffffff" },
  { code: 2, label: "Nero", hex: "#171717" },
  { code: 3, label: "Rosso", hex: "#ef4444" },
  { code: 4, label: "Blu Royal", hex: "#2563eb" },
  { code: 5, label: "Giallo", hex: "#eab308" },
  { code: 6, label: "Verde", hex: "#22c55e" },
  { code: 7, label: "Arancione", hex: "#f97316" },
  { code: 10, label: "Grigio Chiaro", hex: "#cbd5e1" },
  { code: 11, label: "Grigio Scuro / Antracite", hex: "#475569" },
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
