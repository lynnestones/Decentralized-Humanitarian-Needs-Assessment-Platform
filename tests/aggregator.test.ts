import { describe, it, expect, beforeEach } from "vitest";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_REGION = 101;
const ERR_INVALID_CATEGORY = 102;
const ERR_INVALID_AMOUNT = 103;
const ERR_INVALID_PERIOD = 104;
const ERR_INSUFFICIENT_CONTRIBUTORS = 110;
const ERR_ALREADY_AGGREGATED = 111;
const ERR_INVALID_AGGREGATION_TYPE = 112;
const ERR_CONTRACT_PAUSED = 116;
const ERR_INVALID_QUERY_RANGE = 117;

type AggregatedData = {
  totalSum: number;
  totalWeight: number;
  count: number;
  maxValue: number;
  minValue: number;
  lastUpdate: number;
  aggType: number;
};

type HistoricalAggregate = {
  avgSum: number;
  avgCount: number;
};

type PendingContribution = {
  amount: number;
  weight: number;
  timestamp: number;
};

class AggregatorMock {
  state!: {
    owner: string;
    isPaused: boolean;
    totalAggregations: number;
    totalContributions: number;
    lastAggregationTime: number;
    authorizedContributors: Map<string, boolean>;
    regions: Map<string, boolean>;
    categories: Map<string, boolean>;
    pendingContributions: Map<string, PendingContribution>;
    aggregatedData: Map<string, AggregatedData>;
    historicalAggregates: Map<string, HistoricalAggregate>;
  };

