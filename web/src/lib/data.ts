import path from "node:path";
import { promises as fs } from "node:fs";

export type ContractSeed = {
  slug: string;
  title: string;
  jurisdiction: "uk-ew" | "uk-sc" | "uk-ni";
  summary: string;
};

export async function getAllContracts(): Promise<ContractSeed[]> {
  const p = path.join(process.cwd(), "src", "seed-data", "contracts.sample.json");
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as ContractSeed[];
}

export async function getContractsByJurisdiction(j: ContractSeed["jurisdiction"]) {
  const all = await getAllContracts();
  return all.filter(c => c.jurisdiction === j);
}

export async function getContract(slug: string) {
  const all = await getAllContracts();
  return all.find(c => c.slug === slug) || null;
}
