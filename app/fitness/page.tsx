'use client';

import { useState } from 'react';
import MyHeder from '../components/header';
import MyFooter from '../components/footer';
import { Activity, Heart, Gauge, Timer, ChevronDown, Globe, Scale, Flame, Dumbbell, Percent, Utensils, Droplets, Wind, Target } from 'lucide-react';

type Gender = 'male' | 'female';
type Lang = 'en' | 'de' | 'la';

// ─── Translations ───────────────────────────────────────────────────────────

const t: Record<string, Record<Lang, string>> = {
  title:            { en: 'Fitness & Sport Calculator', de: 'Fitness & Sport Rechner', la: 'Calculator Corporis & Ludi' },
  subtitle:         { en: 'Your complete fitness toolkit — 12 calculators in one place', de: 'Dein komplettes Fitness-Toolkit — 12 Rechner an einem Ort', la: 'Instrumentarium completum — XII calculatores in uno loco' },
  personalData:     { en: 'Personal Data', de: 'Persönliche Daten', la: 'Data Personalia' },
  gender:           { en: 'Gender', de: 'Geschlecht', la: 'Sexus' },
  male:             { en: 'Male', de: 'Männlich', la: 'Masculus' },
  female:           { en: 'Female', de: 'Weiblich', la: 'Femina' },
  age:              { en: 'Age', de: 'Alter', la: 'Aetas' },
  weightKg:         { en: 'Weight (kg)', de: 'Gewicht (kg)', la: 'Pondus (kg)' },
  heightCm:         { en: 'Height (cm)', de: 'Größe (cm)', la: 'Statura (cm)' },
  // Running Pace
  paceTitle:        { en: 'Running Pace Calculator für Hannes Prohaska', de: 'Lauftempo-Rechner für Hannes Prohaska', la: 'Calculator Cursus pro Hannes Prohaska' },
  paceSubtitle:     { en: 'Calculate your pace per kilometer', de: 'Berechne dein Tempo pro Kilometer', la: 'Computa tempus per chiliometrum' },
  distanceKm:       { en: 'Distance (km)', de: 'Distanz (km)', la: 'Distantia (km)' },
  targetTime:       { en: 'Target time', de: 'Zielzeit', la: 'Tempus destinatum' },
  pace:             { en: 'Pace', de: 'Tempo', la: 'Gradus' },
  speed:            { en: 'Speed', de: 'Geschwindigkeit', la: 'Velocitas' },
  paceEmpty:        { en: 'Enter distance and target time to calculate your pace.', de: 'Distanz und Zielzeit eingeben, um das Tempo zu berechnen.', la: 'Insere distantiam et tempus ad computandum.' },
  // BMR
  bmrTitle:         { en: 'Basal Metabolic Rate', de: 'Grundumsatz (BMR)', la: 'Metabolismus Basalis' },
  bmrSubtitle:      { en: 'Calculate your daily caloric baseline', de: 'Berechne deinen täglichen Kaloriengrundumsatz', la: 'Computa consumptionem caloricam diariam' },
  formula:          { en: 'Formula', de: 'Formel', la: 'Formula' },
  activityLevel:    { en: 'Activity Level (optional)', de: 'Aktivitätslevel (optional)', la: 'Gradus Activitatis (optio)' },
  selectActivity:   { en: '-- Select activity level --', de: '-- Aktivitätslevel wählen --', la: '-- Elige gradum --' },
  bmrEmpty:         { en: 'Enter age, weight and height above to calculate.', de: 'Alter, Gewicht und Größe oben eingeben.', la: 'Insere aetatem, pondus et staturam supra.' },
  // Heart Rate
  hrTitle:          { en: 'Heart Rate Analysis', de: 'Herzfrequenz-Analyse', la: 'Analysis Pulsus Cordis' },
  hrSubtitle:       { en: 'Estimated resting heart rate & training zones (Karvonen)', de: 'Geschätzter Ruhepuls & Trainingszonen (Karvonen)', la: 'Pulsus quiescens aestimatus & zonae exercitii (Karvonen)' },
  hrEstimated:      { en: 'Estimated resting heart rate based on your data', de: 'Geschätzter Ruhepuls basierend auf deinen Daten', la: 'Pulsus quiescens aestimatus ex datis tuis' },
  hrEmpty:          { en: 'Enter age, weight and height above to estimate your heart rate.', de: 'Alter, Gewicht und Größe oben eingeben, um den Ruhepuls zu schätzen.', la: 'Insere aetatem, pondus et staturam ad aestimandum pulsum.' },
  restingHR:        { en: 'Resting HR', de: 'Ruhepuls', la: 'Pulsus Quiesc.' },
  avgHR:            { en: 'Avg HR', de: 'Durchschn.', la: 'Pulsus Med.' },
  maxHR:            { en: 'Max HR', de: 'Maximalpuls', la: 'Pulsus Max.' },
  trainingZones:    { en: 'Training Zones (Karvonen)', de: 'Trainingszonen (Karvonen)', la: 'Zonae Exercitii (Karvonen)' },
  zoneRecovery:     { en: 'Recovery', de: 'Erholung', la: 'Recuperatio' },
  zoneFatBurn:      { en: 'Fat Burn', de: 'Fettverbr.', la: 'Adeps Comb.' },
  zoneAerobic:      { en: 'Aerobic', de: 'Aerob', la: 'Aerobicus' },
  zoneAnaerobic:    { en: 'Anaerobic', de: 'Anaerob', la: 'Anaerobicus' },
  zoneMaximum:      { en: 'Maximum', de: 'Maximum', la: 'Maximum' },
  // Blood Pressure
  bpTitle:          { en: 'Blood Pressure References', de: 'Blutdruck-Referenzwerte', la: 'Valores Pressionis Sanguinis' },
  bpSubtitle:       { en: 'Typical values by age, gender & time of day (mmHg)', de: 'Typische Werte nach Alter, Geschlecht & Tageszeit (mmHg)', la: 'Valores typici secundum aetatem, sexum & tempus diei (mmHg)' },
  timeOfDay:        { en: 'Time of Day', de: 'Tageszeit', la: 'Hora Diei' },
  systolic:         { en: 'Systolic', de: 'Systolisch', la: 'Systolicus' },
  diastolic:        { en: 'Diastolic', de: 'Diastolisch', la: 'Diastolicus' },
  morning:          { en: 'Morning', de: 'Morgens', la: 'Mane' },
  daytime:          { en: 'Daytime', de: 'Tagsüber', la: 'Interdiu' },
  evening:          { en: 'Evening', de: 'Abends', la: 'Vespere' },
  bpEmpty:          { en: 'Enter your age above to see reference values.', de: 'Alter oben eingeben, um Referenzwerte zu sehen.', la: 'Insere aetatem supra ad videndum valores.' },
  // BMI
  bmiTitle:         { en: 'Body Mass Index (BMI)', de: 'Body Mass Index (BMI)', la: 'Index Massae Corporis (BMI)' },
  bmiSubtitle:      { en: 'Weight classification based on height and weight', de: 'Gewichtsklassifikation basierend auf Größe und Gewicht', la: 'Classificatio ponderis ex statura et pondere' },
  bmiUnderweight:   { en: 'Underweight', de: 'Untergewicht', la: 'Infra pondus' },
  bmiNormal:        { en: 'Normal', de: 'Normalgewicht', la: 'Pondus normale' },
  bmiOverweight:    { en: 'Overweight', de: 'Übergewicht', la: 'Supra pondus' },
  bmiObese1:        { en: 'Obese I', de: 'Adipositas I', la: 'Obesitas I' },
  bmiObese2:        { en: 'Obese II', de: 'Adipositas II', la: 'Obesitas II' },
  bmiObese3:        { en: 'Obese III', de: 'Adipositas III', la: 'Obesitas III' },
  // Calories Burned
  calTitle:         { en: 'Calories Burned', de: 'Kalorienverbrauch', la: 'Caloriae Consumptae' },
  calSubtitle:      { en: 'Estimate calories burned during exercise', de: 'Geschätzter Kalorienverbrauch bei Sport', la: 'Caloriae aestimatae in exercitio' },
  calActivity:      { en: 'Activity', de: 'Aktivität', la: 'Activitas' },
  calDuration:      { en: 'Duration (min)', de: 'Dauer (min)', la: 'Duratio (min)' },
  calResult:        { en: 'Calories burned', de: 'Verbrannte Kalorien', la: 'Caloriae combustae' },
  calEmpty:         { en: 'Select an activity and enter duration.', de: 'Aktivität wählen und Dauer eingeben.', la: 'Elige activitatem et insere durationem.' },
  // 1RM
  ormTitle:         { en: 'One Rep Max (1RM)', de: 'Maximalwiederholung (1RM)', la: 'Maximum Unius Repetitionis' },
  ormSubtitle:      { en: 'Estimate your maximum single lift', de: 'Schätze dein maximales Einmalgewicht', la: 'Aestima maximum pondus singulare' },
  ormWeight:        { en: 'Weight lifted (kg)', de: 'Gehobenes Gewicht (kg)', la: 'Pondus elevatum (kg)' },
  ormReps:          { en: 'Repetitions', de: 'Wiederholungen', la: 'Repetitiones' },
  ormEmpty:         { en: 'Enter weight and reps to estimate 1RM.', de: 'Gewicht und Wiederholungen eingeben.', la: 'Insere pondus et repetitiones.' },
  // Body Fat
  bfTitle:          { en: 'Body Fat Percentage', de: 'Körperfettanteil', la: 'Adeps Corporis (%)' },
  bfSubtitle:       { en: 'Navy method estimation from body measurements', de: 'Schätzung nach Navy-Methode aus Körpermaßen', la: 'Aestimatio methodo navali ex mensuris corporis' },
  bfNeck:           { en: 'Neck (cm)', de: 'Hals (cm)', la: 'Collum (cm)' },
  bfWaist:          { en: 'Waist (cm)', de: 'Bauch (cm)', la: 'Abdomen (cm)' },
  bfHip:            { en: 'Hip (cm)', de: 'Hüfte (cm)', la: 'Coxa (cm)' },
  bfEssential:      { en: 'Essential', de: 'Lebensnotw.', la: 'Essentialis' },
  bfAthletes:       { en: 'Athletes', de: 'Athleten', la: 'Athletae' },
  bfFitness:        { en: 'Fitness', de: 'Fitness', la: 'Forma' },
  bfAverage:        { en: 'Average', de: 'Durchschnitt', la: 'Mediocris' },
  bfAbove:          { en: 'Above avg.', de: 'Über Durchs.', la: 'Supra med.' },
  bfEmpty:          { en: 'Enter neck and waist circumference (hip for women).', de: 'Hals- und Bauchumfang eingeben (Hüfte bei Frauen).', la: 'Insere circumferentiam colli et abdominis.' },
  // Macros
  macTitle:         { en: 'Macronutrients', de: 'Makronährstoffe', la: 'Macronutrimenta' },
  macSubtitle:      { en: 'Protein, carbs & fat split based on your goal', de: 'Protein-, Kohlenhydrat- & Fettverteilung nach Ziel', la: 'Distributio proteinorum, carborum & adipis' },
  macGoal:          { en: 'Goal', de: 'Ziel', la: 'Finis' },
  macLose:          { en: 'Lose weight', de: 'Abnehmen', la: 'Minuere' },
  macMaintain:      { en: 'Maintain', de: 'Halten', la: 'Conservare' },
  macGain:          { en: 'Build muscle', de: 'Aufbauen', la: 'Augere' },
  macProtein:       { en: 'Protein', de: 'Protein', la: 'Proteinum' },
  macCarbs:         { en: 'Carbs', de: 'Kohlenhydrate', la: 'Carbones' },
  macFat:           { en: 'Fat', de: 'Fett', la: 'Adeps' },
  macEmpty:         { en: 'Enter personal data and select activity level in BMR section first.', de: 'Erst persönliche Daten eingeben und Aktivitätslevel im BMR-Bereich wählen.', la: 'Primum data personalia et gradum activitatis insere.' },
  // Water
  watTitle:         { en: 'Water Intake', de: 'Wasserbedarf', la: 'Aquae Necessitas' },
  watSubtitle:      { en: 'Recommended daily water intake', de: 'Empfohlene tägliche Wasserzufuhr', la: 'Aqua diaria commendata' },
  watBase:          { en: 'Base intake', de: 'Grundbedarf', la: 'Necessitas basica' },
  watActive:        { en: 'With activity', de: 'Mit Aktivität', la: 'Cum activitate' },
  watGlasses:       { en: 'glasses (250ml)', de: 'Gläser (250ml)', la: 'pocula (250ml)' },
  watEmpty:         { en: 'Enter your weight above.', de: 'Gewicht oben eingeben.', la: 'Insere pondus supra.' },
  // VO2max
  vo2Title:         { en: 'VO2max Estimate', de: 'VO2max Schätzung', la: 'VO2max Aestimatio' },
  vo2Subtitle:      { en: 'Aerobic fitness level (Uth method)', de: 'Aerobe Fitness (Uth-Methode)', la: 'Forma aerobica (methodus Uth)' },
  vo2Excellent:     { en: 'Excellent', de: 'Hervorragend', la: 'Excellens' },
  vo2Good:          { en: 'Good', de: 'Gut', la: 'Bonus' },
  vo2Average:       { en: 'Average', de: 'Durchschnitt', la: 'Mediocris' },
  vo2BelowAvg:      { en: 'Below average', de: 'Unterdurchschn.', la: 'Infra med.' },
  vo2Poor:          { en: 'Poor', de: 'Schwach', la: 'Debilis' },
  vo2Empty:         { en: 'Enter age, weight and height above.', de: 'Alter, Gewicht und Größe oben eingeben.', la: 'Insere aetatem, pondus et staturam.' },
  // Ideal Weight
  iwTitle:          { en: 'Ideal Weight', de: 'Idealgewicht', la: 'Pondus Ideale' },
  iwSubtitle:       { en: 'According to Devine, Hamwi & Broca formulas', de: 'Nach Devine-, Hamwi- & Broca-Formel', la: 'Secundum formulas Devine, Hamwi & Broca' },
  iwRange:          { en: 'Healthy BMI range', de: 'Gesunder BMI-Bereich', la: 'Ambitus BMI sanus' },
  iwEmpty:          { en: 'Enter your height above.', de: 'Größe oben eingeben.', la: 'Insere staturam supra.' },
  // Feature Tooltips
  tipPace:          { en: 'Calculates your running pace (min/km) and speed (km/h) from distance and target time. Useful for race planning and training goals.', de: 'Berechnet dein Lauftempo (min/km) und Geschwindigkeit (km/h) aus Distanz und Zielzeit. Nützlich für Wettkampfplanung und Trainingsziele.', la: 'Computat gradum cursus (min/km) et velocitatem (km/h) ex distantia et tempore. Utile ad certamina et exercitia.' },
  tipBmi:           { en: 'Body Mass Index — a simple ratio of weight to height squared. Gives a quick classification of your weight status (underweight to obese).', de: 'Body Mass Index — einfaches Verhältnis von Gewicht zu Größe². Gibt eine schnelle Einordnung deines Gewichtsstatus (Unter- bis Übergewicht).', la: 'Index Massae Corporis — ratio simplex ponderis ad staturam. Classificatio celera status ponderis tui.' },
  tipBmr:           { en: 'Basal Metabolic Rate — the calories your body burns at complete rest just to stay alive (breathing, heartbeat, organs). Combined with your activity level, it gives your Total Daily Energy Expenditure (TDEE).', de: 'Grundumsatz — die Kalorien, die dein Körper in völliger Ruhe verbrennt, um am Leben zu bleiben (Atmen, Herzschlag, Organe). Mit dem Aktivitätslevel ergibt sich der Gesamtenergiebedarf (TDEE).', la: 'Metabolismus Basalis — caloriae quas corpus in quiete consumit ad vivendum (respiratio, pulsus cordis). Cum gradu activitatis dat consumptionem totalem diariam.' },
  tipHr:            { en: 'Estimates your resting heart rate from personal data and calculates 5 training zones using the Karvonen method. Helps you train in the right intensity zone.', de: 'Schätzt deinen Ruhepuls aus persönlichen Daten und berechnet 5 Trainingszonen nach der Karvonen-Methode. Hilft dir, in der richtigen Intensitätszone zu trainieren.', la: 'Aestimat pulsum quiescentem ex datis personalibus et computat V zonas exercitii methodo Karvonen. Adiuvat ad exercitandum in zona recta.' },
  tipCal:           { en: 'Estimates how many calories you burn during a specific activity based on MET values (Metabolic Equivalent of Task), your weight, and duration.', de: 'Schätzt wie viele Kalorien du bei einer bestimmten Aktivität verbrennst, basierend auf MET-Werten (Metabolisches Äquivalent), Gewicht und Dauer.', la: 'Aestimat quot caloriae in activitate consumantur, ex valoribus MET, pondere et duratione.' },
  tipOrm:           { en: 'Estimates your theoretical one-repetition maximum (the heaviest weight you could lift once) using the Epley and Brzycki formulas. Enter the weight you lifted and how many reps you did.', de: 'Schätzt dein theoretisches Einwiederholungsmaximum (das schwerste Gewicht für eine Wiederholung) mit Epley- und Brzycki-Formel. Gib das gehobene Gewicht und die Wiederholungen ein.', la: 'Aestimat maximum theoreticum unius repetitionis ex formulis Epley et Brzycki. Insere pondus elevatum et repetitiones.' },
  tipBf:            { en: 'Estimates your body fat percentage using the U.S. Navy method based on neck, waist, and hip circumference measurements. No special equipment needed.', de: 'Schätzt deinen Körperfettanteil nach der U.S. Navy-Methode anhand von Hals-, Bauch- und Hüftumfang. Kein spezielles Equipment nötig.', la: 'Aestimat partem adipis corporis methodo navali ex circumferentia colli, abdominis et coxae. Nullum instrumentum speciale necessarium.' },
  tipMac:           { en: 'Splits your daily calories into protein, carbohydrates, and fat based on your TDEE and fitness goal (lose weight, maintain, or build muscle).', de: 'Verteilt deine täglichen Kalorien auf Protein, Kohlenhydrate und Fett basierend auf deinem TDEE und Fitnessziel (Abnehmen, Halten oder Aufbauen).', la: 'Distribuit caloriae diarias in proteinum, carbones et adipem secundum TDEE et finem (minuere, conservare, augere).' },
  tipWat:           { en: 'Calculates your recommended daily water intake based on body weight (approx. 33 ml per kg). Adjusts for activity level if selected.', de: 'Berechnet deinen empfohlenen täglichen Wasserbedarf basierend auf dem Körpergewicht (ca. 33 ml pro kg). Passt sich an das Aktivitätslevel an.', la: 'Computat aquam diariam commendatam ex pondere corporis (ca. 33 ml per kg). Adaptatur ad gradum activitatis.' },
  tipVo2:           { en: 'Estimates your VO2max (maximum oxygen uptake) using the Uth method based on your max and resting heart rate. A key indicator of aerobic/cardiovascular fitness.', de: 'Schätzt deinen VO2max (maximale Sauerstoffaufnahme) nach der Uth-Methode basierend auf Maximal- und Ruhepuls. Ein wichtiger Indikator für aerobe/kardiovaskuläre Fitness.', la: 'Aestimat VO2max (receptio oxygenii maxima) methodo Uth ex pulsu maximo et quiescente. Indicator praecipuus formae aerobicae.' },
  tipIw:            { en: 'Shows your ideal weight range according to three established formulas (Devine, Hamwi, Broca) plus the healthy BMI weight range (18.5–24.9).', de: 'Zeigt deinen Idealgewichtsbereich nach drei etablierten Formeln (Devine, Hamwi, Broca) plus den gesunden BMI-Gewichtsbereich (18,5–24,9).', la: 'Ostendit ambitum ponderis idealis secundum tres formulas (Devine, Hamwi, Broca) et ambitum BMI sanum (18.5–24.9).' },
  tipBp:            { en: 'Shows typical blood pressure reference values by time of day, adjusted for your age and gender. Values are approximate guidelines, not a diagnosis.', de: 'Zeigt typische Blutdruck-Referenzwerte nach Tageszeit, angepasst an Alter und Geschlecht. Werte sind Richtwerte, keine Diagnose.', la: 'Ostendit valores typicos pressionis sanguinis secundum horam diei, adaptatos ad aetatem et sexum. Valores sunt approximationes, non diagnosis.' },
  // Disclaimer
  disclaimer:       { en: 'All values are approximations for informational purposes only and do not constitute medical advice. Consult a qualified healthcare professional for personalized health assessments and recommendations.', de: 'Alle Werte sind Näherungswerte und dienen nur der Information. Sie ersetzen keine ärztliche Beratung. Konsultiere einen Arzt für persönliche Gesundheitsbewertungen.', la: 'Omnes valores sunt approximationes ad informationem solum. Medicum consule pro consiliis personalibus.' },
  // PAL labels
  palSedentary:     { en: 'Sedentary (office work, little exercise)', de: 'Sitzend (Büroarbeit, wenig Bewegung)', la: 'Sedentarius (opus officii)' },
  palLight:         { en: 'Lightly active (light exercise 1-3 days/week)', de: 'Leicht aktiv (leichter Sport 1-3 Tage/Woche)', la: 'Leviter activus (1-3 dies/hebd.)' },
  palModerate:      { en: 'Moderately active (moderate exercise 3-5 days/week)', de: 'Mäßig aktiv (mäßiger Sport 3-5 Tage/Woche)', la: 'Moderate activus (3-5 dies/hebd.)' },
  palVery:          { en: 'Very active (hard exercise 6-7 days/week)', de: 'Sehr aktiv (intensiver Sport 6-7 Tage/Woche)', la: 'Valde activus (6-7 dies/hebd.)' },
  palExtreme:       { en: 'Extremely active (athlete, physical job)', de: 'Extrem aktiv (Athlet, körperliche Arbeit)', la: 'Maxime activus (athleta, labor corporis)' },
  // HR categories
  catAthlete:       { en: 'Athlete', de: 'Athlet', la: 'Athleta' },
  catGood:          { en: 'Good', de: 'Gut', la: 'Bonus' },
  catNormal:        { en: 'Normal', de: 'Normal', la: 'Normalis' },
  catElevated:      { en: 'Elevated', de: 'Erhöht', la: 'Elevatus' },
  catHigh:          { en: 'High', de: 'Hoch', la: 'Altus' },
  catAthleteDesc:   { en: 'Excellent cardiovascular fitness, typical for trained endurance athletes.', de: 'Hervorragende kardiovaskuläre Fitness, typisch für trainierte Ausdauersportler.', la: 'Excellens valetudo cardiovascularis, typica pro athletis.' },
  catGoodDesc:      { en: 'Above average fitness level. Your heart works efficiently at rest.', de: 'Überdurchschnittliche Fitness. Dein Herz arbeitet in Ruhe effizient.', la: 'Supra mediocrem. Cor tuum efficienter quiescit.' },
  catNormalDesc:    { en: 'Within the normal range for a healthy adult at rest.', de: 'Im normalen Bereich für einen gesunden Erwachsenen in Ruhe.', la: 'Intra ambitum normalem pro adulto sano.' },
  catElevatedDesc:  { en: 'Slightly elevated. Consider regular aerobic exercise to improve cardiovascular health.', de: 'Leicht erhöht. Regelmäßiger Ausdauersport kann die Herzgesundheit verbessern.', la: 'Leviter elevatus. Considera exercitium aerobicum regulare.' },
  catHighDesc:      { en: 'Above normal range. Consult a physician if persistently elevated.', de: 'Über dem Normalbereich. Konsultiere einen Arzt bei dauerhaft erhöhtem Puls.', la: 'Supra ambitum normalem. Consule medicum si persistit.' },
};

