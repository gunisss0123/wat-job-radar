# ตรวจข้อมูลทั้งระบบ WAT Job Radar — 4 ตุลาคม 2026

ผลตรวจ: **ข้อมูลเดิมไม่ถูกต้องทั้งหมด** พบทั้งข้อมูลที่กำหนดเองในโค้ด การติดปีผิด สถานะผิด การทับประกาศ และการเติมข้อมูลที่ต้นทางไม่ได้ระบุ ได้แก้ตัวดึงข้อมูล การจัดเก็บ การแสดงผล และปรับฐานข้อมูลในเครื่องแล้ว ยังไม่รับรองว่าทุกเงื่อนไขเป็นข้อมูลยืนยันสำหรับปี 2027

## ขอบเขตและหลักฐาน

- ตรวจฐานข้อมูลเดิมครบ 2,240 แถว และเส้นทาง connector → normalization → local store → API → Radar / Compare / 3 Friends / Live Changes / Sources
- ดึงใหม่จาก OEG, New Step, ALC, IEE, iHappy และ ACADEX รวม 936 หน้ารายละเอียด/ตารางที่ตัวดึงค้นพบ อ่านได้ 935 หน้า อีกหนึ่งรายการ ALC มี `custom_url: null` และไม่มีรายละเอียดให้อ่าน
- Interchange / I4 Group: ตรวจโค้ดแล้วพบว่าไม่ได้แปลงข้อมูลจาก response แต่เผยแพร่ catalog ที่เขียนไว้เอง จึงปิดการเผยแพร่ catalog และแสดง Connector Needed
- ตรวจราคา agency, sponsor, SEVIS, MRV, โปรโมชั่นและ refund แยกไว้ใน [รายงานค่าใช้จ่าย](agency-fee-audit-2026-10-04.md)
- [ผลตรวจและจำนวนก่อน–หลัง](../data/system-audit/latest.json), [ข้อมูลที่ดึงจากต้นทาง](../data/system-audit/records.json), [ผลตรวจความสอดคล้อง](../data/system-audit/invariants.json)
- [สคริปต์ตรวจซ้ำ](../scripts/audit-system-data.ts), [ชุดทดสอบข้อมูล](../scripts/data-integrity.test.ts)

ตัวเลขหน้าที่อ่านได้เป็น coverage ของรายการที่ค้นพบ ไม่ใช่หลักฐานว่าพบทุกงานที่ agency มี หรือรับรองความถูกต้องทุกข้อในประกาศ การตรวจเทียบ field กับต้นทางอย่างอิสระใช้ตัวอย่างที่มีความเสี่ยง ส่วนการดึงใหม่ทำกับทุกรายการที่ connector ค้นพบ

## ผลราย Agency

