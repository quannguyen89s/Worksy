import { haversineKm } from "./distance";

const COMPLETED_CAP = 100;
const DIST_CAP_KM = 50;

export function calculateApplicantScore(input: {
  workerRating: number;
  workerCompletedJobs: number;
  workerLocation: { lat: number; lng: number };
  jobPrice: number;
  jobLocation: { lat: number; lng: number };
  priceOffer?: number;
}): number {
  const rating = Math.min(5, Math.max(0, input.workerRating));
  const cappedJobs = Math.min(input.workerCompletedJobs, COMPLETED_CAP);
  const distanceKm = haversineKm(input.workerLocation, input.jobLocation);
  const effectivePrice = input.priceOffer ?? input.jobPrice;
  return (
    rating * 3 +
    cappedJobs * 0.5 -
    Math.min(distanceKm, DIST_CAP_KM) -
    effectivePrice * 0.01
  );
}

function skillOverlapNorm(jobTags: string[], workerSkills: string[]): number {
  if (jobTags.length === 0) return 0;
  const jobSet = new Set(jobTags.map((t) => t.toLowerCase()));
  let hit = 0;
  for (const s of workerSkills) {
    if (jobSet.has(s.toLowerCase())) hit += 1;
  }
  return hit / jobTags.length;
}

export function recommendationScore(input: {
  jobTags: string[];
  workerSkills: string[];
  jobPrice: number;
  distanceKm: number;
}): number {
  const skillScore = skillOverlapNorm(input.jobTags, input.workerSkills);
  const priceScore = 1 / (1 + input.jobPrice / 500);
  const distancePenalty = Math.min(input.distanceKm, DIST_CAP_KM) / DIST_CAP_KM;
  const raw = skillScore * 10 + priceScore * 3 - distancePenalty * 4;
  return Math.round(raw * 1000) / 1000;
}