// Activity MET values
const activities: Record<Lang, string>[] = [
  { en: 'Walking (normal)', de: 'Gehen (normal)', la: 'Ambulatio' },
  { en: 'Walking (brisk)', de: 'Schnelles Gehen', la: 'Ambulatio celera' },
  { en: 'Running (8 km/h)', de: 'Laufen (8 km/h)', la: 'Cursus (8 km/h)' },
  { en: 'Running (10 km/h)', de: 'Laufen (10 km/h)', la: 'Cursus (10 km/h)' },
  { en: 'Running (12 km/h)', de: 'Laufen (12 km/h)', la: 'Cursus (12 km/h)' },
  { en: 'Cycling (leisure)', de: 'Radfahren (gemütlich)', la: 'Cyclismus (otium)' },
  { en: 'Cycling (moderate)', de: 'Radfahren (moderat)', la: 'Cyclismus (moderatus)' },
  { en: 'Swimming (moderate)', de: 'Schwimmen (moderat)', la: 'Natatio (moderata)' },
  { en: 'Swimming (vigorous)', de: 'Schwimmen (intensiv)', la: 'Natatio (intensa)' },
  { en: 'Yoga', de: 'Yoga', la: 'Yoga' },
  { en: 'Weight Training', de: 'Krafttraining', la: 'Exercitium ponderum' },
  { en: 'HIIT', de: 'HIIT', la: 'HIIT' },
  { en: 'Dancing', de: 'Tanzen', la: 'Saltatio' },
  { en: 'Hiking', de: 'Wandern', la: 'Iter montanum' },
  { en: 'Jump Rope', de: 'Seilspringen', la: 'Saltus funis' },
  { en: 'Rowing', de: 'Rudern', la: 'Remigatio' },
];
const activityMETs = [3.5, 5.0, 8.0, 10.0, 12.5, 4.0, 8.0, 6.0, 10.0, 3.0, 6.0, 12.0, 5.5, 6.5, 12.0, 7.0];

