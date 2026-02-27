import { Donor, RecipientRequest, MatchResult } from "@shared/schema";
import { AVLTree, MaxHeap } from "./dataStructures";
import { randomUUID } from "crypto";

export interface IStorage {
  addDonor(donor: Omit<Donor, "id">): Promise<Donor>;
  getDonors(): Promise<Donor[]>;
  findMatches(req: RecipientRequest): Promise<MatchResult[]>;
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2-lat1);  
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; 
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

export class MemoryStorage implements IStorage {
  private tree: AVLTree;

  constructor() {
    this.tree = new AVLTree();
    this.seed();
  }

  private seed() {
    const seedDonors: Omit<Donor, "id">[] = [
      { hospitalName: "City Hospital", organType: "Heart", bloodGroup: "O+", viabilityTime: 4, latitude: 40.7128, longitude: -74.0060 },
      { hospitalName: "General Clinic", organType: "Heart", bloodGroup: "O+", viabilityTime: 6, latitude: 34.0522, longitude: -118.2437 },
      { hospitalName: "Mercy Medical", organType: "Liver", bloodGroup: "A-", viabilityTime: 12, latitude: 41.8781, longitude: -87.6298 },
      { hospitalName: "St. John's", organType: "Kidney", bloodGroup: "B+", viabilityTime: 24, latitude: 29.7604, longitude: -95.3698 },
      { hospitalName: "Hope Center", organType: "Heart", bloodGroup: "O+", viabilityTime: 2, latitude: 40.7306, longitude: -73.9352 },
      { hospitalName: "Memorial Hospital", organType: "Heart", bloodGroup: "O+", viabilityTime: 8, latitude: 42.3601, longitude: -71.0589 }
    ];
    for (const d of seedDonors) {
      this.addDonor(d);
    }
  }

  async addDonor(donorInfo: Omit<Donor, "id">): Promise<Donor> {
    const donor: Donor = { ...donorInfo, id: randomUUID() };
    this.tree.insert(donor);
    return donor;
  }

  async getDonors(): Promise<Donor[]> {
    return this.tree.getAll();
  }

  async findMatches(req: RecipientRequest): Promise<MatchResult[]> {
    const matches = this.tree.findMatches(req.organType, req.bloodGroup);
    
    type HeapItem = { donor: Donor, score: number, distance: number };
    const heap = new MaxHeap<HeapItem>(item => item.score);

    for (const donor of matches) {
      const distance = getDistanceFromLatLonInKm(req.latitude, req.longitude, donor.latitude, donor.longitude);
      const score = (req.urgencyLevel * 100) + (donor.viabilityTime * 10) - (distance * 0.5);
      heap.push({ donor, score, distance });
    }

    const results: MatchResult[] = [];
    let rank = 1;
    while (true) {
      const best = heap.pop();
      if (!best) break;
      results.push({
        rank,
        donorId: best.donor.id!,
        hospitalName: best.donor.hospitalName,
        organDetails: `${best.donor.organType} (${best.donor.bloodGroup})`,
        viabilityTime: best.donor.viabilityTime,
        priorityScore: Math.round(best.score * 100) / 100,
        distance: Math.round(best.distance * 10) / 10
      });
      if (results.length >= req.topK) break;
      rank++;
    }

    return results;
  }
}

export const storage = new MemoryStorage();
