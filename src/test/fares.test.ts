import { describe, expect, it } from "vitest";
import { basePrice, eur, passengerPrice } from "@/lib/fares";
import { veloviaRoute } from "@/lib/timetable";

describe("cennik Velovia", () => {
  it("cena bazowa wg dystansu i klasy", () => {
    expect(basePrice(150, "standard")).toBe(19.9);
    expect(basePrice(151, "premiere")).toBe(39.9);
    expect(basePrice(785.7, "business")).toBe(124.9);
  });
  it("warianty taryfowe", () => {
    expect(passengerPrice(100, "standard", "promo", "none")).toBe(13.93);
    expect(passengerPrice(100, "standard", "flex", "none")).toBe(23.88);
  });
  it("ulga liczona od ceny biletu", () => {
    expect(passengerPrice(100, "standard", "standard", "student")).toBe(13.93);
    expect(passengerPrice(100, "standard", "standard", "child4")).toBe(0);
  });
  it("ulgi nie łączą się z PROMO ani SAVER", () => {
    expect(passengerPrice(100, "standard", "promo", "student")).toBe(13.93);
    expect(passengerPrice(100, "standard", "saver", "senior")).toBe(16.92);
  });
});
