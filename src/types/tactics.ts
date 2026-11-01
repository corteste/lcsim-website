// ============================================================================
// LCSIM - Tattiche EA Sports FC 25 (FC IQ)
// Modello ufficiale: Tattiche di Squadra (Stile Costruzione & Approccio Difensivo)
// + Ruoli Giocatore & Focus per ogni posizione in campo.
// ============================================================================

export interface TeamTacticStyle {
  id: "short_passing" | "balanced" | "counter";
  name: string;
  shortDesc: string;
  description: string;
}

export interface TeamDefensiveApproach {
  id: "deep" | "balanced" | "high";
  name: string;
  shortDesc: string;
  description: string;
}

export type DefensiveLineLevel = "bassa" | "media" | "alta" | "aggressiva";

export interface DefensiveLineOption {
  id: DefensiveLineLevel;
  value: number; // Valore numerico normalizzato 1-100 per retrocompatibilità e simulatore
  name: string;
  shortDesc: string;
  description: string;
}

export const DEFENSIVE_LINE_OPTIONS: DefensiveLineOption[] = [
  {
    id: "bassa",
    value: 25,
    name: "Bassa",
    shortDesc: "Protezione area di rigore",
    description: "La squadra arretra a ridosso dei sedici metri difendendo l'area e limitando i varchi alle spalle dei centrali.",
  },
  {
    id: "media",
    value: 50,
    name: "Media",
    shortDesc: "Equilibrata sulla trequarti",
    description: "Assetto bilanciato che mantiene le distanze tra i reparti ed esce in pressione non appena la palla entra nella propria trequarti.",
  },
  {
    id: "alta",
    value: 75,
    name: "Alta",
    shortDesc: "Presidio linea di metà campo",
    description: "La difesa staziona stabilmente a ridosso della linea mediana, accorciando la squadra e favorendo la riconquista immediata.",
  },
  {
    id: "aggressiva",
    value: 95,
    name: "Aggressiva",
    shortDesc: "Pressione a tutto campo e fuorigioco",
    description: "I difensori salgono aggressivamente nella metà campo avversaria applicando la trappola sistematica del fuorigioco.",
  },
];

export function getDefensiveLineOption(val: number | string | undefined | null): DefensiveLineOption {
  if (typeof val === "string") {
    const found = DEFENSIVE_LINE_OPTIONS.find((opt) => opt.id === val.toLowerCase());
    if (found) return found;
  }
  const numeric = typeof val === "number" ? val : Number(val) || 50;
  if (numeric <= 37) return DEFENSIVE_LINE_OPTIONS[0]; // Bassa (25)
  if (numeric <= 62) return DEFENSIVE_LINE_OPTIONS[1]; // Media (50)
  if (numeric <= 85) return DEFENSIVE_LINE_OPTIONS[2]; // Alta (75)
  return DEFENSIVE_LINE_OPTIONS[3]; // Aggressiva (95)
}

export const BUILD_UP_STYLES: TeamTacticStyle[] = [
  {
    id: "short_passing",
    name: "Passaggi corti",
    shortDesc: "Pazienza e possesso palla",
    description: "I compagni si avvicinano per offrire linee di passaggio pulite e favorire la circolazione palla paziente.",
  },
  {
    id: "balanced",
    name: "Bilanciato",
    shortDesc: "Equilibrio e flessibilità",
    description: "La squadra mantiene le distanze naturali, alternando manovra ragionata e aperture rapide quando opportuno.",
  },
  {
    id: "counter",
    name: "Contropiede",
    shortDesc: "Verticalizzazioni immediate",
    description: "I giocatori offensivi scattano subito in profondità per sfruttare gli spazi lasciati liberi dagli avversari.",
  },
];

export const DEFENSIVE_APPROACHES: TeamDefensiveApproach[] = [
  {
    id: "deep",
    name: "Basso / Prudente",
    shortDesc: "Blocco basso e compatto",
    description: "La linea difensiva arretra a ridosso dell'area, concedendo poco spazio tra portiere e difensori.",
  },
  {
    id: "balanced",
    name: "Equilibrato",
    shortDesc: "Linea a metà campo difensiva",
    description: "La squadra difende a un'altezza media, pressando quando l'avversario entra nella trequarti campo.",
  },
  {
    id: "high",
    name: "Alto / Aggressivo",
    shortDesc: "Pressione alta e fuorigioco",
    description: "La squadra accorcia in avanti, riconquista palla nella metà campo avversaria e applica la trappola del fuorigioco.",
  },
];

export interface RoleFocusOption {
  id: string;
  name: string;
  description: string;
}

export interface PlayerRoleOption {
  id: string;
  name: string;
  description: string;
  focuses: RoleFocusOption[];
}

