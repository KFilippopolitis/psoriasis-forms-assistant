const PDFS = {
  dlqi: 'GREECE_DLQ1_GREECE.pdf',
  eq5d: 'GREECE_EQ5D_GREECE.pdf',
  hads: 'GREECE_HADS_GREECE_AU2.0_gre-GR_1.0.0_15403 (1).pdf',
  pest: 'GREECE_PEST_Screening_Questionnaire_GR-gre_08NOV2018_F.pdf',
  psaid: 'PsAID12_GR-gre_14JAN2019_F-2.pdf',
  wpai: 'GREECE_WPAI-PSO_V2.0-Greek-Greece-debriefed-final (1).pdf',
  emea: 'GRE_EMEA-HE-MRU-Questionnaire_patient_v 3.0_13Oct09.pdf',
};

const severity = [
  ['very_much', 'Πάρα πολύ'],
  ['much', 'Πολύ'],
  ['a_little', 'Λίγο'],
  ['not_at_all', 'Καθόλου'],
];

const severityWithNa = [...severity, ['not_relevant', 'Άσχετο']];
const yesNo = [
  ['yes', 'Ναι'],
  ['no', 'Όχι'],
];

const topMark = (page, x, top, size = 15) => ({ type: 'check', page, x, top, size });
const topRing = (page, x, top, radiusX = 5, radiusY = 5) => ({ type: 'ring', page, x, top, radiusX, radiusY });
const topText = (page, x, top, width = 120, fontSize = 10) => ({ type: 'text', page, x, top, width, fontSize });
const topCircle = (page, x, top, radiusX = 9, radiusY = 7) => ({ type: 'circle', page, x, top, radiusX, radiusY });
const topUnderline = (page, x, top, width = 110) => ({ type: 'underline', page, x, top, width });
const pestMark = (x, top) => topMark(0, x - 3, top - 3, 15);
const pestYesMark = (x, top) => topMark(0, x - 5, top - 4, 15);
const pestNoMark = (x, top) => topMark(0, x - 1, top - 4, 15);

const option = ([value, label], placements = []) => ({ value, label, placements });

const inferFormId = (id) => id.split('_')[0];

const choice = (id, formIdOrLabel, labelOrOptions, optionDefsOrRequired, requiredOrExtra = true, extraMaybe = {}) => {
  const hasExplicitForm = typeof labelOrOptions === 'string';
  const formId = hasExplicitForm ? formIdOrLabel : inferFormId(id);
  const label = hasExplicitForm ? labelOrOptions : formIdOrLabel;
  const optionDefs = hasExplicitForm ? optionDefsOrRequired : labelOrOptions;
  const required = hasExplicitForm ? requiredOrExtra : (optionDefsOrRequired ?? true);
  const extra = hasExplicitForm ? extraMaybe : (requiredOrExtra && typeof requiredOrExtra === 'object' ? requiredOrExtra : {});

  return {
    id,
    formId,
    type: 'choice',
    label,
    required,
    options: optionDefs,
    ...extra,
  };
};

const text = (id, formId, label, placements = [], extra = {}) => ({
  id,
  formId,
  type: extra.inputType ?? 'text',
  label,
  required: extra.required ?? false,
  placements,
  ...extra,
});

const DLQI_MARK_X = 423;
const DLQI_NA_MARK_X = 495.5;
const dlqiRing = (page, x, top) => topRing(page, x, top + 7.5, 5, 5);

const scale = (id, formId, label, page, top, xs, extra = {}) => ({
  id,
  formId,
  type: 'scale',
  label,
  required: true,
  min: extra.min ?? 0,
  max: extra.max ?? 10,
  options: xs.map((x, value) => ({
    value: String(value),
    label: String(value),
    placements: [
      extra.marker === 'ring'
        ? topRing(page, x, top + 4, extra.radiusX ?? 9, extra.radiusY ?? 7)
        : topCircle(page, x, top, extra.radiusX ?? 10, extra.radiusY ?? 7),
    ],
  })),
  ...extra,
});

const dlqiChoice = (id, label, page, top, hasNa = false) => {
  const rows = hasNa ? severityWithNa : severity;
  return choice(
    id,
    'dlqi',
    label,
    rows.map(([value, labelText], index) => {
      const isNa = value === 'not_relevant';
      const x = isNa ? DLQI_NA_MARK_X : DLQI_MARK_X;
      const rowTop = isNa ? top + 38.4 : top + index * 12.84;
      return option([value, labelText], [dlqiRing(page, x, rowTop)]);
    }),
  );
};

const eq5dChoice = (id, label, tops, labels) => choice(
  id,
  'eq5d',
  label,
  labels.map((labelText, index) => option([String(index + 1), labelText], [topMark(1, 434, tops[index], 14)])),
);

