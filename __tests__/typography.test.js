/**
 * Unit tests for Plenty type scale tokens.
 */
import { type, fontSize, lineHeight } from "../constants/typography";

describe("type tokens", () => {
  it("exports display token with expected values", () => {
    expect(type.display).toEqual({ fontSize: 36, fontWeight: "400", lineHeight: 44, fontFamily: "Bitrank" });
  });

  it("exports title token with expected values", () => {
    expect(type.title).toEqual({ fontSize: 28, fontWeight: "400", lineHeight: 36, fontFamily: "Bitrank" });
  });

  it("exports heading token with expected values", () => {
    expect(type.heading).toEqual({ fontSize: 22, fontWeight: "400", lineHeight: 28, fontFamily: "Creamy_Chicken" });
  });

  it("exports body token with expected values", () => {
    expect(type.body).toEqual({ fontSize: 16, fontWeight: "400", lineHeight: 24, fontFamily: "Poppins-Regular" });
  });

  it("exports label token with expected values", () => {
    expect(type.label).toEqual({ fontSize: 15, fontWeight: "600", lineHeight: 22, fontFamily: "Poppins-SemiBold" });
  });

  it("exports caption token with expected values", () => {
    expect(type.caption).toEqual({ fontSize: 13, fontWeight: "600", lineHeight: 18, fontFamily: "Poppins-SemiBold" });
  });

  it("exports small token with expected values", () => {
    expect(type.small).toEqual({ fontSize: 12, fontWeight: "400", lineHeight: 16, fontFamily: "Poppins-Regular" });
  });
});

describe("fontSize helper", () => {
  it("returns correct font size for display", () => {
    expect(fontSize("display")).toBe(36);
  });

  it("returns correct font size for body", () => {
    expect(fontSize("body")).toBe(16);
  });

  it("returns correct font size for caption", () => {
    expect(fontSize("caption")).toBe(13);
  });

  it("returns undefined for unknown token", () => {
    expect(fontSize("invalid")).toBeUndefined();
  });
});

describe("lineHeight helper", () => {
  it("returns correct line height for display", () => {
    expect(lineHeight("display")).toBe(44);
  });

  it("returns correct line height for body", () => {
    expect(lineHeight("body")).toBe(24);
  });

  it("returns undefined for unknown token", () => {
    expect(lineHeight("invalid")).toBeUndefined();
  });
});