export const FC25_ROLES_BY_POSITION: Record<string, PlayerRoleOption[]> = {
  POR: [
    {
      id: "portiere_fuori_dai_pali",
      name: "Portiere Fuori Dai Pali",
      description: "Un portiere moderno, in grado di sventare le conclusioni e di supportare la costruzione della manovra offrendo un'opzione di passaggio.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "Il portiere fuori dai pali uscirà per raccogliere i palloni vicino alla propria area." },
        { id: "costruzione_manovra", name: "Costruzione manovra", description: "Il portiere fuori dai pali uscirà più fuori dalla propria area per raccogliere palla e supportare l'azione." },
      ],
    },
    {
      id: "portiere_classico",
      name: "Portiere Classico",
      description: "Un portiere tradizionale, che rimane in porta e pensa a intercettare le conclusioni.",
      focuses: [
        { id: "difensivo", name: "Difensivo", description: "Il portiere non uscirà per raccogliere i palloni lunghi o vaganti." },
        { id: "bilanciato", name: "Bilanciato", description: "Il portiere uscirà di tanto in tanto dalla propria area per raccogliere i palloni lunghi o vaganti." },
      ],
    },
  ],
  DC: [
    {
      id: "difensore",
      name: "Difensore",
      description: "Un centrale abile nei fondamenti della difesa, compreso mantenere la linea difensiva.",
      focuses: [
        { id: "difensivo", name: "Difensivo", description: "Il difensore si concentrerà esclusivamente sui propri compiti difensivi." },
        { id: "bilanciato", name: "Bilanciato", description: "Il difensore cercherà di chiudere gli attaccanti quando necessario." },
      ],
    },
    {
      id: "stopper",
      name: "Stopper",
      description: "Un difensore centrale abile nel riconquistare palla. Tende a salire per effettuare contrasti, intercettare i passaggi e guidare il pressing.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "Lo stopper tenterà di intercettare i passaggi e presserà gli attaccanti che ricevono palla." },
        { id: "aggressivita", name: "Aggressività", description: "Lo stopper si alzerà fino a centrocampo per intercettare i passaggi e chiudere gli attaccanti." },
      ],
    },
    {
      id: "regista_difensivo",
      name: "Regista Difensivo",
      description: "Un difensore centrale moderno, abile sia nel chiamare il fuorigioco che con la palla tra i piedi. Può avanzare o allargarsi per supportare la manovra.",
      focuses: [
        { id: "difensivo", name: "Difensivo", description: "Il regista difensivo avanzerà leggermente per supportare la manovra in fase di possesso." },
        { id: "costruzione_manovra", name: "Costruzione manovra", description: "Il regista difensivo giocherà nella posizione di centrocampista difensivo di contenimento in fase di possesso." },
        { id: "aggressivita", name: "Aggressività", description: "Il regista difensivo si concentrerà sull'intercettare i passaggi e sul chiudere gli avversari." },
      ],
    },
  ],
  TD: [
    {
      id: "falso_difensore",
      name: "Falso Difensore",
      description: "L'evoluzione moderna del terzino, questo giocatore attacca in posizione centrale quando la sua squadra ha la palla.",
      focuses: [
        { id: "difensivo", name: "Difensivo", description: "Il falso difensore agirà da centrocampista difensivo quando la sua squadra è in possesso di palla." },
        { id: "bilanciato", name: "Bilanciato", description: "Il falso difensore giocherà in posizione di centrocampista centrale quando la sua squadra è in possesso di palla." },
      ],
    },
    {
      id: "terzino_spinta",
      name: "Terzino Di Spinta",
      description: "Nonostante sia sulla carta un difensore, questo giocatore pensa di più ad avanzare e a dare ampiezza agli attacchi della propria squadra.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'esterno offensivo raramente ripiegherà in difesa, salvo nelle situazioni di contropiede." },
        { id: "offensivo", name: "Offensivo", description: "L'esterno offensivo si spingerà in posizione ancora più avanzata e avrà meno compiti difensivi." },
      ],
    },
    {
      id: "terzino",
      name: "Terzino",
      description: "Un difensore largo che pensa soprattutto a proteggere la propria porta, mantenendo la linea di difesa e offrendo un'opzione di passaggio per allentare la pressione.",
      focuses: [
        { id: "difensivo", name: "Difensivo", description: "Il terzino tenderà ad accentrarsi per formare una difesa a tre in fase di possesso." },
        { id: "bilanciato", name: "Bilanciato", description: "Il terzino sarà più libero di spingersi in avanti in posizione defilata per supportare gli attacchi." },
      ],
    },
    {
      id: "tornante",
      name: "Tornante",
      description: "La versatilità e la resistenza di questo giocatore gli permettono di avanzare per supportare gli attacchi, prima di riprendere posizione in difesa.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'esterno sarà libero di restare in avanti anche nella fase di non possesso, o di ripiegare in difesa se necessario." },
        { id: "supporto", name: "Supporto", description: "l'esterno attaccherà solo quando la sua squadra ha la palla e difenderà quando ce l'hanno gli avversari" },
      ],
    },
  ],
  TS: [
    {
      id: "falso_difensore",
      name: "Falso Difensore",
      description: "L'evoluzione moderna del terzino, questo giocatore attacca in posizione centrale quando la sua squadra ha la palla.",
      focuses: [
        { id: "difensivo", name: "Difensivo", description: "Il falso difensore agirà da centrocampista difensivo quando la sua squadra è in possesso di palla." },
        { id: "bilanciato", name: "Bilanciato", description: "Il falso difensore giocherà in posizione di centrocampista centrale quando la sua squadra è in possesso di palla." },
      ],
    },
    {
      id: "terzino_spinta",
      name: "Terzino Di Spinta",
      description: "Nonostante sia sulla carta un difensore, questo giocatore pensa di più ad avanzare e a dare ampiezza agli attacchi della propria squadra.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'esterno offensivo raramente ripiegherà in difesa, salvo nelle situazioni di contropiede." },
        { id: "offensivo", name: "Offensivo", description: "L'esterno offensivo si spingerà in posizione ancora più avanzata e avrà meno compiti difensivi." },
      ],
    },
    {
      id: "terzino",
      name: "Terzino",
      description: "Un difensore largo che pensa soprattutto a proteggere la propria porta, mantenendo la linea di difesa e offrendo un'opzione di passaggio per allentare la pressione.",
      focuses: [
        { id: "difensivo", name: "Difensivo", description: "Il terzino tenderà ad accentrarsi per formare una difesa a tre in fase di possesso." },
        { id: "bilanciato", name: "Bilanciato", description: "Il terzino sarà più libero di spingersi in avanti in posizione defilata per supportare gli attacchi." },
      ],
    },
    {
      id: "tornante",
      name: "Tornante",
      description: "La versatilità e la resistenza di questo giocatore gli permettono di avanzare per supportare gli attacchi, prima di riprendere posizione in difesa.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'esterno sarà libero di restare in avanti anche nella fase di non possesso, o di ripiegare in difesa se necessario." },
        { id: "supporto", name: "Supporto", description: "l'esterno attaccherà solo quando la sua squadra ha la palla e difenderà quando ce l'hanno gli avversari" },
      ],
    },
  ],
  CDC: [
    {
      id: "centrocampista_ampiezza",
      name: "Centrocampista D'Ampiezza",
      description: "Un centrocampista incaricato di marcare e coprire i lati del campo in caso di necessità.",
      focuses: [
        { id: "difensivo", name: "Difensivo", description: "Il centrocampista d'ampiezza è in grado di ripiegare in posizione di terzino e tornante quando la squadra ha la palla." },
        { id: "costruzione_manovra", name: "Costruzione manovra", description: "Il centrocampista d'ampiezza può assumere la posizione di tornante e avanzare nel ruolo di esterno di centrocampo quando la squadra ha la palla." },
      ],
    },
    {
      id: "centromediano",
      name: "Centromediano",
      description: "Un centrocampista difensivo che ripiegherà tra i difensori centrali in fase di possesso per offrire protezione contro le ripartenze.",
      focuses: [
        { id: "difensivo", name: "Difensivo", description: "Il centromediano si concentrerà sui propri compiti difensivi." },
      ],
    },
    {
      id: "contenimento",
      name: "Centrocampista Di Contenimento",
      description: "Un ruolo fondamentale nel calcio moderno. Questo centrocampista dalla mentalità difensiva penserà a proteggere la difesa durante gli attacchi e a coprire gli spazi in occasione dei contropiedi, fornendo un supporto limitato in attacco.",
      focuses: [
        { id: "difensivo", name: "Difensivo", description: "Il centrocampista di contenimento si alzerà leggermente per offrire un'opzione di passaggio, ma per il resto si concentrerà sui compiti difensivi." },
        { id: "riconquista_palla", name: "Riconquista palla", description: "Il centrocampista di contenimento tenterà di intercettare i passaggi in maniera aggressiva quando difende." },
        { id: "svaria", name: "Svaria", description: "Il centrocampista di contenimento si muoverà per tutta l'ampiezza del campo per chiudere le linee di passaggio e tenterà di pressare gli attaccanti." },
      ],
    },
    {
      id: "regista_arretrato",
      name: "Regista Arretrato",
      description: "L'elemento chiave per costruire l'azione dal basso. Questo centrocampista difensivo sarà spesso il fulcro della manovra.",
      focuses: [
        { id: "costruzione_manovra", name: "Costruzione manovra", description: "Il regista arretrato avanzerà per offrire un'opzione di passaggio a supporto dell'attacco." },
        { id: "difensivo", name: "Difensivo", description: "Il regista arretrato si concentrerà sul chiudere le linee di passaggio e resterà dietro quando la squadra attacca." },
        { id: "svaria", name: "Svaria", description: "Il regista arretrato si muoverà per tutta l'ampiezza del campo per supportare gli attacchi." },
      ],
    },
  ],
  CC: [
    {
      id: "mezzala",
      name: "Mezzala",
      description: "Un centrocampista che fornisce ampiezza alla squadra in fase di possesso, agendo in posizione defilata per creare pericoli dalle fasce. Risulta particolarmente efficace se schierato come uno dei tre centrocampisti centrali.",
      focuses: [
        { id: "offensivo", name: "Offensivo", description: "La mezzala avanzerà liberamente, sacrificando i compiti difensivi." },
        { id: "bilanciato", name: "Bilanciato", description: "La mezzala attaccherà e difenderà in egual misura" },
      ],
    },
    {
      id: "contenimento",
      name: "Centrocampista Di Contenimento",
      description: "Un ruolo fondamentale nel calcio moderno. Questo centrocampista dalla mentalità difensiva penserà a proteggere la difesa durante gli attacchi e a coprire gli spazi in occasione dei contropiedi, fornendo un supporto limitato in attacco.",
      focuses: [
        { id: "difensivo", name: "Difensivo", description: "Il centrocampista di contenimento si alzerà leggermente per offrire un'opzione di passaggio, ma per il resto si concentrerà sui compiti difensivi." },
        { id: "riconquista_palla", name: "Riconquista palla", description: "Il centrocampista di contenimento tenterà di intercettare i passaggi in maniera aggressiva quando difende." },
      ],
    },
    {
      id: "regista_arretrato",
      name: "Regista Arretrato",
      description: "L'elemento chiave per costruire l'azione dal basso. Questo centrocampista difensivo sarà spesso il fulcro della manovra.",
      focuses: [
        { id: "costruzione_manovra", name: "Costruzione manovra", description: "Il regista arretrato avanzerà per offrire un'opzione di passaggio a supporto dell'attacco." },
        { id: "difensivo", name: "Difensivo", description: "Il regista arretrato si concentrerà sul chiudere le linee di passaggio e resterà dietro quando la squadra attacca." },
      ],
    },
    {
      id: "box_to_box",
      name: "Box To Box",
      description: "Questo giocatore opera tra le due aree, agendo come ultimo difensore o come terminale d'attacco, facendosi trovare sempre nel vivo dell'azione.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "Il centrocampista box-to-box coprirà la zona centrale del campo in attacco e in difesa." },
      ],
    },
    {
      id: "regista",
      name: "Regista",
      description: "Questo giocatore tende a essere l'elemento di fantasia del centrocampo. Ha licenza di svariare per creare spazi e occasioni da rete. È facile che finisca fuori posizione in caso di contropiede.",
      focuses: [
        { id: "offensivo", name: "Offensivo", description: "Il regista giocherà in posizione più avanzata per supportare gli attacchi." },
        { id: "svaria", name: "Svaria", description: "Il regista sarà libero di muoversi per il campo a caccia di spazi per supportare gli attacchi." },
      ],
    },
  ],
  ED: [
    {
      id: "ala",
      name: "Ala",
      description: "Un centrocampista che agisce sempre lungo la corsia laterale per offrire supporto sulle fasce in tutte le fasi di gioco.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'ala offrirà supporto sia in attacco che in difesa, effettuando inserimenti da dietro per offrire un'opzione di passaggio." },
        { id: "offensivo", name: "Offensivo", description: "L'ala penserà principalmente ad attaccare, preferendo gli inserimenti alle spalle della difesa piuttosto che ricevere palla sui piedi." },
      ],
    },
    {
      id: "regista_largo",
      name: "Regista Largo",
      description: "Un giocatore di fantasia schierato largo ma in grado di tagliare centralmente per mettere in difficoltà la difesa e creare occasioni da rete.",
      focuses: [
        { id: "costruzione_manovra", name: "Costruzione manovra", description: "Il regista largo accorcerà per offrire un'opzione di passaggio, cercando al tempo stesso di dare una mano in difesa quando serve." },
        { id: "offensivo", name: "Offensivo", description: "Il regista largo avanzerà per ricevere palla lungo le corsie laterali." },
      ],
    },
    {
      id: "esterno_centrocampo",
      name: "Esterno Di Centrocampo",
      description: "Un centrocampista che gioca largo per agevolare la manovra, offrendo supporto in difesa e opzioni di passaggio. Raramente però si spinge in avanti per attaccare.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'esterno di centrocampo manterrà una posizione larga per supportare il possesso palla e fornire supporto in difesa quando necessario." },
        { id: "difensivo", name: "Difensivo", description: "L'esterno di centrocampo ripiegherà nella propria trequarti per proteggere la difesa." },
      ],
    },
    {
      id: "attaccante_interno",
      name: "Attaccante Interno",
      description: "Un attaccante largo che parte dalla fascia ma che tende regolarmente a tagliare all'interno per calciare a rete o per effettuare l'ultimo passaggio con il suo piede forte. Ama inserirsi alle spalle della difesa.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'attaccante interno offrirà un supporto minimo in difesa e a volte eviterà di inserirsi da dietro preferendo offrire opzioni di passaggio." },
        { id: "offensivo", name: "Offensivo", description: "L'attaccante interno tenderà a tagliare al centro e a effettuare inserimenti." },
      ],
    },
  ],
  ES: [
    {
      id: "ala",
      name: "Ala",
      description: "Un centrocampista che agisce sempre lungo la corsia laterale per offrire supporto sulle fasce in tutte le fasi di gioco.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'ala offrirà supporto sia in attacco che in difesa, effettuando inserimenti da dietro per offrire un'opzione di passaggio." },
        { id: "offensivo", name: "Offensivo", description: "L'ala penserà principalmente ad attaccare, preferendo gli inserimenti alle spalle della difesa piuttosto che ricevere palla sui piedi." },
      ],
    },
    {
      id: "regista_largo",
      name: "Regista Largo",
      description: "Un giocatore di fantasia schierato largo ma in grado di tagliare centralmente per mettere in difficoltà la difesa e creare occasioni da rete.",
      focuses: [
        { id: "costruzione_manovra", name: "Costruzione manovra", description: "Il regista largo accorcerà per offrire un'opzione di passaggio, cercando al tempo stesso di dare una mano in difesa quando serve." },
        { id: "offensivo", name: "Offensivo", description: "Il regista largo avanzerà per ricevere palla lungo le corsie laterali." },
      ],
    },
    {
      id: "esterno_centrocampo",
      name: "Esterno Di Centrocampo",
      description: "Un centrocampista che gioca largo per agevolare la manovra, offrendo supporto in difesa e opzioni di passaggio. Raramente però si spinge in avanti per attaccare.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'esterno di centrocampo manterrà una posizione larga per supportare il possesso palla e fornire supporto in difesa quando necessario." },
        { id: "difensivo", name: "Difensivo", description: "L'esterno di centrocampo ripiegherà nella propria trequarti per proteggere la difesa." },
      ],
    },
    {
      id: "attaccante_interno",
      name: "Attaccante Interno",
      description: "Un attaccante largo che parte dalla fascia ma che tende regolarmente a tagliare all'interno per calciare a rete o per effettuare l'ultimo passaggio con il suo piede forte. Ama inserirsi alle spalle della difesa.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'attaccante interno offrirà un supporto minimo in difesa e a volte eviterà di inserirsi da dietro preferendo offrire opzioni di passaggio." },
        { id: "offensivo", name: "Offensivo", description: "L'attaccante interno tenderà a tagliare al centro e a effettuare inserimenti." },
      ],
    },
  ],
  COC: [
    {
      id: "mezzala",
      name: "Mezzala",
      description: "Un centrocampista che fornisce ampiezza alla squadra in fase di possesso, agendo in posizione defilata per creare pericoli dalle fasce. Risulta particolarmente efficace se schierato come uno dei tre centrocampisti centrali.",
      focuses: [
        { id: "offensivo", name: "Offensivo", description: "La mezzala avanzerà liberamente, sacrificando i compiti difensivi." },
        { id: "bilanciato", name: "Bilanciato", description: "La mezzala attaccherà e difenderà in egual misura." },
      ],
    },
    {
      id: "attaccante_ombra",
      name: "Attaccante Ombra",
      description: "Un centrocampista offensivo che gioca tra le linee, dietro le punte. Abile negli inserimenti in area, da cui scaturiscono parecchie occasioni da rete.",
      focuses: [
        { id: "offensivo", name: "Offensivo", description: "L'attaccante ombra tenderà a effettuare inserimenti in area sfruttando lo spazio alle spalle della prima punta" },
      ],
    },
    {
      id: "dieci_vecchia_scuola",
      name: "10 Vecchia Scuola",
      description: "Un centrocampista offensivo tradizionale, dai cui piedi passa la maggior parte delle iniziative in attacco.",
      focuses: [
        { id: "offensivo", name: "Offensivo", description: "Il 10 vecchia scuola agirà alle spalle degli attaccanti, fungendo da principale fonte di gioco." },
        { id: "gioco_largo", name: "Gioco largo", description: "Il 10 vecchia scuola tende ad allargarsi sulla fascia per orchestrare gli attacchi da posizione defilata." },
      ],
    },
    {
      id: "regista",
      name: "Regista",
      description: "Questo giocatore tende a essere l'elemento di fantasia del centrocampo. Ha licenza di svariare per creare spazi e occasioni da rete. È facile che finisca fuori posizione in caso di contropiede.",
      focuses: [
        { id: "costruzione_manovra", name: "Costruzione manovra", description: "Il regista ripiegherà per prendere palla e impostare l'azione di attacco." },
        { id: "bilanciato", name: "Bilanciato", description: "Il regista giocherà in posizione più avanzata per supportare gli attacchi." },
        { id: "svaria", name: "Svaria", description: "Il regista sarà libero di muoversi per il campo a caccia di spazi per supportare gli attacchi." },
      ],
    },
  ],
  AD: [
    {
      id: "ala",
      name: "Ala",
      description: "Un centrocampista che agisce sempre lungo la corsia laterale per offrire supporto sulle fasce in tutte le fasi di gioco.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'ala offrirà supporto sia in attacco che in difesa, effettuando inserimenti da dietro per offrire un'opzione di passaggio." },
        { id: "offensivo", name: "Offensivo", description: "L'ala penserà principalmente ad attaccare, preferendo gli inserimenti alle spalle della difesa piuttosto che ricevere palla sui piedi." },
      ],
    },
    {
      id: "regista_largo",
      name: "Regista Largo",
      description: "Un giocatore di fantasia schierato largo ma in grado di tagliare centralmente per mettere in difficoltà la difesa e creare occasioni da rete.",
      focuses: [
        { id: "costruzione_manovra", name: "Costruzione manovra", description: "Il regista largo accorcerà per offrire un'opzione di passaggio, cercando al tempo stesso di dare una mano in difesa quando serve." },
        { id: "offensivo", name: "Offensivo", description: "Il regista largo avanzerà per ricevere palla lungo le corsie laterali." },
      ],
    },
    {
      id: "attaccante_interno",
      name: "Attaccante Interno",
      description: "Un attaccante largo che parte dalla fascia ma che tende regolarmente a tagliare all'interno per calciare a rete o per effettuare l'ultimo passaggio con il suo piede forte. Ama inserirsi alle spalle della difesa.",
      focuses: [
        { id: "offensivo", name: "Offensivo", description: "L'attaccante interno tenderà a tagliare al centro e a effettuare inserimenti." },
        { id: "bilanciato", name: "Bilanciato", description: "L'attaccante interno offrirà un supporto minimo in difesa e a volte eviterà di inserirsi da dietro preferendo offrire opzioni di passaggio." },
        { id: "svaria", name: "Svaria", description: "L'attaccante interno avrà libertà di muoversi per sfruttare eventuali spazi nella difesa avversaria." },
      ],
    },
  ],
  AS: [
    {
      id: "ala",
      name: "Ala",
      description: "Un centrocampista che agisce sempre lungo la corsia laterale per offrire supporto sulle fasce in tutte le fasi di gioco.",
      focuses: [
        { id: "bilanciato", name: "Bilanciato", description: "L'ala offrirà supporto sia in attacco che in difesa, effettuando inserimenti da dietro per offrire un'opzione di passaggio." },
        { id: "offensivo", name: "Offensivo", description: "L'ala penserà principalmente ad attaccare, preferendo gli inserimenti alle spalle della difesa piuttosto che ricevere palla sui piedi." },
      ],
    },
    {
      id: "regista_largo",
      name: "Regista Largo",
      description: "Un giocatore di fantasia schierato largo ma in grado di tagliare centralmente per mettere in difficoltà la difesa e creare occasioni da rete.",
      focuses: [
        { id: "costruzione_manovra", name: "Costruzione manovra", description: "Il regista largo accorcerà per offrire un'opzione di passaggio, cercando al tempo stesso di dare una mano in difesa quando serve." },
        { id: "offensivo", name: "Offensivo", description: "Il regista largo avanzerà per ricevere palla lungo le corsie laterali." },
      ],
    },
    {
      id: "attaccante_interno",
      name: "Attaccante Interno",
      description: "Un attaccante largo che parte dalla fascia ma che tende regolarmente a tagliare all'interno per calciare a rete o per effettuare l'ultimo passaggio con il suo piede forte. Ama inserirsi alle spalle della difesa.",
      focuses: [
        { id: "offensivo", name: "Offensivo", description: "L'attaccante interno tenderà a tagliare al centro e a effettuare inserimenti." },
        { id: "bilanciato", name: "Bilanciato", description: "L'attaccante interno offrirà un supporto minimo in difesa e a volte eviterà di inserirsi da dietro preferendo offrire opzioni di passaggio." },
        { id: "svaria", name: "Svaria", description: "L'attaccante interno avrà libertà di muoversi per sfruttare eventuali spazi nella difesa avversaria." },
      ],
    },
  ],
  ATT: [
    {
      id: "torre",
      name: "Torre",
      description: "Un attaccante la cui fisicità gli permette di tenere palla e di proteggerla per far salire la squadra. Ama sia essere servito con i cross che ricevere palla sui piedi.",
      focuses: [
        { id: "offensivo", name: "Offensivo", description: "La torre avrà libertà di avanzare, senza alcun compito difensivo." },
        { id: "bilanciato", name: "Bilanciato", description: "La torre si staccherà dalla difesa e terrà palla per cederla a un compagno. Avrà meno compiti difensivi." },
        { id: "gioco_largo", name: "Gioco largo", description: "La torre giocherà in posizione defilata rispetto all'area in cerca di spazi da sfruttare." },
      ],
    },
    {
      id: "falso_nove",
      name: "Falso 9",
      description: "Schierato sulla linea degli attaccanti, questo giocatore tende a ripiegare davanti alla difesa per dettare i tempi della manovra. Così facendo riesce a dare il proprio contributo anche alla fase difensiva.",
      focuses: [
        { id: "costruzione_manovra", name: "Costruzione manovra", description: "Il falso 9 arretrerà la propria posizione rispetto alla difesa avversaria e agirà come un regista." },
      ],
    },
    {
      id: "rapace_area",
      name: "Rapace",
      description: "Questo giocatore ha un solo obiettivo: fare gol. Resta in avanti e cerca di effettuare inserimenti alle spalle della difesa nella speranza di crearsi l'occasione per segnare.",
      focuses: [
        { id: "offensivo", name: "Offensivo", description: "Il rapace agirà nei pressi della difesa avversaria per sfruttare eventuali spazi o errori." },
        { id: "supporto", name: "Supporto", description: "Il rapace presserà in maniera aggressiva i difensori quando hanno la palla per indurli all'errore." },
      ],
    },
    {
      id: "attaccante_avanzato",
      name: "Attaccante Avanzato",
      description: "Un attaccante versatile che di solito agisce vicino alla linea difensiva avversaria, ma che si fa vedere per ricevere palla durante la costruzione della manovra ed effettua inserimenti per crearsi occasioni da rete.",
      focuses: [
        { id: "offensivo", name: "Offensivo", description: "L'attaccante avanzato si concentrerà nello sfruttare le occasioni da rete, agendo di solito in posizione avanzata e centrale." },
        { id: "supporto", name: "Supporto", description: "L'attaccante avanzato cercherà di effettuare inserimenti da dietro o da posizione defilata e presserà i difensori." },
        { id: "completo", name: "Completo", description: "L'attaccante avanzato sarà libero di giocare largo, se serve, per ricevere palla o di creare spazio con un inserimento." },
      ],
    },
  ],
};

