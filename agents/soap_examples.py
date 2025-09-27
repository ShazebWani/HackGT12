# agents/soap_examples.py
FEW_SHOT_EXAMPLES = [
    {
        "input": "Patient is a 45-year-old male here for a follow-up on his hypertension. He says he's been taking his lisinopril daily and has been checking his blood pressure, which is running about 130 over 80. No complaints of dizziness or side effects. Exam shows a BP of 128/82 and a heart rate of 70. Lungs are clear. We'll continue the current dose of lisinopril 10mg and see him back in 3 months.",
        "output": """
SUBJECTIVE:
The patient is a 45-year-old male presenting for a routine follow-up for hypertension. He reports good compliance with his lisinopril 10mg daily. He has been monitoring his blood pressure at home with readings around 130/80. He denies any dizziness, headache, or other side effects.

OBJECTIVE:
Vitals: BP 128/82, HR 70.
Physical Exam: Lungs are clear to auscultation. Cardiovascular exam reveals a regular rate and rhythm.

ASSESSMENT:
Well-controlled hypertension.

PLAN:
- Continue Lisinopril 10mg daily.
- Continue home blood pressure monitoring.
- Follow up in 3 months.
"""
    },
    {
        "input": "28-year-old female comes in with a sore throat and fever for the past 2 days. She describes the pain as a 7 out of 10. She's tried Tylenol with some relief. On exam, her temperature is 101.5. Pharynx is erythematous with tonsillar exudates. Rapid strep test is positive. Plan is to start her on Amoxicillin 500mg twice a day for 10 days.",
        "output": """
SUBJECTIVE:
The patient is a 28-year-old female presenting with a 2-day history of sore throat and fever. She rates the pain at 7/10 and reports partial relief with Tylenol.

OBJECTIVE:
Vitals: Temp 101.5°F.
Physical Exam: Pharynx is erythematous with bilateral tonsillar exudates.
Labs: Rapid strep test is positive.

ASSESSMENT:
Acute Streptococcal Pharyngitis.

PLAN:
- Prescribe Amoxicillin 500mg, 1 tablet twice daily for 10 days.
- Advise patient to complete the full course of antibiotics.
- Recommend supportive care with hydration and analgesics.
- Return if symptoms worsen.
"""
    },
    {
        "input": "This is a 58-year-old gentleman with type 2 diabetes here because his sugars have been creeping up. He's on metformin 1000 twice a day, tolerating it, but his last A1c three months ago was 8.6. He really wants to avoid injections if possible. He's checking at home, fasting around the 160s. No chest pain, vision changes, or foot ulcers, but he does mention some burning in the toes at night. Blood pressure today is 134 over 84, BMI's about 31. Foot exam with slightly decreased sensation at the great toes. I'm going to add empagliflozin 10 mg daily, keep metformin, check labs, and have him follow up in 6 weeks.",
        "output": """
SUBJECTIVE:
The patient is a 58-year-old male with T2DM for glycemic control. Meds: metformin 1000 mg BID, atorvastatin 20 mg nightly. A1c 8.6% (3 months ago). Home fasting glucoses ~160 mg/dL. Denies hypoglycemia, chest pain, vision loss; reports nocturnal burning in toes. Diet suboptimal; sedentary. No tobacco; rare alcohol.

OBJECTIVE:
Vitals: BP 134/84, HR 76, BMI 31.0. Eyes: no acute findings. Feet: intact skin, no ulcers; monofilament reduced at bilateral great toes; pulses 2+. CMP last month normal Cr 0.9. POC A1c today 8.7%.

ASSESSMENT:
1) Type 2 diabetes mellitus, suboptimally controlled.
2) Early peripheral neuropathy, likely diabetic.
3) Overweight and dyslipidemia on statin therapy.

PLAN:
- Start empagliflozin 10 mg PO daily; counsel on genital infection risk, volume depletion; maintain hydration.
- Continue metformin 1000 mg BID.
- Check BMP in 1–2 weeks after SGLT2 start; urine albumin/creatinine ratio; repeat A1c in 3 months.
- Foot care education; consider gabapentin if neuropathic pain persists.
- Nutrition referral; recommend 150 min/week exercise and 5–10% weight loss.
- Follow-up in 6 weeks to assess tolerance and glucose logs.
"""
    },
    {
        "input": "Eight-year-old with asthma here for cough and wheeze for the last four days after a cold. Mom says he's needed his albuterol every 4–6 hours but no ER visits, no fevers. He's talking in full sentences, sat is 96%, mild expiratory wheezes. We gave one neb in clinic with good response. I'm going to start a short steroid burst, get him on a daily inhaled steroid because he's been using albuterol a lot lately, and review spacer technique.",
        "output": """
SUBJECTIVE:
8-year-old male with known mild persistent asthma. URI 4 days ago; now cough and wheeze. Using albuterol q4–6h. No fever, chest pain, or nighttime awakenings >2/week. No prior ICU/intubations.

OBJECTIVE:
Vitals: HR 102, RR 20, Temp 37.1°C, SpO2 96% RA. General: speaking full sentences, no distress. Lungs: mild expiratory wheezes; improved post-albuterol neb. No retractions. Ears/throat benign.

ASSESSMENT:
1) Mild asthma exacerbation triggered by URI.
2) Persistent asthma not optimally controlled (SABA use >2 days/week).

PLAN:
- Administered albuterol nebulizer in clinic with improvement.
- Prednisolone 30 mg PO daily (≈1 mg/kg) x 5 days.
- Start fluticasone HFA 44 mcg, 2 puffs BID with spacer.
- Albuterol HFA 2 puffs q4–6h PRN wheeze; spacer teaching provided; asthma action plan updated.
- Return precautions for increased work of breathing; follow-up in 2 weeks.
"""
    },
    {
        "input": "Twenty-six-year-old woman with two days of burning with urination, urinary frequency, and urgency. No fevers, no flank pain, no vaginal discharge. She's not pregnant—pregnancy test is negative in clinic. UA shows nitrites and leukocyte esterase. I'll treat this as uncomplicated cystitis with nitrofurantoin for five days and give phenazopyridine short term for symptom relief.",
        "output": """
SUBJECTIVE:
26-year-old female with dysuria, frequency, urgency x 2 days. Denies fever, flank pain, hematuria, vaginal discharge, or STI exposure. No prior complicated UTIs. No known drug allergies.

OBJECTIVE:
Vitals: afebrile, stable. Abdomen: soft, nontender; no CVA tenderness. POC pregnancy test negative. UA: positive nitrites and leukocyte esterase; trace blood.

ASSESSMENT:
1) Acute uncomplicated cystitis.

PLAN:
- Nitrofurantoin monohydrate/macrocrystals 100 mg PO BID x 5 days.
- Phenazopyridine 200 mg PO TID PRN dysuria x 2 days; counsel urine discoloration.
- Encourage hydration; send urine culture if symptoms persist or recur.
- Return/ED for fever, flank pain, vomiting, or worsening symptoms.
- Follow-up PRN if not improved in 48–72 hours.
"""
    },
    {
        "input": "She's a 22-year-old with major depressive disorder following up after we increased sertraline to 100 mg. She reports better mood and energy, sleeping more regularly, and fewer crying spells. PHQ-9 today is 7, down from 17. No suicidal or homicidal ideation. No side effects besides a little nausea the first week. I'm keeping her at 100 mg, encouraging therapy, and I'll see her in about a month.",
        "output": """
SUBJECTIVE:
22-year-old female with MDD. Sertraline increased from 50 mg to 100 mg daily 4 weeks ago. Reports improved mood, energy, sleep; residual mild anhedonia. No SI/HI, no panic, no mania. Mild transient nausea resolved. Engaged in school; limited social support.

OBJECTIVE:
Vitals stable. Appearance: well-groomed, cooperative. Affect congruent; speech normal; thought process linear; insight/judgment intact. PHQ-9: 7 (prior 17).

ASSESSMENT:
1) Major depressive disorder, improving on sertraline 100 mg.

PLAN:
- Continue sertraline 100 mg PO daily.
- Recommend CBT; provide therapy referrals.
- Safety plan reviewed; crisis resources provided; return immediately if SI emerges.
- Sleep hygiene, exercise 150 min/week.
- Follow-up in 4–6 weeks; consider dose adjustment if plateau.
"""
    },
    {
        "input": "Thirty-nine-year-old warehouse worker with acute low back pain after lifting a heavy box three days ago. Pain is axial, no radiation, no numbness, no weakness, no bowel or bladder issues. He's stiff in the morning but walking helps. Exam shows paraspinal tenderness, negative straight leg raise, normal strength and reflexes. I'm recommending NSAIDs, heat, gentle mobility, and referring to PT. No imaging today.",
        "output": """
SUBJECTIVE:
39-year-old male with acute low back pain x 3 days after lifting. Achy, worse with bending, better with walking. Denies red flags: trauma, fever, weight loss, IV drug use, cancer, saddle anesthesia, bowel/bladder dysfunction, leg weakness.

OBJECTIVE:
Vitals normal. Back: lumbar paraspinal tenderness; no midline bony tenderness. Neuro: strength 5/5 LE, sensation intact, reflexes 2+ symmetric; negative SLR bilaterally; normal gait.

ASSESSMENT:
1) Acute mechanical low back strain without radiculopathy.

PLAN:
- Naproxen 500 mg PO BID with food x 7–10 days; add acetaminophen PRN.
- Heat, activity as tolerated; avoid bed rest; home exercises provided.
- PT referral for core strengthening and body mechanics.
- No imaging unless persistent (>6 weeks) or new red flags.
- Return precautions for neurologic deficits or intractable pain; follow-up in 2–3 weeks.
"""
    },
    {
        "input": "Thirty-year-old woman with a history of eczema has a two-week flare in the elbows and behind the knees—dry, very itchy patches. She's using lotion but no steroid recently. No signs of infection. I'll restart a medium-potency steroid ointment twice daily for two weeks, heavy emollients, and antihistamine at night. We discussed trigger avoidance and short, lukewarm showers.",
        "output": """
SUBJECTIVE:
30-year-old female with atopic dermatitis flare x 2 weeks in antecubital and popliteal fossae. Pruritus worse at night. No fever, drainage, or new products. Uses fragrance-free lotion intermittently.

OBJECTIVE:
Vitals stable. Skin: erythematous, lichenified plaques with excoriations in flexural areas; no crusting, no purulence; no cellulitis. No lymphadenopathy.

ASSESSMENT:
1) Atopic dermatitis flare without secondary infection.

PLAN:
- Triamcinolone 0.1% ointment BID to affected areas x 2 weeks, then weekend maintenance PRN; avoid face/groin.
- Liberal emollients (ointment-based) at least BID; gentle skin care; short lukewarm showers.
- Cetirizine 10 mg PO daily; optional hydroxyzine 10–25 mg PO HS PRN pruritus.
- Discussed trigger avoidance and fingertip-unit dosing.
- Follow-up in 4 weeks or sooner if signs of infection.
"""
    },
    {
        "input": "She's a 28-year-old, first pregnancy, about 10 weeks by last menstrual period. Nausea without vomiting, no bleeding or cramping. Vitals are normal, uterus is appropriate size. We'll get standard prenatal labs, schedule a dating ultrasound, start prenatal vitamins, and treat nausea with doxylamine-pyridoxine. Discussed vaccinations and lifestyle recommendations.",
        "output": """
SUBJECTIVE:
28-year-old G1P0 at ~10 weeks by LMP for initial prenatal visit. Nausea without emesis; denies vaginal bleeding, leakage of fluid, pelvic pain, dysuria. No prior pregnancies or STIs. No tobacco/alcohol/drugs. Taking no medications.

OBJECTIVE:
Vitals: BP 112/70, HR 78, BMI 24. Abdomen: soft, nontender. Pelvic: consistent with ~10 weeks; no adnexal masses. FHR pending ultrasound at this GA.

ASSESSMENT:
1) Intrauterine pregnancy, ~10 weeks, low risk.
2) Nausea of pregnancy.

PLAN:
- Prenatal labs: CBC, type & screen, rubella/varicella IgG, HIV, HBsAg, HCV Ab, RPR, urine culture, GC/CT NAAT.
- Dating ultrasound and NIPT per patient preference; review carrier screening options.
- Start prenatal vitamin with ≥400 mcg folic acid daily.
- Doxylamine 12.5 mg + pyridoxine 25 mg PO HS; can add AM/PM dosing PRN.
- Counsel on nutrition, exercise, avoid teratogens and certain foods; recommend influenza vaccine (seasonal) and COVID vaccination if not up to date.
- Follow-up in 4 weeks.
"""
    },
    {
        "input": "Seventy-two-year-old man with heart failure with reduced EF, baseline furosemide 40 daily, now with three pounds of weight gain over a week, more ankle swelling, and mild exertional dyspnea. No chest pain, no orthopnea beyond one extra pillow, no fevers. On exam he's got mild crackles at the bases and 1+ edema. Vitals are stable. I'm going to bump his furosemide to 40 twice daily for a few days, check labs, reinforce sodium restriction and daily weights, and follow up in a week.",
        "output": """
SUBJECTIVE:
72-year-old male with HFrEF (EF 30%) presents with 1 week of increased dyspnea on exertion, +3 lb weight gain, ankle edema. Denies chest pain, syncope, fever, cough, PND; uses one extra pillow. Meds: furosemide 40 mg daily, metoprolol succinate 50 mg, lisinopril 10 mg, spironolactone 25 mg, atorvastatin 40 mg. Adherence: good; dietary indiscretion over weekend.

OBJECTIVE:
Vitals: BP 118/72, HR 74, RR 18, SpO2 96% RA. Lungs: bibasilar crackles. Cardiac: regular, no new murmurs. JVP mildly elevated. Extremities: 1+ pitting edema to shins. No focal neuro deficits.

ASSESSMENT:
1) Mild volume-overloaded HFrEF exacerbation, hemodynamically stable.

PLAN:
- Increase furosemide to 40 mg PO BID x 3–5 days; reassess response.
- BMP in 3–5 days to monitor electrolytes/renal function; consider BNP if symptoms persist.
- Reinforce 2 g sodium diet, 2 L fluid restriction, daily weights; call if weight ↑ >2 lb/day or >5 lb/week.
- Review GDMT; continue ACEi/BB/MRA; consider SGLT2 at next visit.
- Follow-up in 1 week or sooner for worsening dyspnea, orthopnea, or O2 sat <92%.
"""
    },
    {
        "input": "Fifty-year-old man with diabetes has a red, warm area on the left shin after a scratch a few days ago. It's tender, about 4 by 6 centimeters, no fluctuance, no drainage, no fevers. Vitals are okay. I think this is uncomplicated cellulitis without an abscess. I'll start cephalexin, mark the borders, and have him come back if it spreads or if he gets systemic symptoms.",
        "output": """
SUBJECTIVE:
50-year-old male with T2DM presents with 3–4 days of left shin redness, warmth, and tenderness after minor trauma. Denies fever, chills, streaking, purulence. No MRSA history. Allergies: none known.

OBJECTIVE:
Vitals: afebrile, stable. Skin: 4×6 cm erythematous, warm, tender plaque on anterior shin; indistinct borders; no fluctuance, no drainage, no crepitus. Neurovascular intact. No lymphangitic streaking.

ASSESSMENT:
1) Nonpurulent cellulitis of left lower extremity, uncomplicated.

PLAN:
- Cephalexin 500 mg PO QID x 7 days.
- Demarcate margins; elevate limb; wound care instructions.
- Return if expanding erythema, fever, purulence, or systemic symptoms; consider MRSA coverage if failure.
- Tdap status reviewed; update if >10 years.
- Follow-up in 48–72 hours to reassess.
"""
    },
    {
        "input": "Forty-four-year-old with migraines says she's getting about two headaches a week now, throbbing, unilateral, with nausea and light sensitivity. Sumatriptan helps but she needs it often. Neuro exam is normal. We discussed prevention—she's open to starting propranolol—plus avoiding triggers, keeping a headache diary, and limiting triptan use to avoid rebound.",
        "output": """
SUBJECTIVE:
44-year-old female with episodic migraine without aura, frequency ~8/month. Triggers: stress, sleep deprivation. Acute treatment: sumatriptan 50 mg with relief; uses 2–3 doses/week. Denies focal neuro symptoms, "worst headache," or new pattern.

OBJECTIVE:
Vitals stable. Neuro: CN II–XII intact, strength 5/5, sensation intact, normal gait, no meningeal signs.

ASSESSMENT:
1) Episodic migraine, suboptimally controlled; candidate for preventive therapy.

PLAN:
- Start propranolol LA 60 mg PO daily; titrate based on response and BP/HR.
- Continue sumatriptan 50 mg PO at onset; may repeat once in 2 hours (max 200 mg/day); limit acute meds to ≤10 days/month.
- Headache diary; sleep hygiene; hydration; identify triggers; magnesium 400 mg daily may be considered.
- Follow-up in 6–8 weeks to assess frequency and tolerability.
"""
    },
    {
        "input": "Sixty-five-year-old with COPD comes in for a cough and more shortness of breath over five days, more sputum that's yellow. He's using his rescue inhaler more. O2 sat is 93% on room air, mild wheeze, no distress. I'll treat this as a mild exacerbation with a short steroid course, add doxycycline given sputum change, and step up his maintenance inhaler to a LAMA/LABA.",
        "output": """
SUBJECTIVE:
65-year-old male with moderate COPD (GOLD 2) presents with 5 days of increased dyspnea, cough, and sputum volume/color change. Using albuterol more frequently. Denies fever, chest pain, leg swelling.

OBJECTIVE:
Vitals: BP 132/78, HR 88, RR 20, Temp 37.2°C, SpO2 93% RA. Lungs: diffuse expiratory wheezes; no accessory muscle use. No peripheral edema. Prior spirometry FEV1 65% predicted.

ASSESSMENT:
1) Mild COPD exacerbation (increased dyspnea, sputum volume, and purulence).

PLAN:
- Prednisone 40 mg PO daily x 5 days.
- Doxycycline 100 mg PO BID x 5 days.
- Start LAMA/LABA inhaler daily; continue albuterol HFA PRN.
- Spacer/nebulizer technique review; smoking cessation counseling if applicable.
- Return/ED for worsening dyspnea, hypoxia, or fever; follow-up in 1–2 weeks.
"""
    },
    {
        "input": "Fifty-two-year-old woman with hypothyroidism on levothyroxine 100 micrograms says she's more tired and gaining weight slowly. No heat or cold intolerance changes otherwise. Exam is pretty benign. We'll check a TSH and adjust her dose if needed, review how to take the medication on an empty stomach, and plan a recheck in six weeks if we change the dose.",
        "output": """
SUBJECTIVE:
52-year-old female with primary hypothyroidism on levothyroxine 100 mcg daily presents with fatigue and mild weight gain over 2–3 months. Takes medication inconsistently with breakfast. Denies constipation, hair loss, depression beyond baseline.

OBJECTIVE:
Vitals: BP 118/76, HR 62, BMI 29. Thyroid: no goiter, nontender. Skin/hair normal. Reflexes normal.

ASSESSMENT:
1) Hypothyroidism—possible under-replacement vs adherence/absorption issue.

PLAN:
- Check TSH and free T4 today.
- Counsel to take levothyroxine on empty stomach, 30–60 minutes before breakfast, separate from calcium/iron by ≥4 hours.
- If dose adjusted, repeat TSH in 6–8 weeks.
- Follow-up upon lab results to titrate dosing.
"""
    },
    {
        "input": "Seventeen-year-old soccer player rolled his right ankle yesterday. Lateral swelling and pain with weight bearing. No tenderness over the base of the fifth metatarsal, mild tenderness over the ATFL. Anterior drawer is a little lax compared to the other side but no high-ankle signs. We'll treat as a grade II lateral ankle sprain with RICE, a lace-up brace, NSAIDs, and early PT.",
        "output": """
SUBJECTIVE:
17-year-old male with right ankle inversion injury yesterday during soccer. Pain lateral ankle, difficulty weight bearing initially. No numbness, no proximal fibular pain.

OBJECTIVE:
Vitals stable. Right ankle: swelling/ecchymosis laterally; tenderness over ATFL; no bony tenderness at malleolar tips or base of 5th metatarsal; anterior drawer mildly increased laxity; squeeze test negative. Neurovascular intact. Ottawa ankle rules: no imaging indicated.

ASSESSMENT:
1) Grade II lateral ankle sprain (ATFL).

PLAN:
- RICE: rest, ice 15–20 min q2–3h, compression wrap, elevation.
- Lace-up brace; weight bear as tolerated with crutches initially.
- Ibuprofen 400–600 mg PO q6–8h PRN pain with food (max daily dose respected).
- PT referral for proprioception and strengthening; home rehab exercises provided.
- Return in 2 weeks; sooner for worsening pain or inability to bear weight.
"""
    },
    {
        "input": "Sixty-year-old man with GERD has breakthrough heartburn three nights a week despite omeprazole in the morning. He drinks coffee late and eats late dinners. No alarm features. Exam is unremarkable. I'll switch him to pantoprazole 40 mg twice daily for 8 weeks, emphasize lifestyle changes, and consider H. pylori testing if not improved.",
        "output": """
SUBJECTIVE:
60-year-old male with GERD on omeprazole 20 mg AM presents with nocturnal symptoms 3x/week. Denies dysphagia, odynophagia, GI bleeding, weight loss, or anemia. Coffee late afternoon; dinner late; alcohol 1–2/night.

OBJECTIVE:
Vitals stable. Abdomen: soft, nontender. No anemia signs.

ASSESSMENT:
1) GERD with nocturnal breakthrough symptoms; no alarm features.

PLAN:
- Switch to pantoprazole 40 mg PO BID x 8 weeks, then step down if controlled.
- Lifestyle: elevate head of bed, avoid late meals, caffeine/alcohol reduction, weight loss.
- If persistent symptoms: test-and-treat for H. pylori and consider GI referral.
- Follow-up in 6–8 weeks.
"""
    }
]
