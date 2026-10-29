import { describe, it, expect, vi } from "vitest";
import { exportarParaCsv } from "./export";

describe("export", () => {
  it("exportarParaCsv gera blob com delimitadores e UTF-8 BOM", () => {
    let capturedBlob: Blob | null = null;
    let capturedDownload = "";

    // Mock DOM elements
    const mockClick = vi.fn();
    vi.stubGlobal("Blob", class MockBlob {
      parts: any[];
      options: any;
      constructor(parts: any[], options: any) {
        this.parts = parts;
        this.options = options;
        capturedBlob = this as any;
      }
    });

    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return {
          set href(_v: string) {},
          set download(v: string) { capturedDownload = v; },
          click: mockClick,
        } as any;
      }
      return document.createElement(tag);
    });

    exportarParaCsv([
      {
        id: "1",
        data: "2026-03-15",
        onibus: "Ônibus 01",
        litros: 150,
        preco_litro: 6.2,
        odometro: 10000,
        observacao: "Posto Shell",
      },
    ], undefined, "teste.csv");

    expect(mockClick).toHaveBeenCalled();
    expect(capturedDownload).toBe("teste.csv");
    expect(capturedBlob).not.toBeNull();
  });
});