| Agency | แถวเดิม | แถวที่แสดงหลังแก้ | ผลตรวจ/ข้อจำกัด |
|---|---:|---:|---|
| OEG | 129 | 129 | ปีอ่านจากวันที่: 121 แถวปี 2027, 5 แถวปี 2026, 3 แถวไม่ระบุปี; สถานะ/จำนวนมาจากกล่อง Available |
| New Step | 183 | 189 | พบ 6 ตำแหน่งชื่อซ้ำแต่ ID/อัตราต่างกันที่เคยทับกัน; แก้ช่วงวันที่เป็นข้อความ; API ระบุ SUMMER และเดือน–วัน แต่ไม่มีปี จึงแสดงไม่ระบุปี |
| ALC | 629 | 628 | ปีจากวันที่จริง: 316 แถวปี 2027, 307 แถวปี 2025–2026, 5 แถวไม่ระบุปี; 54 แถวไม่ทราบจำนวนไม่ถูกแปลเป็น OPEN; รายการไม่มีรายละเอียดไม่เผยแพร่ค่าทดแทน |
| IEE | 254 | 254 | ใช้ tag Summer/Spring และปีจากช่วงวันที่; 120 แถวมีปี 2027, 134 แถวไม่ระบุปี; ไม่มีหลักฐานจำนวน/สถานะปัจจุบัน จึงใช้ UNKNOWN; บางหน้าระบุว่ารายละเอียดอ้างอิง 2024–2026 และเก็บคำเตือนนั้นไว้ |
| iHappy | 556 | 35 | อ่านปีจากคอลัมน์ Season: 521 แถวเป็นปี 2026 จึงไม่เผยแพร่เป็นปี 2027; ปี 2027 มี 33 แถวเปิดรับและ 2 แถว Full; แก้อ่านไอคอน Full |
| ACADEX | 439 | 456 | แยก URL ของแต่ละ Group ไม่ทับกัน; ตัดตำแหน่งซ้ำในประกาศเดียวกัน; อัตราค่าแรงเป็นช่วงรวมของประกาศ ไม่ใช่อัตรารายตำแหน่ง; ที่พักปีก่อน/รอยืนยันไม่แสดงเป็นราคายืนยันปี 2027 |
| Interchange | 25 | 0 | catalog เดิมไม่มีหลักฐานว่าค่าแรง/ที่พัก/จำนวน/วันที่มาจาก response ที่อ่านจริง; มี URL Spring 2025 แต่ติด Summer 2027 |
| I4 Group | 25 | 0 | catalog เดิมกำหนดค่าเอง และใช้ลิงก์ใบสมัครทั่วไปแทนประกาศงาน; รอ connector ที่มีหลักฐาน |

รวม 1,691 แถวที่ยังแสดงผล: **1,048 แถวระบุปี 2027, 312 แถวระบุปีก่อน, 331 แถวไม่ระบุปี** จำนวนนี้รวมงานเต็มและงานที่ยังไม่ทราบสถานะ ไม่ใช่จำนวนงานเปิดรับปี 2027 และแถวตำแหน่งไม่ใช่จำนวนที่ว่าง

ข้อมูลเดิมยังเก็บใน store พร้อม `isStale` เพื่อให้ตรวจย้อนหลังและย้อนกลับได้ ไม่แสดงรวมกับแถวที่ปรับใหม่ การกักข้อมูลเดิมในรอบ audit เป็นการแก้ข้อมูลที่ตรวจพบว่าผิด ไม่ได้อ้างว่างานนั้นหายจากต้นทาง

## ข้อผิดพลาดที่แก้