  blockHeight: number = 0;
  contribCounter: number = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      owner: "ST1OWNER",
      isPaused: false,
      totalAggregations: 0,
      totalContributions: 0,
      lastAggregationTime: 0,
      authorizedContributors: new Map<string, boolean>(),
      regions: new Map<string, boolean>(),
      categories: new Map<string, boolean>(),
      pendingContributions: new Map<string, PendingContribution>(),
      aggregatedData: new Map<string, AggregatedData>(),
      historicalAggregates: new Map<string, HistoricalAggregate>(),
    };
    this.blockHeight = 0;
    this.contribCounter = 0;
  }

  advanceTime(blocks: number) {
    this.blockHeight += blocks;
  }

  addAuthorizedContributor(contributor: string) {
    if (this.state.owner !== "ST1OWNER") {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    this.state.authorizedContributors.set(contributor, true);
    return { ok: true, value: true };
  }

  addRegion(region: string) {
    if (this.state.owner !== "ST1OWNER") {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    this.state.regions.set(region, true);
    return { ok: true, value: true };
  }

  addCategory(category: string) {
    if (this.state.owner !== "ST1OWNER") {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    this.state.categories.set(category, true);
    return { ok: true, value: true };
  }

  submitContribution(
    region: string,
    category: string,
    period: number,
    amount: number,
    weight: number,
    timestamp: number
  ) {
    if (this.state.isPaused) {
      return { ok: false, value: ERR_CONTRACT_PAUSED };
    }
    if (!this.state.authorizedContributors.get("STX-SENDER")) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (!this.state.regions.get(region)) {
      return { ok: false, value: ERR_INVALID_REGION };
    }
    if (!this.state.categories.get(category)) {
      return { ok: false, value: ERR_INVALID_CATEGORY };
    }
    if (amount <= 0) {
      return { ok: false, value: ERR_INVALID_AMOUNT };
    }
    if (period !== 144 && period !== 1008 && period !== 4320) {
      return { ok: false, value: ERR_INVALID_PERIOD };
    }
    // unique contributor ID for each submission
    this.contribCounter += 1;
    const contributorId = `STX-SENDER-${this.contribCounter}`;
    const key = `${region}-${category}-${period}-${contributorId}`;
    if (this.state.pendingContributions.has(key)) {
      return { ok: false, value: ERR_ALREADY_AGGREGATED };
    }
    this.state.pendingContributions.set(key, { amount, weight, timestamp });
    this.state.totalContributions += 1;
    return { ok: true, value: true };
  }

  aggregateData(region: string, category: string, period: number, aggType: number) {
    if (this.state.isPaused) {
      return { ok: false, value: ERR_CONTRACT_PAUSED };
    }
    if (this.state.owner !== "ST1OWNER") {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (!this.state.regions.get(region)) {
      return { ok: false, value: ERR_INVALID_REGION };
    }
    if (!this.state.categories.get(category)) {
      return { ok: false, value: ERR_INVALID_CATEGORY };
    }
    if (period !== 144 && period !== 1008 && period !== 4320) {
      return { ok: false, value: ERR_INVALID_PERIOD };
    }
    if (aggType > 3) {
      return { ok: false, value: ERR_INVALID_AGGREGATION_TYPE };
    }
    const contribKeys = Array.from(this.state.pendingContributions.keys()).filter(k =>
      k.startsWith(`${region}-${category}-${period}-`)
    );
    if (contribKeys.length < 3) {
      return { ok: false, value: ERR_INSUFFICIENT_CONTRIBUTORS };
    }
    let totalSum = 0;
    let totalWeight = 0;
    let count = 0;
    let maxValue = 0;
    let minValue = Number.MAX_SAFE_INTEGER;
    for (const key of contribKeys) {
      const contrib = this.state.pendingContributions.get(key)!;
      totalSum += contrib.amount;
      totalWeight += contrib.weight;
      count += 1;
      if (contrib.amount > maxValue) maxValue = contrib.amount;
      if (contrib.amount < minValue) minValue = contrib.amount;
      this.state.pendingContributions.delete(key);
    }
    const aggKey = `${region}-${category}-${period}`;
    this.state.aggregatedData.set(aggKey, {
      totalSum,
      totalWeight,
      count,
      maxValue,
      minValue,
      lastUpdate: this.blockHeight,
      aggType,
    });
    this.state.totalAggregations += 1;
    this.state.lastAggregationTime = this.blockHeight;
    return { ok: true, value: true };
  }

  getAggregatedData(region: string, category: string, period: number) {
    const key = `${region}-${category}-${period}`;
    return this.state.aggregatedData.get(key);
  }

  computeHistoricalAverage(region: string, category: string, startPeriod: number, endPeriod: number) {
    if (!this.state.regions.get(region)) {
      return { ok: false, value: ERR_INVALID_REGION };
    }
    if (!this.state.categories.get(category)) {
      return { ok: false, value: ERR_INVALID_CATEGORY };
    }
    if (startPeriod > endPeriod || endPeriod - startPeriod >= 10000) {
      return { ok: false, value: ERR_INVALID_QUERY_RANGE };
    }
    let avgSum = 0;
    let avgCount = 0;
    for (let p = startPeriod; p <= endPeriod; p++) {
      const key = `${region}-${category}-${p}`;
      const agg = this.state.aggregatedData.get(key);
      if (agg) {
        avgSum += agg.totalSum;
        avgCount += agg.count;
      }
    }
    const histKey = `${region}-${category}-${startPeriod}-${endPeriod}`;
    const hist = { avgSum, avgCount };
    this.state.historicalAggregates.set(histKey, hist);
    return { ok: true, value: hist };
  }

  pauseContract() {
    if (this.state.owner !== "ST1OWNER") {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    this.state.isPaused = true;
    return { ok: true, value: true };
  }

  unpauseContract() {
    if (this.state.owner !== "ST1OWNER") {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    this.state.isPaused = false;
    return { ok: true, value: true };
  }
}

describe("Aggregator", () => {
  let contract: AggregatorMock;

  beforeEach(() => {
    contract = new AggregatorMock();
  });

  it("should add authorized contributor", () => {
    const result = contract.addAuthorizedContributor("STX-SENDER");
    expect(result).toEqual({ ok: true, value: true });
    expect(contract.state.authorizedContributors.get("STX-SENDER")).toBe(true);
  });

  it("should add region and category", () => {
    contract.addRegion("Region1");
    contract.addCategory("Food");
    expect(contract.state.regions.get("Region1")).toBe(true);
    expect(contract.state.categories.get("Food")).toBe(true);
  });

  it("should submit contribution with valid params", () => {
    contract.addAuthorizedContributor("STX-SENDER");
    contract.addRegion("Region1");
    contract.addCategory("Food");
    const result = contract.submitContribution("Region1", "Food", 144, 100, 10, 0);
    expect(result).toEqual({ ok: true, value: true });
    expect(contract.state.totalContributions).toBe(1);
  });

  it("should reject submission if not authorized", () => {
    contract.addRegion("Region1");
    contract.addCategory("Food");
    const result = contract.submitContribution("Region1", "Food", 144, 100, 10, 0);
    expect(result).toEqual({ ok: false, value: ERR_NOT_AUTHORIZED });
  });

  it("should reject submission with invalid region", () => {
    contract.addAuthorizedContributor("STX-SENDER");
    contract.addCategory("Food");
    const result = contract.submitContribution("InvalidRegion", "Food", 144, 100, 10, 0);
    expect(result).toEqual({ ok: false, value: ERR_INVALID_REGION });
  });

  it("should aggregate data with sufficient contributors", () => {
    contract.addRegion("Region1");
    contract.addCategory("Food");
    contract.addAuthorizedContributor("STX-SENDER");
    contract.submitContribution("Region1", "Food", 144, 100, 10, 0);
    contract.submitContribution("Region1", "Food", 144, 200, 20, 0);
    contract.submitContribution("Region1", "Food", 144, 300, 30, 0);
    const result = contract.aggregateData("Region1", "Food", 144, 0);
    expect(result).toEqual({ ok: true, value: true });
    const agg = contract.getAggregatedData("Region1", "Food", 144);
    expect(agg?.totalSum).toBe(600);
    expect(agg?.count).toBe(3);
    expect(contract.state.totalAggregations).toBe(1);
  });

  it("should reject aggregation with insufficient contributors", () => {
    contract.addRegion("Region1");
    contract.addCategory("Food");
    contract.addAuthorizedContributor("STX-SENDER");
    contract.submitContribution("Region1", "Food", 144, 100, 10, 0);
    const result = contract.aggregateData("Region1", "Food", 144, 0);
    expect(result).toEqual({ ok: false, value: ERR_INSUFFICIENT_CONTRIBUTORS });
  });

  it("should reject aggregation if paused", () => {
    contract.pauseContract();
    const result = contract.aggregateData("Region1", "Food", 144, 0);
    expect(result).toEqual({ ok: false, value: ERR_CONTRACT_PAUSED });
  });

  it("should compute historical average", () => {
    contract.addRegion("Region1");
    contract.addCategory("Food");
    contract.state.aggregatedData.set("Region1-Food-100", {
      totalSum: 100, totalWeight: 10, count: 1, maxValue: 100, minValue: 100, lastUpdate: 0, aggType: 0
    });
    contract.state.aggregatedData.set("Region1-Food-101", {
      totalSum: 200, totalWeight: 20, count: 2, maxValue: 200, minValue: 100, lastUpdate: 0, aggType: 0
    });
    const result = contract.computeHistoricalAverage("Region1", "Food", 100, 101);
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ avgSum: 300, avgCount: 3 });
  });

  it("should reject historical average with invalid range", () => {
    contract.addRegion("Region1");
    contract.addCategory("Food");
    const result = contract.computeHistoricalAverage("Region1", "Food", 101, 100);
    expect(result).toEqual({ ok: false, value: ERR_INVALID_QUERY_RANGE });
  });

  it("should pause and unpause contract", () => {
    let result = contract.pauseContract();
    expect(result).toEqual({ ok: true, value: true });
    expect(contract.state.isPaused).toBe(true);
    result = contract.unpauseContract();
    expect(result).toEqual({ ok: true, value: true });
    expect(contract.state.isPaused).toBe(false);
  });
});
