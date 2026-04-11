export interface CrmKunde {
  id: number;
  user_id: number;
  name: string;
  firma: string | null;
  email: string | null;
  telefon: string | null;
  notizen: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
}

export interface CrmProjekt {
  id: number;
  user_id: number;
  kunde_id: number | null;
  titel: string;
  beschreibung: string | null;
  status: 'offen' | 'aktiv' | 'abgeschlossen' | 'pausiert';
  budget: number | null;
  deadline: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
  // Joined field
  kunde_name?: string | null;
}

export interface CrmAufgabe {
  id: number;
  user_id: number;
  projekt_id: number | null;
  titel: string;
  beschreibung: string | null;
  prioritaet: 'niedrig' | 'mittel' | 'hoch';
  status: 'offen' | 'in_bearbeitung' | 'erledigt';
  faellig_am: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
  // Joined fields
  projekt_titel?: string | null;
}
