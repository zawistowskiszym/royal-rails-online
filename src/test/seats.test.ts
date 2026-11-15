import { describe, expect, it } from "vitest";
import { assignSeat, isSeatOccupied, seatsInCoach, veloviaCoaches } from "@/lib/seats";

describe("schemat ośmiowagonowego Velaro", () => {
  it("ma osiem wagonów z klasami Velovii", () => {
    expect(veloviaCoaches.map((coach) => coach.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(veloviaCoaches[0]?.travelClass).toBe("business");
    expect(veloviaCoaches.filter((coach) => coach.travelClass === "premiere")).toHaveLength(2);
    expect(veloviaCoaches.filter((coach) => coach.travelClass === "standard")).toHaveLength(5);
  });

  it("generuje niepowtarzalne numery miejsc", () => {
    const seats = veloviaCoaches.flatMap(seatsInCoach);
    expect(new Set(seats.map((seat) => seat.id)).size).toBe(seats.length);
    expect(seatsInCoach(veloviaCoaches[0]!)).toHaveLength(24);
    expect(seatsInCoach(veloviaCoaches[3]!)).toHaveLength(64);
  });

  it("zachowuje symulowaną zajętość dla tego samego pociągu i dnia", () => {
    expect(isSeatOccupied("VV 101", "2026-11-20", "4-12A")).toBe(isSeatOccupied("VV 101", "2026-11-20", "4-12A"));
  });

  it("przypisuje jedno miejsce tylko jednemu pasażerowi i pozwala je zwolnić", () => {
    const assigned = assignSeat([null, null], 1, "4-12A");
    expect(assigned).toEqual([null, "4-12A"]);
    expect(assignSeat(assigned, 0, "4-12A")).toEqual([null, null]);
    expect(assignSeat(assigned, 0, "4-12B")).toEqual(["4-12B", "4-12A"]);
  });
});
