import { practices as basePractices } from "../content.mjs";
export const practiceDefaults = [
  ...basePractices,
  {
    slug: "horeca",
    href: "/horeca",
    number: "07",
    title: "HORECA Procurement",
    line: "Every specification. Every delivery.",
    intro:
      "Build a coordinated procurement programme for hotels, restaurants and operating businesses. Translate your BOQ into comparable specifications, supplier proposals, approved quotations and tracked fulfilment.",
    services: [
      [
        "Product sourcing",
        "Source tableware, linen, equipment, housekeeping and operating supplies against an agreed product specification.",
      ],
      [
        "BOQ and supplier comparison",
        "Compare quantities, units, technical specifications and commercial inclusions on a consistent basis.",
      ],
      [
        "Samples and approvals",
        "Coordinate product information, available samples and decisions before placing an approved order.",
      ],
      [
        "Delivery coordination",
        "Plan lead times, dispatch dependencies and receipt against the project programme.",
      ],
    ],
    outputs: [
      "Reviewed procurement schedule",
      "Supplier comparison and approved quotation",
      "Order and delivery tracker",
    ],
  },
];
