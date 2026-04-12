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

   COMPANY NAMES (common ones):
     CADILA  CADILA(NET)  CADILA(NUSAFE)  CADILA(VOLTA)
     INTAS   INTAS(NET)   SKYMAP (INTAS)
     ABBOTT
     ELDER   ELDER PROJECT
     EMCURE  EMCURE(XION)
     ZYDUS
     ALKEM( HC)  ALKEM(.MAXX)  ALKEM(.CHRONIC)  ALKEM(FUTURA)
     LUPIN   CIPLA   THEOGEN   THEOGEN(NET)
     AKUMENTIS  AKUMENTIS(NET)
     NUBENO  NUBENO (EXP)
     SANOFI  PIRAMAL  TROIKAA  GLAND  MYLAN  DR MOREPEN  B-BRAUN

   SALES MEN (active):
     BRIJESH (MIS)
     APURVA (MIS)            MITI DESAI
     1ARCHANA (MIS)          1ARVIND (MIS)         1ASHIKA (MIS)
     1ASHUTOSH (MIS)         1GANESH (MIS)         1KANCHAN (MIS)
     1KRANTI (MIS)           1NARENDRA (MIS)        1PANDIT (MIS)
     1PANKAJ KORI (MIS)      1PAYAL (MIS)           1PRAVIN PAWAR (MIS)
     1RAJENDRA (MIS)         1RAMESH AHUJA (MIS)    1SACHI (MIS)
     1SANTOSH KUMAR (MIS)    1SHANKAR BENGADE (MIS) 1SHIFA (MIS)
     1SUMIT NAITAM (MIS)     1SWAPNALI (MIS)        1SWATI (MIS)
     1YOGESH SINGH (MIS)
     CADILA AKSHAY MANAVE (MIS)   CADILA VINAYAK SURYA (MIS)
     CADILA VOLTA ZIA KHAN
     ALKEM ARUN DUBEY (MIS)  ALKEM PRAJJWAL SINGH (MIS)
     ALKEM RAJESH (MIS)      ALKEM ROSHAN (MIS)    ALKEM UMESH (MIS)
     MYLAN RAM BHUSHAN (MIS) MYLAN SURAJ SINGH (MIS)
     THEON ABDULKADAR (MIS)  THEON SACHIN (MIS)    THEON VIJAY PATIL (MIS)
     KEMsyn AMIT MOKHARE (MIS)  KEMYN DEEPAK SOOD (MIS)
     CSC CP SINGH (MIS)      CSC DIPESH (MIS)
     ROMSON SUNIL BARKHADE (MIS)
     NUBENO GARUN TIWARI     AURUS RAHUL KAMBLE

   AREA NAMES (sample):
     1-MUM-DAWABAZAR   1-MUM-SOBO-WHC    11-DA-KUR-BAN
     12-SAN-AND-SAK    13-JOGES-BORIVA   14-DAHIS-BHAYE
     15-VASAI-DAHAN    21-GHATK-MULUD    22-THANE
     23-BHIWANDI       24-KLWA-DOMBIV    25-KLY-ULH-BADL
     31-WADAL-MANKH    32-VASHI-PANVEL   33-TRANS HARB
     AHILYANAGAR  AKOLA  AMRAVATI  BEED  BHANDARA  BULDHAN
     CHANDRAPUR   DHULE  ... (see CSV Area Name column for full list)

   ================================================================ */

const USERS = {

  /* ── ADMIN — full unrestricted access ── */
  ADMIN: {
    password:    'Admin@9999',
    displayName: 'Administrator',
    companies:   null,   // all companies
    areas:       null,   // all areas
    salesmen:    null,   // all salesmen
  },

  /* ── CADILA — all Cadila companies, all areas, all salesmen ── */
  CADILA: {
    password:    'CADILA',
    displayName: 'Cadila Team',
    companies:   ['CADILA', 'CADILA(NET)', 'CADILA(NUSAFE)', 'CADILA(VOLTA)'],
    areas:       null,
    salesmen:    null,
  },

  /* ── INTAS — all Intas companies ── */
  INTAS: {
    password:    'INTAS',
    displayName: 'Intas Team',
    companies:   ['INTAS', 'INTAS(NET)', 'SKYMAP (INTAS)'],
    areas:       null,
    salesmen:    null,
  },

  /* ── ABBOTT ── */
  ABBOTT: {
    password:    'ABBOTT',
    displayName: 'Abbott Team',
    companies:   ['ABBOTT'],
    areas:       null,
    salesmen:    null,
  },

  /* ── ELDER ── */
  ELDER: {
    password:    'ELDER',
    displayName: 'Elder Team',
    companies:   ['ELDER', 'ELDER PROJECT'],
    areas:       null,
    salesmen:    null,
  },

  /* ── EMCURE ── */
  EMCURE: {
    password:    'EMCURE',
    displayName: 'Emcure Team',
    companies:   ['EMCURE', 'EMCURE(XION)'],
    areas:       null,
    salesmen:    null,
  },

  /* ── ZYDUS ── */
  ZYDUS: {
    password:    'ZYDUS',
    displayName: 'Zydus Team',
    companies:   ['ZYDUS'],
    areas:       null,
    salesmen:    null,
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