// ============================================================================
// STRUTTURA DATI TATTICHE SALVATE SU SUPABASE
// ============================================================================

export interface PlayerSlotInstruction {
  slotRole: string; // "POR", "DC", "ATT", etc.
  roleId: string;   // es. "portiere", "stopper", "box_to_box"
  focusId: string;  // es. "difesa", "equilibrato", "attacco"
}

export interface SetPiecesSettings {
  capitano?: number | null;
  punizione_corta_sx?: number | null;
  punizione_corta_dx?: number | null;
  punizione_lunga?: number | null;
  rigore?: number | null;
  corner_sx?: number | null;
  corner_dx?: number | null;
  torre_angolo?: number | null;
  primo_palo_angolo?: number | null;
  secondo_palo_angolo?: number | null;
}

export const SET_PIECES_DEFINITIONS: {
  key: keyof SetPiecesSettings;
  label: string;
  column: "left" | "right";
  shortDesc: string;
}[] = [
  { key: "capitano", label: "Capitano", column: "left", shortDesc: "Leader della squadra in campo" },
  { key: "punizione_corta_sx", label: "Punizione Corta Sinistra", column: "left", shortDesc: "Tiratore punizioni a giro da sinistra" },
  { key: "punizione_corta_dx", label: "Punizione Corta Destra", column: "left", shortDesc: "Tiratore punizioni a giro da destra" },
  { key: "punizione_lunga", label: "Punizione Lunga", column: "left", shortDesc: "Crossatore su punizioni dalla trequarti" },
  { key: "rigore", label: "Rigore", column: "left", shortDesc: "Rigorista designato dal dischetto" },
  { key: "corner_sx", label: "Corner Sinistro", column: "right", shortDesc: "Incaricato dei corner da sinistra" },
  { key: "corner_dx", label: "Corner Destro", column: "right", shortDesc: "Incaricato dei corner da destra" },
  { key: "torre_angolo", label: "Torre (Angolo)", column: "right", shortDesc: "Saltatore dominante per colpire di testa in area" },
  { key: "primo_palo_angolo", label: "Primo Palo (Angolo)", column: "right", shortDesc: "Inserimento o spizzata sul primo palo" },
  { key: "secondo_palo_angolo", label: "Secondo Palo (Angolo)", column: "right", shortDesc: "Presidio sul secondo palo a rimorchio" },
];

