/* ================================================================
   users.js  —  IshwarCRM  User Configuration
   ================================================================

   EACH USER CAN BE RESTRICTED BY ANY COMBINATION OF:
   ─────────────────────────────────────────────────────────────────
   companies  → array of Company Names  | null = all companies
   areas      → array of Area Names     | null = all areas
   salesmen   → array of Sales Men      | null = all salesmen

   Set any of the above to null to mean "no restriction on that field"

   EXAMPLES:
   ─────────────────────────────────────────────────────────────────
   // See only Cadila companies, all areas, all salesmen:
   companies: ['CADILA','CADILA(NET)'], areas: null, salesmen: null

   // See all companies, but only one area:
   companies: null, areas: ['22-THANE'], salesmen: null

   // See all companies, all areas, but only their own data:
   companies: null, areas: null, salesmen: ['BRIJESH (MIS)']

   // Fully unrestricted (Admin):
   companies: null, areas: null, salesmen: null

   ================================================================
   EXACT VALUES — must match CSV column exactly (case-sensitive)
   ----------------------------------------------------------------

   ================================================================ */

const USERS = {

  /* ── ADMIN — full unrestricted access ── */
  BAKAA: {
    pin:         '443501',
    displayName: 'Administrator',
    companies:   null,   // all companies
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },

SAPURVA: {
    pin:         '272600',
    displayName: 'Administrator',
    companies:   null,   // all companies
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },
   
 
   
   /* ── KEMSYN REP ── */
  DEEPAKSD: {
    pin:          '124708',
    displayName: 'Kemsyn Team',
    companies:   ['KEMSYN'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },

YOGESH: {
    pin:         '898900',
    displayName: 'Kemsyn Team',
    companies:   ['KEMSYN'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },


   
 /* ── CADILA REP ── */
  VINAYAK: {
    pin:         '030300',
    displayName: 'Cadila Team',
    companies:   ['CADILA', 'CADILA(NET)'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },
   
 /* ── CSC REP ── */
  DIPESH: {
    pin:         '860000',
    displayName: 'CSC Team',
    companies:   ['CSC'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },
   
   
   /* ── ALKEM HC REP ── */
  ROSHAN: {
    pin:             '199806',
    displayName: 'Alkem Team',
    companies:   ['ALKEM( HC)'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },

RAJESH: {
    pin:             '261083',
    displayName: 'Alkem Team',
    companies:   ['ALKEM( HC)'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },
   
      
   /* ── ALKEM MAXX REP ── */
  UMESH123: {
    pin:          '224466',
    displayName: 'Alkem Team',
    companies:   ['ALKEM(.CHRONIC)', 'ALKEM(.MAXX)'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },
   
PRAJJWAL: {
    pin:         '150400',
    displayName: 'Alkem Team',
    companies:   ['ALKEM(.CHRONIC)', 'ALKEM(.MAXX)'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },


   
   
   /* ── AKUMENTIS REP ── */
  ANUPTIWARE: {
    pin:             '111100',
    displayName: 'Akumentis Team',
    companies:   ['AKUMENTIS', 'AKUMENTIS(NET)'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },
 
   
   /* ── ALKEM ── */
  ALKEM: {
    pin:            '253600',
    displayName: 'Alkem Team',
    companies:   ['ALKEM( HC)', 'ALKEM(.MAXX)', 'ALKEM(.CHRONIC)', 'ALKEM(FUTURA)'],
    areas:       null,
    salesmen:    null,
  },

  /* ── THEOGEN ── */
  VIJAY: {
    pin:         '847200',
    displayName: 'Theogen Team',
    companies:   ['THEOGEN', 'THEOGEN(NET)'],
    areas:       null,
    salesmen:    null,
  },

  /* ── EXAMPLE: Area Manager — all companies, only Thane area ── */
  THANE_MGR: {
    pin:        '123000',
    displayName: 'Thane Area Manager',
    companies:   null,
    areas:       ['22-THANE', '23-BHIWANDI', '24-KLWA-DOMBIV', '25-KLY-ULH-BADL'],
    salesmen:    null,
  },

 PRAVIN: {
    pin:        '748261',
    displayName: 'Thane Area Manager',
    companies:   null,
    areas:       ['SATARA', 'SANGLI', 'KOLHAPUR', 'SOLAPUR'],
    salesmen:    null,
  },
     
  PANDIT: {
    pin:             '560493',
    displayName: 'Nanded Area Manager',
    companies:   null,
    areas:       ['NANDED', 'PARBHANI', 'LATUR', 'BEED', 'OSMANABAD', 'SAMBHAJINAGAR', 'JALNA' , 'HINGOLI'],
    salesmen:    null,
  },
   
   
   ROHIT: {
    pin:             '300300',
    displayName: 'Khandesh Area Manager',
    companies:   null,
    areas:       ['NASHIK', 'JALGAON', 'DHULE', 'NANDURBAR'],
    salesmen:    null,
  },
   
   
   
   /* ── EXAMPLE: Field Salesman — sees only his own rows ── */
  BRIJESH: {
    pin:         '112300',
    displayName: 'Brijesh',
    companies:   null,
    areas:       null,
    salesmen:    ['BRIJESH (MIS)'],
  },

  /* ── GANESH: Field Salesman — sees only his own rows ── */
  GANESH: {
    pin:             '128800',
    displayName: 'Ganesh',
    companies:   null,
    areas:       null,
    salesmen:    ['1GANESH (MIS)'],
  },
   
    SWAPNALI: {
    pin:          '911924',
    displayName: 'Swapnali',
    companies:   null,
    areas:       null,
    salesmen:    ['1SWAPNALI (MIS)'],
  },
   
 KRANTI: {
    pin:             '864042',
    displayName: 'Kranti',
    companies:   null,
    areas:       null,
    salesmen:    ['1KRANTI (MIS)'],
  },
   
   
   
   KANCHAN: {
    pin:         '432100',
    displayName: 'Kanchan',
    companies:   null,
    areas:       null,
    salesmen:    ['1KANCHAN (MIS)'],
  },

PAYAL: {
    pin:           '248600',
    displayName: 'Payal',
    companies:   null,
    areas:       null,
    salesmen:    ['1PAYAL (MIS)', '1SACHI (MIS)'],
  },
  
ARCHANA: {
    pin:             '082200',
    displayName: 'Archana',
    companies:   null,
    areas:       null,
    salesmen:    ['1ARCHANA (MIS)', '1SWATI (MIS)'], 
     },
   
 KHETU: {
    pin:             '820801',
    displayName: 'Narendra',
    companies:   null,
    areas:       null,
    salesmen:    ['1NARENDRA (MIS)'],
  },
      
   /* ── EXAMPLE: Phone order taker — specific company + area ── */
  ORDER_DESK: {
    pin:        '999001',
    displayName: 'Order Desk',
    companies:   ['CADILA', 'CADILA(NET)'],
    areas:       ['1-MUM-DAWABAZAR', '1-MUM-SOBO-WHC'],
    salesmen:    null,
  },

  /*
  ── HOW TO ADD A NEW USER ──────────────────────────────────────
  Copy and paste this template, fill in the values:

  USERNAME: {
    pin:         '123456',
    displayName: 'Full Name or Role',
    companies:   ['COMPANY NAME'],   or null for all
    areas:       ['AREA NAME'],      or null for all
    salesmen:    ['SALESMAN NAME'],  or null for all
  },

  USERNAME must be ALL CAPS. User can type in any case.
  ────────────────────────────────────────────────────────────── */

};
