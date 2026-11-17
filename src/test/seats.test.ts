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
    const business = veloviaCoaches.find((coach) => coach.number === 1);
    const accessible = veloviaCoaches.find((coach) => coach.number === 4);
    if (!business || !accessible) throw new Error("Brak wagonu");
    expect(seatsInCoach(business)).toHaveLength(48);
    expect(seatsInCoach(accessible)).toHaveLength(38);
  });

  it("odtwarza numerację i puste pola wagonu czołowego Standard", () => {
    const coach = veloviaCoaches.find((item) => item.number === 8);
    if (!coach) throw new Error("Brak wagonu 8");
    const seats = seatsInCoach(coach);
    expect(seats).toHaveLength(51);
    expect(seats.filter((seat) => seat.column === 0).map((seat) => seat.number)).toEqual([14, 12, 11]);
    expect(seats.some((seat) => seat.id === "8-13")).toBe(false);
    expect(seats.find((seat) => seat.number === 14)?.window).toBe(true);
    expect(seats.find((seat) => seat.number === 12)?.window).toBe(false);
  });

  it("ma stoliki, bistro i miejsca na wózki bez fikcyjnych foteli w pustych polach", () => {
    expect(veloviaCoaches.find((coach) => coach.number === 3)?.facilities).toContain("bistro");
    expect(veloviaCoaches.find((coach) => coach.number === 4)?.facilities).toContain("accessible");
    const coach = veloviaCoaches.find((item) => item.number === 5);
    if (!coach) throw new Error("Brak wagonu 5");
    expect(seatsInCoach(coach)).toHaveLength(76);
    expect(seatsInCoach(coach).find((seat) => seat.number === 24)?.table).toBe(true);
  });

  it("zachowuje symulowaną zajętość dla tego samego pociągu i dnia", () => {
    expect(isSeatOccupied("VV 101", "2026-11-20", "4-14")).toBe(isSeatOccupied("VV 101", "2026-11-20", "4-14"));
  });

  it("przypisuje jedno miejsce tylko jednemu pasażerowi i pozwala je zwolnić", () => {
    const assigned = assignSeat([null, null], 1, "4-14");
    expect(assigned).toEqual([null, "4-14"]);
    expect(assignSeat(assigned, 0, "4-14")).toEqual([null, null]);
    expect(assignSeat(assigned, 0, "4-15")).toEqual(["4-15", "4-14"]);
  });
});