export interface TacticalSettings {
  teamTactics: {
    buildUpStyle: "short_passing" | "balanced" | "counter";
    defensiveApproach: "deep" | "balanced" | "high";
    defensiveLine: number; // 1-100 (default 50)
  };
  playerInstructions: Record<number, PlayerSlotInstruction>; // slot index 0..10
  setPieces?: SetPiecesSettings;
}

/**
 * Restituisce le opzioni ruolo per la posizione data (o fallback su CC)
 */
export function getRolesForPosition(posLabel: string): PlayerRoleOption[] {
  const norm = (posLabel || "").toUpperCase().trim();
  return FC25_ROLES_BY_POSITION[norm] || FC25_ROLES_BY_POSITION["CC"] || [];
}

/**
 * Restituisce l'istruzione di default per un determinato slot in base al ruolo della casella
 */
export function getDefaultInstructionForSlot(slotRole: string): PlayerSlotInstruction {
  const roles = getRolesForPosition(slotRole);
  const firstRole = roles[0];
  const firstFocus = firstRole?.focuses[0];
  return {
    slotRole: slotRole.toUpperCase().trim(),
    roleId: firstRole?.id || "ruolo_base",
    focusId: firstFocus?.id || "equilibrato",
  };
}

/**
 * Genera il set completo di impostazioni tattiche di default per una formazione (11 slot)
 */