const palFactorData = [
  { value: 1.2, key: 'palSedentary' as const },
  { value: 1.375, key: 'palLight' as const },
  { value: 1.55, key: 'palModerate' as const },
  { value: 1.725, key: 'palVery' as const },
  { value: 1.9, key: 'palExtreme' as const },
];

const inputClass = "w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500";

// ─── Helper Functions ────────────────────────────────────────────────────────

function getHeartRateCategoryKey(bpm: number) {
  if (bpm < 50) return { labelKey: 'catAthlete', descKey: 'catAthleteDesc', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' };
  if (bpm <= 59) return { labelKey: 'catGood', descKey: 'catGoodDesc', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40' };
  if (bpm <= 80) return { labelKey: 'catNormal', descKey: 'catNormalDesc', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40' };
  if (bpm <= 90) return { labelKey: 'catElevated', descKey: 'catElevatedDesc', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40' };
  return { labelKey: 'catHigh', descKey: 'catHighDesc', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' };
}

function estimateRestingHR(age: number, gender: Gender, weightKg: number, heightCm: number): number {
  const bmi = weightKg / ((heightCm / 100) ** 2);
  const base = gender === 'male' ? 70 : 75;
  let ageFactor = 0;
  if (age < 20) ageFactor = 2;
  else if (age < 30) ageFactor = 0;
  else if (age < 40) ageFactor = -1;
  else if (age < 50) ageFactor = 0;
  else if (age < 60) ageFactor = 1;
  else ageFactor = 3;
  const bmiFactor = (bmi - 22) * 0.6;
  return Math.round(base + ageFactor + bmiFactor);
}

interface BPReference { periodKey: string; systolic: string; diastolic: string; }
function getBloodPressureReferences(age: number, gender: Gender): BPReference[] {
  if (age < 18) return [{ periodKey: 'morning', systolic: '100-110', diastolic: '60-70' }, { periodKey: 'daytime', systolic: '105-115', diastolic: '65-75' }, { periodKey: 'evening', systolic: '100-110', diastolic: '60-70' }];
  if (age <= 39) {
    if (gender === 'male') return [{ periodKey: 'morning', systolic: '110-120', diastolic: '70-80' }, { periodKey: 'daytime', systolic: '115-130', diastolic: '75-85' }, { periodKey: 'evening', systolic: '110-120', diastolic: '70-80' }];
    return [{ periodKey: 'morning', systolic: '105-115', diastolic: '65-75' }, { periodKey: 'daytime', systolic: '110-125', diastolic: '70-80' }, { periodKey: 'evening', systolic: '105-115', diastolic: '65-75' }];
  }
  if (age <= 59) {
    if (gender === 'male') return [{ periodKey: 'morning', systolic: '115-130', diastolic: '75-85' }, { periodKey: 'daytime', systolic: '120-135', diastolic: '80-90' }, { periodKey: 'evening', systolic: '115-125', diastolic: '75-85' }];
    return [{ periodKey: 'morning', systolic: '110-125', diastolic: '70-80' }, { periodKey: 'daytime', systolic: '115-130', diastolic: '75-85' }, { periodKey: 'evening', systolic: '110-120', diastolic: '70-80' }];
  }
  if (gender === 'male') return [{ periodKey: 'morning', systolic: '120-135', diastolic: '75-85' }, { periodKey: 'daytime', systolic: '125-140', diastolic: '80-90' }, { periodKey: 'evening', systolic: '120-130', diastolic: '75-85' }];
  return [{ periodKey: 'morning', systolic: '115-130', diastolic: '70-80' }, { periodKey: 'daytime', systolic: '120-135', diastolic: '75-85' }, { periodKey: 'evening', systolic: '115-125', diastolic: '70-80' }];
}

function getBMICategory(bmi: number, l: (k: string) => string) {
  if (bmi < 18.5) return { label: l('bmiUnderweight'), color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40' };
  if (bmi < 25) return { label: l('bmiNormal'), color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/40' };
  if (bmi < 30) return { label: l('bmiOverweight'), color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/40' };
  if (bmi < 35) return { label: l('bmiObese1'), color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/40' };
  if (bmi < 40) return { label: l('bmiObese2'), color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/40' };
  return { label: l('bmiObese3'), color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/40' };
}

function getBodyFatCategory(bf: number, gender: Gender, l: (k: string) => string) {
  const ranges = gender === 'male'
    ? [{ max: 6, key: 'bfEssential' }, { max: 14, key: 'bfAthletes' }, { max: 18, key: 'bfFitness' }, { max: 25, key: 'bfAverage' }]
    : [{ max: 14, key: 'bfEssential' }, { max: 21, key: 'bfAthletes' }, { max: 25, key: 'bfFitness' }, { max: 32, key: 'bfAverage' }];
  for (const r of ranges) if (bf < r.max) return l(r.key);
  return l('bfAbove');
}

function getVO2maxCategory(vo2: number, gender: Gender, l: (k: string) => string) {
  const thresholds = gender === 'male' ? [50, 43, 36, 30] : [45, 38, 31, 25];
  if (vo2 >= thresholds[0]) return { label: l('vo2Excellent'), color: 'text-green-500' };
  if (vo2 >= thresholds[1]) return { label: l('vo2Good'), color: 'text-blue-500' };
  if (vo2 >= thresholds[2]) return { label: l('vo2Average'), color: 'text-yellow-500' };
  if (vo2 >= thresholds[3]) return { label: l('vo2BelowAvg'), color: 'text-orange-500' };
  return { label: l('vo2Poor'), color: 'text-red-500' };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FitnessPage() {
  const [lang, setLang] = useState<Lang>('en');
  const l = (key: string) => t[key]?.[lang] ?? key;

  // Shared personal data
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // BMR
  const [bmrFormula, setBmrFormula] = useState<'mifflin' | 'harris'>('mifflin');
  const [palFactor, setPalFactor] = useState(0);

  // Running pace
  const [distance, setDistance] = useState('');
  const [timeHours, setTimeHours] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [timeSeconds, setTimeSeconds] = useState('');

  // Calories burned
  const [calActivity, setCalActivity] = useState(-1);
  const [calDuration, setCalDuration] = useState('');

  // 1RM
  const [ormWeight, setOrmWeight] = useState('');
  const [ormReps, setOrmReps] = useState('');

  // Body fat
  const [bfNeck, setBfNeck] = useState('');
  const [bfWaist, setBfWaist] = useState('');
  const [bfHip, setBfHip] = useState('');

  // Macros
  const [macGoal, setMacGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');

  // ─── Calculations ────────────────────────────────────────────────────────

  const ageNum = parseFloat(age);
  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);
  const hasPersonal = ageNum > 0 && weightNum > 0 && heightNum > 0;

  // BMI
  const bmi = (weightNum > 0 && heightNum > 0) ? weightNum / ((heightNum / 100) ** 2) : null;

  // BMR
  let bmr: number | null = null;
  if (hasPersonal) {
    if (bmrFormula === 'mifflin') {
      bmr = gender === 'male' ? 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5 : 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    } else {
      bmr = gender === 'male' ? 88.362 + 13.397 * weightNum + 4.799 * heightNum - 5.677 * ageNum : 447.593 + 9.247 * weightNum + 3.098 * heightNum - 4.330 * ageNum;
    }
  }
  const tdee = bmr && palFactor > 0 ? bmr * palFactor : null;

  // Heart rate
  const estimatedRHR = hasPersonal ? estimateRestingHR(ageNum, gender, weightNum, heightNum) : null;
  const hrCategory = estimatedRHR ? getHeartRateCategoryKey(estimatedRHR) : null;

  // Blood pressure
  const bpReferences = ageNum > 0 ? getBloodPressureReferences(ageNum, gender) : null;

  // Running pace
  const distanceNum = parseFloat(distance);
  const totalSeconds = (parseInt(timeHours) || 0) * 3600 + (parseInt(timeMinutes) || 0) * 60 + (parseInt(timeSeconds) || 0);
  let pace: { minutes: number; seconds: number } | null = null;
  if (distanceNum > 0 && totalSeconds > 0) {
    const paceSeconds = totalSeconds / distanceNum;
    pace = { minutes: Math.floor(paceSeconds / 60), seconds: Math.round(paceSeconds % 60) };
  }

  // Calories burned
  const calDurationNum = parseFloat(calDuration);
  const caloriesBurned = (calActivity >= 0 && calDurationNum > 0 && weightNum > 0)
    ? Math.round(activityMETs[calActivity] * weightNum * (calDurationNum / 60))
    : null;

  // 1RM
  const ormWeightNum = parseFloat(ormWeight);
  const ormRepsNum = parseInt(ormReps);
  const orm = (ormWeightNum > 0 && ormRepsNum > 1 && ormRepsNum <= 30) ? {
    epley: Math.round(ormWeightNum * (1 + ormRepsNum / 30)),
    brzycki: Math.round(ormWeightNum * (36 / (37 - ormRepsNum))),
  } : null;

  // Body fat (Navy method)
  const neckNum = parseFloat(bfNeck);
  const waistNum = parseFloat(bfWaist);
  const hipNum = parseFloat(bfHip);
  let bodyFat: number | null = null;
  if (heightNum > 0 && neckNum > 0 && waistNum > 0) {
    if (gender === 'male' && waistNum > neckNum) {
      bodyFat = 86.010 * Math.log10(waistNum - neckNum) - 70.041 * Math.log10(heightNum) + 36.76;
    } else if (gender === 'female' && hipNum > 0 && (waistNum + hipNum) > neckNum) {
      bodyFat = 163.205 * Math.log10(waistNum + hipNum - neckNum) - 97.684 * Math.log10(heightNum) - 78.387;
    }
  }

  // Macros
  const macroCalories = tdee ? (macGoal === 'lose' ? tdee - 500 : macGoal === 'gain' ? tdee + 300 : tdee) : null;
  const macros = macroCalories ? (() => {
    const proteinG = Math.round(weightNum * (macGoal === 'gain' ? 2.2 : macGoal === 'lose' ? 2.0 : 1.8));
    const fatG = Math.round((macroCalories * 0.28) / 9);
    const carbsG = Math.round((macroCalories - proteinG * 4 - fatG * 9) / 4);
    return { proteinG, fatG, carbsG: Math.max(carbsG, 0), total: macroCalories };
  })() : null;

  // Water intake
  const waterBase = weightNum > 0 ? (weightNum * 33) / 1000 : null;
  const waterActive = waterBase && palFactor > 0 ? waterBase + (palFactor - 1.2) * 0.5 : null;

  // VO2max (Uth method: 15.3 * maxHR / restingHR)
  const vo2max = (estimatedRHR && ageNum > 0) ? 15.3 * ((220 - ageNum) / estimatedRHR) : null;

  // Ideal Weight
  const idealWeight = heightNum > 0 ? (() => {
    const hInch = heightNum / 2.54;
    const over60 = Math.max(hInch - 60, 0);
    const devine = gender === 'male' ? 50 + 2.3 * over60 : 45.5 + 2.3 * over60;
    const hamwi = gender === 'male' ? 48.0 + 2.7 * over60 : 45.4 + 2.2 * over60;
    const broca = heightNum - 100;
    const bmiLow = 18.5 * ((heightNum / 100) ** 2);
    const bmiHigh = 24.9 * ((heightNum / 100) ** 2);
    return { devine: Math.round(devine * 10) / 10, hamwi: Math.round(hamwi * 10) / 10, broca: Math.round(broca * 10) / 10, bmiLow: Math.round(bmiLow * 10) / 10, bmiHigh: Math.round(bmiHigh * 10) / 10 };
  })() : null;

  // Zone names
  const zoneNames = [l('zoneRecovery'), l('zoneFatBurn'), l('zoneAerobic'), l('zoneAnaerobic'), l('zoneMaximum')];

  // ─── Reusable styles ──────────────────────────────────────────────────────
  const cyanInput = inputClass.replace(/focus:ring-green-500\/20 focus:border-green-500 dark:focus:ring-green-400\/20 dark:focus:border-green-400/g, 'focus:ring-cyan-500/20 focus:border-cyan-500 dark:focus:ring-cyan-400/20 dark:focus:border-cyan-400');
  const orangeInput = inputClass.replace(/focus:ring-green-500\/20 focus:border-green-500 dark:focus:ring-green-400\/20 dark:focus:border-green-400/g, 'focus:ring-orange-500/20 focus:border-orange-500 dark:focus:ring-orange-400/20 dark:focus:border-orange-400');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MyHeder />

      <style jsx>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.4s ease-out forwards; }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px -8px rgba(0,0,0,0.15); }
        :global(.dark) .card-hover:hover { box-shadow: 0 12px 40px -8px rgba(0,0,0,0.4); }
        .tooltip-trigger { position: relative; cursor: help; border-bottom: 1px dashed currentColor; }
        .tooltip-trigger .tooltip-content {
          visibility: hidden; opacity: 0; position: absolute; bottom: calc(100% + 8px); left: 50%;
          transform: translateX(-50%) translateY(4px); width: min(max(260px, 40vw), 380px);
          padding: 12px 16px; border-radius: 12px; font-size: 13px; font-weight: 400; line-height: 1.5;
          z-index: 50; pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
          background: #1e293b; color: #e2e8f0; box-shadow: 0 8px 24px -4px rgba(0,0,0,0.3);
        }
        :global(.dark) .tooltip-trigger .tooltip-content { background: #0f172a; border: 1px solid #334155; }
        .tooltip-trigger .tooltip-content::after {
          content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
          border: 6px solid transparent; border-top-color: #1e293b;
        }
        :global(.dark) .tooltip-trigger .tooltip-content::after { border-top-color: #0f172a; }
        .tooltip-trigger:hover .tooltip-content { visibility: visible; opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto; }
        @media (max-width: 640px) {
          .tooltip-trigger .tooltip-content { left: 0; transform: translateX(0) translateY(4px); width: calc(100vw - 80px); max-width: none; }
          .tooltip-trigger:hover .tooltip-content { transform: translateX(0) translateY(0); }
          .tooltip-trigger .tooltip-content::after { left: 20px; transform: none; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">

        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
            <Globe className="w-4 h-4 text-gray-400 ml-2" />
            {(['en', 'de', 'la'] as Lang[]).map((code) => (
              <button key={code} onClick={() => setLang(code)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  lang === code ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 mb-4">
            <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">{l('title')}</h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">{l('subtitle')}</p>
        </div>

        {/* ═══════════════════ Running Pace Calculator ═══════════════════ */}
        <div className="card-hover bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 mb-6 sm:mb-8 border border-cyan-100 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/25">
              <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="tooltip-trigger">{l('paceTitle')}<span className="tooltip-content">{l('tipPace')}</span></span>
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6 sm:ml-13">{l('paceSubtitle')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-6">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('distanceKm')} <span className="text-red-500">*</span></label>
              <input type="number" min="0.1" step="0.1" placeholder="e.g. 10" value={distance} onChange={(e) => setDistance(e.target.value)} className={cyanInput} />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('targetTime')} <span className="text-red-500">*</span></label>
              <div className="flex gap-2 sm:gap-3 items-center">
                {[{ val: timeHours, set: setTimeHours, label: 'h', pr: 'pr-7 sm:pr-9' }, { val: timeMinutes, set: setTimeMinutes, label: 'min', pr: 'pr-10 sm:pr-12', max: 59 }, { val: timeSeconds, set: setTimeSeconds, label: 'sec', pr: 'pr-10 sm:pr-12', max: 59 }].map((f, i) => (
                  <span key={f.label} className="contents">
                    {i > 0 && <span className="text-xl font-bold text-gray-400 dark:text-gray-500">:</span>}
                    <div className="flex-1 relative">
                      <input type="number" min="0" max={f.max} placeholder="0" value={f.val} onChange={(e) => f.set(e.target.value)} className={`${cyanInput} ${f.pr}`} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 dark:text-gray-500 pointer-events-none">{f.label}</span>
                    </div>
                  </span>
                ))}
              </div>
            </div>
          </div>
          {pace ? (
            <div className="animate-scale-in bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-cyan-200 dark:border-cyan-800/50 shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <span className="block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{l('pace')}</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-cyan-600 dark:text-cyan-400 tracking-tight">{pace.minutes}:{pace.seconds.toString().padStart(2, '0')}</span>
                  <span className="block mt-1 text-sm sm:text-base font-semibold text-cyan-500/70 dark:text-cyan-400/60">min/km</span>
                </div>
                <div className="text-center border-l border-gray-200 dark:border-gray-700 pl-4">
                  <span className="block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{l('speed')}</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">{(distanceNum / (totalSeconds / 3600)).toFixed(1)}</span>
                  <span className="block mt-1 text-sm sm:text-base font-semibold text-blue-500/70 dark:text-blue-400/60">km/h</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm sm:text-base text-gray-400 dark:text-gray-500 italic text-center py-4">{l('paceEmpty')}</div>
          )}
        </div>

        {/* ═══════════════════ Personal Data ═══════════════════ */}
        <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 mb-6 sm:mb-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-5 sm:mb-6 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-green-500/25">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            {l('personalData')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('gender')} <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {(['male', 'female'] as Gender[]).map((g) => (
                  <button key={g} onClick={() => setGender(g)}
                    className={`flex-1 px-4 py-3.5 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 ${
                      gender === g
                        ? g === 'male' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]' : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 scale-[1.02]'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]'
                    }`}>{l(g)}</button>
                ))}
              </div>
            </div>
            {[{ id: 'age', key: 'age', val: age, set: setAge, min: 1, max: 120, ph: 'e.g. 30' },
              { id: 'weight', key: 'weightKg', val: weight, set: setWeight, min: 1, max: 500, ph: 'e.g. 75', step: 0.1 },
              { id: 'height', key: 'heightCm', val: height, set: setHeight, min: 1, max: 300, ph: 'e.g. 180', step: 0.1 }
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">{l(f.key)} <span className="text-red-500">*</span></label>
                <input id={f.id} type="number" min={f.min} max={f.max} step={f.step} placeholder={f.ph} value={f.val} onChange={(e) => f.set(e.target.value)} className={inputClass} />
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════ Calculator Cards Grid ═══════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

          {/* ── BMI ── */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/25">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="tooltip-trigger">{l('bmiTitle')}<span className="tooltip-content">{l('tipBmi')}</span></span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{l('bmiSubtitle')}</p>
            {bmi !== null ? (() => {
              const cat = getBMICategory(bmi, l);
              const markerPos = Math.min(Math.max(((bmi - 15) / (45 - 15)) * 100, 0), 100);
              return (
                <div className="animate-scale-in space-y-4">
                  <div className={`${cat.bg} rounded-xl p-5 text-center`}>
                    <span className={`text-4xl sm:text-5xl font-extrabold ${cat.color}`}>{bmi.toFixed(1)}</span>
                    <span className={`block mt-1 text-lg font-semibold ${cat.color}`}>{cat.label}</span>
                  </div>
                  <div className="relative h-4 rounded-full overflow-hidden flex">
                    <div className="flex-[18.5] bg-blue-300" />
                    <div className="flex-[6.4] bg-green-400" />
                    <div className="flex-[5] bg-yellow-400" />
                    <div className="flex-[5] bg-orange-400" />
                    <div className="flex-[10.1] bg-red-400" />
                  </div>
                  <div className="relative h-2">
                    <div className="absolute w-3 h-3 bg-gray-900 dark:bg-white rounded-full -top-0.5 -translate-x-1/2 shadow" style={{ left: `${markerPos}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40+</span></div>
                </div>
              );
            })() : <div className="text-sm text-gray-400 italic text-center py-4">{l('bmrEmpty')}</div>}
          </div>

          {/* ── BMR ── */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/25">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="tooltip-trigger">{l('bmrTitle')}<span className="tooltip-content">{l('tipBmr')}</span></span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{l('bmrSubtitle')}</p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('formula')}</label>
              <div className="flex gap-2">
                {(['mifflin', 'harris'] as const).map((f) => (
                  <button key={f} onClick={() => setBmrFormula(f)}
                    className={`flex-1 px-3 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      bmrFormula === f ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02]' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]'
                    }`}>{f === 'mifflin' ? 'Mifflin-St Jeor' : 'Harris-Benedict'}</button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('activityLevel')}</label>
              <div className="relative">
                <select value={palFactor} onChange={(e) => setPalFactor(parseFloat(e.target.value))} className={`${orangeInput} appearance-none pr-10 cursor-pointer`}>
                  <option value={0}>{l('selectActivity')}</option>
                  {palFactorData.map((p) => (<option key={p.value} value={p.value}>PAL {p.value} - {l(p.key)}</option>))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {bmr !== null ? (
              <div className="animate-scale-in bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-5 space-y-3 border border-orange-200/50 dark:border-orange-800/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <div>
                    <span className="tooltip-trigger text-sm font-medium text-gray-600 dark:text-gray-400">BMR
                      <span className="tooltip-content"><strong>{lang === 'de' ? 'Grundumsatz' : 'Basal Metabolic Rate'}</strong><br />{lang === 'de' ? 'Energie die dein Körper im Ruhezustand verbraucht.' : 'Energy your body burns at complete rest.'}</span>
                    </span>
                    <span className="ml-2 text-xs text-gray-400">({bmrFormula === 'mifflin' ? 'Mifflin-St Jeor' : 'Harris-Benedict'})</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-orange-600 dark:text-orange-400">{Math.round(bmr)} <span className="text-base font-medium text-gray-500">kcal/{lang === 'de' ? 'Tag' : 'day'}</span></span>
                </div>
                {tdee !== null && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-t border-orange-200 dark:border-orange-800/50 pt-3">
                    <span className="tooltip-trigger text-sm font-medium text-gray-600 dark:text-gray-400">TDEE
                      <span className="tooltip-content"><strong>Total Daily Energy Expenditure</strong><br />{lang === 'de' ? 'Gesamtverbrauch pro Tag = Grundumsatz + Aktivität.' : 'Total daily burn = BMR + all activities.'}</span>
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-green-600 dark:text-green-400">{Math.round(tdee)} <span className="text-base font-medium text-gray-500">kcal/{lang === 'de' ? 'Tag' : 'day'}</span></span>
                  </div>
                )}
              </div>
            ) : <div className="text-sm text-gray-400 italic text-center py-4">{l('bmrEmpty')}</div>}
          </div>

          {/* ── Heart Rate ── */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-md shadow-red-500/25">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="tooltip-trigger">{l('hrTitle')}<span className="tooltip-content">{l('tipHr')}</span></span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{l('hrSubtitle')}</p>
            {estimatedRHR && hrCategory ? (
              <div className="animate-scale-in space-y-4">
                <p className="text-xs text-gray-500 italic">{l('hrEstimated')}</p>
                <div className={`${hrCategory.bg} rounded-xl p-5`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xl sm:text-2xl font-extrabold ${hrCategory.color}`}>{l(hrCategory.labelKey)}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-black/20 px-2.5 py-0.5 rounded-full">~{estimatedRHR} bpm</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{l(hrCategory.descKey)}</p>
                </div>
                {(() => {
                  const maxHR = Math.round(220 - ageNum);
                  const hrr = maxHR - estimatedRHR;
                  const avgHR = Math.round(estimatedRHR + hrr * 0.5);
                  const zones = [
                    { name: zoneNames[0], low: Math.round(estimatedRHR + hrr * 0.5), high: Math.round(estimatedRHR + hrr * 0.6), color: 'bg-blue-400', text: 'text-blue-600 dark:text-blue-400' },
                    { name: zoneNames[1], low: Math.round(estimatedRHR + hrr * 0.6), high: Math.round(estimatedRHR + hrr * 0.7), color: 'bg-green-400', text: 'text-green-600 dark:text-green-400' },
                    { name: zoneNames[2], low: Math.round(estimatedRHR + hrr * 0.7), high: Math.round(estimatedRHR + hrr * 0.8), color: 'bg-yellow-400', text: 'text-yellow-600 dark:text-yellow-400' },
                    { name: zoneNames[3], low: Math.round(estimatedRHR + hrr * 0.8), high: Math.round(estimatedRHR + hrr * 0.9), color: 'bg-orange-400', text: 'text-orange-600 dark:text-orange-400' },
                    { name: zoneNames[4], low: Math.round(estimatedRHR + hrr * 0.9), high: maxHR, color: 'bg-red-400', text: 'text-red-600 dark:text-red-400' },
                  ];
                  return (
                    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {[{ label: l('restingHR'), val: `~${estimatedRHR}`, color: 'text-blue-600 dark:text-blue-400' },
                          { label: l('avgHR'), val: String(avgHR), color: 'text-green-600 dark:text-green-400' },
                          { label: l('maxHR'), val: String(maxHR), color: 'text-red-600 dark:text-red-400' }
                        ].map((item) => (
                          <div key={item.label} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{item.label}</span>
                            <span className={`text-xl sm:text-2xl font-extrabold ${item.color}`}>{item.val}</span>
                            <span className="block text-xs text-gray-400">bpm</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('trainingZones')}</h3>
                        <div className="space-y-1.5">
                          {zones.map((zone) => {
                            const widthPct = ((zone.high - zone.low) / (maxHR - estimatedRHR)) * 100;
                            const offsetPct = ((zone.low - estimatedRHR) / (maxHR - estimatedRHR)) * 100;
                            return (
                              <div key={zone.name} className="flex items-center gap-2 sm:gap-3">
                                <span className={`text-xs sm:text-sm font-medium w-20 sm:w-24 ${zone.text}`}>{zone.name}</span>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                                  <div className={`${zone.color} h-full rounded-full absolute`} style={{ left: `${offsetPct}%`, width: `${widthPct}%`, minWidth: '8px' }} />
                                </div>
                                <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-300 w-24 text-right">{zone.low}–{zone.high} bpm</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 italic">HRR = {maxHR} − {estimatedRHR} = {hrr} bpm</p>
                    </div>
                  );
                })()}
              </div>
            ) : <div className="text-sm text-gray-400 italic text-center py-4">{l('hrEmpty')}</div>}
          </div>

          {/* ── Calories Burned ── */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-md shadow-amber-500/25">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="tooltip-trigger">{l('calTitle')}<span className="tooltip-content">{l('tipCal')}</span></span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{l('calSubtitle')}</p>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('calActivity')}</label>
                <div className="relative">
                  <select value={calActivity} onChange={(e) => setCalActivity(parseInt(e.target.value))}
                    className={`${inputClass.replace(/focus:ring-green-500\/20 focus:border-green-500 dark:focus:ring-green-400\/20 dark:focus:border-green-400/g, 'focus:ring-amber-500/20 focus:border-amber-500 dark:focus:ring-amber-400/20 dark:focus:border-amber-400')} appearance-none pr-10 cursor-pointer`}>
                    <option value={-1}>-- {l('calActivity')} --</option>
                    {activities.map((a, i) => (<option key={i} value={i}>{a[lang]} (MET {activityMETs[i]})</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('calDuration')}</label>
                <input type="number" min="1" placeholder="e.g. 45" value={calDuration} onChange={(e) => setCalDuration(e.target.value)} className={inputClass.replace(/focus:ring-green-500\/20 focus:border-green-500 dark:focus:ring-green-400\/20 dark:focus:border-green-400/g, 'focus:ring-amber-500/20 focus:border-amber-500 dark:focus:ring-amber-400/20 dark:focus:border-amber-400')} />
              </div>
            </div>
            {caloriesBurned !== null ? (
              <div className="animate-scale-in bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-5 text-center border border-amber-200/50 dark:border-amber-800/30">
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{l('calResult')}</span>
                <span className="text-4xl sm:text-5xl font-extrabold text-amber-600 dark:text-amber-400">{caloriesBurned}</span>
                <span className="block mt-1 text-sm font-semibold text-amber-500/70">kcal</span>
                <p className="text-xs text-gray-400 mt-2">{activities[calActivity][lang]} · {calDuration} min · {weightNum} kg</p>
              </div>
            ) : <div className="text-sm text-gray-400 italic text-center py-4">{l('calEmpty')}</div>}
          </div>

          {/* ── 1RM ── */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/25">
                <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="tooltip-trigger">{l('ormTitle')}<span className="tooltip-content">{l('tipOrm')}</span></span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{l('ormSubtitle')}</p>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('ormWeight')}</label>
                <input type="number" min="1" placeholder="e.g. 80" value={ormWeight} onChange={(e) => setOrmWeight(e.target.value)}
                  className={inputClass.replace(/focus:ring-green-500\/20 focus:border-green-500 dark:focus:ring-green-400\/20 dark:focus:border-green-400/g, 'focus:ring-violet-500/20 focus:border-violet-500 dark:focus:ring-violet-400/20 dark:focus:border-violet-400')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('ormReps')}</label>
                <input type="number" min="2" max="30" placeholder="e.g. 8" value={ormReps} onChange={(e) => setOrmReps(e.target.value)}
                  className={inputClass.replace(/focus:ring-green-500\/20 focus:border-green-500 dark:focus:ring-green-400\/20 dark:focus:border-green-400/g, 'focus:ring-violet-500/20 focus:border-violet-500 dark:focus:ring-violet-400/20 dark:focus:border-violet-400')} />
              </div>
            </div>
            {orm ? (
              <div className="animate-scale-in bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-violet-200/50 dark:border-violet-800/30">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Epley</span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-violet-600 dark:text-violet-400">{orm.epley}</span>
                    <span className="block mt-1 text-sm font-semibold text-violet-500/70">kg</span>
                  </div>
                  <div className="border-l border-gray-200 dark:border-gray-700 pl-4">
                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Brzycki</span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-purple-600 dark:text-purple-400">{orm.brzycki}</span>
                    <span className="block mt-1 text-sm font-semibold text-purple-500/70">kg</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">{ormWeight} kg × {ormReps} reps</p>
              </div>
            ) : <div className="text-sm text-gray-400 italic text-center py-4">{l('ormEmpty')}</div>}
          </div>

          {/* ── Body Fat ── */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-md shadow-rose-500/25">
                <Percent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="tooltip-trigger">{l('bfTitle')}<span className="tooltip-content">{l('tipBf')}</span></span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{l('bfSubtitle')}</p>
            <div className={`grid ${gender === 'female' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-4 mb-5`}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('bfNeck')}</label>
                <input type="number" min="1" step="0.1" placeholder="e.g. 38" value={bfNeck} onChange={(e) => setBfNeck(e.target.value)}
                  className={inputClass.replace(/focus:ring-green-500\/20 focus:border-green-500 dark:focus:ring-green-400\/20 dark:focus:border-green-400/g, 'focus:ring-rose-500/20 focus:border-rose-500 dark:focus:ring-rose-400/20 dark:focus:border-rose-400')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('bfWaist')}</label>
                <input type="number" min="1" step="0.1" placeholder="e.g. 85" value={bfWaist} onChange={(e) => setBfWaist(e.target.value)}
                  className={inputClass.replace(/focus:ring-green-500\/20 focus:border-green-500 dark:focus:ring-green-400\/20 dark:focus:border-green-400/g, 'focus:ring-rose-500/20 focus:border-rose-500 dark:focus:ring-rose-400/20 dark:focus:border-rose-400')} />
              </div>
              {gender === 'female' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('bfHip')}</label>
                  <input type="number" min="1" step="0.1" placeholder="e.g. 95" value={bfHip} onChange={(e) => setBfHip(e.target.value)}
                    className={inputClass.replace(/focus:ring-green-500\/20 focus:border-green-500 dark:focus:ring-green-400\/20 dark:focus:border-green-400/g, 'focus:ring-rose-500/20 focus:border-rose-500 dark:focus:ring-rose-400/20 dark:focus:border-rose-400')} />
                </div>
              )}
            </div>
            {bodyFat !== null && bodyFat > 0 && bodyFat < 60 ? (
              <div className="animate-scale-in bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-5 text-center border border-rose-200/50 dark:border-rose-800/30">
                <span className="text-4xl sm:text-5xl font-extrabold text-rose-600 dark:text-rose-400">{bodyFat.toFixed(1)}%</span>
                <span className="block mt-1 text-sm font-semibold text-rose-500/70">{getBodyFatCategory(bodyFat, gender, l)}</span>
                <p className="text-xs text-gray-400 mt-2">Navy Method</p>
              </div>
            ) : <div className="text-sm text-gray-400 italic text-center py-4">{l('bfEmpty')}</div>}
          </div>

          {/* ── Macronutrients ── */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center shadow-md shadow-lime-500/25">
                <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="tooltip-trigger">{l('macTitle')}<span className="tooltip-content">{l('tipMac')}</span></span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{l('macSubtitle')}</p>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('macGoal')}</label>
              <div className="flex gap-2">
                {(['lose', 'maintain', 'gain'] as const).map((g) => (
                  <button key={g} onClick={() => setMacGoal(g)}
                    className={`flex-1 px-3 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      macGoal === g ? 'bg-gradient-to-r from-lime-500 to-green-500 text-white shadow-lg shadow-lime-500/30 scale-[1.02]' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]'
                    }`}>{l(g === 'lose' ? 'macLose' : g === 'maintain' ? 'macMaintain' : 'macGain')}</button>
                ))}
              </div>
            </div>
            {macros ? (
              <div className="animate-scale-in bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20 rounded-xl p-5 border border-lime-200/50 dark:border-lime-800/30">
                <div className="text-center mb-4">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{lang === 'de' ? 'Tagesziel' : 'Daily target'}</span>
                  <span className="block text-2xl font-extrabold text-lime-600 dark:text-lime-400">{Math.round(macros.total)} kcal</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[{ label: l('macProtein'), g: macros.proteinG, cal: macros.proteinG * 4, color: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-400' },
                    { label: l('macCarbs'), g: macros.carbsG, cal: macros.carbsG * 4, color: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-400' },
                    { label: l('macFat'), g: macros.fatG, cal: macros.fatG * 9, color: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-400' }
                  ].map((m) => (
                    <div key={m.label}>
                      <span className="block text-xs font-medium text-gray-500 mb-1">{m.label}</span>
                      <span className={`text-2xl font-extrabold ${m.color}`}>{m.g}g</span>
                      <span className="block text-xs text-gray-400">{m.cal} kcal</span>
                      <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`${m.bar} h-full rounded-full`} style={{ width: `${(m.cal / macros.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="text-sm text-gray-400 italic text-center py-4">{l('macEmpty')}</div>}
          </div>

          {/* ── Water Intake ── */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-md shadow-sky-500/25">
                <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="tooltip-trigger">{l('watTitle')}<span className="tooltip-content">{l('tipWat')}</span></span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{l('watSubtitle')}</p>
            {waterBase ? (
              <div className="animate-scale-in bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-sky-200/50 dark:border-sky-800/30 space-y-4">
                <div className="text-center">
                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{l('watBase')}</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-sky-600 dark:text-sky-400">{waterBase.toFixed(1)}</span>
                  <span className="block mt-1 text-sm font-semibold text-sky-500/70">{lang === 'de' ? 'Liter / Tag' : 'liters / day'}</span>
                  <span className="block text-xs text-gray-400 mt-1">≈ {Math.round(waterBase * 4)} {l('watGlasses')}</span>
                </div>
                {waterActive && (
                  <div className="text-center border-t border-sky-200 dark:border-sky-800/50 pt-4">
                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{l('watActive')}</span>
                    <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{waterActive.toFixed(1)}</span>
                    <span className="block mt-1 text-sm font-semibold text-blue-500/70">{lang === 'de' ? 'Liter / Tag' : 'liters / day'}</span>
                  </div>
                )}
              </div>
            ) : <div className="text-sm text-gray-400 italic text-center py-4">{l('watEmpty')}</div>}
          </div>

          {/* ── VO2max ── */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/25">
                <Wind className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="tooltip-trigger">{l('vo2Title')}<span className="tooltip-content">{l('tipVo2')}</span></span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{l('vo2Subtitle')}</p>
            {vo2max ? (() => {
              const cat = getVO2maxCategory(vo2max, gender, l);
              return (
                <div className="animate-scale-in bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-5 text-center border border-emerald-200/50 dark:border-emerald-800/30 space-y-3">
                  <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600 dark:text-emerald-400">{vo2max.toFixed(1)}</span>
                  <span className="block text-sm font-semibold text-emerald-500/70">ml/kg/min</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${cat.color} bg-white/50 dark:bg-black/20`}>{cat.label}</span>
                  <p className="text-xs text-gray-400">{lang === 'de' ? 'Uth-Methode: 15.3 × (MaxHR / RuheHR)' : 'Uth method: 15.3 × (MaxHR / RestingHR)'}</p>
                </div>
              );
            })() : <div className="text-sm text-gray-400 italic text-center py-4">{l('vo2Empty')}</div>}
          </div>

          {/* ── Ideal Weight ── */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="tooltip-trigger">{l('iwTitle')}<span className="tooltip-content">{l('tipIw')}</span></span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{l('iwSubtitle')}</p>
            {idealWeight ? (
              <div className="animate-scale-in bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-indigo-200/50 dark:border-indigo-800/30 space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[{ label: 'Devine', val: idealWeight.devine }, { label: 'Hamwi', val: idealWeight.hamwi }, { label: 'Broca', val: idealWeight.broca }].map((f) => (
                    <div key={f.label}>
                      <span className="block text-xs font-medium text-gray-500 mb-1">{f.label}</span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{f.val}</span>
                      <span className="block text-xs text-gray-400">kg</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-indigo-200 dark:border-indigo-800/50 pt-3 text-center">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{l('iwRange')}</span>
                  <span className="block text-lg font-bold text-indigo-600 dark:text-indigo-400">{idealWeight.bmiLow} – {idealWeight.bmiHigh} kg</span>
                  <span className="block text-xs text-gray-400">BMI 18.5 – 24.9</span>
                </div>
              </div>
            ) : <div className="text-sm text-gray-400 italic text-center py-4">{l('iwEmpty')}</div>}
          </div>

          {/* ── Blood Pressure (full width) ── */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/25">
                <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="tooltip-trigger">{l('bpTitle')}<span className="tooltip-content">{l('tipBp')}</span></span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{l('bpSubtitle')}</p>
            {bpReferences ? (
              <div className="animate-scale-in overflow-x-auto">
                <table className="w-full text-sm sm:text-base min-w-[300px]">
                  <thead>
                    <tr className="border-b-2 border-purple-200 dark:border-purple-800/50">
                      <th className="text-left py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">{l('timeOfDay')}</th>
                      <th className="text-left py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">{l('systolic')}</th>
                      <th className="text-left py-3 font-semibold text-gray-600 dark:text-gray-400">{l('diastolic')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bpReferences.map((ref) => (
                      <tr key={ref.periodKey} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                        <td className="py-3.5 pr-4 text-gray-700 dark:text-gray-300 font-medium">{l(ref.periodKey)}</td>
                        <td className="py-3.5 pr-4 font-bold text-purple-600 dark:text-purple-400 text-lg">{ref.systolic}</td>
                        <td className="py-3.5 font-bold text-purple-600 dark:text-purple-400 text-lg">{ref.diastolic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-4 italic">
                  {lang === 'de' ? `Referenzwerte für ${gender === 'male' ? 'männlich' : 'weiblich'}, Alter ${Math.round(ageNum)}. Einheit: mmHg.` :
                   `Reference values for ${gender === 'male' ? 'male' : 'female'}, age ${Math.round(ageNum)}. Unit: mmHg.`}
                </p>
              </div>
            ) : <div className="text-sm text-gray-400 italic text-center py-4">{l('bpEmpty')}</div>}
          </div>

        </div>

        {/* Disclaimer */}
        <div className="mt-8 sm:mt-10 p-4 sm:p-5 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            <strong>Disclaimer:</strong> {l('disclaimer')}
          </p>
        </div>
      </div>

      <MyFooter />
    </div>
  );
}