const psaidXsPage1 = [88.3, 124.6, 160.8, 197.2, 233.4, 269.8, 306.2, 342.5, 379.2, 415.7, 452.0];
const psaidXsPage2 = [97.6, 133.1, 168.7, 204.2, 239.8, 275.3, 310.9, 346.4, 381.9, 417.5, 453.0];
const wpaiXs = [178.5, 200.2, 221.8, 243.4, 265.0, 286.6, 308.2, 329.8, 351.4, 373.0, 397.1];
const emeaScaleXs = [222.3, 242.8, 263.3, 283.9, 304.6, 325.1, 345.7, 366.2, 386.8, 407.3, 430.5];

const emeaRing = (page, x, top) => topRing(page, x, top, 5.8, 5.8);
const emeaCheck = (page, x, top) => topMark(page, x - 1, top - 1, 13);
const emeaValue = (page, x, top, width = 60) => topText(page, x, top, width, 10);
const emeaYesNo = (id, label, page, yesTop, noTop, extra = {}) => choice(id, 'emea', label, [
  option(['yes', 'Ναι'], [emeaRing(page, 138.1, yesTop)]),
  option(['no', 'Όχι'], [emeaRing(page, 138.1, noTop)]),
], true, extra);
const emeaContact = (id, label, markTop, valueTop, extra = {}) => text(id, 'emea', label, [
  emeaCheck(2, 134.8, markTop),
  emeaValue(2, 446.6, valueTop, 45),
], { type: 'number', inputType: 'number', min: 0, ...extra });

const HADS_LEFT_ANXIETY_X = 35;
const HADS_LEFT_DEPRESSION_X = 60;
const HADS_RIGHT_ANXIETY_X = 537;
const HADS_RIGHT_DEPRESSION_X = 560;
const hadsOptions = (page, scoreX, tops, labels) => labels.map((labelText, index) => (
  option([String(index), labelText], [topRing(page, scoreX, tops[index] + 6.5, 5, 5)])
));