export function getDefaultTacticalSettings(positions: { label: string }[]): TacticalSettings {
  const instructions: Record<number, PlayerSlotInstruction> = {};
  positions.forEach((pos, idx) => {
    instructions[idx] = getDefaultInstructionForSlot(pos.label);
  });

  return {
    teamTactics: {
      buildUpStyle: "balanced",
      defensiveApproach: "balanced",
      defensiveLine: 50,
    },
    playerInstructions: instructions,
    setPieces: {
      capitano: null,
      punizione_corta_sx: null,
      punizione_corta_dx: null,
      punizione_lunga: null,
      rigore: null,
      corner_sx: null,
      corner_dx: null,
      torre_angolo: null,
      primo_palo_angolo: null,
      secondo_palo_angolo: null,
    },
  };
}

/**
 * Valida e sanitizza le impostazioni tattiche caricate dal database o da stato locale
 */
export function sanitizeTacticalSettings(
  raw: any,
  positions: { label: string }[]
): TacticalSettings {
  const defaultSettings = getDefaultTacticalSettings(positions);

  if (!raw || typeof raw !== "object") {
    return defaultSettings;
  }

  // Sanitizzazione Team Tactics
  const rawTT = raw.teamTactics || {};
  const validBuildUp: ("short_passing" | "balanced" | "counter")[] = [
    "short_passing",
    "balanced",
    "counter",
  ];
  const validDef: ("deep" | "balanced" | "high")[] = ["deep", "balanced", "high"];

  const buildUpStyle = validBuildUp.includes(rawTT.buildUpStyle)
    ? rawTT.buildUpStyle
    : "balanced";
  const defensiveApproach = validDef.includes(rawTT.defensiveApproach)
    ? rawTT.defensiveApproach
    : "balanced";
  const defensiveLine =
    typeof rawTT.defensiveLine === "number" &&
    rawTT.defensiveLine >= 1 &&
    rawTT.defensiveLine <= 100
      ? rawTT.defensiveLine
      : 50;

  // Sanitizzazione Player Instructions per i rispettivi 11 slot
  const rawPI = raw.playerInstructions || {};
  const playerInstructions: Record<number, PlayerSlotInstruction> = {};

  positions.forEach((pos, idx) => {
    const slotPos = pos.label.toUpperCase().trim();
    const availableRoles = getRolesForPosition(slotPos);
    const existing = rawPI[idx] || rawPI[String(idx)];

    if (existing && existing.roleId) {
      const matchedRole = availableRoles.find(
        (r) =>
          r.id === existing.roleId ||
          (existing.roleId === "portiere" && r.id === "portiere_classico") ||
          (existing.roleId === "portiere_libero" && r.id === "portiere_fuori_dai_pali") ||
          (existing.roleId === "esterno_tuttocampo" && r.id === "esterno_centrocampo") ||
          (existing.roleId === "tornante_fascia" && r.id === "esterno_centrocampo") ||
          (existing.roleId === "dieci_classico" && r.id === "dieci_vecchia_scuola")
      );
      if (matchedRole) {
        const matchedFocus = matchedRole.focuses.find(
          (f) =>
            f.id === existing.focusId ||
            (existing.focusId === "attacco" && f.id === "offensivo") ||
            (existing.focusId === "equilibrato" && f.id === "bilanciato") ||
            (existing.focusId === "difesa" && f.id === "difensivo") ||
            (existing.focusId === "costruzione" && f.id === "costruzione_manovra")
        );
        playerInstructions[idx] = {
          slotRole: slotPos,
          roleId: matchedRole.id,
          focusId: matchedFocus ? matchedFocus.id : matchedRole.focuses[0].id,
        };
        return;
      }
    }

    // Fallback su default dello slot
    playerInstructions[idx] = getDefaultInstructionForSlot(slotPos);
  });

  // Sanitizzazione Incarichi
  const rawSP = raw.setPieces || {};
  const setPieces: SetPiecesSettings = {
    capitano: rawSP.capitano ? Number(rawSP.capitano) : null,
    punizione_corta_sx: rawSP.punizione_corta_sx ? Number(rawSP.punizione_corta_sx) : null,
    punizione_corta_dx: rawSP.punizione_corta_dx ? Number(rawSP.punizione_corta_dx) : null,
    punizione_lunga: rawSP.punizione_lunga ? Number(rawSP.punizione_lunga) : null,
    rigore: rawSP.rigore ? Number(rawSP.rigore) : null,
    corner_sx: rawSP.corner_sx ? Number(rawSP.corner_sx) : null,
    corner_dx: rawSP.corner_dx ? Number(rawSP.corner_dx) : null,
    torre_angolo: rawSP.torre_angolo ? Number(rawSP.torre_angolo) : null,
    primo_palo_angolo: rawSP.primo_palo_angolo ? Number(rawSP.primo_palo_angolo) : null,
    secondo_palo_angolo: rawSP.secondo_palo_angolo ? Number(rawSP.secondo_palo_angolo) : null,
  };

  return {
    teamTactics: {
      buildUpStyle,
      defensiveApproach,
      defensiveLine,
    },
    playerInstructions,
    setPieces,
  };
}

