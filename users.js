/* ============================================================
   users.js  —  SalesView User Configuration
   ============================================================
   HOW TO ADD / EDIT USERS:
   ─────────────────────────────────────────────────────────────
   Each entry follows this format:

     USERNAME: {
       password: 'YourPassword',
       companies: ['EXACT COMPANY NAME', 'ANOTHER ONE'],
       displayName: 'Full Name (shown in header)'
     },

   RULES:
   • USERNAME must be ALL CAPS (user types it in any case — auto-converted)
   • company names must EXACTLY match the "Company Name" column in SWSA.csv
   • Set companies: null to allow access to ALL companies (Admin only)
   • Passwords are case-sensitive

   ALL VALID COMPANY NAMES IN YOUR CSV:
   ─────────────────────────────────────────────────────────────
   CADILA         CADILA(NET)       CADILA(NUSAFE)    CADILA(VOLTA)
   INTAS          INTAS(NET)        SKYMAP (INTAS)
   ABBOTT
   ELDER          ELDER PROJECT
   EMCURE         EMCURE(XION)
   ZYDUS
   ALKEM( HC)     ALKEM(.MAXX)      ALKEM(.CHRONIC)   ALKEM(FUTURA)
   LUPIN
   CIPLA
   THEOGEN        THEOGEN(NET)
   AKUMENTIS      AKUMENTIS(NET)
   NUBENO         NUBENO (EXP)
   SANOFI
   PIRAMAL
   TROIKAA
   GLAND
   MYLAN
   DR MOREPEN
   B-BRAUN
   BIONOVA
   DELLWICH
   CSC
   ROMsons        ROMSONS (DIAPER)
   ... and many more — see full list in the CSV Company Name column
   ============================================================ */

const USERS = {

  /* ── KEMSYN REP ── */
  DEEPAKSD: {
    password:    'KEM@1234',
    companies:   ['KEMSYN'],
    displayName: 'Kemsyn Team',
  },
   
   
   
   /* ── CADILA REP ── */
  VINAYAK: {
    password:    'VINAYAK03',
    companies:   ['CADILA', 'CADILA(NET)'],
    displayName: 'Cadila Team',
  },

  /* ── ALKEM HC REP ── */
  ROSHAN: {
    password:    '1806',
    companies:   ['ALKEM( HC)'],
    displayName: 'Alkem Team',
  },

/* ── ALKEM HC REP ── */
  ALKEM: {
    password:    'ALKEM',
    companies:   ['ALKEM( HC)', 'ALKEM(.MAXX)', 'ALKEM(.CHRONIC)', 'ALKEM(FUTURA)'],
    displayName: 'Alkem Team',
  },

/* ── AKUMENTIS REP ── */
  ANUPTIWARE: {
    password:    '1111',
    companies:   ['AKUMENTIS', 'AKUMENTIS(NET)'],
    displayName: 'Akumentis Team',
  },

   
  /* ── THEOGEN REP ── */
  THEOGEN: {
    password:    'THEOGEN',
    companies:   ['THEOGEN', 'THEOGEN(NET)'],
    displayName: 'Theogen Team',
  },

  /* ── ADMIN — sees ALL companies ── */
  ADMIN: {
    password:    'USHMA',
    companies:   null,           // null = unrestricted access
    displayName: 'Administrator',
  },

  /*
  ── HOW TO ADD A NEW USER ──────────────────────────────────
  Copy this template and paste above the closing }; bracket:

  NEWUSER: {
    password:    'StrongPass@123',
    companies:   ['EXACT NAME FROM CSV'],
    displayName: 'Display Name',
  },
  ─────────────────────────────────────────────────────────── */
};
