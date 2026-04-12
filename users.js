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
    password:    'USHMA',
    displayName: 'Administrator',
    companies:   null,   // all companies
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },

/* ── KEMSYN REP ── */
  DEEPAKSD: {
    password:    'KEM@1234',
    displayName: 'Kemsyn Team',
    companies:   ['KEMSYN'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },

 /* ── CADILA REP ── */
  VINAYAK: {
    password:    'VINAYAK03',
    displayName: 'Cadila Team',
    companies:   ['CADILA', 'CADILA(NET)'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },
   
 /* ── ALKEM HC REP ── */
  ROSHAN: {
    password:    '1806',
    displayName: 'Alkem Team',
    companies:   ['ALKEM( HC)'],
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },

  
  /* ── ALKEM ── */
  ALKEM: {
    password:    'ALKEM',
    displayName: 'Alkem Team',
    companies:   ['ALKEM( HC)', 'ALKEM(.MAXX)', 'ALKEM(.CHRONIC)', 'ALKEM(FUTURA)'],
    areas:       null,
    salesmen:    null,
  },

  /* ── THEOGEN ── */
  THEOGEN: {
    password:    'THEOGEN',
    displayName: 'Theogen Team',
    companies:   ['THEOGEN', 'THEOGEN(NET)'],
    areas:       null,
    salesmen:    null,
  },

  /* ── EXAMPLE: Area Manager — all companies, only Thane area ── */
  THANE_MGR: {
    password:    'Thane@123',
    displayName: 'Thane Area Manager',
    companies:   null,
    areas:       ['22-THANE', '23-BHIWANDI', '24-KLWA-DOMBIV', '25-KLY-ULH-BADL'],
    salesmen:    null,
  },

  /* ── EXAMPLE: Field Salesman — sees only his own rows ── */
  BRIJESH: {
    password:    'Brij@123',
    displayName: 'Brijesh',
    companies:   null,
    areas:       null,
    salesmen:    ['BRIJESH (MIS)'],
  },

  /* ── EXAMPLE: Phone order taker — specific company + area ── */
  ORDER_DESK: {
    password:    'Order@123',
    displayName: 'Order Desk',
    companies:   ['CADILA', 'CADILA(NET)'],
    areas:       ['1-MUM-DAWABAZAR', '1-MUM-SOBO-WHC'],
    salesmen:    null,
  },

  /*
  ── HOW TO ADD A NEW USER ──────────────────────────────────────
  Copy and paste this template, fill in the values:

  USERNAME: {
    password:    'StrongPass@123',
    displayName: 'Full Name or Role',
    companies:   ['COMPANY NAME'],   or null for all
    areas:       ['AREA NAME'],      or null for all
    salesmen:    ['SALESMAN NAME'],  or null for all
  },

  USERNAME must be ALL CAPS. User can type in any case.
  ────────────────────────────────────────────────────────────── */

};