1. **สูง / ยืนยันจากโค้ดและต้นทาง:** catalog ที่กำหนดเอง 50 แถวถูกแสดงเป็นข้อมูลสดพร้อม coverage 100% — ยกเลิก catalog และแสดงแหล่งที่ยังเชื่อมต่อไม่ได้
2. **สูง / ยืนยันจากปีในตารางและ API:** เติมปี 2027 ให้ข้อมูลปีก่อนหรือไม่ระบุปี — ใช้ปีจากวันที่/คอลัมน์จริงและแสดงปีบนการ์ด
3. **สูง / ยืนยันจากไอคอนต้นทาง:** iHappy ไม่อ่าน Full และผสมงานปี 2026 — อ่าน icon อย่างเจาะจงและคัดปีจากแต่ละแถว
4. **สูง / ยืนยันจาก schema และตัวอย่าง API:** New Step แปลง date range object เป็น `[object Object]` — อ่าน start/end โดยไม่เติมปี
5. **สูง / ยืนยันจาก ID ของต้นทาง:** ประกาศ ACADEX คนละ Group และ New Step ชื่อตำแหน่งซ้ำถูกทับ — แยก identity ของ offer และ source position ID รวมเมืองใน identity นายจ้าง
6. **สูง / ยืนยันจากโค้ด:** slot UNKNOWN/AT_MOST ถูกถือว่าเพียงพอสำหรับ 3 คน — รองรับเฉพาะ EXACT/AT_LEAST และสถานะเปิดที่มีหลักฐาน ไม่รวมข้าม agency/ฤดูกาล และไม่รวมเมืองที่ไม่ทราบ
7. **สูง / ยืนยันจากข้อมูล 109 แถว:** New Step สถานะ FULL แต่แสดง cap เดิมเป็นที่ว่าง — จำนวนใช้งานเป็น 0 และแสดงเต็ม เก็บ raw text เดิมไว้
8. **กลาง / ยืนยันจากข้อความต้นทาง:** คำว่า meal หรือ housing price ถูกตีความเป็นรวม/ไม่รวมอาหาร — อ่านข้อความ inclusion/charge ที่ชัดเจน ตัวอย่าง Bryce Canyon `$100+tax /week/person + Includes meals` เป็นรวมอาหาร
9. **กลาง / ยืนยันจากข้อความประกาศ:** ค่า housing อ้างอิงปี 2026 / TBA ถูกแสดงเป็นราคาปี 2027 — เก็บข้อความ/ข้อจำกัดและไม่ยืนยันยอดรายสัปดาห์
10. **กลาง / ยืนยันจากโค้ด:** เติมภาษาอังกฤษ สถานที่ ชั่วโมง วันที่ และที่พักโดยไม่มีหลักฐาน — ยกเลิกการเติมในข้อมูลที่แสดง; คะแนน Fit ยังคงเป็น heuristic และระบุว่าเป็นการประมาณ
11. **สูง / ยืนยันจากโค้ด:** scrape ล้มเหลว/ไม่ครบทำให้งานถูกนับว่าหายและซ่อน — นับ missing run เฉพาะ discovery/parse สำเร็จครบ ไม่มี anomaly
12. **กลาง / ยืนยันจากโค้ด:** Live Changes ใส่ค่าก่อนหน้า 0 เองและเรียก wage change ว่า slot change — เปรียบเทียบ snapshot จริง แยกประเภท event; rebuild audit เป็น baseline ไม่อ้างว่างานเพิ่งเปิดใหม่
13. **กลาง / ยืนยันจากโค้ด:** ภาพ demo/seed ถูกใช้เป็นข้อมูลจริงเมื่อไม่มีผล — ยกเลิก seed fallback; ภาพประกอบสำรองของ UI ยังไม่ใช่ภาพยืนยันนายจ้าง
14. **สูง / ยืนยันจาก workflow:** `sync:all` รันเพียง 6 Agency แม้ workflow ระบุ 8 — ปรับให้วนครบ connector ทั้ง 8 และรายงาน source ที่ไม่พร้อมตามจริง
15. **กลาง / ยืนยันจากการแปลงข้อมูล:** ชั่วโมง/อาหารหายระหว่าง local store → Job และคะแนน 0 ถูกแทนด้วยค่า default — ส่ง field ต่อครบและรักษาค่า 0; เวลา lastSeen ใช้เวลาที่อ่านต้นทาง ไม่ใช้เวลาเอา cache มาเขียนใหม่

16. **กลาง / ยืนยันจาก DOM ต้นทาง:** ขีดในชื่อตำแหน่ง ACADEX เช่น `Public Areas Attendant - Jackson Lake Lodge - GTL` ถูกแยกชื่อสาขาเป็นงานเพิ่ม — อ่านแถว `.subtitlelist` ตามโครงสร้างจริง ลดแถวที่เกินจาก 466 เหลือ 456
17. **กลาง / ยืนยันจากข้อมูลและตัวกรอง:** ชื่อเมืองและข้อความหลายรัฐถูกใช้เป็นรัฐ และรหัสรัฐซ้ำกับชื่อเต็ม — normalize รหัส/ชื่อรัฐ, แก้ลำดับเมือง–รัฐเมื่อรัฐอยู่ช่องแรก, เก็บ location raw และไม่เดารัฐเมื่อไม่แน่ใจ

