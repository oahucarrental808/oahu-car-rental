// functions/src/pdfCoordinates.js
// Coordinates in PDF points (page ~612 x 792)

const PAD_X = 2;

// Global vertical baseline adjustment
const Y_GLOBAL = -20;

// One row height
const LINE = 18;

export const CONTRACT_COORDS = {
  fontSize: 11,
  padLeft: PAD_X,

  d1: {
    lastName: { x: 27 + PAD_X, y: 735.12 + Y_GLOBAL },
    firstName: { x: 157 + PAD_X, y: 735.12 + Y_GLOBAL },
    mi: { x: 238 + PAD_X, y: 735.12 + Y_GLOBAL },

    homeAddress: { x: 27 + PAD_X, y: 717.3 + Y_GLOBAL },

    city: { x: 27 + PAD_X, y: 699.48 + Y_GLOBAL },

    // ✅ FIX: State + Zip moved RIGHT into their boxes
    state: { x: 157 + PAD_X, y: 699.48 + Y_GLOBAL },
    zip: { x: 215 + PAD_X, y: 699.48 + Y_GLOBAL },

    homePhone: { x: 27 + PAD_X, y: 681.66 + Y_GLOBAL },
    businessPhone: { x: 157 + PAD_X, y: 681.66 + Y_GLOBAL },

    employer: { x: 27 + PAD_X, y: 663.84 + Y_GLOBAL },
    employerCity: { x: 157 + PAD_X, y: 663.84 + Y_GLOBAL },
    employerState: { x: 238 + PAD_X, y: 663.84 + Y_GLOBAL },

    dlNumber: { x: 27 + PAD_X, y: 646.02 + Y_GLOBAL },
    dlExp: { x: 157 + PAD_X, y: 646.02 + Y_GLOBAL },
    dlState: { x: 238 + PAD_X, y: 646.02 + Y_GLOBAL },

    cellPhone: { x: 27 + PAD_X, y: 628.38 + Y_GLOBAL },
    dob: { x: 157 + PAD_X, y: 628.38 + Y_GLOBAL },

    insuranceCompany: { x: 27 + PAD_X, y: 506.88 + Y_GLOBAL - 0.75 * LINE },
    insuranceCompanyPhone: { x: 205 + PAD_X, y: 506.88 + Y_GLOBAL - 0.75 * LINE },

    agentName: { x: 27 + PAD_X, y: 488.88 + Y_GLOBAL - 0.75 * LINE },
    agentPhone: { x: 205 + PAD_X, y: 488.88 + Y_GLOBAL - 0.75 * LINE },
  },

  d2: {
    lastName: { x: 27 + PAD_X, y: 597.06 + Y_GLOBAL },
    firstName: { x: 157 + PAD_X, y: 597.06 + Y_GLOBAL },

    address: { x: 27 + PAD_X, y: 588.06 + Y_GLOBAL - 0.5 * LINE },

    city: { x: 27 + PAD_X, y: 579.06 + Y_GLOBAL - LINE },
    state: { x: 200 + PAD_X, y: 579.06 + Y_GLOBAL - LINE },
    zip: { x: 225 + PAD_X, y: 579.06 + Y_GLOBAL - LINE },

    dlNumber: { x: 27 + PAD_X, y: 570.24 + Y_GLOBAL - 1.5 * LINE },
    dlExp: { x: 200 + PAD_X, y: 570.24 + Y_GLOBAL - 1.5 * LINE },

    dob: { x: 27 + PAD_X, y: 561.42 + Y_GLOBAL - 2 * LINE },
  },

  vehicle: {
    unitNumber: { x: 306 + PAD_X, y: 735.12 + Y_GLOBAL },

    // ✅ FIX: Car info shifted UP one full row
    makeModel: { x: 306 + PAD_X, y: 717.3 + Y_GLOBAL + 0.75 * LINE },
    color: { x: 439 + PAD_X, y: 717.3 + Y_GLOBAL + 0.75 * LINE },

    vin: { x: 306 + PAD_X, y: 699.48 + Y_GLOBAL + 0.75 * LINE },
    tagNumber: { x: 439 + PAD_X, y: 699.48 + Y_GLOBAL + 0.75 * LINE },

    replacementMakeModel: { x: 306 + PAD_X, y: 663.84 + Y_GLOBAL + 2 * LINE },
    replacementColor: { x: 439 + PAD_X, y: 663.84 + Y_GLOBAL + 2 * LINE },
    replacementTagNumber: { x: 439 + PAD_X, y: 646.02 + Y_GLOBAL + 2 * LINE },
    replacementVin: { x: 306 + PAD_X, y: 646.02 + Y_GLOBAL + 2 * LINE },

    dateTimeOut: { x: 439 + PAD_X, y: 628.38 + Y_GLOBAL + 2 * LINE },
    dateDueIn: { x: 439 + PAD_X, y: 610.56 + Y_GLOBAL + 2 * LINE },

    // ✅ Added: Miles Out / Miles In fields (vehicle section)
    // NOTE: These are best-effort coordinates based on the provided contract image.
    // If they need nudging, tweak x/y here.
    milesIn: { x: 306 + PAD_X, y: 628.38 + Y_GLOBAL + 0.0 * LINE }, // left cell "Miles In"
    milesOut: { x: 306 + PAD_X, y: 610.56 + Y_GLOBAL + 0.0 * LINE }, // left cell "Miles Out"
  },

  rental: {
    // ✅ Added: Day@ rate cell in RENTAL table (format "$X/Day")
    // Best-effort coordinate. Adjust if needed.
    dayRate: { x: 480 + PAD_X, y: 542.5 + Y_GLOBAL }, // near "Day@"
  },

  // ✅ Added: Fuel fields in "ALL CHARGES SUBJECT TO FINAL AUDIT" section
  // Your current code draws text, not checkbox marks.
  // This places the selected value (E, 1/8, 1/4, ... F) near the row.
  // If you later want true checkbox marking, we can switch to per-option coordinates.
  fuelOut: { x: 360 + PAD_X, y: 399 + Y_GLOBAL }, // Gas Out row
  fuelIn: { x: 360 + PAD_X, y: 357 + Y_GLOBAL }, // Gas In row

  // ✅ Added: mileage/fuel placements used by submitMileageIn.js completion overlay
  mileageOut: { x: 306 + PAD_X, y: 610.56 + Y_GLOBAL + 0.0 * LINE }, // same as vehicle.milesOut
  mileageIn: { x: 306 + PAD_X, y: 628.38 + Y_GLOBAL + 0.0 * LINE }, // same as vehicle.milesIn
};
