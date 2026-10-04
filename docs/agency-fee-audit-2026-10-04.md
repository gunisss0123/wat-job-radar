# Agency fee and sponsor audit — 4 October 2026

The previous `/fees` data was a static table without citations. Its agency totals, discounts, refund deductions, founding dates, 120-day insurance assumptions, flight guarantees and sponsor partnerships were not supported by field-level evidence. The calculator averaged price ranges, assumed discounts stacked and presented an incomplete estimate as a whole-program total.

The revised page preserves all eight agencies and the three tabs. It attaches a URL, check date and year/season/package scope to published facts. Unverified fields remain explicitly unknown. The budget uses a net invoice supplied by the user and requires government-fee inclusion to be specified. Unknown invoice totals and unknown inclusion do not generate a grand total. Flight and USD/THB inputs are estimates, not live quotes. USD 850/350 and THB 36/USD are disclosed editable assumptions.

| Agency | Verified evidence | Remaining gaps |
|---|---|---|
| OEG | Official job titles show CIEE and Spirit. Official **2026** fee PDF sums to THB 111,900 before discounts/government fees. | No verified 2027 price or refund contract. Do not substitute 2026 prices or claim a complete sponsor list. |
| New Step | Current general cost article, dated 6 Sep 2026, lists application/program/location charges, SEVIS billing, flight choice and conditional insurance. Separate Spring/Summer **2027** promotion page specifies campaign prices and deadline 15 Oct 2026. | Exact program quote, refund exclusions, group eligibility and sponsor partnerships. Pay-later page inconsistently numbers installments. THB 3,900 SEVIS line does not explain the difference from the government fee. |
| ALC | Public job API read through all four pages: 384 records, sponsor labels AAG, AAG-Self, AWA, Intrax, Intrax-Self, Janus, Janus-Self. Full audit with sample job URLs in `data/alc-sponsor-audit.json`. | API has season but no program-year field. No verified 2027 fee/refund contract. Old IACE/GeoVisions/InterExchange partnership claims were removed. |
| IEE | Official WAT page and images confirm promotion of WAT 2027; inspected banners did not provide fee tables. | Prices, package inclusion, refund policy and sponsor partnerships. Do not use High School Exchange banners as WAT evidence. |
| iHappy | Read official October promotion posters for Spring/Summer **2027**. Spring All in One: THB 3,500 application + THB 82,000 program, with VISA/SEVIS included. Summer Adventure: 4,500 + 77,900. Spring Visa Protection: 16,900 + 70,900. Summer Visa Protection: 17,500 + 68,900. Campaign deadline 25 Oct 2026. | Only Spring All in One explicitly states VISA/SEVIS inclusion. Protection branding does not establish a refund amount or exclusions. No confirmed sponsor names or installment amounts. |
| ACADEX | Summer 2027 listing advertises THB 3,900 application. General information explicitly mentions SEVIS with service THB 3,900 and self-booked flights. Yellowstone Summer 2027 job permits changing jobs in the same exchange organization after failed consideration/interview. | Total program price by group, inclusion in invoice, campaign deadline, insurance and refund contract. Free job change does not imply a cash refund. |
| Interchange | Official Main Interchange page reviewed. | No verified 2027 prices/refund contract/sponsor partnerships in the reviewed public material. |
| I4 Group | Official program page specifies payment before submission and remaining payment after Job Offer without amounts. | Program year, prices, sponsor list, flight restrictions and refund contract. |

Primary sources:

- [OEG current jobs](https://www.oeg.co.th/work-and-travel-usa), [OEG 2026 fee PDF](https://oeg.co.th/oegfile/OEGWorkAndTravel2026Fee.pdf).
- [New Step costs](https://newstepthailand.com/blog/expenses-work-and-travel-usa), [2027 promotions](https://newstepthailand.com/promotions).
- [ALC program](https://myalcapp.com/work-and-travel), [public job API](https://api.myalcapp.com/api/v1/web/wat/job?page=1&size=100).
- [IEE WAT](https://www.ieethailand.com/work-and-travel-new/).
- [iHappy promotion page](https://www.ihappyeducation.com/hot-promotion/), [Spring All in One](https://www.ihappyeducation.com/wp-content/uploads/2026/09/All-in-one-2.png), [Summer](https://www.ihappyeducation.com/wp-content/uploads/2026/09/Summer-2.png), [Spring Protection](https://www.ihappyeducation.com/wp-content/uploads/2026/09/SP-Protect-3.png), [Summer Protection](https://www.ihappyeducation.com/wp-content/uploads/2026/09/SM-Protect-3.png).
- [ACADEX general information](https://www.acadexthailand.com/work-and-travel-2/), [2027 job list](https://www.acadexthailand.com/program/work-and-travel-summer/), [Yellowstone scoped terms](https://www.acadexthailand.com/location/xanterra-yellowstone-national-park-wyoming-summer-2027-group-x/).
- [Main Interchange](https://maininterchange.com/), [I4 Group program](https://i4gs.com/work-and-travel-in-usa-program/).
- [State Department visa fees](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html): current non-petition J visa application fee USD 185. [8 CFR 214.13(c)](https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-214/subpart-A/section-214.13): SWT I-901 fee USD 35. These are current rates, not a guarantee for 2027.
- [BridgeUSA designated sponsor directory](https://j1visa.state.gov/participants/how-to-apply/sponsor-search/?program=Summer%20Work%20Travel): designation must not be interpreted as proof of partnership with a Thai agency.

Access limitations: some agency pages failed through the search reader, so their public HTML was also retrieved directly. iHappy fees were in images, which were downloaded temporarily and visually inspected; hashes and original URLs are saved in `data/fee-evidence/manifest.json`. Full posters are not bundled into the application. Nothing required login or contacting an agency.

This is a dated audit, not an automatic live fee sync. Unknown means the reviewed material did not establish a claim, not that the agency has no published information elsewhere. No external publication or deployment was performed.
