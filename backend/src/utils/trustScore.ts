/**
 * Trust Score cho auto-approve job.
 * Điểm >= AUTO_APPROVE_THRESHOLD → auto approve
 * Điểm < AUTO_APPROVE_THRESHOLD → để admin duyệt
 *
 * Cấu hình: TRUST_SCORE_AUTO_APPROVE_THRESHOLD trong .env (mặc định 50)
 */
const envThreshold = process.env.TRUST_SCORE_AUTO_APPROVE_THRESHOLD;
export const AUTO_APPROVE_THRESHOLD = envThreshold
  ? Math.max(0, Math.min(100, Number(envThreshold)))
  : 50;
const MAX_SCORE = 100;

export type UserTrustInput = {
  isVerified: boolean;
  createdAt?: Date | string | null;
  /** Số job đã tạo mà đã hoàn thành (status done) */
  completedJobsAsCustomer?: number;
};

export type JobTrustInput = {
  title: string;
  description: string;
  price: number;
  requiredWorkers: number;
};

/**
 * Tính điểm tin cậy dựa trên user và nội dung job.
 */
export function calculateTrustScore(
  user: UserTrustInput,
  job: JobTrustInput
): { score: number; details: Record<string, number> } {
  const details: Record<string, number> = {};
  let score = 0;

  // 1. Email đã xác thực: +30
  if (user.isVerified) {
    details.isVerified = 30;
    score += 30;
  } else {
    details.isVerified = 0;
  }

  // 2. Tuổi tài khoản: mỗi 30 ngày +3, tối đa 20
  const accountAgeDays = user.createdAt
    ? (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const ageScore = Math.min(20, Math.floor(accountAgeDays / 30) * 3);
  details.accountAge = ageScore;
  score += ageScore;

  // 3. Lịch sử job đã hoàn thành (từng thuê và hoàn thành): mỗi job +8, tối đa 24
  const pastJobs = user.completedJobsAsCustomer ?? 0;
  const historyScore = Math.min(24, pastJobs * 8);
  details.completedJobsHistory = historyScore;
  score += historyScore;

  // 4. Chất lượng tin: title >= 5 ký tự +5
  if (job.title.trim().length >= 5) {
    details.titleQuality = 5;
    score += 5;
  } else {
    details.titleQuality = 0;
  }

  // 5. Mô tả đầy đủ: >= 20 ký tự +6
  if (job.description.trim().length >= 20) {
    details.descriptionQuality = 6;
    score += 6;
  } else {
    details.descriptionQuality = 0;
  }

  // 6. Giá hợp lý (10k - 5tr VNĐ): +5
  if (job.price >= 10_000 && job.price <= 5_000_000) {
    details.priceReasonable = 5;
    score += 5;
  } else {
    details.priceReasonable = 0;
  }

  // 7. requiredWorkers hợp lý (1-20): +5
  if (job.requiredWorkers >= 1 && job.requiredWorkers <= 20) {
    details.workersReasonable = 5;
    score += 5;
  } else {
    details.workersReasonable = 0;
  }

  return {
    score: Math.min(MAX_SCORE, score),
    details,
  };
}

/**
 * Có nên auto approve không.
 */
export function shouldAutoApprove(score: number): boolean {
  return score >= AUTO_APPROVE_THRESHOLD;
}

/** Nhãn tiêu chí để log */
const CRITERIA_LABELS: Record<string, { label: string; max: number }> = {
  isVerified: { label: "Email đã xác thực", max: 30 },
  accountAge: { label: "Tuổi tài khoản (mỗi 30 ngày +3)", max: 20 },
  completedJobsHistory: { label: "Job đã hoàn thành trước đó (mỗi job +8)", max: 24 },
  titleQuality: { label: "Title >= 5 ký tự", max: 5 },
  descriptionQuality: { label: "Mô tả >= 20 ký tự", max: 6 },
  priceReasonable: { label: "Giá 10k-5tr VNĐ", max: 5 },
  workersReasonable: { label: "Số worker 1-20", max: 5 },
};

/**
 * Format tiêu chí để log ra console.
 */
export function formatTrustScoreLog(
  score: number,
  details: Record<string, number>
): string[] {
  const lines: string[] = [
    `[TrustScore] Tổng điểm: ${score}/100 | Ngưỡng: ${AUTO_APPROVE_THRESHOLD} | ${score >= AUTO_APPROVE_THRESHOLD ? "ĐẠT → auto approve" : "CHƯA ĐẠT → pending"}`,
    "  Chi tiết tiêu chí:",
  ];
  for (const [key, pts] of Object.entries(details)) {
    const meta = CRITERIA_LABELS[key];
    const label = meta?.label ?? key;
    const got = pts;
    const max = meta?.max ?? 0;
    lines.push(`    - ${label}: ${got}/${max}`);
  }
  return lines;
}