export const forms = [
  {
    id: 'dlqi',
    title: 'DLQI',
    description: 'Δείκτης ποιότητας ζωής στη δερματολογία. Απαντήστε για την περασμένη εβδομάδα.',
    template: PDFS.dlqi,
    questions: [
      dlqiChoice('dlqi_1', '1. Κνησμός, ενόχληση, πόνος ή τσούξιμο δέρματος την περασμένη εβδομάδα', 0, 203.7),
      dlqiChoice('dlqi_2', '2. Ενόχληση ή απασχόληση από την κατάσταση του δέρματος', 0, 267.0),
      dlqiChoice('dlqi_3', '3. Επηρεάστηκαν ψώνια, σπίτι ή κήπος;', 0, 330.4, true),
      dlqiChoice('dlqi_4', '4. Επηρεάστηκε η επιλογή ρούχων;', 0, 393.7, true),
      dlqiChoice('dlqi_5', '5. Επηρεάστηκαν κοινωνικές δραστηριότητες ή χόμπι;', 0, 457.0, true),
      dlqiChoice('dlqi_6', '6. Δυσκολία σε σπορ;', 0, 520.4, true),
      choice('dlqi_7', '7. Σας εμπόδισε η δερματική κατάσταση να εργαστείτε ή να μελετήσετε;', [
        option(['yes', 'Ναι'], [dlqiRing(0, DLQI_MARK_X, 583.8)]),
        option(['no', 'Όχι'], [dlqiRing(0, DLQI_MARK_X, 608.6)]),
        option(['not_relevant', 'Άσχετο'], [dlqiRing(0, DLQI_NA_MARK_X, 608.6)]),
      ]),
      choice('dlqi_7_if_no', '7β. Αν όχι, πόσο πρόβλημα δημιούργησε στη δουλειά ή μελέτη;', [
        option(['much', 'Πολύ'], [dlqiRing(0, DLQI_MARK_X, 633.5)]),
        option(['a_little', 'Λίγο'], [dlqiRing(0, DLQI_MARK_X, 646.3)]),
        option(['not_at_all', 'Καθόλου'], [dlqiRing(0, DLQI_MARK_X, 659.2)]),
      ], true, { showIf: { id: 'dlqi_7', value: 'no' } }),
      dlqiChoice('dlqi_8', '8. Προβλήματα με σύντροφο, στενούς φίλους ή συγγενείς;', 0, 684.0, true),
      choice('dlqi_9', '9. Προβλήματα στη σεξουαλική ζωή;', [
        option(['very_much', 'Πάρα πολύ'], [dlqiRing(0, DLQI_MARK_X, 783.6)]),
        option(['much', 'Πολύ'], [dlqiRing(1, DLQI_MARK_X, 70.1)]),
        option(['a_little', 'Λίγο'], [dlqiRing(1, DLQI_MARK_X, 82.9)]),
        option(['not_at_all', 'Καθόλου'], [dlqiRing(1, DLQI_MARK_X, 95.8)]),
        option(['not_relevant', 'Άσχετο'], [dlqiRing(1, DLQI_NA_MARK_X, 95.8)]),
      ]),
      dlqiChoice('dlqi_10', '10. Η θεραπεία του δέρματος αποτέλεσε πρόβλημα;', 1, 120.6, true),
    ],
  },
  {
    id: 'eq5d',
    title: 'EQ-5D',
    description: 'Ερωτηματολόγιο υγείας EQ-5D. Σημειώστε την απάντηση που περιγράφει καλύτερα την υγεία σας σήμερα.',
    template: PDFS.eq5d,
    questions: [
      eq5dChoice('eq5d_mobility', 'Κινητικότητα', [120.6, 143.7, 166.8], ['Δεν έχω κανένα πρόβλημα στο περπάτημα', 'Έχω μερικά προβλήματα στο περπάτημα', 'Είμαι καθηλωμένος/η στο κρεβάτι']),
      eq5dChoice('eq5d_selfcare', 'Αυτοεξυπηρέτηση', [226.9, 250.0, 273.1], ['Δεν έχω κανένα πρόβλημα με την αυτοεξυπηρέτησή μου', 'Έχω μερικά προβλήματα στο να πλένομαι και να ντύνομαι', 'Είμαι ανίκανος/η να πλυθώ ή να ντυθώ']),
      eq5dChoice('eq5d_activities', 'Συνηθισμένες δραστηριότητες', [369.1, 410.2, 451.2], ['Κανένα πρόβλημα', 'Μερικά προβλήματα', 'Ανίκανος/η να τις εκτελώ']),
      eq5dChoice('eq5d_pain', 'Πόνος / Δυσφορία', [511.3, 534.4, 557.5], ['Καθόλου πόνο ή δυσφορία', 'Μέτριο πόνο ή δυσφορία', 'Υπερβολικό πόνο ή δυσφορία']),
      eq5dChoice('eq5d_anxiety', 'Άγχος / Θλίψη', [616.9, 640.0, 663.1], ['Καθόλου άγχος ή θλίψη', 'Μέτριο άγχος ή θλίψη', 'Υπερβολικό άγχος ή θλίψη']),
      text('eq5d_vas', 'eq5d', 'Η υγεία σας σήμερα, από 0 έως 100', [
        { type: 'eq5d_vas', page: 2, x: 507, top100: 139, top0: 728 },
      ], { type: 'number', inputType: 'number', min: 0, max: 100, required: true }),
    ],
  },
  {
    id: 'hads',
    title: 'HADS',
    description: 'Κλίμακα νοσοκομειακού άγχους και κατάθλιψης (HADS). Απαντήστε για το πώς νιώθατε την τελευταία εβδομάδα.',
    template: PDFS.hads,
    questions: [
      choice('hads_1', 'Νιώθω ανήσυχος/η ή εκνευρισμένος/η', hadsOptions(0, HADS_LEFT_ANXIETY_X, [260.4, 271.4, 282.4, 293.4], ['Σχεδόν πάντα', 'Συχνά', 'Μερικές φορές', 'Ποτέ'])),
      choice('hads_2', 'Εξακολουθώ να απολαμβάνω τα πράγματα που απολάμβανα παλιότερα', hadsOptions(0, HADS_LEFT_DEPRESSION_X, [329.4, 340.4, 351.4, 362.4], ['Σίγουρα το ίδιο όσο και παλιά', 'Όχι τόσο όσο παλιά', 'Πολύ λίγο', 'Σχεδόν καθόλου'])),
      choice('hads_3', 'Με πιάνει φόβος σαν να πρόκειται να συμβεί κάτι απαίσιο', hadsOptions(0, HADS_LEFT_ANXIETY_X, [398.4, 409.4, 420.4, 431.4], ['Ακριβώς, πολύ έντονα', 'Ναι, αλλά όχι τόσο έντονα', 'Λίγο, αλλά δεν με ανησυχεί', 'Καθόλου'])),
      choice('hads_4', 'Μπορώ να γελώ και να βλέπω την αστεία πλευρά των πραγμάτων', hadsOptions(0, HADS_LEFT_DEPRESSION_X, [467.4, 478.4, 489.4, 500.4], ['Το ίδιο όσο και παλιά', 'Όχι τόσο όσο παλιά', 'Σίγουρα όχι τόσο πολύ τώρα', 'Καθόλου'])),
      choice('hads_5', 'Ανήσυχες σκέψεις περνούν από το μυαλό μου', hadsOptions(0, HADS_LEFT_ANXIETY_X, [525.4, 536.4, 547.4, 558.4], ['Σχεδόν πάντα', 'Συχνά', 'Μερικές φορές', 'Σχεδόν ποτέ'])),
      choice('hads_6', 'Νιώθω κεφάτος/η', hadsOptions(0, HADS_LEFT_DEPRESSION_X, [583.4, 594.4, 605.4, 616.4], ['Ποτέ', 'Σπάνια', 'Μερικές φορές', 'Σχεδόν πάντα'])),
      choice('hads_7', 'Μπορώ να κάθομαι ήρεμος/η και να νιώθω χαλαρός/ή', hadsOptions(0, HADS_LEFT_ANXIETY_X, [652.4, 663.4, 674.4, 685.4], ['Πάντα', 'Συνήθως', 'Όχι συχνά', 'Ποτέ'])),
      choice('hads_8', 'Νιώθω σαν να έχουν πέσει οι ρυθμοί μου', hadsOptions(0, HADS_RIGHT_DEPRESSION_X, [261.1, 272.1, 283.1, 294.1], ['Σχεδόν πάντα', 'Πολύ συχνά', 'Μερικές φορές', 'Ποτέ'])),
      choice('hads_9', 'Με πιάνει φόβος, σαν κόμπος στο στομάχι', hadsOptions(0, HADS_RIGHT_ANXIETY_X, [329.1, 340.1, 351.1, 362.1], ['Ποτέ', 'Μερικές φορές', 'Συχνά', 'Πολύ συχνά'])),
      choice('hads_10', 'Έχω χάσει το ενδιαφέρον για την εμφάνισή μου', hadsOptions(0, HADS_RIGHT_DEPRESSION_X, [386.1, 410.0, 435.0, 447], ['Σίγουρα', 'Τη φροντίζω πολύ λιγότερο από όσο θα έπρεπε', 'Μάλλον τη φροντίζω λιγότερο από όσο θα έπρεπε', 'Τη φροντίζω όπως πάντοτε'])),
      choice('hads_11', 'Νιώθω νευρικός/ή και ανήσυχος/η, σαν να πρέπει να είμαι σε κίνηση', hadsOptions(0, HADS_RIGHT_ANXIETY_X, [482.1, 493.1, 504.1, 515.1], ['Σε πολύ μεγάλο βαθμό', 'Σε αρκετά μεγάλο βαθμό', 'Όχι πάρα πολύ', 'Καθόλου'])),
      choice('hads_12', 'Περιμένω με χαρά διάφορα πράγματα', hadsOptions(0, HADS_RIGHT_DEPRESSION_X, [539.1, 550.1, 561.1, 572.1], ['Το ίδιο όπως και παλιά', 'Μάλλον λιγότερο από ό,τι παλιά', 'Σίγουρα λιγότερο από ό,τι παλιά', 'Καθόλου'])),
      choice('hads_13', 'Με πιάνουν ξαφνικά συναισθήματα πανικού', hadsOptions(0, HADS_RIGHT_ANXIETY_X, [596.1, 607.1, 618.1, 629.1], ['Πολύ συχνά', 'Συχνά', 'Σπάνια', 'Ποτέ'])),
      choice('hads_14', 'Μπορώ να απολαμβάνω βιβλίο ή ραδιοφωνικό/τηλεοπτικό πρόγραμμα', hadsOptions(0, HADS_RIGHT_DEPRESSION_X, [664.1, 675.1, 686.1, 697.1], ['Συχνά', 'Μερικές φορές', 'Σπάνια', 'Σχεδόν ποτέ'])),
    ],
  },
  {
    id: 'pest',
    title: 'PEST',
    description: 'Εργαλείο διαλογής ψωριασικής αρθρίτιδας (PEST). Η επιλογή αρθρώσεων είναι προαιρετική.',
    template: PDFS.pest,
    questions: [
      {
        id: 'pest_joints',
        formId: 'pest',
        type: 'multi',
        label: 'Σημειώστε τις αρθρώσεις που σας έχουν προκαλέσει δυσφορία',
        required: false,
        options: [
          option(['neck', 'Αυχένας'], [pestMark(308, 349)]),
          option(['left_shoulder', 'Αριστερός ώμος'], [pestMark(252, 362)]),
          option(['right_shoulder', 'Δεξιός ώμος'], [pestMark(362, 362)]),
          option(['upper_back', 'Άνω πλάτη'], [pestMark(305, 387)]),
          option(['lower_back', 'Κάτω πλάτη'], [pestMark(310, 422)]),
          option(['waist', 'Περιοχή μέσης'], [pestMark(350, 411)]),
          option(['left_elbow', 'Αριστερός αγκώνας'], [pestMark(220, 390)]),
          option(['right_elbow', 'Δεξιός αγκώνας'], [pestMark(400, 390)]),
          option(['left_wrist', 'Αριστερός καρπός'], [pestMark(200, 435)]),
          option(['right_wrist', 'Δεξιός καρπός'], [pestMark(420, 436)]),
          option(['left_hand', 'Αριστερό χέρι / δάκτυλα'], [pestMark(202, 456)]),
          option(['right_hand', 'Δεξί χέρι / δάκτυλα'], [pestMark(418, 451)]),
          option(['left_hip', 'Αριστερό ισχίο'], [pestMark(290, 456)]),
          option(['right_hip', 'Δεξί ισχίο'], [pestMark(325, 456)]),
          option(['left_thumb', 'Αριστερός αντίχειρας'], [pestMark(220, 460)]),
          option(['right_thumb', 'Δεξιός αντίχειρας'], [pestMark(397, 460)]),
          option(['left_knee', 'Αριστερό γόνατο'], [pestMark(283, 499)]),
          option(['right_knee', 'Δεξί γόνατο'], [pestMark(330, 499)]),
          option(['left_ankle', 'Αριστερός αστράγαλος'], [pestMark(282, 544)]),
          option(['right_ankle', 'Δεξιός αστράγαλος'], [pestMark(332, 544)]),
          option(['left_foot', 'Αριστερό πόδι / δάκτυλα ποδιών'], [pestMark(268, 561)]),
          option(['right_foot', 'Δεξί πόδι / δάκτυλα ποδιών'], [pestMark(348, 561)]),
        ],
      },
      ...[653.1, 667.7, 682.4, 697.0, 711.7].map((top, index) => choice(`pest_${index + 1}`, `${index + 1}. ${[
        'Είχατε ποτέ πρησμένη άρθρωση ή αρθρώσεις;',
        'Σας είπε ποτέ γιατρός ότι έχετε αρθρίτιδα;',
        'Έχουν τα νύχια σας τρύπες ή κοιλώματα;',
        'Είχατε πόνο στη φτέρνα σας;',
        'Είχατε δάχτυλο χεριού ή ποδιού εντελώς πρησμένο και επώδυνο;',
      ][index]}`, [
        option(['yes', 'Ναι'], [pestYesMark(428, top)]),
        option(['no', 'Όχι'], [pestNoMark(500, top)]),
      ])),
    ],
  },
  {
    id: 'psaid',
    title: 'PsAID12',
    description: 'Αντίληψη ασθενούς για τον αντίκτυπο της ψωριασικής αρθρίτιδας (PsAID12).',
    template: PDFS.psaid,
    questions: [
      scale('psaid_1', 'psaid', '1. Πόνος', 0, 214.7, psaidXsPage1, { marker: 'ring' }),
      scale('psaid_2', 'psaid', '2. Κόπωση', 0, 310.1, psaidXsPage1, { marker: 'ring' }),
      scale('psaid_3', 'psaid', '3. Δερματικά προβλήματα', 0, 394.8, psaidXsPage1, { marker: 'ring' }),
      scale('psaid_4', 'psaid', '4. Δραστηριότητες εργασίας ή/και αναψυχής', 0, 483.5, psaidXsPage1, { marker: 'ring' }),
      scale('psaid_5', 'psaid', '5. Λειτουργική ικανότητα', 0, 568.4, psaidXsPage1, { marker: 'ring' }),
      scale('psaid_6', 'psaid', '6. Δυσφορία', 0, 653.2, psaidXsPage1, { marker: 'ring' }),
      scale('psaid_7', 'psaid', '7. Διαταραχές ύπνου', 0, 739.4, psaidXsPage1, { marker: 'ring' }),
      scale('psaid_8', 'psaid', '8. Αντιμετώπιση', 1, 138.3, psaidXsPage2, { marker: 'ring' }),
      scale('psaid_9', 'psaid', '9. Άγχος, φόβος και αβεβαιότητα', 1, 243.2, psaidXsPage2, { marker: 'ring' }),
      scale('psaid_10', 'psaid', '10. Αμηχανία ή/και ντροπή', 1, 329.9, psaidXsPage2, { marker: 'ring' }),
      scale('psaid_11', 'psaid', '11. Κοινωνική συμμετοχή', 1, 428.3, psaidXsPage2, { marker: 'ring' }),
      scale('psaid_12', 'psaid', '12. Κατάθλιψη', 1, 520.8, psaidXsPage2, { marker: 'ring' }),
    ],
  },
  {
    id: 'wpai',
    title: 'WPAI:PSO',
    description: 'Παραγωγικότητα εργασίας και επιπτώσεις σε καθημερινές δραστηριότητες (WPAI:PSO).',
    template: PDFS.wpai,
    questions: [
      choice('wpai_working', '1. Εργάζεστε προς το παρόν με πληρωμή;', [
        option(['no', 'ΟΧΙ'], [topMark(0, 237, 109.1)]),
        option(['yes', 'ΝΑΙ'], [topMark(0, 298, 109.1)]),
      ]),
      text('wpai_missed_psoriasis_hours', 'wpai', '2. Ώρες εργασίας που χάσατε λόγω ψωρίασης τις τελευταίες 7 ημέρες', [topText(0, 53, 227, 45, 10)], { type: 'number', inputType: 'number', min: 0, required: true, showIf: { id: 'wpai_working', value: 'yes' } }),
      text('wpai_missed_other_hours', 'wpai', '3. Ώρες εργασίας που χάσατε για άλλους λόγους', [topText(0, 53, 300, 45, 10)], { type: 'number', inputType: 'number', min: 0, required: true, showIf: { id: 'wpai_working', value: 'yes' } }),
      text('wpai_worked_hours', 'wpai', '4. Ώρες που εργαστήκατε πραγματικά', [topText(0, 53, 352, 45, 10)], { type: 'number', inputType: 'number', min: 0, required: true, showIf: { id: 'wpai_working', value: 'yes' } }),
      scale('wpai_work_productivity', 'wpai', '5. Επίδραση στην παραγωγικότητα ενώ εργαζόσασταν', 0, 524.1, wpaiXs, { marker: 'ring', showIf: { id: 'wpai_working', value: 'yes' } }),
      scale('wpai_daily_activities', 'wpai', '6. Επίδραση στις συνήθεις καθημερινές δραστηριότητες', 0, 726.6, wpaiXs, { marker: 'ring' }),
    ],
  },
  {
    id: 'emea',
    title: 'EMEA HE/MRU',
    description: 'Κόστος, χρήση υπηρεσιών υγείας και επιπτώσεις στη ζωή του ασθενούς. Τα πεδία επαφών είναι προαιρετικά.',
    template: PDFS.emea,
    questions: [
      emeaYesNo('emea_non_prescription_used', '1.1.1 Χρησιμοποιήσατε μη συνταγογραφούμενες θεραπείες τους τελευταίους 6 μήνες;', 1, 213.3, 227.6),
      emeaYesNo('emea_non_prescription_paid', '1.1.1 Καλύψατε μέρος ή το σύνολο του κόστους για μη συνταγογραφούμενες θεραπείες;', 1, 309.0, 371.8, { showIf: { id: 'emea_non_prescription_used', value: 'yes' } }),
      text('emea_non_prescription_amount', 'emea', 'Συνολικό ποσό για μη συνταγογραφούμενες θεραπείες (€)', [emeaValue(1, 156.0, 346.2, 65)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_non_prescription_paid', value: 'yes' } }),
      emeaYesNo('emea_prescription_paid', '1.2.1 Καλύψατε κόστος για συνταγογραφούμενες θεραπείες ή φάρμακα;', 1, 504.8, 604.3),
      text('emea_prescription_meds_amount', 'emea', 'Ποσό για συνταγογραφούμενα φάρμακα (€)', [emeaValue(1, 361.6, 556.2, 65)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_prescription_paid', value: 'yes' } }),
      text('emea_prescription_other_amount', 'emea', 'Ποσό για άλλες συνταγογραφούμενες θεραπείες (€)', [emeaValue(1, 361.6, 574.5, 65)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_prescription_paid', value: 'yes' } }),

      emeaContact('emea_dermatologist_contacts', '2.1.1 Επαφές με δερματολόγο', 206.0, 207.0),
      emeaContact('emea_rheumatologist_contacts', '2.1.1 Επαφές με ρευματολόγο', 226.3, 227.3),
      emeaContact('emea_specialist_contacts', '2.1.1 Επαφές με ειδικό παθολόγο', 246.4, 247.4),
      emeaContact('emea_gp_contacts', '2.1.1 Επαφές με γενικό/οικογενειακό γιατρό', 266.7, 267.7),
      emeaContact('emea_nurse_contacts', '2.1.1 Επαφές με νοσηλευτή δερματολογικού τμήματος ή ιατρείου', 287.0, 288.0),
      emeaContact('emea_home_care_contacts', '2.1.1 Επαφές με κατ’ οίκον φροντίδα', 307.2, 322.4),
      emeaContact('emea_pharmacy_contacts', '2.1.1 Επαφές με φαρμακείο', 341.7, 356.9),
      text('emea_other_professional_name', 'emea', '2.1.1 Άλλος επαγγελματίας υγείας, προσδιορίστε', [emeaCheck(2, 134.8, 376.2), emeaValue(2, 209.9, 391.4, 115)], { required: false }),
      text('emea_other_professional_contacts', 'emea', '2.1.1 Επαφές με άλλο επαγγελματία υγείας', [emeaValue(2, 446.6, 391.4, 45)], { type: 'number', inputType: 'number', min: 0 }),
      emeaYesNo('emea_urgent_care', '2.2.1 Επισκεφθήκατε τμήμα επειγόντων ή επείγουσας φροντίδας;', 2, 514.2, 568.9),
      text('emea_urgent_visits', 'emea', '2.2.1 Πόσες φορές επισκεφθήκατε επείγουσα φροντίδα;', [emeaValue(2, 425.0, 521.8, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_urgent_care', value: 'yes' } }),
      text('emea_urgent_overnights', 'emea', '2.2.1 Πόσες φορές νοσηλευτήκατε με διανυκτέρευση;', [emeaValue(2, 425.0, 546.3, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_urgent_care', value: 'yes' } }),
      emeaYesNo('emea_hospitalized', '2.2.2 Νοσηλευτήκατε στο νοσοκομείο λόγω ψωρίασης/ψωριασικής αρθρίτιδας;', 2, 629.7, 730.9),
      text('emea_hospitalizations', 'emea', '2.2.2 Αριθμός νοσηλειών', [emeaValue(2, 389.9, 625.2, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_hospitalized', value: 'yes' } }),
      text('emea_dermatology_days', 'emea', '2.2.2 Ημέρες σε δερματολογική κλινική', [emeaValue(2, 389.9, 645.4, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_hospitalized', value: 'yes' } }),
      text('emea_rheumatology_days', 'emea', '2.2.2 Ημέρες σε ρευματολογική κλινική', [emeaValue(2, 389.9, 665.7, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_hospitalized', value: 'yes' } }),
      text('emea_internal_days', 'emea', '2.2.2 Ημέρες σε παθολογική κλινική', [emeaValue(2, 389.9, 686.0, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_hospitalized', value: 'yes' } }),
      text('emea_other_clinic_name', 'emea', '2.2.2 Άλλη κλινική, προσδιορίστε', [emeaValue(2, 327.9, 706.1, 55)], { showIf: { id: 'emea_hospitalized', value: 'yes' } }),
      text('emea_other_clinic_days', 'emea', '2.2.2 Ημέρες σε άλλη κλινική', [emeaValue(2, 389.9, 706.1, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_hospitalized', value: 'yes' } }),

      choice('emea_work_status', 'emea', '3.1.1 Κύρια εργασιακή κατάσταση τους τελευταίους 6 μήνες', [
        option(['full_time', 'Πλήρης απασχόληση'], [emeaRing(3, 139.3, 154.5)]),
        option(['part_time', 'Μερική ή ωριαία απασχόληση'], [emeaRing(3, 139.3, 174.8)]),
        option(['self_employed', 'Αυτοαπασχολούμενος/-η'], [emeaRing(3, 139.3, 195.0)]),
        option(['student', 'Μαθητής/-τρια / Φοιτητής/-τρια'], [emeaRing(3, 139.3, 215.2)]),
        option(['home_family', 'Φροντίδα σπιτιού/οικογένειας'], [emeaRing(3, 139.3, 235.5)]),
        option(['unemployed', 'Άνεργος/-η'], [emeaRing(3, 139.3, 255.8)]),
        option(['long_term_illness', 'Μακροχρόνια ασθένεια/αναπηρία'], [emeaRing(3, 139.3, 275.9)]),
        option(['retired', 'Συνταξιούχος'], [emeaRing(3, 139.3, 296.2)]),
        option(['not_working_other', 'Δεν εργάζομαι για άλλους λόγους'], [emeaRing(3, 139.3, 316.5)]),
      ]),
      text('emea_part_time_hours', 'emea', '3.1.1 Ώρες εβδομαδιαίως για μερική/ωριαία απασχόληση', [emeaValue(3, 275.4, 170.3, 60)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_work_status', value: 'part_time' } }),
      emeaYesNo('emea_not_working_due_to_condition', '3.1.2 Αν δεν εργάζεστε, οφείλεται στην ψωρίαση/ψωριασική αρθρίτιδα;', 3, 377.2, 397.4),
      emeaYesNo('emea_disability_benefit', '3.1.3 Λάβατε επίδομα αναπηρίας ή μακροχρόνιας ασθένειας;', 3, 472.4, 492.7),
      choice('emea_prevented_activities', 'emea', '3.1.4 Σας εμπόδισε από εργασία, σχολείο ή καθημερινές δραστηριότητες;', [
        option(['yes', 'Ναι'], [emeaRing(3, 139.3, 581.9)]),
        option(['no', 'Όχι'], [emeaRing(3, 139.3, 602.1)]),
      ]),
      text('emea_absence_days', 'emea', '3.1.4 Σύνολο ημερών απουσίας από εργασία/σχολείο', [emeaValue(3, 389.6, 577.3, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_prevented_activities', value: 'yes' } }),
      scale('emea_work_productivity', 'emea', '3.2.1 Επίδραση στην παραγωγικότητα στην εργασία', 4, 193.0, emeaScaleXs, { marker: 'ring', radiusX: 7, radiusY: 6 }),
      scale('emea_daily_activities', 'emea', '3.2.2 Επίδραση στις συνήθεις καθημερινές δραστηριότητες', 4, 395.7, emeaScaleXs, { marker: 'ring', radiusX: 7, radiusY: 6 }),

      text('emea_treatment_hours_weekly', 'emea', '4.1.1 Ώρες εβδομαδιαίως για θεραπεία και σχετικές δραστηριότητες', [emeaValue(5, 134.8, 192.7, 65)], { type: 'number', inputType: 'number', min: 0 }),
      emeaYesNo('emea_housework_help', '4.2.1 Χρειαστήκατε βοήθεια για δουλειές του σπιτιού;', 5, 332.7, 367.2),
      text('emea_paid_help_days', 'emea', '4.2.1 Ημέρες αμειβόμενης βοήθειας', [emeaValue(5, 184.4, 328.2, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_housework_help', value: 'yes' } }),
      text('emea_unpaid_help_days', 'emea', '4.2.1 Ημέρες μη αμειβόμενης βοήθειας', [emeaValue(5, 184.4, 342.4, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_housework_help', value: 'yes' } }),
      emeaYesNo('emea_care_help', '4.2.2 Χρειαστήκατε βοήθεια από φίλους ή συγγενείς για φροντίδα/θεραπεία/μετάβαση;', 5, 442.2, 462.4),
      text('emea_care_help_days', 'emea', '4.2.2 Ημέρες βοήθειας από φίλους ή συγγενείς', [emeaValue(5, 319.1, 437.6, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_care_help', value: 'yes' } }),
      emeaYesNo('emea_family_absent', '4.2.3 Έλειψαν φίλοι ή οικογένεια από εργασία/σχολείο για να βοηθήσουν;', 5, 537.3, 557.6),
      text('emea_family_absent_days', 'emea', '4.2.3 Σύνολο ημερών απουσίας φίλων/οικογένειας', [emeaValue(5, 389.6, 532.8, 45)], { type: 'number', inputType: 'number', min: 0, showIf: { id: 'emea_family_absent', value: 'yes' } }),

      scale('emea_treatment_burden', 'emea', '5.1.1 Δυσκολία ενσωμάτωσης θεραπείας στην καθημερινή ρουτίνα', 6, 203.7, emeaScaleXs, { marker: 'ring', radiusX: 7, radiusY: 6 }),
      choice('emea_treatment_adherence', 'emea', '5.2.1 Χρησιμοποιήσατε τη θεραπεία σύμφωνα με τις οδηγίες του γιατρού;', [
        option(['almost_never', 'Σχεδόν ποτέ'], [emeaRing(6, 139.3, 319.3)]),
        option(['sometimes', 'Μερικές φορές'], [emeaRing(6, 139.3, 339.4)]),
        option(['most_times', 'Τις περισσότερες φορές'], [emeaRing(6, 139.3, 359.7)]),
        option(['almost_always', 'Σχεδόν πάντα'], [emeaRing(6, 139.3, 380.0)]),
      ]),
      scale('emea_treatment_satisfaction', 'emea', '5.3.1 Ικανοποίηση από τη θεραπεία', 6, 493.6, emeaScaleXs, { marker: 'ring', radiusX: 7, radiusY: 6 }),
    ],
  },
];

export const pdfs = PDFS;

export function isQuestionVisible(question, answers, questionList = allQuestions()) {
  if (!question.showIf) return true;
  const dependency = questionList.find((item) => item.id === question.showIf.id);
  if (dependency && !isQuestionVisible(dependency, answers, questionList)) return false;
  return String(answers[question.showIf.id] ?? '') === String(question.showIf.value);
}

export function visibleQuestionsForForm(form, answers) {
  return form.questions.filter((question) => isQuestionVisible(question, answers, form.questions));
}

export function visibleQuestionsForAnswers(answers) {
  return forms.flatMap((form) => visibleQuestionsForForm(form, answers));
}

export function allQuestions() {
  return forms.flatMap((form) => form.questions.map((question) => ({
    ...question,
    formTitle: form.title,
    template: form.template,
  })));
}

export function clientForms() {
  return forms.map((form) => ({
    id: form.id,
    title: form.title,
    description: form.description,
    questions: form.questions.map(({ placements, options, ...question }) => ({
      ...question,
      options: options?.map(({ placements: _placements, ...opt }) => opt),
    })),
  }));
}