## แหล่งต้นทาง

- [OEG รายการงาน](https://www.oeg.co.th/work-and-travel-usa), [ตัวอย่างรายละเอียด](https://www.oeg.co.th/work-and-travel-usa/detail/41)
- [New Step รายการงาน](https://newstepthailand.com/jobs?season=summer), [Brutger Equities](https://newstepthailand.com/jobs/montana-billings-brutger-equities), [Beachy's — ชื่อซ้ำแต่อัตราต่างกัน](https://newstepthailand.com/jobs/michigan-caseville-beachys-bar-grill)
- [ALC รายการ API](https://api.myalcapp.com/api/v1/web/wat/job?page=1&size=100), [49th State Brewing](https://myalcapp.com/work-and-travel/jobs/summer/49th-state-brewing-ak)
- [IEE รายการงานและ tag ฤดูกาล](https://www.ieethailand.com/work-and-travel-new/), [Firefall Ranch — ระบุข้อมูลอ้างอิงปีก่อน](https://www.ieethailand.com/work_and_travel_2/firefall-ranch-at-yosemite/)
- [iHappy ตาราง Season/Status](https://ihappyeducation.com/job-location-summer/)
- [ACADEX รายการงาน](https://www.acadexthailand.com/program/work-and-travel-summer/), [Grand Teton — housing ปี 2026](https://www.acadexthailand.com/location/grand-teton-lodge-wyoming-summer-2027-group-a/)
- [Interchange](https://maininterchange.com/work_and_travel_summer), [I4 ใบสมัคร](https://i4gs.com/apply-online/)

## การตรวจสอบและข้อจำกัด

ชุดทดสอบรวมข้อมูลและค่าใช้จ่าย 21 ข้อ ครอบคลุมปี/วันที่/จำนวน/สถานะ/identity/อาหาร/ประวัติ/partial crawl/fee inclusion ตรวจ typecheck และ production build รวมถึง API และหน้า Sources/Radar/Compare/Group ในเครื่อง

ยังยืนยันไม่ได้: ปี New Step/IEE บางงาน, ALC หนึ่งรายการที่ไม่มี detail, availability ที่ agency ไม่เผยแพร่, housing ที่ยังไม่ finalized, อัตรารายตำแหน่ง ACADEX และความครบถ้วนของงานที่ไม่อยู่ในแหล่งสาธารณะ ควรอ้างเงื่อนไขใน job offer ที่ agency ยืนยันก่อนชำระเงิน

**Remote/deployment:** รอบนี้แก้และทดสอบ local project เท่านั้น ไม่ deploy และไม่เขียน Supabase/ส่ง Telegram ไม่มี `.env` ที่มี credentials ให้ตรวจ remote ใน workspace นี้ โค้ด legacy ยังอ้าง `wat_jobs` / `wat_job_events` / `wat_source_runs` แต่ `supabase.sql` กำหนด normalized tables; engine remote ยังไม่ได้ sync housing/snapshots ครบหรือพิสูจน์ผลเขียนทุก table จึงยังรับรองเส้นทาง remote ไม่ได้ หน้าแอปที่มี local store ใช้ข้อมูล local เป็นหลัก และแสดง health/history จากแหล่งเดียวกันแล้ว

ตรวจซ้ำโดยไม่แก้ฐานข้อมูล: `node --import tsx scripts/audit-system-data.ts`

ทดสอบ: `node --import tsx --test scripts/data-integrity.test.ts scripts/fees.test.ts`

สคริปต์ audit ไม่ส่งข้อความ ไม่เขียน remote; ต้องระบุ `--apply-local` จึงเขียนฐานข้อมูลในเครื่อง การใช้ `--quarantine-unverified` เป็นขั้นตอนกักข้อมูลเก่าหลังตรวจ parser มีปัญหา ไม่ใช่นโยบายการซิงก์ประจำ