// ============================================================================
// VALUTAZIONE COMPATIBILITÀ RUOLO (Stile EA FC IQ)
// ============================================================================
export type RoleFit = "natural" | "adaptable" | "out";

export function evaluateRoleFit(
  playerPos: string | undefined,
  slotRole: string,
  player?: {
    PreferredPosition2?: string | null;
    PreferredPosition3?: string | null;
    PreferredPosition4?: string | null;
  } | null
): RoleFit {
  if (!playerPos) return "out";
  const p = playerPos.toUpperCase().trim();
  const s = slotRole.toUpperCase().trim();

  // 1. Ruolo Naturale Diretto
  if (p === s) return "natural";
  if (p === "AT" && s === "ATT") return "natural";

  // 2. Ruoli Secondari Dichiarati (se definiti nel profilo del calciatore): sono considerati naturali
  if (player) {
    const secRoles = [
      player.PreferredPosition2,
      player.PreferredPosition3,
      player.PreferredPosition4,
    ]
      .filter((r): r is string => Boolean(r && typeof r === "string" && r.trim() !== "" && r !== "-"))
      .map((r) => r.toUpperCase().trim());

    if (secRoles.includes(s)) return "natural";
    if (s === "ATT" && secRoles.includes("AT")) return "natural";
  }

  // Portiere può fare SOLO il portiere
  if (p === "POR" || s === "POR") return "out";

  // 3. Compatibilità Affine tra Ruoli Vicini
  const adaptableMap: Record<string, string[]> = {
    DC: ["CDC", "TD", "TS", "DFC"],
    TD: ["ED", "TS", "DC", "TER"],
    TS: ["ES", "TD", "DC", "TER"],
    CDC: ["CC", "DC", "MED"],
    CC: ["CDC", "COC", "ED", "ES", "CEN"],
    COC: ["CC", "AD", "AS", "ED", "ES", "ATT", "TRQ"],
    ED: ["AD", "TD", "ES", "CC", "COC"],
    ES: ["AS", "TS", "ED", "CC", "COC"],
    AD: ["ED", "AS", "ATT", "COC"],
    AS: ["ES", "AD", "ATT", "COC"],
    ATT: ["AT", "AD", "AS", "COC"],
  };

  if (adaptableMap[s]?.includes(p)) return "adaptable";

  // Stesso macro-reparto (es. difensori centrali/terzini, centrocampisti centrali/esterni)
  const isSameDept =
    (["DC", "TD", "TS", "DFC", "TER"].includes(p) && ["DC", "TD", "TS", "DFC", "TER"].includes(s)) ||
    (["CDC", "CC", "ED", "ES", "COC", "CEN", "MED", "TRQ"].includes(p) && ["CDC", "CC", "ED", "ES", "COC", "CEN", "MED", "TRQ"].includes(s)) ||
    (["AD", "AS", "ATT"].includes(p) && ["AD", "AS", "ATT"].includes(s));

  if (isSameDept) return "adaptable";

  return "out";
}
